<template>
  <q-page class="q-pa-sm">
    <div class="q-mx-auto">
      <!-- Поздравление -->
      <q-card class="q-pa-md q-mb-md" flat bordered>
        <div class="text-h5 text-weight-bold q-mb-lg">
          {{ t('finale.summary_title') }}
        </div>
        <p class="text-body2 q-mb-sm">{{ t('finale.summary_line1') }}</p>
        <p class="text-body2 q-mb-md">{{ t('finale.summary_line2') }}</p>
        <p class="text-body2 q-mb-md">{{ t('finale.summary_line3') }}</p>
        <p v-if="gameData" class="text-body1 text-weight-bold q-mb-md q-pl-sm"
          style="border-left: 3px solid var(--q-primary)">
          {{ gameData.query }}
        </p>
        <div v-if="gameData" class="q-mb-md">
          <div class="row items-center q-mb-xs q-gutter-x-sm no-wrap">
            <q-icon name="mdi-dice-multiple" color="primary" size="18px" />
            <span class="text-body2">{{ t('finale.summary_stats_moves', { count: gameData.total_moves }) }}</span>
          </div>
          <div class="row items-center q-mb-xs q-gutter-x-sm no-wrap">
            <q-icon name="mdi-arrow-up-bold" color="positive" size="18px" />
            <span class="text-body2">{{ t('finale.summary_stats_arrows', { count: gameData.arrows_hit }) }}</span>
          </div>
          <div class="row items-center q-gutter-x-sm no-wrap">
            <q-icon name="mdi-snake" color="negative" size="18px" />
            <span class="text-body2">{{ t('finale.summary_stats_snakes', { count: gameData.snakes_hit }) }}</span>
          </div>
        </div>
        <p class="text-body2 q-mb-sm">{{ t('finale.summary_line4') }}</p>
        <p class="text-body2 text-weight-medium">{{ t('finale.summary_footer') }}</p>
      </q-card>

      <div v-if="isLoading" class="row justify-center q-py-xl">
        <q-spinner color="primary" size="42px" />
      </div>

      <div v-else-if="errorMessage" class="q-mb-lg">
        <q-banner rounded class="bg-negative text-white">
          {{ errorMessage }}
          <template #action>
            <q-btn flat color="white" :label="t('actions.continue')" @click="loadFinaleState" />
          </template>
        </q-banner>
      </div>

      <template v-else-if="finaleState">
        <div v-if="!summary" class="row items-center q-gutter-sm q-mb-md">
          <q-btn color="primary" unelevated :label="t('finale.mentor_button')" :loading="isGeneratingSummary"
            @click="generateSummary" />
        </div>

        <!-- План на ближайшие 72 часа -->
        <q-card v-if="summary" flat bordered class="q-mb-md bg-surface">
          <q-card-section>
            <div class="text-overline text-secondary">
              {{ t('finale.plan_block') }}
            </div>
            <div v-for="window in summary.next_72h_plan" :key="window.window" class="q-mt-md">
              <div class="text-subtitle2 text-weight-medium">
                {{ window.window }} · {{ window.title }}
              </div>
              <ul class="q-pl-lg q-mt-xs q-mb-none">
                <li v-for="step in window.steps" :key="step">
                  {{ step }}
                </li>
              </ul>
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="q-mb-md bg-surface">
          <q-card-section>
            <div class="text-overline text-secondary">
              {{ t('finale.art_block') }}
            </div>

            <div v-if="artifactPreviewUrl" class="q-mt-sm">
              <img :src="artifactPreviewUrl" class="full-width rounded-borders" alt="Finale art" />
            </div>

            <div class="q-mt-md text-body2">
              <span v-if="activeJobStatus === 'queued' || activeJobStatus === 'processing'">
                {{ t('finale.image_generating') }}
              </span>
              <span v-else-if="activeJobStatus === 'failed'" class="text-negative">
                {{ t('finale.image_failed') }}
              </span>
              <span v-else-if="finaleState.image.latest_artifact">
                {{ t('finale.image_ready') }}
              </span>
              <span v-else>
                {{ t('finale.image_not_started') }}
              </span>
            </div>

            <div class="row q-col-gutter-sm q-mt-md">
              <div class="col-12 col-sm-4">
                <q-btn class="full-width" color="primary" unelevated :loading="isStartingImage"
                  :disable="!canGenerateImage" :label="t('finale.generate_image')" @click="startImageGeneration" />
              </div>
              <div class="col-12 col-sm-4">
                <q-btn class="full-width" outline color="secondary" :disable="!finaleState.image.latest_artifact"
                  :label="t('finale.download')" @click="downloadCurrentArtifact" />
              </div>
              <div class="col-12 col-sm-4">
                <q-btn class="full-width" outline color="accent" :disable="!finaleState.image.latest_artifact"
                  :label="t('finale.share')" @click="shareCurrentArtifact" />
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
import { gamesApi } from 'src/services/api';
import type { GameFinaleState, GameFinaleSummary, GameFinaleImageJob, GameDetail } from 'src/types/game.interface';

