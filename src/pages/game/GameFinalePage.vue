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
              @click="retryLoadFinaleState"
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
              v-if="hasAnyArtifactPreview"
              class="q-mt-sm"
            >
              <q-carousel
                v-model="selectedArtifactId"
                animated
                :arrows="artifacts.length > 1"
                :swipeable="artifacts.length > 1"
                :infinite="artifacts.length > 1"
                v-model:fullscreen="fullscreen"
              >
                <q-carousel-slide
                  v-for="artifact in artifacts"
                  :key="artifact.artifact_id"
                  :name="artifact.artifact_id"
                  :img-src="artifactPreviewUrls[artifact.artifact_id]"
                  class="q-pa-none overflow-hidden finale-art-slide"
                  :class="{ 'finale-art-slide--fullscreen': fullscreen }"
                />

                <template v-if="artifacts.length" v-slot:control>
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
            </div>

            <div class="q-mt-md text-body2">
              <div
                v-if="shouldShowImageLoader"
                class="column items-center"
              >
                <l-ai-loader :text="t('finale.image_generation_wait')" />
              </div>
              <div
                v-else-if="isArtifactPreviewLoading"
                class="column items-center"
              >
                <l-ai-loader :text="t('finale.image_generation_wait')" />
              </div>
              <div
                v-else-if="pollingInterrupted"
                class="column items-start q-gutter-y-sm"
              >
                <span class="text-warning">
                  {{ pollingErrorMessage }}
                </span>
                <q-btn
                  flat
                  color="primary"
                  no-caps
                  :label="t('actions.retry')"
                  @click="recoverImagePolling"
                />
              </div>
              <span
                v-else-if="activeJobStatus === 'failed'"
                class="text-negative"
              >
                {{ t('finale.image_failed') }}
              </span>
              <span v-else-if="hasAnyArtifactPreview">
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
import { useFinaleImagePolling } from 'src/composables/useFinaleImagePolling';
import { useTelegram } from 'src/composables/useTelegram';
import { gamesApi } from 'src/services/api';
import { useUserStore } from 'src/stores/user.store';
import LAiLoader from 'src/components/common/LAiLoader.vue';
import type { GameFinaleState, GameFinaleSummary, GameDetail } from 'src/types/game.interface';

const route = useRoute();
const { t } = useI18n();
const $q = useQuasar();
const telegram = useTelegram();
const userStore = useUserStore();

const finaleState = ref<GameFinaleState | null>(null);
const gameData = ref<GameDetail | null>(null);
const isLoading = ref(false);
const isGeneratingSummary = ref(false);
const errorMessage = ref('');
const artifactPreviewUrls = ref<Record<number, string>>({});
const selectedArtifactId = ref<number | null>(null);
const fullscreen = ref(false);
const artifactPreviewRequests = new Map<number, Promise<void>>();
const pendingArtifactPreviewCount = ref(0);

const gameId = computed(() => Number(route.params.gameId || 0));
const summary = computed<GameFinaleSummary | null>(() => finaleState.value?.summary ?? null);
const hasSummary = computed(() => Boolean(summary.value?.mentor_text?.trim()));
const referralLink = computed(
  () => userStore.referralProgram?.link || userStore.referralData?.link || '',
);
const imagePolling = useFinaleImagePolling({
  gameId,
  finaleState,
  loadFinaleState: async () => {
    // ВАЖНО: при пуллинге вызываем loadFinaleState в фоновом режиме без лоадера
    await loadFinaleState({ resumePolling: false, background: true });
  },
  generateFinaleImage: (currentGameId) => gamesApi.generateFinaleImage(currentGameId),
  getFinaleImageJob: (currentGameId, jobId) => gamesApi.getFinaleImageJob(currentGameId, jobId),
});
const activeJobStatus = imagePolling.activeJobStatus;
const artifacts = imagePolling.artifacts;
const selectedArtifact = computed(() => {
  const currentId = selectedArtifactId.value;
  if (currentId != null) {
    const found = artifacts.value.find((artifact) => artifact.artifact_id === currentId);
    if (found) return found;
  }
  return artifacts.value[0] ?? null;
});
const hasAnyArtifactPreview = computed(() =>
  artifacts.value.some((artifact) => Boolean(artifactPreviewUrls.value[artifact.artifact_id])),
);
const isArtifactPreviewLoading = computed(
  () => artifacts.value.length > 0 && !hasAnyArtifactPreview.value && pendingArtifactPreviewCount.value > 0,
);
const canGenerateImage = imagePolling.canGenerateImage;
const isImageGeneratingCombined = imagePolling.isImageGeneratingCombined;
const shouldShowImageLoader = imagePolling.shouldShowImageLoader;
const pollingInterrupted = imagePolling.pollingInterrupted;
const pollingError = imagePolling.pollingError;
const pollingErrorMessage = computed(() => {
  if (!pollingInterrupted.value) return '';
  if (!pollingError.value) return t('error.generic');
  return resolveBackendErrorMessage(new Error(pollingError.value));
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

async function loadFinaleState(
  options: { resumePolling?: boolean; background?: boolean } = {},
): Promise<void> {
  if (!gameId.value) return;

  // Показываем глобальный лоадер только если данных еще нет и это не фоновое обновление
  if (!finaleState.value && !options.background) {
    isLoading.value = true;
  }

  errorMessage.value = '';
  try {
    const [state, game] = await Promise.all([
      gamesApi.getFinaleState(gameId.value),
      gamesApi.get(gameId.value),
    ]);
    finaleState.value = state;
    gameData.value = game;

    // Запускаем предзагрузку артефактов в фоновом режиме (без await)
    void refreshArtifactPreviews();

    if (options.resumePolling !== false) {
      imagePolling.resumeIfNeeded();
    }
  } catch (error) {
    errorMessage.value = resolveBackendErrorMessage(error);
  } finally {
    isLoading.value = false;
  }
}

function retryLoadFinaleState(): void {
  void loadFinaleState();
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
  try {
    await imagePolling.start();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: resolveBackendErrorMessage(error),
    });
  }
}

