<template>
  <q-page class="q-pa-sm">
    <div class="q-mx-auto">
      <!-- Поздравление -->
      <q-card
        class="q-pa-md q-mb-md"
        flat
        bordered
      >
        <div class="text-h5 text-weight-bold q-mb-lg">
          {{ t('finale.summary_title') }}
        </div>
        <p class="text-body2 q-mb-sm">{{ t('finale.summary_line1') }}</p>
        <p class="text-body2 q-mb-md">{{ t('finale.summary_line2') }}</p>
        <p class="text-body2 q-mb-md">{{ t('finale.summary_line3') }}</p>
        <p
          v-if="gameData"
          class="text-body1 text-weight-bold q-mb-md q-pl-sm"
          style="border-left: 3px solid var(--q-primary)"
        >
          {{ gameData.query }}
        </p>
        <div
          v-if="gameData"
          class="q-mb-md"
        >
          <div class="row items-center q-mb-xs q-gutter-x-sm no-wrap">
            <q-icon
              name="mdi-dice-multiple"
              color="primary"
              size="18px"
            />
            <span class="text-body2">{{
              t('finale.summary_stats_moves', { count: gameData.total_moves })
            }}</span>
          </div>
          <div class="row items-center q-mb-xs q-gutter-x-sm no-wrap">
            <q-icon
              name="mdi-arrow-up-bold"
              color="positive"
              size="18px"
            />
            <span class="text-body2">{{
              t('finale.summary_stats_arrows', { count: gameData.arrows_hit })
            }}</span>
          </div>
          <div class="row items-center q-gutter-x-sm no-wrap">
            <q-icon
              name="mdi-snake"
              color="negative"
              size="18px"
            />
            <span class="text-body2">{{
              t('finale.summary_stats_snakes', { count: gameData.snakes_hit })
            }}</span>
          </div>
        </div>
        <p class="text-body2 q-mb-sm">{{ t('finale.summary_line4') }}</p>
        <p class="text-body2 text-weight-medium">{{ t('finale.summary_footer') }}</p>
      </q-card>

      <div
        v-if="isLoading"
        class="row justify-center q-py-xl"
      >
        <q-spinner
          color="primary"
          size="42px"
        />
      </div>

      <div
        v-else-if="errorMessage"
        class="q-mb-lg"
      >
        <q-banner
          rounded
          class="bg-negative text-white"
        >
          {{ errorMessage }}
          <template #action>
            <q-btn
              flat
              color="white"
              :label="t('actions.continue')"
              @click="loadFinaleState"
            />
          </template>
        </q-banner>
      </div>

      <template v-else-if="finaleState">
        <div class="row justify-center items-center q-gutter-sm q-mb-md">
          <q-btn
            v-if="!hasSummary"
            color="primary"
            unelevated
            :label="t('finale.mentor_button')"
            :loading="isGeneratingSummary"
            @click="generateSummary"
          />
        </div>

        <div
          v-if="isGeneratingSummary"
          data-test="mentor-loading"
          class="row justify-center items-center q-gutter-sm q-mb-md text-secondary"
        >
          <q-spinner-dots
            color="primary"
            size="22px"
          />
          <span class="text-body2">{{ t('finale.mentor_generating') }}</span>
        </div>

        <q-card
          v-if="summary"
          flat
          bordered
          class="q-mb-md bg-surface"
        >
          <q-card-section>
            <div class="text-overline text-secondary">
              {{ t('finale.mentor_result_block') }}
            </div>
            <div
              class="q-mt-sm text-body1"
              style="white-space: pre-line"
            >
              {{ summary.mentor_text }}
            </div>
          </q-card-section>
        </q-card>

        <q-card
          flat
          bordered
          class="q-mb-md bg-surface"
        >
          <q-card-section>
            <div class="text-overline text-secondary">
              {{ t('finale.art_block') }}
            </div>

            <div
              v-if="selectedArtifactPreviewUrl"
              class="q-mt-sm"
            >
              <q-carousel
                v-if="artifacts.length > 0"
                v-model="selectedArtifactId"
                animated
                v-model:fullscreen="fullscreen"
              >
                <q-carousel-slide
                  v-for="artifact in artifacts"
                  :key="artifact.artifact_id"
                  :name="artifact.artifact_id"
                  class="q-pa-none overflow-hidden"
                >
                  <img
                    :src="artifactPreviewUrls[artifact.artifact_id]"
                    class="full-width full-height rounded-borders"
                    alt="Finale art"
                    style="object-fit: cover"
                  />
                </q-carousel-slide>

                <template v-slot:control>
                  <q-carousel-control
                    position="bottom-right"
                    :offset="[18, 18]"
                  >
                    <q-btn
                      push
                      round
                      dense
                      color="white"
                      text-color="primary"
                      :icon="fullscreen ? 'fullscreen_exit' : 'fullscreen'"
                      @click="fullscreen = !fullscreen"
                    />
                  </q-carousel-control>
                </template>
              </q-carousel>
              <img
                v-else
                :src="selectedArtifactPreviewUrl"
                class="full-width rounded-borders"
                alt="Finale art"
              />
            </div>

            <div class="q-mt-md text-body2">
              <div
                v-if="shouldShowImageLoader"
                class="column items-center"
              >
                <l-ai-loader :text="t('finale.image_generation_wait')" />
              </div>
              <span
                v-else-if="activeJobStatus === 'failed'"
                class="text-negative"
              >
                {{ t('finale.image_failed') }}
              </span>
              <span v-else-if="artifacts.length > 0">
                {{ t('finale.image_ready') }}
              </span>
              <span v-else>
                {{ t('finale.image_not_started') }}
              </span>
            </div>

            <div class="row items-center q-gutter-x-sm q-mt-md no-wrap">
              <div class="col grow">
                <q-btn
                  class="full-width"
                  color="primary"
                  unelevated
                  :loading="isImageGeneratingCombined"
                  :disable="!canGenerateImage"
                  :label="t('finale.generate_image')"
                  @click="startImageGeneration"
                />
              </div>
              <div class="col-auto row items-center q-gutter-x-xs">
                <q-btn
                  round
                  flat
                  dense
                  color="secondary"
                  icon="mdi-download"
                  :disable="!selectedArtifact"
                  @click="downloadCurrentArtifact"
                >
                  <q-tooltip>{{ t('finale.download') }}</q-tooltip>
                </q-btn>
                <q-btn
                  round
                  flat
                  dense
                  color="accent"
                  icon="mdi-share-variant"
                  :disable="!selectedArtifact"
                  @click="shareCurrentArtifact"
                >
                  <q-tooltip>{{ t('finale.share') }}</q-tooltip>
                </q-btn>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { AxiosError } from 'axios';
