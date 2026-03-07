import { computed, onUnmounted, ref, watch, type Ref } from 'vue';
import type { GameFinaleImageJob, GameFinaleState } from 'src/types/game.interface';

/**
 * Параметры polling-композабла финальной генерации изображения.
 */
interface UseFinaleImagePollingOptions {
  gameId: Ref<number>;
  finaleState: Ref<GameFinaleState | null>;
  loadFinaleState: () => Promise<void>;
  generateFinaleImage: (gameId: number) => Promise<GameFinaleImageJob>;
  getFinaleImageJob: (gameId: number, jobId: string) => Promise<GameFinaleImageJob>;
}

const POLLING_INTERVAL_MS = 1500;

/**
 * Управлять lifecycle polling для финального AI-арта.
 */
export function useFinaleImagePolling(options: UseFinaleImagePollingOptions) {
  const isStartingImage = ref(false);
  const pollingInterrupted = ref(false);
  const pollingError = ref<string | null>(null);
  const currentJobId = ref<string | null>(null);
  const pollingTimer = ref<ReturnType<typeof setTimeout> | null>(null);
  const isPolling = ref(false);
  const isDisposed = ref(false);

  const activeJob = computed<GameFinaleImageJob | null>(
    () => options.finaleState.value?.image.active_job ?? null,
  );
  const activeJobStatus = computed(() => activeJob.value?.status ?? null);
  const artifacts = computed(() => {
    const imageState = options.finaleState.value?.image;
    if (!imageState) return [];
    if (imageState.active_job?.artifacts?.length) return imageState.active_job.artifacts;
    if (imageState.artifacts?.length) return imageState.artifacts;
    return imageState.latest_artifact ? [imageState.latest_artifact] : [];
  });

  const canGenerateImage = computed(() => {
    if (!options.finaleState.value) return false;
    if (isStartingImage.value) return false;
    if (isPolling.value) return false;
    if (activeJobStatus.value === 'queued' || activeJobStatus.value === 'processing') return false;
    return options.finaleState.value.image.free_generations_left > 0;
  });

  const isImageGeneratingCombined = computed(() => {
    return (
      isStartingImage.value ||
      isPolling.value ||
      activeJobStatus.value === 'queued' ||
      activeJobStatus.value === 'processing'
    );
  });

  const shouldShowImageLoader = computed(() => {
    if (pollingInterrupted.value) return false;
    if (isStartingImage.value) return true;
    const isJobRunning = activeJobStatus.value === 'queued' || activeJobStatus.value === 'processing';
    return (isPolling.value || isJobRunning) && artifacts.value.length === 0;
  });

  /**
   * Очистить таймер polling.
   */
  function clearPollingTimer(): void {
    if (pollingTimer.value) {
      clearTimeout(pollingTimer.value);
      pollingTimer.value = null;
    }
  }

  /**
   * Полностью остановить polling.
   */
  function stop(): void {
    clearPollingTimer();
    isPolling.value = false;
    currentJobId.value = null;
  }

  /**
   * Отметить polling как прерванный ошибкой/обрывом сети.
   */
  function interrupt(message: string): void {
    stop();
    pollingInterrupted.value = true;
    pollingError.value = message;
  }

  /**
   * Сбросить состояние деградации перед новым циклом.
   */
  function clearPollingInterruption(): void {
    pollingInterrupted.value = false;
    pollingError.value = null;
  }

  /**
   * Считать статус финального job терминальным.
   */
  function isTerminalStatus(status: GameFinaleImageJob['status'] | null): boolean {
    return status === 'completed' || status === 'completed_with_errors' || status === 'failed';
  }

  /**
   * Синхронизировать job в локальном finale state.
   */
  function applyJob(job: GameFinaleImageJob): void {
    if (!options.finaleState.value) return;
    options.finaleState.value.image.active_job = job;
  }

  /**
   * Выполнить один шаг polling.
   */
  async function pollOnce(jobId: string): Promise<void> {
    if (isDisposed.value || !options.gameId.value) return;

    try {
      const job = await options.getFinaleImageJob(options.gameId.value, jobId);
      if (isDisposed.value) return;
      applyJob(job);

      const terminal = isTerminalStatus(job.status);
      const shouldRefreshState = job.artifacts.length > 0 || terminal;

      if (terminal) {
        stop();
      }

      if (shouldRefreshState) {
        await options.loadFinaleState();
      }

      if (terminal) {
        return;
      }

      schedulePoll(jobId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'errors.ai_internal_error';
      interrupt(message);
    }
  }

  /**
   * Запланировать следующий цикл polling.
   */
  function schedulePoll(jobId: string): void {
    clearPollingTimer();
    isPolling.value = true;
    currentJobId.value = jobId;
    pollingTimer.value = setTimeout(() => {
      void pollOnce(jobId);
    }, POLLING_INTERVAL_MS);
  }

  /**
   * Запустить polling для конкретной job.
   */
  function startPolling(jobId: string): void {
    if (!jobId || isDisposed.value) return;
    clearPollingInterruption();
    if (currentJobId.value === jobId && isPolling.value) return;
    schedulePoll(jobId);
  }

  /**
   * Возобновить polling, если backend уже хранит активную job.
   */
  function resumeIfNeeded(): void {
    const job = activeJob.value;
    if (!job) {
      stop();
      return;
    }
    if (job.status === 'queued' || job.status === 'processing') {
      startPolling(job.job_id);
      return;
    }
    stop();
  }

  /**
   * Стартовать генерацию и сразу подписаться на polling.
   */
  async function start(): Promise<void> {
    if (!options.gameId.value || !canGenerateImage.value) return;
    isStartingImage.value = true;
    clearPollingInterruption();
    try {
      const job = await options.generateFinaleImage(options.gameId.value);
      applyJob(job);
      startPolling(job.job_id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'errors.ai_internal_error';
      pollingError.value = message;
      throw error;
    } finally {
      isStartingImage.value = false;
    }
  }

  /**
   * Восстановить состояние после ошибки polling/сети.
   */
  async function recover(): Promise<void> {
    clearPollingInterruption();
    await options.loadFinaleState();
    resumeIfNeeded();
  }

  watch(
    () => options.gameId.value,
    () => {
      stop();
      clearPollingInterruption();
    },
  );

  onUnmounted(() => {
    isDisposed.value = true;
    stop();
  });

  return {
    activeJob,
    activeJobStatus,
    artifacts,
    canGenerateImage,
    currentJobId,
    isImageGeneratingCombined,
    isPolling,
    isStartingImage,
    pollingError,
    pollingInterrupted,
    recover,
    resumeIfNeeded,
    shouldShowImageLoader,
    start,
    stop,
  };
}
