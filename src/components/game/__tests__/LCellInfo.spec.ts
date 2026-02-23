import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { CellBrief } from 'src/types/game.interface';
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

interface CellInfoProps {
  modelValue: boolean;
  currentCellInfo: CellBrief | null;
  gameMode: 'free' | 'ai_incognito' | 'ai_guide';
}

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
          template: '<div data-testid="cell-info-modal"><slot /></div>',
          props: ['modelValue'],
        },
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
});
