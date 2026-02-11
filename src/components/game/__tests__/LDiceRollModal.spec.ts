import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { nextTick } from 'vue';
import LDiceRollModal from '../LDiceRollModal.vue';
import type { MoveResponse } from 'src/types/game.interface';

const {
  mockRollDice,
  mockManualMove,
  mockNotify,
  mockDialog,
  mockRouterPush,
  mockVibrate,
} = vi.hoisted(() => ({
  mockRollDice: vi.fn(),
  mockManualMove: vi.fn(),
  mockNotify: vi.fn(),
  mockDialog: vi.fn(),
  mockRouterPush: vi.fn(),
  mockVibrate: vi.fn(),
}));

const mockGameStore = {
  rollDice: mockRollDice,
  manualMove: mockManualMove,
  currentDiceRolls: [] as number[],
  error: null as string | null,
};

vi.mock('src/stores/game.store', () => ({
  useGameStore: () => mockGameStore,
}));

vi.mock('src/stores/settings.store', () => ({
  useSettingsStore: () => ({
    vibrate: mockVibrate,
  }),
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const cell = params?.cell;
      if (typeof cell === 'number' || typeof cell === 'string') {
        return `${key}:${cell}`;
      }
      return key;
    },
  }),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock('quasar', async () => {
  const actual = await vi.importActual('quasar');
  return {
    ...actual,
    useQuasar: () => ({
      notify: mockNotify,
      dialog: mockDialog,
    }),
  };
});

function createMoveResponse(partial: Partial<MoveResponse> = {}): MoveResponse {
  return {
    move: {
      id: 1,
      game_id: 1,
      move_number: 1,
      dice_rolls: [4],
      total_roll: 4,
      is_triple_six: false,
      start_cell: 0,
      end_cell: 4,
      final_cell: 4,
      transition_type: 'none',
      transition_from: null,
      transition_to: null,
      ai_interpretation: null,
      player_insight: null,
      created_at: '2026-02-11T00:00:00Z',
    },
    cell_info: {
      id: 4,
      name_ru: 'Клетка',
      chakra_level: 1,
      chakra_name: 'Муладхара',
      affirmation_ru: 'Аффирмация',
      transition_type: 'none',
      transition_to: null,
    },
    game_status: 'in_progress',
    requires_another_roll: false,
    is_entry_move: false,
    is_victory: false,
    ...partial,
  };
}

function mountModal() {
  return shallowMount(LDiceRollModal, {
    props: {
      modelValue: true,
    },
    global: {
      stubs: {
        LModal: {
          template: '<div v-if="modelValue"><slot /></div>',
          props: ['modelValue'],
        },
        'q-btn': {
          template:
            '<button :data-testid="$attrs[\'data-testid\']" @click="$emit(\'click\')"><slot /></button>',
        },
        'q-btn-toggle': {
          template: '<div />',
        },
        LDice: true,
        LDiceManual: {
          template: '<button data-testid="manual-confirm" @click="$emit(\'confirm\', 5)" />',
        },
      },
    },
  });
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('LDiceRollModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockGameStore.currentDiceRolls = [];
    mockGameStore.error = null;
    mockDialog.mockReturnValue({
      onOk: () => ({ onOk: () => undefined }),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('авто-режим вызывает rollDice и закрывает модалку после минимальной задержки', async () => {
    mockRollDice.mockResolvedValue(createMoveResponse());

    const wrapper = mountModal();
    await wrapper.get('[data-testid="dice-auto-roll-btn"]').trigger('click');

    expect(mockRollDice).toHaveBeenCalledOnce();

    await vi.advanceTimersByTimeAsync(1199);
    await flushPromises();
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();

    await vi.advanceTimersByTimeAsync(551);
    await flushPromises();

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
  });

  it('ручной режим вызывает manualMove с выбранным значением', async () => {
    mockManualMove.mockResolvedValue(createMoveResponse());

    const wrapper = mountModal();
    (wrapper.vm as unknown as { diceMode: 'auto' | 'manual' }).diceMode = 'manual';
    await nextTick();

    await wrapper.get('[data-testid="manual-confirm"]').trigger('click');

    expect(mockManualMove).toHaveBeenCalledWith(5);
  });

  it('обрабатывает тройную шестерку, переход и победу', async () => {
    const response = createMoveResponse({
      move: {
        ...createMoveResponse().move,
        dice_rolls: [6, 6, 6, 4],
        is_triple_six: true,
        transition_type: 'arrow',
        final_cell: 23,
      },
      is_victory: true,
    });

    mockRollDice.mockResolvedValue(response);

    const wrapper = mountModal();
    await wrapper.get('[data-testid="dice-auto-roll-btn"]').trigger('click');

    await vi.advanceTimersByTimeAsync(1800);
    await flushPromises();

    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'dice.burned' }),
    );
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'game.arrow_notify:23' }),
    );
    expect(mockDialog).toHaveBeenCalled();
  });
});
