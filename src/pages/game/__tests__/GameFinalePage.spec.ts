import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import GameFinalePage from '../GameFinalePage.vue';

const {
  mockNotify,
  mockGetFinaleState,
  mockGetGame,
  mockGenerateFinaleMentor,
  mockGenerateFinaleSummary,
  mockGenerateFinaleImage,
  mockGetFinaleImageJob,
  mockDownloadFinaleImage,
  mockRoute,
} = vi.hoisted(() => ({
  mockNotify: vi.fn(),
  mockGetFinaleState: vi.fn(),
  mockGetGame: vi.fn(),
  mockGenerateFinaleMentor: vi.fn(),
  mockGenerateFinaleSummary: vi.fn(),
  mockGenerateFinaleImage: vi.fn(),
  mockGetFinaleImageJob: vi.fn(),
  mockDownloadFinaleImage: vi.fn(),
  mockRoute: {
    params: {
      gameId: '42',
    },
  },
}));

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
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
    }),
  };
});

vi.mock('src/services/api', () => ({
  gamesApi: {
    getFinaleState: mockGetFinaleState,
    get: mockGetGame,
    generateFinaleMentor: mockGenerateFinaleMentor,
    generateFinaleSummary: mockGenerateFinaleSummary,
    generateFinaleImage: mockGenerateFinaleImage,
    getFinaleImageJob: mockGetFinaleImageJob,
    downloadFinaleImage: mockDownloadFinaleImage,
  },
}));

const QBtnStub = defineComponent({
  name: 'QBtnStub',
  props: {
    label: {
      type: String,
      default: '',
    },
  },
  emits: ['click'],
  template: '<button :data-label="label" @click="$emit(\'click\')">{{ label }}</button>',
});

function mountPage() {
  return mount(GameFinalePage, {
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
        'q-banner': {
          template: '<div><slot /><slot name="action" /></div>',
        },
        'q-spinner': {
          template: '<span />',
        },
        'q-spinner-dots': {
          template: '<span />',
        },
        'q-icon': {
          template: '<span />',
        },
        'q-carousel': {
          template: '<div><slot /></div>',
        },
        'q-carousel-slide': {
          template: '<div><slot /></div>',
        },
        'q-btn': QBtnStub,
      },
    },
  });
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function buildFinaleState(summary: object | null = null) {
  return {
    game_id: 42,
    summary,
    image: {
      artifacts: [],
      latest_artifact: null,
      active_job: null,
      free_generations_left: 1,
    },
  };
}

function buildGameDetail() {
  return {
    id: 42,
    user_id: 7,
    query: 'Как перейти на новый этап',
    category: 'career',
    mode: 'ai_guide',
    status: 'completed',
    current_cell: 68,
    entry_meditation_completed: true,
    exit_meditation_completed: true,
    total_moves: 12,
    arrows_hit: 2,
    snakes_hit: 1,
    highest_cell: 68,
    clarifications_used: 1,
    created_at: '2026-02-20T10:00:00Z',
    completed_at: '2026-02-20T11:00:00Z',
    magic_time_ends_at: '2026-02-23T11:00:00Z',
    ai_summary: null,
  };
}

describe('GameFinalePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFinaleState.mockResolvedValue(buildFinaleState());
    mockGetGame.mockResolvedValue(buildGameDetail());
    mockGenerateFinaleMentor.mockResolvedValue({
      mentor_text: 'Итог',
      path_phrase: 'phrase',
      source: 'ai',
      generated_at: '2026-02-20T11:10:00Z',
    });
    mockGenerateFinaleSummary.mockResolvedValue({});
    mockGenerateFinaleImage.mockResolvedValue({});
    mockGetFinaleImageJob.mockResolvedValue({});
    mockDownloadFinaleImage.mockResolvedValue(new Blob(['x'], { type: 'image/png' }));
  });

  it('при загрузке не вызывает автогенерацию финального ответа', async () => {
    mountPage();
    await flushPromises();

    expect(mockGetFinaleState).toHaveBeenCalledWith(42);
    expect(mockGetGame).toHaveBeenCalledWith(42);
    expect(mockGenerateFinaleMentor).not.toHaveBeenCalled();
    expect(mockGenerateFinaleSummary).not.toHaveBeenCalled();
  });

  it('по кнопке "ИИ ментор" запускает генерацию ответа', async () => {
    const wrapper = mountPage();
    await flushPromises();

    const mentorButton = wrapper
      .findAll('button')
      .find((button) => button.attributes('data-label') === 'finale.mentor_button');
    expect(mentorButton).toBeDefined();

    await mentorButton?.trigger('click');
    await flushPromises();

    expect(mockGenerateFinaleMentor).toHaveBeenCalledTimes(1);
    expect(mockGenerateFinaleMentor).toHaveBeenCalledWith(42);
  });

  it('скрывает кнопку, если итог уже сгенерирован', async () => {
    mockGetFinaleState.mockResolvedValue(
      buildFinaleState({
        mentor_text: 'Уже есть итог',
        source: 'ai',
      }),
    );
    const wrapper = mountPage();
    await flushPromises();

    const mentorButton = wrapper
      .findAll('button')
      .find((button) => button.attributes('data-label') === 'finale.mentor_button');

    expect(mentorButton).toBeUndefined();
  });

  it('рендерит текст итога ИИ, если summary уже есть', async () => {
    mockGetFinaleState.mockResolvedValue(
      buildFinaleState({
        mentor_text: 'Тестовый итог от ментора',
        path_phrase: 'phrase',
        source: 'ai',
        generated_at: '2026-02-20T11:10:00Z',
      }),
    );
    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain('Тестовый итог от ментора');
  });

  it('показывает анимацию подготовки ответа во время генерации', async () => {
    mockGenerateFinaleMentor.mockImplementation(() => new Promise(() => {}));
    const wrapper = mountPage();
    await flushPromises();

    const mentorButton = wrapper
      .findAll('button')
      .find((button) => button.attributes('data-label') === 'finale.mentor_button');
    expect(mentorButton).toBeDefined();

    await mentorButton?.trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-test="mentor-loading"]').exists()).toBe(true);
  });
});
