import { describe, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import type { MoveOut, Cell } from 'src/types/game.interface';
import LCellCard from '../LCellCard.vue';

const { mockMoves } = vi.hoisted(() => ({
  mockMoves: [] as MoveOut[],
}));

vi.mock('src/stores/game.store', () => ({
  useGameStore: () => ({
    moves: mockMoves,
    currentGame: { id: 1, mode: 'free' },
    isNextClarificationPaid: true,
    isArrowStart: () => false,
    isSnakeHead: () => false,
    getTransition: () => ({ type: 'none', to: null }),
  }),
}));

vi.mock('src/stores/reference.store', () => ({
  useReferenceStore: () => ({
    fetchCellById: vi.fn().mockResolvedValue({ id: 1, name: 'Клетка', name_ru: 'Клетка' }),
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

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const dict: Record<string, string> = {
        'transition.arrow': 'Стрела',
        'transition.snake': 'Змея',
        'transition.arrived_by_arrow': 'Вы поднялись по стреле с клетки {from} на клетку {to}.',
        'transition.arrived_by_snake': 'Вы опустились по змее с клетки {from} на клетку {to}.',
        'transition.arrow_interpretation':
          'В Лиле стрела означает поддержку добродетели и рост уровня сознания.',
        'transition.snake_interpretation':
          'В Лиле змея указывает на урок через порок и возвращение к проработке.',
      };
      const base = dict[key] ?? key;
      if (!params) return base;
      const toText = (value: unknown): string => {
        if (value == null) return '';
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          return String(value);
        }
        return '';
      };
      const from = toText(params.from);
      const to = toText(params.to);
      return base.replace('{from}', from).replace('{to}', to);
    },
  }),
}));

function buildMove(params: Partial<MoveOut>): MoveOut {
  return {
    id: 1,
    game_id: 1,
    move_number: 1,
    dice_rolls: [6],
    is_triple_six: false,
    is_pending: false,
    start_cell: 10,
    end_cell: 10,
    final_cell: 23,
    transition_type: 'arrow',
    transition_from: 10,
    transition_to: 23,
    ai_interpretation: null,
    player_insight: null,
    created_at: '2026-01-01T00:00:00Z',
    ...params,
  };
}

function mountCard(cell: Cell) {
  return mount(LCellCard, {
    props: {
      modelValue: true,
      cell,
    },
    global: {
      stubs: {
        LModal: {
          template: '<div><slot name="header" /><slot /><slot name="actions" /></div>',
          props: ['modelValue', 'title', 'position', 'maxWidth', 'showHandle'],
        },
        LClarificationPanel: true,
        'q-scroll-area': { template: '<div><slot /></div>' },
        'q-banner': { template: '<div><slot name="avatar" /><slot /></div>' },
        'q-icon': true,
        'q-btn': true,
        'q-avatar': { template: '<div><slot /></div>' },
        'q-chip': { template: '<div><slot /></div>' },
      },
    },
  });
}

describe('LCellCard', () => {
  it('показывает текст подъема и интерпретацию Лилы после стрелы', async () => {
    mockMoves.splice(
      0,
      mockMoves.length,
      buildMove({
        transition_type: 'arrow',
        transition_from: 10,
        transition_to: 23,
        final_cell: 23,
      }),
    );

    const wrapper = mountCard({
      id: 23,
      name: 'Клетка 23',
      chakra_level: 3,
      description: 'Описание',
    });

    await flushPromises();

    const text = wrapper.text();
    expect(text).toContain('Вы поднялись по стреле с клетки 10 (Клетка) на клетку 23 (Клетка).');
    expect(text).toContain('В Лиле стрела означает поддержку добродетели и рост уровня сознания.');
  });

  it('показывает текст спуска и интерпретацию Лилы после змеи', async () => {
    mockMoves.splice(
      0,
      mockMoves.length,
      buildMove({ transition_type: 'snake', transition_from: 44, transition_to: 9, final_cell: 9 }),
    );

    const wrapper = mountCard({
      id: 9,
      name: 'Клетка 9',
      chakra_level: 1,
      description: 'Описание',
    });

    await flushPromises();

    const text = wrapper.text();
    expect(text).toContain('Вы опустились по змее с клетки 44 (Клетка) на клетку 9 (Клетка).');
    expect(text).toContain('В Лиле змея указывает на урок через порок и возвращение к проработке.');
  });

  it('показывает баннер перехода, даже если transition_from/transition_to не пришли', async () => {
    mockMoves.splice(
      0,
      mockMoves.length,
      buildMove({
        transition_type: 'arrow',
        transition_from: null,
        transition_to: null,
        end_cell: 10,
        final_cell: 23,
      }),
    );

    const wrapper = mountCard({
      id: 23,
      name: 'Клетка 23',
      chakra_level: 3,
      description: 'Описание',
    });

    await flushPromises();

    const text = wrapper.text();
    expect(text).toContain('Вы поднялись по стреле с клетки 10 (Клетка) на клетку 23 (Клетка).');
  });
});
