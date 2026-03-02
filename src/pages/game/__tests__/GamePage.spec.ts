import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import GamePage from '../GamePage.vue';

const { mockLoadLatestActiveGame } = vi.hoisted(() => ({
  mockLoadLatestActiveGame: vi.fn(),
}));

const mockGameStore = {
  currentGame: null as { status: string } | null,
  loadLatestActiveGame: mockLoadLatestActiveGame,
};

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

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('GamePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('показывает empty state и пытается восстановить активную игру', async () => {
    mockGameStore.currentGame = null;
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

  it('показывает active state и не делает восстановление если игра уже активна', async () => {
    mockGameStore.currentGame = { status: 'in_progress' };

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
    expect(wrapper.find('[data-testid="active-state"]').exists()).toBe(true);
  });

  it('для завершенной игры пытается восстановить активную и показывает empty state', async () => {
    mockGameStore.currentGame = { status: 'completed' };
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
