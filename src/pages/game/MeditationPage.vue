<template>
  <q-page
    class="column"
    style="background: var(--lila-bg)"
  >
    <div
      class="col column flex-center"
      style="padding: var(--lila-layout-gap)"
    >
      <!-- Название -->
      <h1 class="text-h4 text-weight-medium text-center q-mb-sm">
        {{ isEntry ? $t('meditation.entry_title') : $t('meditation.exit_title') }}
      </h1>

      <p class="text-body1 text-secondary text-center q-mb-xl">
        {{ $t('meditation.instruction') }}
      </p>

      <!-- Плеер для аудио -->
      <l-audio-player
        :audio-url="meditationAudioUrl"
        :title="$t(isEntry ? 'meditation.entry_title' : 'meditation.exit_title')"
        class="q-mt-md"
        @error="handleAudioError"
        @ended="handleMeditationEnded"
      />

      <q-btn
        :label="$t('meditation.skip')"
        flat
        color="grey"
        class="q-mt-xl"
        :loading="isSkipping"
        @click="skipMeditation"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import LAudioPlayer from 'src/components/base/LAudioPlayer.vue';
import { useGameStore } from 'src/stores/game.store';
import type { MeditationAudioType } from 'src/types/audio.interface';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const gameStore = useGameStore();
const { meditationAudioUrl, meditationAudioError } = storeToRefs(gameStore);

// Тип медитации
const isEntry = computed(() => route.params.type === 'entry');
const meditationAudioType = computed<MeditationAudioType>(() =>
  isEntry.value ? 'meditation_entry' : 'meditation_exit',
);

const isSkipping = ref(false);

async function completeMeditationAndGoGame(): Promise<void> {
  if (isSkipping.value) {
    return;
  }

  // Если игра не загружена, просто вернуть пользователя на экран игры.
  if (!gameStore.currentGame) {
    await router.push('/game');
    return;
  }

  isSkipping.value = true;

  const isCompleted = isEntry.value
    ? await gameStore.completeEntryMeditation()
    : await gameStore.completeExitMeditation();

  isSkipping.value = false;

  if (!isCompleted) {
    $q.notify({
      type: 'negative',
      message: gameStore.error || 'Не удалось пропустить медитацию',
    });
    return;
  }

  if (!isEntry.value && gameStore.currentGame?.id) {
    await router.push(`/game/final/${gameStore.currentGame.id}`);
    return;
  }

  await router.push('/game');
}

async function skipMeditation(): Promise<void> {
  await completeMeditationAndGoGame();
}

async function handleMeditationEnded(): Promise<void> {
  await completeMeditationAndGoGame();
}

function handleAudioError(error: Error): void {
  $q.notify({
    type: 'negative',
    message: error.message || 'Ошибка воспроизведения аудио',
  });
}

async function loadMeditationAudio(): Promise<void> {
  await gameStore.loadMeditationAudio(meditationAudioType.value);
  if (meditationAudioError.value) {
    $q.notify({
      type: 'negative',
      message: meditationAudioError.value,
    });
  }
}

onMounted(() => {
  void loadMeditationAudio();
});

onUnmounted(() => {
  gameStore.clearMeditationAudio();
});

watch(
  () => meditationAudioType.value,
  () => {
    void loadMeditationAudio();
  },
);
</script>
