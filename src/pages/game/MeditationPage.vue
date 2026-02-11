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
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import LAudioPlayer from 'src/components/base/LAudioPlayer.vue';
import { useGameStore } from 'src/stores/game.store';
import type { MeditationAudioType } from 'src/types/audio.interface';

const route = useRoute();
const $q = useQuasar();
const gameStore = useGameStore();
const { meditationAudioUrl, meditationAudioError } = storeToRefs(gameStore);

// Тип медитации
const isEntry = computed(() => route.params.type === 'entry');
const meditationAudioType = computed<MeditationAudioType>(() =>
  isEntry.value ? 'meditation_entry' : 'meditation_exit',
);

const canSkip = ref(false);
let skipTimer: ReturnType<typeof setTimeout> | null = null;

function skipMeditation() {
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
  skipTimer = setTimeout(() => {
    canSkip.value = true;
  }, 30000);

  void loadMeditationAudio();
});

onUnmounted(() => {
  if (skipTimer) {
    clearTimeout(skipTimer);
    skipTimer = null;
  }
});

watch(
  () => meditationAudioType.value,
  () => {
    void loadMeditationAudio();
  },
);
</script>
