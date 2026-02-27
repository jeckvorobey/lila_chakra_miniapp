import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import LTokenConfirmModal from '../LTokenConfirmModal.vue';
import type { TokenConfirmOptions } from 'src/stores/ui.store';

const { mockResolveConfirm, mockResolveCancel } = vi.hoisted(() => ({
  mockResolveConfirm: vi.fn(),
  mockResolveCancel: vi.fn(),
}));

const mockUiStore = {
  isTokenConfirmOpen: true,
  confirmOptions: { amount: 1 } as TokenConfirmOptions | null,
  resolveConfirm: mockResolveConfirm,
  resolveCancel: mockResolveCancel,
};

const mockUserStore = {
  balance: 100,
};

vi.mock('src/stores/ui.store', () => ({
  useUiStore: () => mockUiStore,
}));

vi.mock('src/stores/user.store', () => ({
  useUserStore: () => mockUserStore,
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      typeof params?.amount === 'number' ? `${key}:${params.amount}` : key,
  }),
}));

const QBtnStub = defineComponent({
  name: 'QBtnStub',
  props: {
    label: {
      type: String,
      default: '',
    },
    disable: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['click'],
  template:
    '<button :data-label="label" :disabled="disable" @click="$emit(\'click\')">{{ label }}</button>',
});

const LModalStub = defineComponent({
  name: 'LModalStub',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  template: '<div v-if="modelValue"><slot name="header" /><slot /><slot name="actions" /></div>',
});

function mountModal() {
  return mount(LTokenConfirmModal, {
    global: {
      stubs: {
        'l-modal': LModalStub,
        'q-btn': QBtnStub,
        'q-icon': true,
        'q-banner': {
          template: '<div><slot /></div>',
        },
      },
    },
  });
}

function getButtonByLabel(
  wrapper: ReturnType<typeof mountModal>,
  label: string,
): ReturnType<typeof wrapper.get> {
  return wrapper.get(`[data-label="${label}"]`);
}

describe('LTokenConfirmModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUiStore.isTokenConfirmOpen = true;
    mockUiStore.confirmOptions = { amount: 7 };
    mockUserStore.balance = 100;
  });

  it('использует i18n-ключи по умолчанию для заголовка, текста и кнопок', () => {
    const wrapper = mountModal();

    expect(wrapper.text()).toContain('payment.token_confirm.title');
    expect(wrapper.text()).toContain('payment.token_confirm.message:7');
    expect(wrapper.text()).toContain('rules.tkn');
    expect(wrapper.text()).toContain('payment.token_confirm.confirm_button');
    expect(wrapper.text()).toContain('payment.token_confirm.cancel_button');
  });

  it('показывает переданные title и message вместо дефолтных переводов', () => {
    mockUiStore.confirmOptions = {
      amount: 3,
      title: 'custom.title',
      message: 'custom.message',
    };

    const wrapper = mountModal();

    expect(wrapper.text()).toContain('custom.title');
    expect(wrapper.text()).toContain('custom.message');
    expect(wrapper.text()).not.toContain('payment.token_confirm.title');
    expect(wrapper.text()).not.toContain('payment.token_confirm.message:3');
  });

  it('блокирует подтверждение и показывает предупреждение при нехватке баланса', () => {
    mockUiStore.confirmOptions = { amount: 5 };
    mockUserStore.balance = 1;

    const wrapper = mountModal();
    const confirmButton = getButtonByLabel(wrapper, 'payment.token_confirm.confirm_button');

    expect(confirmButton.attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('clarification.insufficient_balance');
  });

  it('вызывает store-обработчики по клику на кнопки', async () => {
    const wrapper = mountModal();

    await getButtonByLabel(wrapper, 'payment.token_confirm.confirm_button').trigger('click');
    await getButtonByLabel(wrapper, 'payment.token_confirm.cancel_button').trigger('click');

    expect(mockResolveConfirm).toHaveBeenCalledOnce();
    expect(mockResolveCancel).toHaveBeenCalledOnce();
  });
});