import { useTelegram } from 'src/composables/useTelegram';
import { gamesApi } from 'src/services/api';
import LAiLoader from 'src/components/common/LAiLoader.vue';
import type {
  GameFinaleState,
  GameFinaleSummary,
  GameFinaleImageJob,
  GameDetail,
} from 'src/types/game.interface';

const route = useRoute();
const { t } = useI18n();
const $q = useQuasar();
const telegram = useTelegram();

const finaleState = ref<GameFinaleState | null>(null);
const gameData = ref<GameDetail | null>(null);
const isLoading = ref(false);
const isGeneratingSummary = ref(false);
const isStartingImage = ref(false);
const errorMessage = ref('');
const streamJobId = ref<string | null>(null);
const streamAbortController = ref<AbortController | null>(null);
const streamReconnectAttempt = ref(0);
const artifactPreviewUrls = ref<Record<number, string>>({});
const selectedArtifactId = ref<number | null>(null);
const fullscreen = ref(false);
const artifactPreviewRequests = new Map<number, Promise<void>>();
let isRefreshingArtifactPreviews = false;
let shouldRefreshArtifactPreviewsAgain = false;

const gameId = computed(() => Number(route.params.gameId || 0));
const summary = computed<GameFinaleSummary | null>(() => finaleState.value?.summary ?? null);
const hasSummary = computed(() => Boolean(summary.value?.mentor_text?.trim()));
const activeJob = computed<GameFinaleImageJob | null>(
  () => finaleState.value?.image.active_job ?? null,
);
const activeJobStatus = computed(() => {
  const job = activeJob.value;
  if (!job) return null;
  return job.status;
});

