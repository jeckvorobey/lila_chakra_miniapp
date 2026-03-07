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
  mockDownloadFinaleImage,
  mockGetFinaleImageTelegramFile,
  mockCreateFinaleImageTelegramShare,
  mockStreamFinaleImageJob,
  mockRoute,
  mockTelegramShowPopup,
  mockTelegramDownloadFile,
  mockTelegramShareToStory,
  mockTelegramShareMessage,
} = vi.hoisted(() => ({
  mockNotify: vi.fn(),
  mockGetFinaleState: vi.fn(),
  mockGetGame: vi.fn(),
  mockGenerateFinaleMentor: vi.fn(),
  mockGenerateFinaleSummary: vi.fn(),
  mockGenerateFinaleImage: vi.fn(),
  mockDownloadFinaleImage: vi.fn(),
  mockGetFinaleImageTelegramFile: vi.fn(),
  mockCreateFinaleImageTelegramShare: vi.fn(),
  mockStreamFinaleImageJob: vi.fn(),
  mockRoute: {
    params: {
      gameId: '42',
    },
  },
  mockTelegramShowPopup: vi.fn(),
  mockTelegramDownloadFile: vi.fn(),
  mockTelegramShareToStory: vi.fn(),
  mockTelegramShareMessage: vi.fn(),
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
    downloadFinaleImage: mockDownloadFinaleImage,
    getFinaleImageTelegramFile: mockGetFinaleImageTelegramFile,
    createFinaleImageTelegramShare: mockCreateFinaleImageTelegramShare,
    streamFinaleImageJob: mockStreamFinaleImageJob,
  },
}));

