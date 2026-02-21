import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import type { Cell } from 'src/types/game.interface';
import LGameBoardSection from '../LGameBoardSection.vue';

const { mockGetCellInfo, mockSaveInsight, mockNotify } = vi.hoisted(() => ({
  mockGetCellInfo: vi.fn(),
  mockSaveInsight: vi.fn(),
  mockNotify: vi.fn(),
}));

const mockGameStore = {
  getCellInfo: mockGetCellInfo,
  saveInsight: mockSaveInsight,
  moves: [{ id: 10 }],
  currentGame: { mode: 'free' as const },
  currentCellInfo: null as null | {
    id: number;
    description?: string | null;
    description_revisit?: string | null;
    reflection_questions?: { relationships?: string } | null;
  },
  error: null as string | null,
};

vi.mock('src/stores/game.store', () => ({
  useGameStore: () => mockGameStore,
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
      notify: mockNotify,
      dialog: vi.fn().mockReturnValue({ onOk: vi.fn() }),
    }),
  };
});

const cell: Cell = {
  id: 12,
  name: 'Клетка 12',
  chakra_level: 2,
  description: 'Описание',
  description_revisit: 'Повторное описание',
};

function mountSection() {
  return shallowMount(LGameBoardSection, {
    props: {
      currentCell: 12,
    },
    global: {
      stubs: {
        LBoard: {
          template: '<button data-testid="cell-click" @click="$emit(\'cell-click\', 12)" />',
        },
        LCellCard: {
          name: 'LCellCard',
          template: '<div data-testid="cell-card" />',
          props: ['modelValue', 'cell'],
        },
      },
    },
  });
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('LGameBoardSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGameStore.error = null;
    mockGameStore.currentCellInfo = null;
  });

  it('по клику на клетку загружает данные с forceRefresh=true и открывает модалку', async () => {
    mockGetCellInfo.mockResolvedValue(cell);

    const wrapper = mountSection();
    await wrapper.get('[data-testid="cell-click"]').trigger('click');
    await flushPromises();

    expect(mockGetCellInfo).toHaveBeenCalledWith(12, true);
    expect(wrapper.find('[data-testid="cell-card"]').exists()).toBe(true);
  });

  it('при ошибке загрузки показывает notify и не открывает модалку', async () => {
    mockGetCellInfo.mockResolvedValue(null);
    mockGameStore.error = 'Ошибка загрузки';

    const wrapper = mountSection();
    await wrapper.get('[data-testid="cell-click"]').trigger('click');
    await flushPromises();

    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Ошибка загрузки' }),
    );
    expect(wrapper.find('[data-testid="cell-card"]').exists()).toBe(false);
  });

  it('для текущей клетки подмешивает контекст хода (описания + вопросы)', async () => {
    mockGetCellInfo.mockResolvedValue(cell);
    mockGameStore.currentCellInfo = {
      id: 12,
      description: 'Описание из хода',
      description_revisit: 'Повторное описание из хода',
      reflection_questions: { relationships: 'Контекстный вопрос' },
    };

    const wrapper = mountSection();
    const vm = wrapper.vm as unknown as { openCurrentCellInfo: () => Promise<void> };
    await vm.openCurrentCellInfo();
    await flushPromises();

    const cellCard = wrapper.getComponent({ name: 'LCellCard' });
    expect(cellCard.props('cell')).toEqual(
      expect.objectContaining({
        description: 'Описание из хода',
        description_revisit: 'Повторное описание из хода',
        reflection_questions: { relationships: 'Контекстный вопрос' },
      }),
    );
  });
});