async function recoverImagePolling(): Promise<void> {
  try {
    await imagePolling.recover();
  } catch (error) {
    $q.notify({
      type: 'warning',
      message: resolveBackendErrorMessage(error),
    });
  }
}

function clearArtifactPreviews(): void {
  Object.values(artifactPreviewUrls.value).forEach((url) => URL.revokeObjectURL(url));
  artifactPreviewUrls.value = {};
  pendingArtifactPreviewCount.value = 0;
}

function refreshArtifactPreviews(): void {
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

  // Инициализируем selectedArtifactId сразу
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

  // Запускаем все запросы на загрузку параллельно
  currentArtifacts.forEach((artifact) => {
    if (artifactPreviewUrls.value[artifact.artifact_id]) return;
    if (artifactPreviewRequests.has(artifact.artifact_id)) {
      return;
    }

    const promise = (async () => {
      pendingArtifactPreviewCount.value += 1;
      try {
        const blob = await gamesApi.downloadFinaleImage(gameId.value, artifact.artifact_id);
        // Проверяем, что артефакт все еще актуален
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
        pendingArtifactPreviewCount.value = Math.max(0, pendingArtifactPreviewCount.value - 1);
        artifactPreviewRequests.delete(artifact.artifact_id);
      }
    })();

    artifactPreviewRequests.set(artifact.artifact_id, promise);
  });
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

async function ensureReferralLink(): Promise<string> {
  if (referralLink.value) return referralLink.value;
  await userStore.fetchReferralProgram();
  return userStore.referralProgram?.link || userStore.referralData?.link || '';
}

function buildTelegramStoryLink(url: string): { url: string; name: string } | undefined {
  if (!url) return undefined;
  return {
    url,
    name: t('finale.share_story_link'),
  };
}

function buildShareText(): string {
  return summary.value?.share_phrase || summary.value?.path_phrase || t('finale.share_title');
}

function buildNavigatorShareText(link: string): string {
  const parts = [buildShareText()];
  if (link) {
    parts.push(link);
  }
  return parts.join('\n\n');
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
        const storyReferralLink = await ensureReferralLink();
        const storyParams: {
          text?: string;
          widget_link?: {
            url: string;
            name?: string;
          };
        } = {
          text: buildShareText(),
        };
        const storyLink = buildTelegramStoryLink(
          storyReferralLink || (typeof window !== 'undefined' ? window.location.href : ''),
        );
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
    const shareReferralLink = await ensureReferralLink();
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: t('finale.share_title'),
        text: buildNavigatorShareText(shareReferralLink),
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
  imagePolling.stop();
  clearArtifactPreviews();
  artifactPreviewRequests.clear();
});
</script>

<style scoped lang="scss">
.finale-art-slide {
  border-radius: 16px;
  min-height: 320px;
}

.finale-art-slide--fullscreen {
  border-radius: 0;
}

:deep(.q-carousel--fullscreen .q-carousel__slide) {
  border-radius: 0;
}

@media (max-width: 599px) {
  :deep(.q-carousel--fullscreen),
  :deep(.q-carousel--fullscreen .q-carousel__slide),
  :deep(.q-carousel--fullscreen img) {
    border-radius: 0 !important;
  }
}
</style>