const artifacts = computed(() => {
  const imageState = finaleState.value?.image;
  if (!imageState) return [];
  if (imageState.active_job?.artifacts?.length) return imageState.active_job.artifacts;
  if (imageState.artifacts?.length) return imageState.artifacts;
  return imageState.latest_artifact ? [imageState.latest_artifact] : [];
});
const selectedArtifact = computed(() => {
  const currentId = selectedArtifactId.value;
  if (currentId != null) {
    const found = artifacts.value.find((artifact) => artifact.artifact_id === currentId);
    if (found) return found;
  }
  return artifacts.value[0] ?? null;
});
const selectedArtifactPreviewUrl = computed(() =>
  selectedArtifact.value ? artifactPreviewUrls.value[selectedArtifact.value.artifact_id] || '' : '',
);
const canGenerateImage = computed(() => {
  if (!finaleState.value) return false;
  if (isStartingImage.value) return false;
  if (activeJobStatus.value === 'queued' || activeJobStatus.value === 'processing') return false;
  return finaleState.value.image.free_generations_left > 0;
});

const isImageGeneratingCombined = computed(() => {
  return (
    isStartingImage.value ||
    activeJobStatus.value === 'queued' ||
    activeJobStatus.value === 'processing'
  );
});

const shouldShowImageLoader = computed(() => {
  if (isStartingImage.value) return true;
  const isJobRunning = activeJobStatus.value === 'queued' || activeJobStatus.value === 'processing';
  return isJobRunning && artifacts.value.length === 0;
});

function resolveBackendErrorMessage(error: unknown): string {
  const detail =
    error instanceof AxiosError
      ? (error.response?.data as { detail?: string } | undefined)?.detail
      : undefined;
  if (typeof detail === 'string' && detail.startsWith('errors.')) {
    const key = detail.slice('errors.'.length);
    return t(`error.${key}`);
  }
  return detail || (error instanceof Error ? error.message : t('error.generic'));
}

async function loadFinaleState(): Promise<void> {
  if (!gameId.value) return;
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const [state, game] = await Promise.all([
      gamesApi.getFinaleState(gameId.value),
      gamesApi.get(gameId.value),
    ]);
    finaleState.value = state;
    gameData.value = game;
    await refreshArtifactPreviews();
    const job = state.image.active_job;
    if (job && (job.status === 'queued' || job.status === 'processing')) {
      void startImageJobStream(job.job_id, { resetRetry: true });
    } else {
      stopImageJobStream();
    }
  } catch (error) {
    errorMessage.value = resolveBackendErrorMessage(error);
  } finally {
    isLoading.value = false;
  }
}

async function generateSummary(): Promise<void> {
  if (!gameId.value || isGeneratingSummary.value || hasSummary.value) return;
  isGeneratingSummary.value = true;
  try {
    const generated = await gamesApi.generateFinaleMentor(gameId.value);
    if (finaleState.value) {
      finaleState.value.summary = generated;
    } else {
      await loadFinaleState();
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: resolveBackendErrorMessage(error),
    });
  } finally {
    isGeneratingSummary.value = false;
  }
}

async function startImageGeneration(): Promise<void> {
  if (!gameId.value || !canGenerateImage.value) return;
  isStartingImage.value = true;
  try {
    const job = await gamesApi.generateFinaleImage(gameId.value);
    if (finaleState.value) {
      finaleState.value.image.active_job = job;
    }
    await startImageJobStream(job.job_id, { resetRetry: true });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: resolveBackendErrorMessage(error),
    });
  } finally {
    isStartingImage.value = false;
  }
}

function stopImageJobStream(): void {
  if (streamAbortController.value) {
    streamAbortController.value.abort();
  }
  streamAbortController.value = null;
  streamJobId.value = null;
}

function clearArtifactPreviews(): void {
  Object.values(artifactPreviewUrls.value).forEach((url) => URL.revokeObjectURL(url));
  artifactPreviewUrls.value = {};
}

