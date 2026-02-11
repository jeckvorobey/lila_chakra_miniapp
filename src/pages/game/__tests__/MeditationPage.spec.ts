import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { shallowMount } from '@vue/test-utils';

import MeditationPage from 'src/pages/game/MeditationPage.vue';
import { useGameStore } from 'src/stores/game.store';

const { mockRouterPush, mockNotify, mockRoute } = vi.hoisted(() => ({
  mockRouterPush: vi.fn(),
  mockNotify: vi.fn(),
  mockRoute: {
    params: {
      type: 'entry',
    },
  },
}));

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock('quasar', async () => {
  const actual = await vi.importActual('quasar');
  return {
    ...actual,
    useQuasar: () => ({
      notify: mockNotify,
    }),
  };
});

vi.mock('src/services/api', () => ({
  audioApi: {
    getByType: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    getStreamBlob: vi.fn(),
  },
  gamesApi: {
    create: vi.fn(),
    get: vi.fn(),
    getMoves: vi.fn(),
    completeEntryMeditation: vi.fn(),
    completeExitMeditation: vi.fn(),
    end: vi.fn(),
    rollDice: vi.fn(),
  },
  movesApi: {
    saveInsight: vi.fn(),
  },
}));

function mountPage() {
  return shallowMount(MeditationPage, {
    global: {
      stubs: {
        'q-page': {
          template: '<div><slot /></div>',
        },
        'q-btn': {
          template: `<button @click="$emit('click')"><slot /></button>`,
          props: ['loading'],
        },
        LAudioPlayer: true,
      },
      mocks: {
        $t: (key: string) => key,
      },
    },
  });
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('MeditationPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockRoute.params.type = 'entry';
    mockRouterPush.mockReset();
    mockNotify.mockReset();
  });

  it('для entry пропускает медитацию и переходит в /game', async () => {
    const store = useGameStore();
    store.currentGame = { id: 1 } as never;

    const completeEntrySpy = vi
      .spyOn(store, 'completeEntryMeditation')
      .mockResolvedValue(true);
    vi.spyOn(store, 'loadMeditationAudio').mockResolvedValue();

    const wrapper = mountPage();
    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(completeEntrySpy).toHaveBeenCalledOnce();
    expect(mockRouterPush).toHaveBeenCalledWith('/game');
  });

  it('для exit пропускает медитацию и переходит в /game', async () => {
    mockRoute.params.type = 'exit';

    const store = useGameStore();
    store.currentGame = { id: 1 } as never;

    const completeExitSpy = vi
      .spyOn(store, 'completeExitMeditation')
      .mockResolvedValue(true);
    vi.spyOn(store, 'loadMeditationAudio').mockResolvedValue();

    const wrapper = mountPage();
    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(completeExitSpy).toHaveBeenCalledOnce();
    expect(mockRouterPush).toHaveBeenCalledWith('/game');
  });

  it('показывает notify и не уходит со страницы при ошибке пропуска', async () => {
    const store = useGameStore();
    store.currentGame = { id: 1 } as never;
    store.error = 'Не удалось завершить медитацию';

    vi.spyOn(store, 'completeEntryMeditation').mockResolvedValue(false);
    vi.spyOn(store, 'loadMeditationAudio').mockResolvedValue();

    const wrapper = mountPage();
    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(mockNotify).toHaveBeenCalled();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});
