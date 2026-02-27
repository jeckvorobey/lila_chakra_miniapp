import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import type { CellBrief, MoveOut } from 'src/types/game.interface';
import LCellInfo from '../LCellInfo.vue';

const { gameStoreState, getClarificationHistoryMock, generateMoveMentorMock } = vi.hoisted(() => ({
  gameStoreState: {
    currentGame: {
      id: 1,
      mode: 'free' as 'free' | 'ai_incognito' | 'ai_guide',
      status: 'in_progress' as 'in_progress' | 'completed',
    },
    isNextClarificationPaid: false,
    moves: [] as MoveOut[],
  },
  getClarificationHistoryMock: vi.fn(),
  generateMoveMentorMock: vi.fn(),
}));

vi.mock('src/stores/game.store', () => ({
  useGameStore: () => ({
    currentGame: gameStoreState.currentGame,
    isNextClarificationPaid: gameStoreState.isNextClarificationPaid,
    moves: gameStoreState.moves,
  }),
}));

vi.mock('src/services/api', () => ({
  gamesApi: {
    getClarificationHistory: getClarificationHistoryMock,
    generateMoveMentor: generateMoveMentorMock,
  },
}));

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

interface CellInfoProps {
  modelValue: boolean;
  currentCellInfo: CellBrief | null;
  gameMode: 'free' | 'ai_incognito' | 'ai_guide';
}

beforeEach(() => {
  gameStoreState.currentGame.id = 1;
  gameStoreState.currentGame.mode = 'free';
  gameStoreState.currentGame.status = 'in_progress';
  gameStoreState.isNextClarificationPaid = false;
  gameStoreState.moves = [];
  getClarificationHistoryMock.mockReset();
  getClarificationHistoryMock.mockResolvedValue({
    items: [],
    is_next_clarification_paid: false,
  });
  generateMoveMentorMock.mockReset();
  generateMoveMentorMock.mockResolvedValue({
    move_id: 1,
    interpretation: 'Тестовая интерпретация',
    reflection_points: ['Вопрос 1'],
  });
});

function mountCellInfo(overrides: Partial<CellInfoProps> = {}) {
  return mount(LCellInfo, {
    props: {
      modelValue: true,
      currentCellInfo,
      gameMode: 'free',
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
            '<button :data-testid="$attrs[\'data-testid\']" :disabled="$attrs.disable" @click="$emit(\'click\')"><slot /></button>',
        },
        LModal: {
          template:
            '<div data-testid="cell-info-modal"><slot name="header" /><slot /><slot name="actions" /></div>',
          props: ['modelValue'],
        },
        LClarificationPanel: {
          name: 'LClarificationPanel',
          props: ['initialClarifications', 'isNextClarificationPaid'],
          template: '<div data-testid="clarification-panel" />',
        },
        LTransitionBanner: true,
      },
    },
  });
}

