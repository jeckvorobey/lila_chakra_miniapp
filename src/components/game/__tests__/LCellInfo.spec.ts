import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { CellBrief, MoveResponse } from 'src/types/game.interface';
import LCellInfo from '../LCellInfo.vue';

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('quasar', async () => {
  const actual = await vi.importActual('quasar');
  return {
    ...actual,
    useQuasar: () => ({
      dark: { isActive: false },
    }),
  };
});

const currentCellInfo: CellBrief = {
  id: 5,
  name_ru: 'Клетка 5',
  chakra_level: 1,
  chakra_name: 'Муладхара',
  transition_type: 'none',
  transition_to: null,
};

const moveResponse: MoveResponse = {
  requires_another_roll: false,
  move: {
    id: 1,
    game_id: 1,
    move_number: 1,
    dice_rolls: [3],
    is_triple_six: false,
    is_pending: false,
    start_cell: 2,
    end_cell: 5,
    final_cell: 5,
    transition_type: 'none',
    transition_from: null,
    transition_to: null,
    ai_interpretation: null,
    player_insight: null,
    created_at: '2024-01-01T00:00:00Z',
  },
  is_entry_move: false,
  is_victory: false,
};

interface CellInfoProps {
  currentCell: number;
  currentCellInfo: CellBrief | null;
  currentChakra: number;
  isWaitingForSix: boolean;
  isChipAnimating: boolean;
  isEndingGame: boolean;
}

function mountCellInfo(overrides: Partial<CellInfoProps> = {}) {
  return mount(LCellInfo, {
    props: {
      currentCell: 5,
      currentCellInfo,
      currentChakra: 1,
      isWaitingForSix: false,
      isChipAnimating: false,
      isEndingGame: false,
      ...overrides,
    },
    global: {
      stubs: {
        'q-card': { template: '<div><slot /></div>' },
        'q-card-section': { template: '<div><slot /></div>' },
        'q-avatar': { template: '<div><slot /></div>' },
        'q-icon': true,
        'q-btn': {
          template:
            "<button :data-testid=\"$attrs['data-testid']\" :disabled=\"$attrs.disable\" @click=\"$emit('click')\"><slot /></button>",
        },
        LDiceRollModal: {
          template:
            '<div data-testid="dice-modal">' +
            '{{ modelValue }}' +
            '<button data-testid="dice-finished-btn" @click="$emit(\'roll-finished\', moveResponse)" />' +
            '</div>',
          props: ['modelValue'],
          setup() {
            return { moveResponse };
          },
        },
      },
    },
  });
}

describe('LCellInfo', () => {
  it('отображает номер текущей клетки', () => {
    const wrapper = mountCellInfo();
    expect(wrapper.text()).toContain('5');
  });

  it('отображает название текущей клетки из props', () => {
    const wrapper = mountCellInfo();
    expect(wrapper.text()).toContain('Клетка 5');
  });

  it('показывает предупреждение при ожидании шестёрки', () => {
    const wrapper = mountCellInfo({ isWaitingForSix: true });
    expect(wrapper.text()).toContain('dice.waiting_for_6');
  });

  it('не показывает предупреждение при нормальном броске', () => {
    const wrapper = mountCellInfo({ isWaitingForSix: false });
    expect(wrapper.text()).not.toContain('dice.waiting_for_6');
  });

  it('по кнопке инфо эмитит событие show-current-cell-info', async () => {
    const wrapper = mountCellInfo();
    await wrapper.get('[data-testid="current-cell-info-btn"]').trigger('click');
    expect(wrapper.emitted('show-current-cell-info')).toBeTruthy();
  });

  it('по кнопке броска открывает модалку кубика', async () => {
    const wrapper = mountCellInfo();
    expect(wrapper.get('[data-testid="dice-modal"]').text()).toContain('false');
    await wrapper.get('[data-testid="open-dice-modal-btn"]').trigger('click');
    expect(wrapper.get('[data-testid="dice-modal"]').text()).toContain('true');
  });

  it('по кнопке завершения игры эмитит событие confirm-end-game', async () => {
    const wrapper = mountCellInfo();
    await wrapper.get('[data-testid="end-game-btn"]').trigger('click');
    expect(wrapper.emitted('confirm-end-game')).toBeTruthy();
  });

  it('эмитит roll-finished при завершении броска кубика', async () => {
    const wrapper = mountCellInfo();
    await wrapper.get('[data-testid="dice-finished-btn"]').trigger('click');
    expect(wrapper.emitted('roll-finished')).toBeTruthy();
  });

  it('кнопка броска заблокирована при isChipAnimating=true', () => {
    const wrapper = mountCellInfo({ isChipAnimating: true });
    const btn = wrapper.get('[data-testid="open-dice-modal-btn"]');
    expect(btn.attributes('disabled')).toBeDefined();
  });
});
