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
                v-if="artifacts.length > 1"
                v-model="selectedArtifactId"
                animated
                arrows
                swipeable
                infinite
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
              <l-ai-loader
                v-if="activeJobStatus === 'queued' || activeJobStatus === 'processing' || isStartingImage"
                :text="t('finale.image_generation_wait')"
              />
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

            <div class="row q-col-gutter-sm q-mt-md">
              <div class="col-12 col-sm-4">
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
              <div class="col-12 col-sm-4">
                <q-btn
                  class="full-width"
                  outline
                  color="secondary"
                  :disable="!selectedArtifact"
                  :label="t('finale.download')"
                  @click="downloadCurrentArtifact"
                />
              </div>
              <div class="col-12 col-sm-4">
                <q-btn
                  class="full-width"
                  outline
                  color="accent"
                  :disable="!selectedArtifact"
                  :label="t('finale.share')"
                  @click="shareCurrentArtifact"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { AxiosError } from 'axios';
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

const finaleState = ref<GameFinaleState | null>(null);
const gameData = ref<GameDetail | null>(null);
const isLoading = ref(false);
const isGeneratingSummary = ref(false);
const isStartingImage = ref(false);
const errorMessage = ref('');
const pollTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const pollStartedAtMs = ref<number | null>(null);
const pollAttempt = ref(0);
const artifactPreviewUrls = ref<Record<number, string>>({});
const selectedArtifactId = ref<number | null>(null);
const fullscreen = ref(false);

const gameId = computed(() => Number(route.params.gameId || 0));
const summary = computed<GameFinaleSummary | null>(() => finaleState.value?.summary ?? null);
const hasSummary = computed(() => Boolean(summary.value?.mentor_text?.trim()));
const activeJob = computed<GameFinaleImageJob | null>(
  () => finaleState.value?.image.active_job ?? null,
);
const activeJobStatus = computed(() => activeJob.value?.status ?? null);
const artifacts = computed(() => {
  const imageState = finaleState.value?.image;
  if (!imageState) return [];
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
    syncPollingState();
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
    syncPollingState();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: resolveBackendErrorMessage(error),
    });
  } finally {
    isStartingImage.value = false;
  }
}

async function pollImageJob(): Promise<void> {
  const job = activeJob.value;
  if (!gameId.value || !job) return;

  if (pollStartedAtMs.value !== null && Date.now() - pollStartedAtMs.value >= 2 * 60 * 1000) {
    clearPolling();
    $q.notify({
      type: 'warning',
      message: t('error.generic'),
    });
    return;
  }

  try {
    const next = await gamesApi.getFinaleImageJob(gameId.value, job.job_id);
    if (!finaleState.value) return;
    finaleState.value.image.active_job = next;

    if (next.status === 'completed' || next.status === 'completed_with_errors') {
      await loadFinaleState();
      clearPolling();
    } else if (next.status === 'failed') {
      clearPolling();
    } else {
      scheduleNextPoll();
    }
  } catch {
    clearPolling();
  }
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
    const blob = await gamesApi.downloadFinaleImage(gameId.value, artifact.artifact_id);
    artifactPreviewUrls.value[artifact.artifact_id] = URL.createObjectURL(blob);
  }
}

function getNextPollDelayMs(): number {
  const delay = 2500 + pollAttempt.value * 1000;
  return Math.min(delay, 10000);
}

function scheduleNextPoll(): void {
  clearPollingTimerOnly();
  pollTimer.value = setTimeout(() => {
    pollAttempt.value += 1;
    void pollImageJob();
  }, getNextPollDelayMs());
}

function clearPollingTimerOnly(): void {
  if (!pollTimer.value) return;
  clearTimeout(pollTimer.value);
  pollTimer.value = null;
}

function syncPollingState(): void {
  if (activeJobStatus.value === 'queued' || activeJobStatus.value === 'processing') {
    if (pollStartedAtMs.value === null) {
      pollStartedAtMs.value = Date.now();
      pollAttempt.value = 0;
    }
    if (pollTimer.value) return;
    scheduleNextPoll();
    return;
  }
  clearPolling();
}

function clearPolling(): void {
  clearPollingTimerOnly();
  pollStartedAtMs.value = null;
  pollAttempt.value = 0;
}

async function downloadCurrentArtifact(): Promise<void> {
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

async function shareCurrentArtifact(): Promise<void> {
  const artifact = selectedArtifact.value;
  if (!artifact) return;

  try {
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

    await downloadCurrentArtifact();
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
  clearPolling();
  clearArtifactPreviews();
});

watch(
  () => artifacts.value.map((artifact) => artifact.artifact_id).join(','),
  () => {
    void refreshArtifactPreviews();
  },
);
</script>
