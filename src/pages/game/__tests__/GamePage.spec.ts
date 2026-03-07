import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { reactive, nextTick } from 'vue';
import GamePage from '../GamePage.vue';

const { mockLoadLatestActiveGame } = vi.hoisted(() => ({
  mockLoadLatestActiveGame: vi.fn(),
}));

const mockGameStore = reactive({
  isGameActive: false,
  loadLatestActiveGame: mockLoadLatestActiveGame,
});

vi.mock('src/stores/game.store', () => ({
  useGameStore: () => mockGameStore,
}));

vi.mock('src/components/game', () => ({
  LGameEmptyState: {
    template: '<div data-testid="empty-state" />',
  },
  LGameActiveState: {
    template: '<div data-testid="active-state" />',
  },
}));

vi.mock('src/components/common/LPageSkeleton.vue', () => ({
  default: {
    template: '<div data-testid="page-skeleton" />',
  },
}));

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('GamePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGameStore.isGameActive = false;
  });

  it('во время восстановления активной игры показывает skeleton', async () => {
    mockGameStore.isGameActive = false;
    let resolveLoad: (value: boolean) => void = () => {
      throw new Error('resolveLoad was called before initialization');
    };
    mockLoadLatestActiveGame.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolveLoad = resolve;
        }),
    );

    const wrapper = mount(GamePage, {
      global: {
        stubs: {
          'q-page': {
            template: '<div><slot /></div>',
          },
        },
      },
    });

    await nextTick();
    expect(wrapper.find('[data-testid="page-skeleton"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="active-state"]').exists()).toBe(false);

    resolveLoad(false);
    await flushPromises();

    expect(mockLoadLatestActiveGame).toHaveBeenCalledOnce();
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true);
  });

  it('после восстановления активной игры показывает active state', async () => {
    mockLoadLatestActiveGame.mockImplementation(() => {
      mockGameStore.isGameActive = true;
      return Promise.resolve(true);
    });

    const wrapper = mount(GamePage, {
      global: {
        stubs: {
          'q-page': {
            template: '<div><slot /></div>',
          },
        },
      },
    });

    await flushPromises();
    await nextTick();

    expect(mockLoadLatestActiveGame).toHaveBeenCalledOnce();
    expect(wrapper.find('[data-testid="active-state"]').exists()).toBe(true);
  });

  it('показывает active state и не делает восстановление если игра уже активна', async () => {
    mockGameStore.isGameActive = true;

    const wrapper = mount(GamePage, {
      global: {
        stubs: {
          'q-page': {
            template: '<div><slot /></div>',
          },
        },
      },
    });

    await flushPromises();

    expect(mockLoadLatestActiveGame).not.toHaveBeenCalled();
    expect(wrapper.find('[data-testid="page-skeleton"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="active-state"]').exists()).toBe(true);
  });

  it('для завершенной игры пытается восстановить активную и показывает empty state', async () => {
    mockGameStore.isGameActive = false;
    mockLoadLatestActiveGame.mockResolvedValue(false);

    const wrapper = mount(GamePage, {
      global: {
        stubs: {
          'q-page': {
            template: '<div><slot /></div>',
          },
        },
      },
    });

    await flushPromises();

    expect(mockLoadLatestActiveGame).toHaveBeenCalledOnce();
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true);
  });
});