const route = useRoute();
const { t } = useI18n();
const $q = useQuasar();

const finaleState = ref<GameFinaleState | null>(null);
const gameData = ref<GameDetail | null>(null);
const isLoading = ref(false);
const isGeneratingSummary = ref(false);
const isStartingImage = ref(false);
const errorMessage = ref('');
const pollTimer = ref<ReturnType<typeof setInterval> | null>(null);
const artifactPreviewUrl = ref('');
const previewArtifactId = ref<number | null>(null);

const gameId = computed(() => Number(route.params.gameId || 0));
const summary = computed<GameFinaleSummary | null>(() => finaleState.value?.summary ?? null);
const activeJob = computed<GameFinaleImageJob | null>(() => finaleState.value?.image.active_job ?? null);
const activeJobStatus = computed(() => activeJob.value?.status ?? null);
const canGenerateImage = computed(() => {
  if (!finaleState.value) return false;
  if (isStartingImage.value) return false;
  if (activeJobStatus.value === 'queued' || activeJobStatus.value === 'processing') return false;
  return finaleState.value.image.free_generations_left > 0;
});
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
    await refreshArtifactPreview();
    syncPollingState();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('error.generic');
  } finally {
    isLoading.value = false;
  }
}

async function generateSummary(): Promise<void> {
  if (!gameId.value || isGeneratingSummary.value) return;
  isGeneratingSummary.value = true;
  try {
    const generated = await gamesApi.generateFinaleSummary(gameId.value);
    if (finaleState.value) {
      finaleState.value.summary = generated;
    } else {
      await loadFinaleState();
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : t('error.generic'),
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
      message: error instanceof Error ? error.message : t('error.generic'),
    });
  } finally {
    isStartingImage.value = false;
  }
}

async function pollImageJob(): Promise<void> {
  const job = activeJob.value;
  if (!gameId.value || !job) return;

  try {
    const next = await gamesApi.getFinaleImageJob(gameId.value, job.job_id);
    if (!finaleState.value) return;
    finaleState.value.image.active_job = next;

    if (next.status === 'completed') {
      await loadFinaleState();
      clearPolling();
    } else if (next.status === 'failed') {
      clearPolling();
    }
  } catch {
    clearPolling();
  }
}

function clearArtifactPreview(): void {
  if (!artifactPreviewUrl.value) return;
  URL.revokeObjectURL(artifactPreviewUrl.value);
  artifactPreviewUrl.value = '';
  previewArtifactId.value = null;
}

async function refreshArtifactPreview(): Promise<void> {
  const artifact = finaleState.value?.image.latest_artifact;
  if (!artifact) {
    clearArtifactPreview();
    return;
  }
  if (previewArtifactId.value === artifact.artifact_id && artifactPreviewUrl.value) {
    return;
  }

  const blob = await gamesApi.downloadFinaleImage(gameId.value, artifact.artifact_id);
  clearArtifactPreview();
  artifactPreviewUrl.value = URL.createObjectURL(blob);
  previewArtifactId.value = artifact.artifact_id;
}

function syncPollingState(): void {
  if (activeJobStatus.value === 'queued' || activeJobStatus.value === 'processing') {
    if (pollTimer.value) return;
    pollTimer.value = setInterval(() => {
      void pollImageJob();
    }, 2500);
    return;
  }
  clearPolling();
}

function clearPolling(): void {
  if (!pollTimer.value) return;
  clearInterval(pollTimer.value);
  pollTimer.value = null;
}

async function downloadCurrentArtifact(): Promise<void> {
  const artifact = finaleState.value?.image.latest_artifact;
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
  const artifact = finaleState.value?.image.latest_artifact;
  if (!artifact) return;

  try {
    const blob = await gamesApi.downloadFinaleImage(gameId.value, artifact.artifact_id);
    const file = new File([blob], artifact.file_name, { type: artifact.mime_type });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: t('finale.share_title'),
        text: summary.value?.path_phrase || summary.value?.parting_message || '',
      });
      return;
    }

    await downloadCurrentArtifact();
    $q.notify({ type: 'info', message: t('finale.share_fallback') });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : t('error.generic'),
    });
  }
}

onMounted(() => {
  void loadFinaleState();
});

onUnmounted(() => {
  clearPolling();
  clearArtifactPreview();
});
</script>
