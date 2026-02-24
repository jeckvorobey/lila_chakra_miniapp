import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import type { CellBrief } from 'src/types/game.interface';
import LCellInfo from '../LCellInfo.vue';

const { gameStoreState, getClarificationHistoryMock } = vi.hoisted(() => ({
  gameStoreState: {
    currentGame: {
      id: 1,
      mode: 'free' as 'free' | 'ai_incognito' | 'ai_guide',
      status: 'in_progress' as 'in_progress' | 'completed',
    },
    clarificationsFreeLeft: 3,
    moves: [],
  },
  getClarificationHistoryMock: vi.fn(),
}));

vi.mock('src/stores/game.store', () => ({
  useGameStore: () => ({
    currentGame: gameStoreState.currentGame,
    clarificationsFreeLeft: gameStoreState.clarificationsFreeLeft,
    moves: gameStoreState.moves,
  }),
}));

vi.mock('src/services/api', () => ({
  gamesApi: {
    getClarificationHistory: getClarificationHistoryMock,
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
  gameStoreState.moves = [];
  getClarificationHistoryMock.mockReset();
  getClarificationHistoryMock.mockResolvedValue({ items: [] });
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
            "<button :data-testid=\"$attrs['data-testid']\" :disabled=\"$attrs.disable\" @click=\"$emit('click')\"><slot /></button>",
        },
        LModal: {
          template:
            '<div data-testid="cell-info-modal"><slot name="header" /><slot /><slot name="actions" /></div>',
          props: ['modelValue'],
        },
        LClarificationPanel: {
          name: 'LClarificationPanel',
          props: ['initialClarifications'],
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
});