describe('LCellInfo', () => {
  it('показывает вопросы саморефлексии только в free режиме', () => {
    const wrapper = mountCellInfo({
      currentCellInfo: {
        ...currentCellInfo,
        reflection_questions: {
          relationships: 'Вопрос про отношения',
        },
      },
      gameMode: 'free',
    });

    expect(wrapper.text()).toContain('cell.reflection_questions');
    expect(wrapper.text()).toContain('Вопрос про отношения');
  });

  it('не показывает вопросы саморефлексии в AI режимах', () => {
    const wrapper = mountCellInfo({
      currentCellInfo: {
        ...currentCellInfo,
        reflection_questions: {
          relationships: 'Вопрос про отношения',
        },
      },
      gameMode: 'ai_guide',
    });

    expect(wrapper.text()).not.toContain('Вопрос про отношения');
  });

  it('передаёт в панель ранее сохранённые уточнения из истории AI_GUIDE', async () => {
    gameStoreState.currentGame.mode = 'ai_guide';
    getClarificationHistoryMock.mockResolvedValue({
      items: [
        {
          id: 1,
          cell_id: 5,
          answer: 'Разверни внимание на одном маленьком шаге сегодня.',
          question: 'Что мне делать прямо сейчас?',
          created_at: '2026-02-23T18:00:00Z',
        },
      ],
    });

    const wrapper = mountCellInfo({
      gameMode: 'ai_guide',
    });
    await flushPromises();

    const panel = wrapper.getComponent({ name: 'LClarificationPanel' });
    expect(panel.props('initialClarifications')).toEqual([
      {
        question: 'Что мне делать прямо сейчас?',
        answer: 'Разверни внимание на одном маленьком шаге сегодня.',
      },
    ]);
  });

  it('на клетке 68 в completed показывает кнопку Далее и эмитит go-next', async () => {
    gameStoreState.currentGame.status = 'completed';

    const wrapper = mountCellInfo({
      currentCellInfo: {
        ...currentCellInfo,
        id: 68,
      },
    });

    const continueBtn = wrapper.get('[data-testid="victory-continue-btn"]');
    await continueBtn.trigger('click');

    expect(wrapper.emitted('go-next')).toBeTruthy();
    expect(wrapper.find('[data-testid="clarification-panel"]').exists()).toBe(false);
  });

  it('после добавления уточнения перезагружает историю и обновляет флаг платности', async () => {
    getClarificationHistoryMock
      .mockResolvedValueOnce({
        items: [],
        is_next_clarification_paid: false,
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: 2,
            cell_id: 5,
            answer: 'Сконцентрируйся на одном действии сегодня.',
            question: 'На чём сфокусироваться?',
            created_at: '2026-02-27T18:00:00Z',
          },
        ],
        is_next_clarification_paid: true,
      });

    const wrapper = mountCellInfo({ gameMode: 'ai_guide' });
    await flushPromises();

    const panel = wrapper.getComponent({ name: 'LClarificationPanel' });
    panel.vm.$emit('clarification-added', {
      question: 'На чём сфокусироваться?',
      answer: 'Сконцентрируйся на одном действии сегодня.',
    });
    await flushPromises();

    expect(getClarificationHistoryMock).toHaveBeenNthCalledWith(1, 1, 5);
    expect(getClarificationHistoryMock).toHaveBeenNthCalledWith(2, 1, 5);
    expect(panel.props('isNextClarificationPaid')).toBe(true);
    expect(panel.props('initialClarifications')).toEqual([
      {
        question: 'На чём сфокусироваться?',
        answer: 'Сконцентрируйся на одном действии сегодня.',
      },
    ]);
  });

  it('при повторном открытии модалки заново подгружает историю уточнений', async () => {
    const wrapper = mountCellInfo({ gameMode: 'ai_guide' });
    await flushPromises();

    expect(getClarificationHistoryMock).toHaveBeenCalledTimes(1);
    expect(getClarificationHistoryMock).toHaveBeenNthCalledWith(1, 1, 5);

    await wrapper.setProps({ modelValue: false });
    await flushPromises();
    await wrapper.setProps({ modelValue: true });
    await flushPromises();

    expect(getClarificationHistoryMock).toHaveBeenCalledTimes(2);
    expect(getClarificationHistoryMock).toHaveBeenNthCalledWith(2, 1, 5);
  });

  it('в платном режиме догружает ответ move_mentor для последнего хода без интерпретации', async () => {
    gameStoreState.currentGame.mode = 'ai_guide';
    gameStoreState.moves = [
      {
        id: 77,
        game_id: 1,
        move_number: 1,
        dice_rolls: [5],
        is_triple_six: false,
        is_pending: false,
        start_cell: 0,
        end_cell: 5,
        final_cell: 5,
        transition_type: 'none',
        transition_from: null,
        transition_to: null,
        ai_interpretation: null,
        player_insight: null,
        created_at: '2026-02-27T18:00:00Z',
      },
    ];
    generateMoveMentorMock.mockResolvedValue({
      move_id: 77,
      interpretation: 'Интерпретация из endpoint',
      reflection_points: ['Что стоит осознать прямо сейчас?'],
    });

    mountCellInfo({ gameMode: 'ai_guide' });
    await flushPromises();

    expect(generateMoveMentorMock).toHaveBeenCalledWith(1, 77);
    expect(gameStoreState.moves[0]?.ai_interpretation).toBe('Интерпретация из endpoint');
  });
});
