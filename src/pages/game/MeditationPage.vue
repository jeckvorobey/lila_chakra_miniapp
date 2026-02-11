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
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import type { AudioByTypeResponse, MeditationAudioType } from 'src/types/audio.interface';
import LAudioPlayer from 'src/components/base/LAudioPlayer.vue';

const route = useRoute();
const $q = useQuasar();

// Тип медитации
const isEntry = computed(() => route.params.type === 'entry');
const meditationAudioType = computed<MeditationAudioType>(() =>
  isEntry.value ? 'meditation_entry' : 'meditation_exit',
);
const meditationAudioUrl = ref('');

const canSkip = ref(false);
let skipTimer: ReturnType<typeof setTimeout> | null = null;

function skipMeditation() {
}

async function loadMeditationAudio(): Promise<void> {
  try {
    const response = await api.get<AudioByTypeResponse>(
      `/api/audio/by-type/${meditationAudioType.value}`,
    );
    const firstAudio = response.data.items[0];
    meditationAudioUrl.value = firstAudio ? `/api/audio/${firstAudio.id}/stream` : '';
  } catch (err: unknown) {
    meditationAudioUrl.value = '';
    const axiosErr = err as { response?: { data?: { detail?: string } } };
    const detail = axiosErr?.response?.data?.detail;
    $q.notify({
      type: 'negative',
      message: detail || 'Не удалось загрузить аудио медитации',
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
