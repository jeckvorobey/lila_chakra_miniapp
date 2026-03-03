import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { shallowMount } from '@vue/test-utils';

import OnboardingPage from 'src/pages/onboarding/OnboardingPage.vue';
import { useUserStore } from 'src/stores/user.store';

const { mockRouterPush } = vi.hoisted(() => ({
  mockRouterPush: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock('src/services/api', () => ({
  usersApi: {
    getProfile: vi.fn(),
    getStats: vi.fn(),
    updateSettings: vi.fn(),
    completeOnboarding: vi.fn().mockResolvedValue({ has_seen_onboarding: true }),
    getReferralData: vi.fn(),
    getReferralProgram: vi.fn(),
    getTransactions: vi.fn(),
  },
}));

function mountPage() {
  return shallowMount(OnboardingPage, {
    global: {
      stubs: {
        'q-page': { template: '<div><slot /></div>' },
        'q-carousel': { template: '<div><slot /></div>' },
        'q-carousel-slide': { template: '<section><slot /></section>' },
        'q-icon': { template: '<i />' },
        'q-card': { template: '<div><slot /></div>' },
        'q-card-section': { template: '<div><slot /></div>' },
        'q-list': { template: '<div><slot /></div>' },
        'q-item': { template: '<div><slot /></div>' },
        'q-item-section': { template: '<div><slot /></div>' },
        'q-item-label': { template: '<span><slot /></span>' },
        'q-badge': { template: '<span><slot /></span>' },
        'q-space': { template: '<span />' },
        'q-checkbox': {
          props: ['modelValue', 'label'],
          template:
            '<label><input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />{{ label }}</label>',
        },
        'q-btn': {
          props: ['label', 'disable'],
          template:
            '<button v-bind="$attrs" :disabled="disable" @click="$emit(\'click\')">{{ label }}<slot /></button>',
        },
      },
      mocks: {
        $t: (key: string) => key,
      },
    },
  });
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockRouterPush.mockReset();
  });

  it('рендерит 7 слайдов и цены режимов в ТКН', () => {
    const wrapper = mountPage();
    const text = wrapper.text();

    expect(text).toContain('onboarding.intro.title');
    expect(text).toContain('onboarding.accept.title');
    expect(text).toContain('onboarding.modes.free.price');
    expect(text).toContain('onboarding.modes.ai.price');
    expect(text).toContain('onboarding.modes.incognito.price');
  });

  it('не показывает кнопку пропуска', () => {
    const wrapper = mountPage();
    expect(wrapper.text()).not.toContain('onboarding.skip');
  });

  it('блокирует завершение без чекбокса и завершает после подтверждения', async () => {
    const wrapper = mountPage();
    const userStore = useUserStore();
    const completeSpy = vi.spyOn(userStore, 'completeOnboarding').mockResolvedValue(true);

    for (let i = 0; i < 10; i += 1) {
      const nextButton = wrapper.find('[data-testid="onboarding-next"]');
      if (!nextButton.exists()) {
        break;
      }
      await nextButton.trigger('click');
    }

    const buttons = wrapper.findAll('button');
    const acceptButton = buttons.find((btn) => btn.text().includes('onboarding.accept_button'));
    expect(acceptButton).toBeDefined();
    expect(acceptButton!.attributes('disabled')).toBeDefined();

    await wrapper.get('input[type="checkbox"]').setValue(true);
    const refreshedButtons = wrapper.findAll('button');
    const enabledAcceptButton = refreshedButtons.find((btn) =>
      btn.text().includes('onboarding.accept_button'),
    );

    expect(enabledAcceptButton!.attributes('disabled')).toBeUndefined();
    await enabledAcceptButton!.trigger('click');

    expect(completeSpy).toHaveBeenCalled();
    expect(mockRouterPush).toHaveBeenCalledWith('/game');
  });
});
