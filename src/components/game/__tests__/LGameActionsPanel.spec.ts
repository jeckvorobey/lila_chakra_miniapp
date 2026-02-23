import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { CellBrief } from 'src/types/game.interface';
import LGameActionsPanel from '../LGameActionsPanel.vue';

const { mockEndGame, mockRouterPush, mockDialog, mockNotify, mockStartChipAnimation } = vi.hoisted(() => ({
  mockEndGame: vi.fn(),
  mockRouterPush: vi.fn(),
  mockDialog: vi.fn(),
  mockNotify: vi.fn(),
  mockStartChipAnimation: vi.fn(),
}));

const mockGameStore = {
  endGame: mockEndGame,
  startChipAnimation: mockStartChipAnimation,
  isChipAnimating: false,
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

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock('quasar', async () => {
  const actual = await vi.importActual('quasar');
  return {
    ...actual,
    useQuasar: () => ({
      dialog: mockDialog,
      notify: mockNotify,
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

const globalMountOptions = {
  stubs: {
    'q-card': {
      template: '<div><slot /></div>',
    },
    'q-card-section': {
      template: '<div><slot /></div>',
    },
    'q-avatar': {
      template: '<div><slot /></div>',
    },
    'q-icon': true,
    'q-btn': {
      template:
        "<button :data-testid=\"$attrs['data-testid']\" @click=\"$emit('click')\"><slot /></button>",
    },
    LDiceRollModal: {
      template:
        '<div data-testid="dice-modal">' +
        '{{ modelValue }}' +
        '<button data-testid="dice-finished-btn" @click="$emit(\'roll-finished\', ' +
        "{ move: { transition_type: 'none', final_cell: 5 }, is_victory: false }" +
        ')" />' +
        '</div>',
      props: ['modelValue'],
    },
    LCellInfo: {
      template: '<div data-testid="cell-info-modal">{{ modelValue }}</div>',
      props: ['modelValue'],
    },
  },
};

function mountPanel() {
  return mount(LGameActionsPanel, {
    props: {
      currentCell: 5,
      currentCellInfo,
      gameMode: 'free',
      currentChakra: 1,
      isWaitingForSix: false,
    },
    global: globalMountOptions,
  });
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('LGameActionsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGameStore.error = null;
    mockStartChipAnimation.mockResolvedValue(undefined);
    mockDialog.mockReturnValue({
      onOk: (handler: () => void) => {
        handler();
      },
    });
  });

  it('отображает номер текущей клетки', () => {
    const wrapper = mountPanel();
    expect(wrapper.text()).toContain('5');
  });

  it('отображает название текущей клетки из props', () => {
    const wrapper = mountPanel();
    expect(wrapper.text()).toContain('Клетка 5');
  });

  it('показывает предупреждение при ожидании шестёрки', () => {
    const wrapper = mount(LGameActionsPanel, {
      props: {
        currentCell: 5,
        currentCellInfo,
        gameMode: 'free',
        currentChakra: 1,
        isWaitingForSix: true,
      },
      global: globalMountOptions,
    });
    expect(wrapper.text()).toContain('dice.waiting_for_6');
  });

  it('не показывает предупреждение при нормальном броске', () => {
    const wrapper = mountPanel();
    expect(wrapper.text()).not.toContain('dice.waiting_for_6');
  });

  it('по кнопке инфо открывает модалку ячейки вместо эмита', async () => {
    const wrapper = mountPanel();
    expect(wrapper.get('[data-testid="cell-info-modal"]').text()).toBe('false');

    await wrapper.get('[data-testid="current-cell-info-btn"]').trigger('click');

    expect(wrapper.get('[data-testid="cell-info-modal"]').text()).toBe('true');
  });

  it('по кнопке броска открывает модалку кубика', async () => {
    const wrapper = mountPanel();

    expect(wrapper.get('[data-testid="dice-modal"]').text()).toBe('false');

    await wrapper.get('[data-testid="open-dice-modal-btn"]').trigger('click');

    expect(wrapper.get('[data-testid="dice-modal"]').text()).toBe('true');
  });

  it('после завершения броска эмитит событие показа информации о текущей клетке', async () => {
    const wrapper = mountPanel();

    await wrapper.get('[data-testid="dice-finished-btn"]').trigger('click');
    await flushPromises();

    expect(mockStartChipAnimation).toHaveBeenCalledOnce();
    expect(wrapper.emitted('show-current-cell-info')).toBeTruthy();
  });

  it('подтверждает завершение игры и переводит на выходную медитацию', async () => {
    mockEndGame.mockResolvedValue(true);

    const wrapper = mountPanel();
    await wrapper.get('[data-testid="end-game-btn"]').trigger('click');
    await flushPromises();

    expect(mockDialog).toHaveBeenCalled();
    expect(mockEndGame).toHaveBeenCalledOnce();
    expect(mockRouterPush).toHaveBeenCalledWith('/game/meditation/exit');
  });
});