vi.mock('src/composables/useTelegram', () => ({
  useTelegram: () => ({
    tg: {
      downloadFile: mockTelegramDownloadFile,
      shareToStory: mockTelegramShareToStory,
      shareMessage: mockTelegramShareMessage,
    },
    isAvailable: { value: true },
    showPopup: mockTelegramShowPopup,
    downloadFile: mockTelegramDownloadFile,
    shareToStory: mockTelegramShareToStory,
    shareMessage: mockTelegramShareMessage,
  }),
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

function buildArtifact(artifactId: number) {
  return {
    artifact_id: artifactId,
    file_name: `finale-${artifactId}.png`,
    mime_type: 'image/png',
    generation_index: artifactId,
    created_at: '2026-02-20T11:10:00Z',
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
    mockDownloadFinaleImage.mockResolvedValue(new Blob(['x'], { type: 'image/png' }));
    mockGetFinaleImageTelegramFile.mockResolvedValue({
      url: 'https://example.com/public/finale-image/token',
      file_name: 'finale-26.png',
      mime_type: 'image/png',
      expires_at: '2026-03-07T12:00:00Z',
    });
    mockCreateFinaleImageTelegramShare.mockResolvedValue({
      url: 'https://example.com/public/finale-image/token',
      file_name: 'finale-26.png',
      mime_type: 'image/png',
      expires_at: '2026-03-07T12:00:00Z',
      share_message_id: 'prepared-message-id',
    });
    mockTelegramShowPopup.mockResolvedValue('cancel');
    mockTelegramDownloadFile.mockResolvedValue(true);
    mockTelegramShareMessage.mockResolvedValue(true);
    mockTelegramShareToStory.mockReturnValue(true);
    mockStreamFinaleImageJob.mockImplementation(async function* () {
      await Promise.resolve();
      yield* [];
    });
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

  it('при загрузке предзагружает превью артефакта только один раз', async () => {
    mockGetFinaleState.mockResolvedValue({
      ...buildFinaleState(),
      image: {
        artifacts: [buildArtifact(26)],
        latest_artifact: buildArtifact(26),
        active_job: null,
        free_generations_left: 0,
      },
    });

    mountPage();
    await flushPromises();

    expect(mockDownloadFinaleImage).toHaveBeenCalledTimes(1);
    expect(mockDownloadFinaleImage).toHaveBeenCalledWith(42, 26);
  });

  it('не падает при 404 на автопредзагрузке превью', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    mockGetFinaleState.mockResolvedValue({
      ...buildFinaleState(),
      image: {
        artifacts: [buildArtifact(26)],
        latest_artifact: buildArtifact(26),
        active_job: null,
        free_generations_left: 0,
      },
    });
    mockDownloadFinaleImage.mockRejectedValueOnce(
      new Error('Request failed with status code 404'),
    );

    mountPage();
    await flushPromises();
    await flushPromises();

    expect(mockNotify).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledOnce();
    warnSpy.mockRestore();
  });

  it('при ошибке SSE не делает fallback на status endpoint и показывает warning', async () => {
    mockGetFinaleState.mockResolvedValue({
      ...buildFinaleState(),
      image: {
        artifacts: [],
        latest_artifact: null,
        active_job: {
          job_id: 'job-42',
          game_id: 42,
          status: 'processing',
          error: null,
          artifact_id: null,
          artifacts: [],
          artifacts_count: 0,
          errors: [],
          created_at: '2026-02-20T11:10:00Z',
          updated_at: '2026-02-20T11:10:00Z',
        },
        free_generations_left: 0,
      },
    });
    mockStreamFinaleImageJob.mockImplementation(async function* () {
      await Promise.resolve();
      yield* [];
      throw new Error('errors.ai_internal_error');
    });

    mountPage();
    await flushPromises();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await flushPromises();

    expect(mockStreamFinaleImageJob).toHaveBeenCalledOnce();
    expect(mockNotify).toHaveBeenCalledWith({
      type: 'warning',
      message: 'errors.ai_internal_error',
    });
  });

  it('при тихом завершении SSE перечитывает финальное состояние и показывает артефакт', async () => {
    mockGetFinaleState
      .mockResolvedValueOnce({
        ...buildFinaleState(),
        image: {
          artifacts: [],
          latest_artifact: null,
          active_job: {
            job_id: 'job-42',
            game_id: 42,
            status: 'processing',
            error: null,
            artifact_id: null,
            artifacts: [],
            artifacts_count: 0,
            errors: [],
            created_at: '2026-02-20T11:10:00Z',
            updated_at: '2026-02-20T11:10:00Z',
          },
          free_generations_left: 0,
        },
      })
      .mockResolvedValueOnce({
        ...buildFinaleState(),
        image: {
          artifacts: [buildArtifact(26)],
          latest_artifact: buildArtifact(26),
          active_job: null,
          free_generations_left: 0,
        },
      });

    mockStreamFinaleImageJob.mockImplementation(async function* () {
      await Promise.resolve();
      yield* [];
    });

    const wrapper = mountPage();
    await flushPromises();
    await flushPromises();
    await flushPromises();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await flushPromises();

    expect(mockGetFinaleState).toHaveBeenCalledTimes(2);
    expect(mockDownloadFinaleImage).toHaveBeenCalledWith(42, 26);
    expect(wrapper.text()).toContain('finale.image_ready');
  });

  it('не блокирует завершение SSE, если предзагрузка превью артефакта зависла', async () => {
    mockGetFinaleState
      .mockResolvedValueOnce({
        ...buildFinaleState({
          mentor_text: 'Итог',
          path_phrase: 'phrase',
          source: 'ai',
          generated_at: '2026-02-20T11:10:00Z',
        }),
        image: {
          artifacts: [],
          latest_artifact: null,
          active_job: {
            job_id: 'job-42',
            game_id: 42,
            status: 'processing',
            error: null,
            artifact_id: null,
            artifacts: [],
            artifacts_count: 0,
            errors: [],
            created_at: '2026-02-20T11:10:00Z',
            updated_at: '2026-02-20T11:10:00Z',
          },
          free_generations_left: 0,
        },
      })
      .mockResolvedValueOnce({
        ...buildFinaleState({
          mentor_text: 'Итог',
          path_phrase: 'phrase',
          source: 'ai',
          generated_at: '2026-02-20T11:10:00Z',
        }),
        image: {
          artifacts: [buildArtifact(26)],
          latest_artifact: buildArtifact(26),
          active_job: null,
          free_generations_left: 0,
        },
      });

    mockDownloadFinaleImage.mockImplementation(
      () => new Promise<Blob>(() => undefined),
    );
    mockStreamFinaleImageJob.mockImplementation(async function* () {
      await Promise.resolve();
      yield {
        type: 'artifact',
        artifact: buildArtifact(26),
        job: {
          job_id: 'job-42',
          game_id: 42,
          status: 'processing',
          error: null,
          artifact_id: 26,
          artifacts: [buildArtifact(26)],
          artifacts_count: 1,
          errors: [],
          created_at: '2026-02-20T11:10:00Z',
          updated_at: '2026-02-20T11:10:05Z',
        },
      };
      yield {
        type: 'done',
        job: {
          job_id: 'job-42',
          game_id: 42,
          status: 'completed',
          error: null,
          artifact_id: 26,
          artifacts: [buildArtifact(26)],
          artifacts_count: 1,
          errors: [],
          created_at: '2026-02-20T11:10:00Z',
          updated_at: '2026-02-20T11:10:06Z',
        },
      };
    });

    const wrapper = mountPage();
    await flushPromises();
    await flushPromises();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await flushPromises();

    expect(mockGetFinaleState).toHaveBeenCalledTimes(2);
    expect(mockStreamFinaleImageJob).toHaveBeenCalledOnce();
    expect(mockNotify).not.toHaveBeenCalled();
    expect(mockDownloadFinaleImage).toHaveBeenCalledTimes(1);
    expect(wrapper.exists()).toBe(true);
    wrapper.unmount();
  });

  it('кнопка скачать в Telegram использует telegram-file и downloadFile', async () => {
    mockGetFinaleState.mockResolvedValue({
      ...buildFinaleState(),
      image: {
        artifacts: [buildArtifact(26)],
        latest_artifact: buildArtifact(26),
        active_job: null,
        free_generations_left: 0,
      },
    });

    const wrapper = mountPage();
    await flushPromises();
    await flushPromises();

    const downloadButton = wrapper
      .findAll('button')
      .find((button) => button.attributes('icon') === 'mdi-download');
    expect(downloadButton).toBeDefined();

    await downloadButton?.trigger('click');
    await flushPromises();

    expect(mockGetFinaleImageTelegramFile).toHaveBeenCalledWith(42, 26);
    expect(mockTelegramDownloadFile).toHaveBeenCalledWith({
      url: 'https://example.com/public/finale-image/token',
      file_name: 'finale-26.png',
    });
  });

  it('кнопка поделиться предлагает сторис и вызывает shareToStory', async () => {
    mockGetFinaleState.mockResolvedValue({
      ...buildFinaleState({
        mentor_text: 'Тестовый итог',
        path_phrase: 'Мой путь света',
        source: 'ai',
        generated_at: '2026-02-20T11:10:00Z',
      }),
      image: {
        artifacts: [buildArtifact(26)],
        latest_artifact: buildArtifact(26),
        active_job: null,
        free_generations_left: 0,
      },
    });
    mockTelegramShowPopup.mockResolvedValueOnce('story');

    const wrapper = mountPage();
    await flushPromises();
    await flushPromises();

    const shareButton = wrapper
      .findAll('button')
      .find((button) => button.attributes('icon') === 'mdi-share-variant');
    expect(shareButton).toBeDefined();

    await shareButton?.trigger('click');
    await flushPromises();

    expect(mockCreateFinaleImageTelegramShare).toHaveBeenCalledWith(42, 26);
    expect(mockTelegramShowPopup).toHaveBeenCalled();
    expect(mockTelegramShareToStory).toHaveBeenCalledWith(
      'https://example.com/public/finale-image/token',
      expect.objectContaining({
        text: 'Мой путь света',
      }),
    );
  });

  it('кнопка поделиться умеет отправлять друзьям через shareMessage', async () => {
    mockGetFinaleState.mockResolvedValue({
      ...buildFinaleState({
        mentor_text: 'Тестовый итог',
        path_phrase: 'Мой путь света',
        source: 'ai',
        generated_at: '2026-02-20T11:10:00Z',
      }),
      image: {
        artifacts: [buildArtifact(26)],
        latest_artifact: buildArtifact(26),
        active_job: null,
        free_generations_left: 0,
      },
    });
    mockTelegramShowPopup.mockResolvedValueOnce('friends');

    const wrapper = mountPage();
    await flushPromises();
    await flushPromises();

    const shareButton = wrapper
      .findAll('button')
      .find((button) => button.attributes('icon') === 'mdi-share-variant');
    expect(shareButton).toBeDefined();

    await shareButton?.trigger('click');
    await flushPromises();

    expect(mockTelegramShareMessage).toHaveBeenCalledWith('prepared-message-id');
  });
});
