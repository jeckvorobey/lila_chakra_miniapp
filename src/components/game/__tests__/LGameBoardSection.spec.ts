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
  question: null,
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
});
