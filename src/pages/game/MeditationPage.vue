<template>
  <q-page class="column" style="background: var(--lila-bg)">
    <div class="col column flex-center q-pa-xl">
      <!-- Название -->
      <h1 class="text-h4 text-weight-medium text-center q-mb-sm">
        {{ isEntry ? $t('meditation.entry_title') : $t('meditation.exit_title') }}
      </h1>

      <p class="text-body1 text-secondary text-center q-mb-xl">
        {{ $t('meditation.instruction') }}
      </p>

      <!-- Плеер для аудио -->
      <l-audio-player :audio-url="meditationAudioUrl"
        :title="$t(isEntry ? 'meditation.entry_title' : 'meditation.exit_title')" class="q-mt-md" />

      <q-btn :label="$t('meditation.skip')" flat color="grey" class="q-mt-xl" @click="skipMeditation" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useGameStore } from 'src/stores/game.store';
import LAudioPlayer from 'src/components/base/LAudioPlayer.vue';

const route = useRoute();
const gameStore = useGameStore();

// Тип медитации
const isEntry = computed(() => route.params.type === 'entry');
const meditationAudioUrl = computed(() => {
  if (!gameStore.currentGame) {
    return '';
  }
  return (
    (isEntry.value
      ? gameStore.currentGame.entry_meditation_audio_url
      : gameStore.currentGame.exit_meditation_audio_url) ?? ''
  );
});

const canSkip = ref(false);
let skipTimer: ReturnType<typeof setTimeout> | null = null;

function skipMeditation() {
}

onMounted(() => {
  skipTimer = setTimeout(() => {
    canSkip.value = true;
  }, 30000);
});

onUnmounted(() => {
  if (skipTimer) {
    clearTimeout(skipTimer);
    skipTimer = null;
  }
});
</script>
