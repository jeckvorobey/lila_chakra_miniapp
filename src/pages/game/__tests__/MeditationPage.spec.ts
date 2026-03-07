import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { mount, shallowMount } from '@vue/test-utils';

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

vi.mock('src/components/common/LPageSkeleton.vue', () => ({
  default: {
    template: '<div data-testid="page-skeleton" />',
  },
}));

function mountPage() {
  return shallowMount(MeditationPage, {
    global: {
      stubs: {
        'q-page': {
          template: '<div><slot /></div>',
        },
        'q-card': {
          template: '<div><slot /></div>',
        },
        'q-card-section': {
          template: '<div><slot /></div>',
        },
        'q-card-actions': {
          template: '<div><slot /></div>',
        },
        'q-list': {
          template: '<div><slot /></div>',
        },
        'q-item': {
          template: '<div><slot /></div>',
        },
        'q-item-section': {
          template: '<div><slot /></div>',
        },
        'q-item-label': {
          template: '<div><slot /></div>',
        },
        'q-icon': {
          template: '<i />',
        },
        'q-btn': {
          template: `<button @click="$emit('click')">{{ label }}<slot /></button>`,
          props: ['loading', 'label'],
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

    const completeEntrySpy = vi.spyOn(store, 'completeEntryMeditation').mockResolvedValue(true);
    vi.spyOn(store, 'loadMeditationAudio').mockResolvedValue();

    const wrapper = mountPage();
    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(completeEntrySpy).toHaveBeenCalledOnce();
    expect(mockRouterPush).toHaveBeenCalledWith('/game');
  });

  it('показывает skeleton пока загружается аудио медитации', async () => {
    const store = useGameStore();
    store.isMeditationAudioLoading = true;
    vi.spyOn(store, 'loadMeditationAudio').mockResolvedValue();

    const wrapper = mount(MeditationPage, {
      global: {
        stubs: {
          'q-page': {
            template: '<div><slot /></div>',
          },
          'q-card': {
            template: '<div><slot /></div>',
          },
          'q-card-section': {
            template: '<div><slot /></div>',
          },
          'q-btn': {
            template: '<button @click="$emit(\'click\')">{{ label }}<slot /></button>',
            props: ['loading', 'label'],
          },
          LAudioPlayer: true,
        },
        mocks: {
          $t: (key: string) => key,
        },
      },
    });
    await flushPromises();

    expect(wrapper.find('[data-testid="page-skeleton"]').exists()).toBe(true);
  });

  it('для entry показывает список шагов без нумерации', async () => {
    const store = useGameStore();
    vi.spyOn(store, 'loadMeditationAudio').mockResolvedValue();

    const wrapper = mountPage();
    await flushPromises();

    const text = wrapper.text();
    expect(text).toContain('meditation.instructions_title');
    expect(text).toContain('meditation.entry_steps.settle.text');
    expect(text).toContain('meditation.entry_steps.formulate_question.text');
    expect(text).toContain('meditation.entry_steps.readiness.text');
    expect(text).not.toContain('meditation.instruction_entry');
    expect(text).not.toContain('1.');
    expect(text).not.toContain('2.');
  });

  it('для exit пропускает медитацию и переходит в /game/final/:id', async () => {
    mockRoute.params.type = 'exit';

    const store = useGameStore();
    store.currentGame = { id: 1 } as never;

    const completeExitSpy = vi.spyOn(store, 'completeExitMeditation').mockResolvedValue(true);
    vi.spyOn(store, 'loadMeditationAudio').mockResolvedValue();

    const wrapper = mountPage();
    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(completeExitSpy).toHaveBeenCalledOnce();
    expect(mockRouterPush).toHaveBeenCalledWith('/game/final/1');
  });

  it('для exit показывает список шагов без нумерации', async () => {
    mockRoute.params.type = 'exit';

    const store = useGameStore();
    vi.spyOn(store, 'loadMeditationAudio').mockResolvedValue();

    const wrapper = mountPage();
    await flushPromises();

    const text = wrapper.text();
    expect(text).toContain('meditation.instructions_title');
    expect(text).toContain('meditation.exit_steps.settle.text');
    expect(text).toContain('meditation.exit_steps.recall_path.text');
    expect(text).toContain('meditation.exit_steps.gratitude.text');
    expect(text).not.toContain('meditation.instruction_exit');
    expect(text).not.toContain('1.');
    expect(text).not.toContain('2.');
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

  it('при ошибке загрузки аудио показывает кнопку повторной загрузки', async () => {
    const store = useGameStore();
    store.meditationAudioError = 'Не удалось загрузить аудио медитации';
    const loadSpy = vi.spyOn(store, 'loadMeditationAudio').mockResolvedValue();

    const wrapper = mountPage();
    await flushPromises();

    const buttons = wrapper.findAll('button');
    const retryButton = buttons.find((button) => button.text().includes('Загрузить'));
    const initialLoadCalls = loadSpy.mock.calls.length;
    expect(buttons).toHaveLength(2);
    expect(wrapper.text()).toContain('Не удалось загрузить аудио медитации');
    expect(retryButton?.text()).toContain('Загрузить');

    await retryButton!.trigger('click');
    await flushPromises();

    expect(loadSpy.mock.calls.length).toBeGreaterThan(initialLoadCalls);
  });
});
