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
  mockGetFinaleImageTelegramFile,
  mockCreateFinaleImageTelegramShare,
  mockRoute,
  mockTelegramShowPopup,
  mockTelegramDownloadFile,
  mockTelegramShareToStory,
  mockTelegramShareMessage,
  mockFetchReferralProgram,
} = vi.hoisted(() => ({
  mockNotify: vi.fn(),
  mockGetFinaleState: vi.fn(),
  mockGetGame: vi.fn(),
  mockGenerateFinaleMentor: vi.fn(),
  mockGenerateFinaleSummary: vi.fn(),
  mockGenerateFinaleImage: vi.fn(),
  mockGetFinaleImageJob: vi.fn(),
  mockDownloadFinaleImage: vi.fn(),
  mockGetFinaleImageTelegramFile: vi.fn(),
  mockCreateFinaleImageTelegramShare: vi.fn(),
  mockRoute: {
    params: {
      gameId: '42',
    },
  },
  mockTelegramShowPopup: vi.fn(),
  mockTelegramDownloadFile: vi.fn(),
  mockTelegramShareToStory: vi.fn(),
  mockTelegramShareMessage: vi.fn(),
  mockFetchReferralProgram: vi.fn(),
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
    getFinaleImageTelegramFile: mockGetFinaleImageTelegramFile,
    createFinaleImageTelegramShare: mockCreateFinaleImageTelegramShare,
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

const mockUserStore = {
  referralProgram: {
    code: 'ABC123',
    link: 'https://t.me/lila_test_bot?start=ABC123',
    total_referrals: 2,
  },
  referralData: {
    code: 'ABC123',
    link: 'https://t.me/lila_test_bot?start=ABC123',
  },
  fetchReferralProgram: mockFetchReferralProgram,
};

vi.mock('src/stores/user.store', () => ({
  useUserStore: () => mockUserStore,
}));

const QBtnStub = defineComponent({
  name: 'QBtnStub',
  props: {
    label: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '',
    },
  },
  emits: ['click'],
  template:
    '<button :data-label="label" :data-icon="icon" @click="$emit(\'click\')">{{ label || icon }}</button>',
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
        'q-img': {
          template: '<div><slot /><slot name="loading" /><slot name="error" /></div>',
        },
        'q-icon': {
          template: '<span />',
        },
        'q-carousel': {
          template: '<div><slot /><slot name="control" /></div>',
        },
        'q-carousel-slide': defineComponent({
          name: 'QCarouselSlideStub',
          props: {
            imgSrc: {
              type: String,
              default: '',
            },
          },
          template: '<div :data-img-src="imgSrc"><slot /></div>',
        }),
        'q-carousel-control': {
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
      share_phrase: 'Я прошёл(а) путь и увидел(а) свой следующий шаг.',
      source: 'ai',
      generated_at: '2026-02-20T11:10:00Z',
    });
    mockGenerateFinaleSummary.mockResolvedValue({});
    mockGenerateFinaleImage.mockResolvedValue({
      job_id: 'job-42',
      game_id: 42,
      status: 'queued',
      error: null,
      artifact_id: null,
      artifacts: [],
      artifacts_count: 0,
      errors: [],
      created_at: '2026-02-20T11:10:00Z',
      updated_at: '2026-02-20T11:10:00Z',
    });
    mockGetFinaleImageJob.mockResolvedValue({
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
    });
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
    mockFetchReferralProgram.mockResolvedValue(undefined);
    mockUserStore.referralProgram = {
      code: 'ABC123',
      link: 'https://t.me/lila_test_bot?start=ABC123',
      total_referrals: 2,
    };
    mockUserStore.referralData = {
      code: 'ABC123',
      link: 'https://t.me/lila_test_bot?start=ABC123',
    };
    vi.useRealTimers();
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
        share_phrase: 'Я уже увидел(а) свой следующий шаг.',
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
        share_phrase: 'Я прошёл(а) путь и увидел(а) свой следующий шаг.',
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

  it('показывает одиночный слайд, когда доступен один артефакт', async () => {
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

    const slide = wrapper.find('[data-img-src^="blob:"]');
    expect(slide.exists()).toBe(true);
    expect(wrapper.text()).toContain('finale.image_ready');
  });

  it('пока preview артефакта не скачан, не показывает статус готовности', async () => {
    mockGetFinaleState.mockResolvedValue({
      ...buildFinaleState(),
      image: {
        artifacts: [buildArtifact(26)],
        latest_artifact: buildArtifact(26),
        active_job: null,
        free_generations_left: 0,
      },
    });
    mockDownloadFinaleImage.mockImplementation(() => new Promise(() => undefined));

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.text()).not.toContain('finale.image_ready');
    expect(wrapper.text()).toContain('finale.image_generation_wait');
    expect(wrapper.find('[data-img-src]').exists()).toBe(false);
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

  it('в fullscreen использует класс без скругления у картинки', async () => {
    mockGetFinaleState.mockResolvedValue({
      ...buildFinaleState(),
      image: {
        artifacts: [buildArtifact(26), buildArtifact(27)],
        latest_artifact: buildArtifact(26),
        active_job: null,
        free_generations_left: 0,
      },
    });

    const wrapper = mountPage();
    await flushPromises();
    await flushPromises();

    const fullscreenButton = wrapper
      .findAll('button')
      .find((button) => button.attributes('data-icon') === 'fullscreen');
    expect(fullscreenButton).toBeDefined();

    await fullscreenButton?.trigger('click');
    await flushPromises();

    expect(wrapper.html()).toContain('finale-art-slide--fullscreen');
  });

  it('при ошибке polling останавливает loader и показывает recover-кнопку', async () => {
    vi.useFakeTimers();
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
    mockGetFinaleImageJob.mockRejectedValueOnce(new Error('errors.ai_internal_error'));

    const wrapper = mountPage();
    await flushPromises();
    await vi.advanceTimersByTimeAsync(1500);
    await flushPromises();

    expect(mockGetFinaleImageJob).toHaveBeenCalledWith(42, 'job-42');
    expect(wrapper.text()).toContain('errors.ai_internal_error');
    expect(wrapper.findAll('button').some((button) => button.attributes('data-label') === 'actions.retry')).toBe(true);
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it('при завершении polling перечитывает финальное состояние и показывает артефакт', async () => {
    vi.useFakeTimers();
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
    mockGetFinaleImageJob.mockResolvedValueOnce({
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
    });

    const wrapper = mountPage();
    await flushPromises();
    await vi.advanceTimersByTimeAsync(1500);
    await flushPromises();

    expect(mockGetFinaleState).toHaveBeenCalledTimes(2);
    expect(mockGetFinaleImageJob).toHaveBeenCalledWith(42, 'job-42');
    expect(mockDownloadFinaleImage).toHaveBeenCalledWith(42, 26);
    expect(wrapper.text()).toContain('finale.image_ready');
  });

  it('не блокирует завершение polling, если предзагрузка превью артефакта зависла', async () => {
    vi.useFakeTimers();
    mockGetFinaleState
      .mockResolvedValueOnce({
        ...buildFinaleState({
          mentor_text: 'Итог',
          path_phrase: 'phrase',
          share_phrase: 'Я прошёл(а) путь и увидел(а) свой следующий шаг.',
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
          share_phrase: 'Я прошёл(а) путь и увидел(а) свой следующий шаг.',
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

    mockDownloadFinaleImage.mockImplementation(() => new Promise<Blob>(() => undefined));
    mockGetFinaleImageJob.mockResolvedValueOnce({
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
    });

    const wrapper = mountPage();
    await flushPromises();
    await vi.advanceTimersByTimeAsync(1500);
    await flushPromises();

    expect(mockGetFinaleState).toHaveBeenCalledTimes(2);
    expect(mockGetFinaleImageJob).toHaveBeenCalledOnce();
    expect(mockNotify).not.toHaveBeenCalled();
    expect(mockDownloadFinaleImage).toHaveBeenCalledTimes(1);
    expect(wrapper.exists()).toBe(true);
    wrapper.unmount();
  });

  it('по кнопке retry после ошибки polling перечитывает состояние и возобновляет опрос', async () => {
    vi.useFakeTimers();
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
    mockGetFinaleImageJob
      .mockRejectedValueOnce(new Error('errors.ai_internal_error'))
      .mockResolvedValueOnce({
        job_id: 'job-42',
        game_id: 42,
        status: 'processing',
        error: null,
        artifact_id: null,
        artifacts: [],
        artifacts_count: 0,
        errors: [],
        created_at: '2026-02-20T11:10:00Z',
        updated_at: '2026-02-20T11:10:10Z',
      });

    const wrapper = mountPage();
    await flushPromises();
    await vi.advanceTimersByTimeAsync(1500);
    await flushPromises();

    const retryButton = wrapper
      .findAll('button')
      .find((button) => button.attributes('data-label') === 'actions.retry');
    expect(retryButton).toBeDefined();

    await retryButton?.trigger('click');
    await flushPromises();
    await vi.advanceTimersByTimeAsync(1500);
    await flushPromises();

    expect(mockGetFinaleState).toHaveBeenCalledTimes(2);
    expect(mockGetFinaleImageJob).toHaveBeenCalledTimes(2);
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
      .find((button) => button.attributes('data-icon') === 'mdi-download');
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
        share_phrase: 'Я прошёл(а) путь света и понял(а), куда идти дальше.',
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
      .find((button) => button.attributes('data-icon') === 'mdi-share-variant');
    expect(shareButton).toBeDefined();

    await shareButton?.trigger('click');
    await flushPromises();

    expect(mockCreateFinaleImageTelegramShare).toHaveBeenCalledWith(42, 26);
    expect(mockTelegramShowPopup).toHaveBeenCalled();
    expect(mockTelegramShareToStory).toHaveBeenCalledWith(
      'https://example.com/public/finale-image/token',
      expect.objectContaining({
        text: 'Я прошёл(а) путь света и понял(а), куда идти дальше.',
        widget_link: expect.objectContaining({
          url: 'https://t.me/lila_test_bot?start=ABC123',
        }),
      }),
    );
  });

  it('кнопка поделиться умеет отправлять друзьям через shareMessage', async () => {
    mockGetFinaleState.mockResolvedValue({
      ...buildFinaleState({
        mentor_text: 'Тестовый итог',
        path_phrase: 'Мой путь света',
        share_phrase: 'Я прошёл(а) путь света и понял(а), куда идти дальше.',
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
      .find((button) => button.attributes('data-icon') === 'mdi-share-variant');
    expect(shareButton).toBeDefined();

    await shareButton?.trigger('click');
    await flushPromises();

    expect(mockTelegramShareMessage).toHaveBeenCalledWith('prepared-message-id');
  });

  it('не блокирует отображение текста итога, пока скачиваются картинки', async () => {
    mockGetFinaleState.mockResolvedValue({
      ...buildFinaleState({
        mentor_text: 'Мгновенный итог',
        share_phrase: 'Я уже увидел(а) свой следующий шаг.',
        source: 'ai',
      }),
      image: {
        artifacts: [buildArtifact(26)],
        latest_artifact: buildArtifact(26),
        active_job: null,
        free_generations_left: 0,
      },
    });

    // Имитируем долгую загрузку картинки
    let resolveDownload: (value: Blob) => void = vi.fn();
    mockDownloadFinaleImage.mockReturnValue(
      new Promise((resolve) => {
        resolveDownload = resolve;
      }),
    );

    const wrapper = mountPage();
    // Первый тик - загрузка метаданных
    await flushPromises();

    // Текст должен уже быть виден
    expect(wrapper.text()).toContain('Мгновенный итог');
    // Глобальный лоадер должен быть выключен (isLoading=false)
    // В стабе q-spinner рендерится как <span />
    expect(wrapper.find('q-spinner-stub').exists()).toBe(false);

    // Завершаем загрузку картинки
    resolveDownload(new Blob(['x'], { type: 'image/png' }));
    await flushPromises();
  });
});