async function refreshArtifactPreviews(): Promise<void> {
  const currentArtifacts = artifacts.value;
  if (currentArtifacts.length === 0) {
    clearArtifactPreviews();
    selectedArtifactId.value = null;
    return;
  }
  const firstArtifact = currentArtifacts[0];
  if (!firstArtifact) {
    clearArtifactPreviews();
    selectedArtifactId.value = null;
    return;
  }

  if (
    selectedArtifactId.value === null ||
    !currentArtifacts.some((artifact) => artifact.artifact_id === selectedArtifactId.value)
  ) {
    selectedArtifactId.value = firstArtifact.artifact_id;
  }

  const activeIds = new Set(currentArtifacts.map((artifact) => artifact.artifact_id));
  for (const [artifactIdRaw, url] of Object.entries(artifactPreviewUrls.value)) {
    const artifactId = Number(artifactIdRaw);
    if (!activeIds.has(artifactId)) {
      URL.revokeObjectURL(url);
      delete artifactPreviewUrls.value[artifactId];
    }
  }

  for (const artifact of currentArtifacts) {
    if (artifactPreviewUrls.value[artifact.artifact_id]) continue;
    if (!artifactPreviewRequests.has(artifact.artifact_id)) {
      artifactPreviewRequests.set(
        artifact.artifact_id,
        (async () => {
          try {
            const blob = await gamesApi.downloadFinaleImage(gameId.value, artifact.artifact_id);
            if (!artifacts.value.some((item) => item.artifact_id === artifact.artifact_id)) {
              return;
            }
            artifactPreviewUrls.value[artifact.artifact_id] = URL.createObjectURL(blob);
          } catch (error) {
            console.warn('Failed to preload finale artifact preview', {
              gameId: gameId.value,
              artifactId: artifact.artifact_id,
              error,
            });
          } finally {
            artifactPreviewRequests.delete(artifact.artifact_id);
          }
        })(),
      );
    }
    await artifactPreviewRequests.get(artifact.artifact_id);
  }
}

function scheduleArtifactPreviewRefresh(): void {
  if (isRefreshingArtifactPreviews) {
    shouldRefreshArtifactPreviewsAgain = true;
    return;
  }

  isRefreshingArtifactPreviews = true;
  void (async () => {
    try {
      do {
        shouldRefreshArtifactPreviewsAgain = false;
        await refreshArtifactPreviews();
      } while (shouldRefreshArtifactPreviewsAgain);
    } finally {
      isRefreshingArtifactPreviews = false;
    }
  })();
}

function handleImageJobStreamFailure(jobId: string, error: unknown): void {
  if (!gameId.value) return;
  streamReconnectAttempt.value += 1;
  stopImageJobStream();
  $q.notify({
    type: 'warning',
    message: resolveBackendErrorMessage(error),
  });
}

async function startImageJobStream(jobId: string, options: { resetRetry: boolean }): Promise<void> {
  if (!gameId.value) return;
  if (streamJobId.value === jobId && streamAbortController.value) return;

  stopImageJobStream();
  if (options.resetRetry) {
    streamReconnectAttempt.value = 0;
  }

  const controller = new AbortController();
  streamAbortController.value = controller;
  streamJobId.value = jobId;

  try {
    for await (const event of gamesApi.streamFinaleImageJob(
      gameId.value,
      jobId,
      controller.signal,
    )) {
      if (!finaleState.value) continue;
      if (event.type === 'meta' || event.type === 'progress') {
        finaleState.value.image.active_job = event.job;
        continue;
      }
      if (event.type === 'artifact') {
        finaleState.value.image.active_job = event.job;
        scheduleArtifactPreviewRefresh();
        continue;
      }
      if (event.type === 'done') {
        finaleState.value.image.active_job = event.job;
        if (event.job.status === 'completed' || event.job.status === 'completed_with_errors') {
          await loadFinaleState();
        } else {
          scheduleArtifactPreviewRefresh();
          stopImageJobStream();
        }
        return;
      }
    }

    // Иногда SSE соединение закрывается без финального `done`.
    // В этом случае перечитываем итоговое состояние, чтобы не оставлять UI в loading.
    if (!controller.signal.aborted) {
      await loadFinaleState();
    }
  } catch (error) {
    if (controller.signal.aborted) return;
    handleImageJobStreamFailure(jobId, error);
  } finally {
    if (streamAbortController.value === controller) {
      streamAbortController.value = null;
    }
    if (streamJobId.value === jobId && !controller.signal.aborted) {
      streamJobId.value = null;
    }
  }
}

