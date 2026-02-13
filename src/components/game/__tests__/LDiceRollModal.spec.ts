import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { nextTick } from 'vue';
import LDiceRollModal from '../LDiceRollModal.vue';
import type { MoveResponse } from 'src/types/game.interface';

const {
  mockRollDice,
  mockNotify,
  mockDialog,
  mockRouterPush,
  mockVibrate,
} = vi.hoisted(() => ({
  mockRollDice: vi.fn(),
  mockNotify: vi.fn(),
  mockDialog: vi.fn(),
  mockRouterPush: vi.fn(),
  mockVibrate: vi.fn(),
}));

const mockGameStore = {
  rollDice: mockRollDice,
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

  it('авто-режим вызывает rollDice и устанавливает result после минимальной задержки', async () => {
    mockRollDice.mockResolvedValue(createMoveResponse());

    const wrapper = mountModal();
    await wrapper.get('[data-testid="dice-auto-roll-btn"]').trigger('click');

    expect(mockRollDice).toHaveBeenCalledOnce();

    // Ждём минимальную задержку 2000ms
    await vi.advanceTimersByTimeAsync(1999);
    await flushPromises();

    // result ещё не установлен (задержка не прошла)
    const dice = wrapper.findComponent({ name: 'LDice' });
    expect(dice.props('result')).toBeNull();

    await vi.advanceTimersByTimeAsync(1);
    await flushPromises();

    // Теперь result установлен, isRolling всё ещё true (ждёт roll-complete)
    expect(dice.props('result')).toBe(4);
    expect(dice.props('isRolling')).toBe(true);
  });

  it('закрывает модалку после получения roll-complete и паузы', async () => {
    mockRollDice.mockResolvedValue(createMoveResponse());

    const wrapper = mountModal();
    await wrapper.get('[data-testid="dice-auto-roll-btn"]').trigger('click');

    // Минимальная задержка
    await vi.advanceTimersByTimeAsync(2000);
    await flushPromises();

    // Эмулируем roll-complete от LDice
    const dice = wrapper.findComponent({ name: 'LDice' });
    dice.vm.$emit('roll-complete', 4);
    await nextTick();

    // Модалка ещё не закрыта — ждём RESULT_VIEW_DELAY_MS (450ms)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();

    await vi.advanceTimersByTimeAsync(450);
    await flushPromises();

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
  });

  it('ручной режим вызывает rollDice с выбранным значением', async () => {
    mockRollDice.mockResolvedValue(createMoveResponse());

    const wrapper = mountModal();
    (wrapper.vm as unknown as { diceMode: 'auto' | 'manual' }).diceMode = 'manual';
    await nextTick();

    await wrapper.get('[data-testid="manual-confirm"]').trigger('click');

    expect(mockRollDice).toHaveBeenCalledWith(5);
  });

  it('в ручном режиме не запускает анимацию кубика и закрывает модалку сразу после ответа', async () => {
    const response = createMoveResponse();
    mockRollDice.mockResolvedValue(response);

    const wrapper = mountModal();
    (wrapper.vm as unknown as { diceMode: 'auto' | 'manual' }).diceMode = 'manual';
    await nextTick();

    expect(wrapper.findComponent({ name: 'LDice' }).exists()).toBe(false);

    await wrapper.get('[data-testid="manual-confirm"]').trigger('click');
    await flushPromises();

    expect(mockRollDice).toHaveBeenCalledWith(5);
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
    const emitted = wrapper.emitted('roll-finished') ?? [];
    expect(emitted).toHaveLength(1);
    expect(emitted[0]?.[0]).toEqual(response);
  });

  it('обрабатывает тройную шестерку и эмитит roll-finished', async () => {
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

    // Минимальная задержка
    await vi.advanceTimersByTimeAsync(2000);
    await flushPromises();

    // roll-complete
    const dice = wrapper.findComponent({ name: 'LDice' });
    dice.vm.$emit('roll-complete', 4);
    await nextTick();

    // RESULT_VIEW_DELAY_MS
    await vi.advanceTimersByTimeAsync(450);
    await flushPromises();

    // Тройная шестёрка — уведомление показывается в модалке
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'dice.burned' }),
    );

    // Переход и победа делегированы наверх через emit
    const emitted = wrapper.emitted('roll-finished') ?? [];
    expect(emitted).toHaveLength(1);
    expect(emitted[0]?.[0]).toEqual(response);
  });

  it('показывает ошибку если rollDice вернул null', async () => {
    mockRollDice.mockResolvedValue(null);
    mockGameStore.error = 'Ошибка сети';

    const wrapper = mountModal();
    await wrapper.get('[data-testid="dice-auto-roll-btn"]').trigger('click');

    await flushPromises();

    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'negative', message: 'Ошибка сети' }),
    );
  });
});
