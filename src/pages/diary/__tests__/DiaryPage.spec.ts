import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { nextTick } from 'vue';
import DiaryPage from '../DiaryPage.vue';

const { mockRouterPush, mockGamesList, mockLoadGame } = vi.hoisted(() => ({
  mockRouterPush: vi.fn(),
  mockGamesList: vi.fn(),
  mockLoadGame: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

vi.mock('src/stores/game.store', () => ({
  useGameStore: () => ({
    loadGame: mockLoadGame,
  }),
}));

vi.mock('src/services/api', () => ({
  gamesApi: {
    list: mockGamesList,
  },
}));

vi.mock('src/components/common/LPageSkeleton.vue', () => ({
  default: {
    template: '<div data-testid="page-skeleton" />',
  },
}));

const QBtnStub = {
  template: `
    <button
      type="button"
      @click="$emit('click', { stopPropagation: () => undefined })"
    >
      <slot />
    </button>
  `,
};

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('DiaryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('по кнопке отчета грузит выбранную игру и открывает её финальный отчет', async () => {
    mockGamesList.mockResolvedValue({
      items: [
        {
          id: 7,
          query: 'Тестовый запрос',
          category: 'career',
          mode: 'free',
          status: 'completed',
          current_cell: 68,
          total_moves: 12,
          clarifications_used: 0,
          is_next_clarification_paid: true,
          created_at: '2026-02-01T10:00:00Z',
          completed_at: '2026-02-02T10:00:00Z',
          magic_time_ends_at: null,
        },
      ],
      total: 1,
      offset: 0,
      limit: 20,
      has_more: false,
    });
    mockLoadGame.mockResolvedValue(true);
    const i18n = createI18n({
      legacy: false,
      locale: 'en-US',
      missingWarn: false,
      fallbackWarn: false,
      messages: {
        'en-US': {},
      },
    });

    const wrapper = mount(DiaryPage, {
      global: {
        plugins: [i18n],
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          'q-list': { template: '<div><slot /></div>' },
          'q-card': { template: '<div><slot /></div>' },
          'q-card-section': { template: '<div><slot /></div>' },
          'q-badge': { template: '<div><slot /></div>' },
          'q-space': { template: '<div />' },
          'q-tooltip': { template: '<div><slot /></div>' },
          'q-chip': { template: '<div><slot /></div>' },
          'q-icon': { template: '<i />' },
          'q-btn': QBtnStub,
        },
      },
    });

    await flushPromises();

    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(mockLoadGame).toHaveBeenCalledWith(7);
    expect(mockRouterPush).toHaveBeenCalledWith('/game/final/7');
  });

  it('показывает skeleton пока загружается список игр', async () => {
    let resolveList: ((value: unknown) => void) | null = null;
    mockGamesList.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveList = resolve;
        }),
    );

    const i18n = createI18n({
      legacy: false,
      locale: 'en-US',
      missingWarn: false,
      fallbackWarn: false,
      messages: {
        'en-US': {},
      },
    });

    const wrapper = mount(DiaryPage, {
      global: {
        plugins: [i18n],
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          'q-list': { template: '<div><slot /></div>' },
          'q-card': { template: '<div><slot /></div>' },
          'q-card-section': { template: '<div><slot /></div>' },
          'q-badge': { template: '<div><slot /></div>' },
          'q-space': { template: '<div />' },
          'q-tooltip': { template: '<div><slot /></div>' },
          'q-chip': { template: '<div><slot /></div>' },
          'q-icon': { template: '<i />' },
          'q-btn': QBtnStub,
        },
      },
    });

    await nextTick();
    expect(wrapper.find('[data-testid="page-skeleton"]').exists()).toBe(true);

    resolveList?.({
      items: [],
      total: 0,
      offset: 0,
      limit: 20,
      has_more: false,
    });
    await flushPromises();
  });
});