async function downloadCurrentArtifactViaBrowser(): Promise<void> {
  const artifact = selectedArtifact.value;
  if (!artifact) return;

  const blob = await gamesApi.downloadFinaleImage(gameId.value, artifact.artifact_id);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = artifact.file_name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function buildTelegramStoryLink(): { url: string; name: string } | undefined {
  if (typeof window === 'undefined') return undefined;
  return {
    url: window.location.href,
    name: t('finale.share_story_link'),
  };
}

async function downloadCurrentArtifact(): Promise<void> {
  const artifact = selectedArtifact.value;
  if (!artifact) return;

  try {
    if (telegram.isAvailable.value && telegram.tg?.downloadFile) {
      const filePayload = await gamesApi.getFinaleImageTelegramFile(
        gameId.value,
        artifact.artifact_id,
      );
      const accepted = await telegram.downloadFile({
        url: filePayload.url,
        file_name: filePayload.file_name,
      });
      if (accepted) {
        return;
      }
    }

    await downloadCurrentArtifactViaBrowser();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: resolveBackendErrorMessage(error),
    });
  }
}

async function shareCurrentArtifact(): Promise<void> {
  const artifact = selectedArtifact.value;
  if (!artifact) return;

  try {
    if (telegram.isAvailable.value && (telegram.tg?.shareToStory || telegram.tg?.shareMessage)) {
      const sharePayload = await gamesApi.createFinaleImageTelegramShare(
        gameId.value,
        artifact.artifact_id,
      );
      const buttons: Array<{ id: string; type: 'default' | 'cancel'; text: string }> = [];
      if (telegram.tg.shareToStory) {
        buttons.push({
          id: 'story',
          type: 'default' as const,
          text: t('finale.share_story_option'),
        });
      }
      if (telegram.tg.shareMessage) {
        buttons.push({
          id: 'friends',
          type: 'default' as const,
          text: t('finale.share_friends_option'),
        });
      }
      buttons.push({
        id: 'cancel',
        type: 'cancel' as const,
        text: t('actions.cancel'),
      });

      const actionId = await telegram.showPopup({
        title: t('finale.share'),
        message: t('finale.share_popup_message'),
        buttons,
      });

      if (actionId === 'story' && telegram.tg.shareToStory) {
        const storyParams: {
          text?: string;
          widget_link?: {
            url: string;
            name?: string;
          };
        } = {
          text: summary.value?.path_phrase || t('finale.share_title'),
        };
        const storyLink = buildTelegramStoryLink();
        if (storyLink) {
          storyParams.widget_link = storyLink;
        }
        const storyShared = telegram.shareToStory(sharePayload.url, storyParams);
        if (!storyShared) {
          $q.notify({ type: 'warning', message: t('finale.share_story_unavailable') });
        }
        return;
      }

      if (actionId === 'friends' && telegram.tg.shareMessage) {
        const shared = await telegram.shareMessage(sharePayload.share_message_id);
        if (!shared) {
          $q.notify({ type: 'warning', message: t('finale.share_friends_unavailable') });
        }
        return;
      }

      return;
    }

    const blob = await gamesApi.downloadFinaleImage(gameId.value, artifact.artifact_id);
    const file = new File([blob], artifact.file_name, { type: artifact.mime_type });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: t('finale.share_title'),
        text: summary.value?.path_phrase || summary.value?.mentor_text || '',
      });
      return;
    }

    await downloadCurrentArtifactViaBrowser();
    $q.notify({ type: 'info', message: t('finale.share_fallback') });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: resolveBackendErrorMessage(error),
    });
  }
}

onMounted(() => {
  void loadFinaleState();
});

onUnmounted(() => {
  stopImageJobStream();
  clearArtifactPreviews();
  artifactPreviewRequests.clear();
});
</script>
