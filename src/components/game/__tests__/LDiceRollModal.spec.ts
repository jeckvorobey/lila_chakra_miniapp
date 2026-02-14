import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { nextTick } from 'vue';
import LDiceRollModal from '../LDiceRollModal.vue';
import type { MoveResponse } from 'src/types/game.interface';

const {
  mockRollDiceAuto,
  mockRollDiceManual,
  mockAddManualSix,
  mockResetManualRolls,
  mockNotify,
  mockDialog,
  mockRouterPush,
  mockVibrate,
} = vi.hoisted(() => ({
  mockRollDiceAuto: vi.fn(),
  mockRollDiceManual: vi.fn(),
  mockAddManualSix: vi.fn(),
  mockResetManualRolls: vi.fn(),
  mockNotify: vi.fn(),
  mockDialog: vi.fn(),
  mockRouterPush: vi.fn(),
  mockVibrate: vi.fn(),
}));

const mockGameStore = {
  rollDiceAuto: mockRollDiceAuto,
  rollDiceManual: mockRollDiceManual,
  addManualSix: mockAddManualSix,
  resetManualRolls: mockResetManualRolls,
  currentDiceRolls: [] as number[],
  error: null as string | null,
};

vi.mock('src/stores/game.store', () => ({
  useGameStore: () => mockGameStore,
}));

vi.mock('src/stores/settings.store', () => ({
  useSettingsStore: () => ({
    vibrate: mockVibrate,
    playSound: vi.fn(),
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

function createFinalMoveResponse(partial: Partial<MoveResponse> = {}): MoveResponse {
  return {
    move: {
      id: 1,
      game_id: 1,
      move_number: 1,
      dice_rolls: [4],
      is_triple_six: false,
      is_pending: false,
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

function createIntermediateResponse(): MoveResponse {
  return {
    requires_another_roll: true,
    intermediate: {
      pending_move_id: 12,
      dice_value: 6,
      accumulated_rolls: [6],
      is_triple_six: false,
      requires_another_roll: true,
      message_key: 'dice.rolled_six_roll_again',
    },
    is_entry_move: false,
    is_victory: false,
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
          template:
            '<div><button data-testid="manual-confirm" @click="$emit(\'confirm\', 5)" />' +
            '<button data-testid="manual-six" @click="$emit(\'six-selected\')" /></div>',
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

  it('авто-режим вызывает rollDiceAuto и устанавливает результат после задержки', async () => {
    mockRollDiceAuto.mockResolvedValue(createFinalMoveResponse());

    const wrapper = mountModal();
    await wrapper.get('[data-testid="dice-auto-roll-btn"]').trigger('click');

    expect(mockRollDiceAuto).toHaveBeenCalledOnce();

    await vi.advanceTimersByTimeAsync(1999);
    await flushPromises();

    const dice = wrapper.findComponent({ name: 'LDice' });
    expect(dice.props('result')).toBeNull();

    await vi.advanceTimersByTimeAsync(1);
    await flushPromises();

    expect(dice.props('result')).toBe(4);
    expect(dice.props('isRolling')).toBe(true);
  });

  it('закрывает модалку после roll-complete для финального ответа', async () => {
    mockRollDiceAuto.mockResolvedValue(createFinalMoveResponse());

    const wrapper = mountModal();
    await wrapper.get('[data-testid="dice-auto-roll-btn"]').trigger('click');

    await vi.advanceTimersByTimeAsync(2000);
    await flushPromises();

    const dice = wrapper.findComponent({ name: 'LDice' });
    dice.vm.$emit('roll-complete', 4);
    await nextTick();

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();

    await vi.advanceTimersByTimeAsync(450);
    await flushPromises();

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
  });

  it('при промежуточном авто-ответе не закрывает модалку', async () => {
    mockRollDiceAuto.mockResolvedValue(createIntermediateResponse());

    const wrapper = mountModal();
    await wrapper.get('[data-testid="dice-auto-roll-btn"]').trigger('click');

    await vi.advanceTimersByTimeAsync(2000);
    await flushPromises();

    const dice = wrapper.findComponent({ name: 'LDice' });
    expect(dice.props('result')).toBe(6);

    dice.vm.$emit('roll-complete', 6);
    await nextTick();

    await vi.advanceTimersByTimeAsync(450);
    await flushPromises();

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('roll-finished')).toBeUndefined();
  });

  it('ручной режим вызывает rollDiceManual с выбранным значением', async () => {
    mockRollDiceManual.mockResolvedValue(createFinalMoveResponse());

    const wrapper = mountModal();
    (wrapper.vm as unknown as { diceMode: 'auto' | 'manual' }).diceMode = 'manual';
    await nextTick();

    await wrapper.get('[data-testid="manual-confirm"]').trigger('click');

    expect(mockRollDiceManual).toHaveBeenCalledWith(5);
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
  });

  it('в ручном режиме выбор 6 вызывает addManualSix без API запроса', async () => {
    mockAddManualSix.mockReturnValue([6]);

    const wrapper = mountModal();
    (wrapper.vm as unknown as { diceMode: 'auto' | 'manual' }).diceMode = 'manual';
    await nextTick();

    await wrapper.get('[data-testid="manual-six"]').trigger('click');

    expect(mockAddManualSix).toHaveBeenCalledOnce();
    expect(mockRollDiceManual).not.toHaveBeenCalled();
  });

  it('показывает ошибку если rollDiceAuto вернул null', async () => {
    mockRollDiceAuto.mockResolvedValue(null);
    mockGameStore.error = 'Ошибка сети';

    const wrapper = mountModal();
    await wrapper.get('[data-testid="dice-auto-roll-btn"]').trigger('click');

    await flushPromises();

    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'negative', message: 'Ошибка сети' }),
    );
  });
});
