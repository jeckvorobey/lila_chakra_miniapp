<template>
  <q-card
    v-if="audioUrl"
    class="bg-surface q-pa-sm rounded-borders q-shadow-2"
    :style="{ border: '1px solid var(--lila-border)' }"
  >
    <q-card-section class="q-pa-sm">
      <q-item dense class="items-center">
        <q-item-section avatar>
          <q-btn
            round
            color="primary"
            :icon="isPlaying ? 'mdi-pause' : 'mdi-play'"
            :aria-label="ariaLabel"
            @click="toggleAudio"
          />
        </q-item-section>

        <q-item-section>
          <q-item-label v-if="title" class="text-weight-medium">
            {{ title }}
          </q-item-label>
          <q-item-label v-if="subtitle" caption class="text-secondary">
            {{ subtitle }}
          </q-item-label>
          <q-linear-progress
            :value="progress"
            color="primary"
            rounded
            size="6px"
            class="q-mt-xs"
          />
        </q-item-section>

        <q-item-section v-if="showTime" side>
          <q-item-label class="text-caption text-secondary">
            {{ timeLabel }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <audio
        ref="audioRef"
        class="hidden"
        :src="audioUrl"
        :preload="preload"
        :loop="loop"
        @loadedmetadata="handleLoadedMetadata"
        @timeupdate="handleTimeUpdate"
        @play="handlePlay"
        @pause="handlePause"
        @ended="handleEnded"
        @error="handleAudioError"
      />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';

interface Props {
  audioUrl?: string | null;
  title?: string;
  subtitle?: string;
  autoplay?: boolean;
  loop?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  showTime?: boolean;
  playAriaLabel?: string;
  pauseAriaLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  audioUrl: '',
  title: '',
  subtitle: '',
  autoplay: false,
  loop: false,
  preload: 'metadata',
  showTime: true,
  playAriaLabel: '',
  pauseAriaLabel: '',
});

const emit = defineEmits<{
  (e: 'error', error: Error): void;
}>();

const audioRef = ref<HTMLAudioElement | null>(null);
const isPlaying = ref(false);
const duration = ref(0);
const currentTime = ref(0);

const progress = computed(() => {
  if (duration.value <= 0) {
    return 0;
  }
  return Math.min(1, currentTime.value / duration.value);
});

const timeLabel = computed(() => {
  return `${formatTime(currentTime.value)} / ${formatTime(duration.value)}`;
});

const ariaLabel = computed(() => {
  if (isPlaying.value) {
    return props.pauseAriaLabel || props.title || undefined;
  }
  return props.playAriaLabel || props.title || undefined;
});

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
}

async function toggleAudio() {
  const audio = audioRef.value;
  if (!audio) {
    return;
  }

  if (audio.paused) {
    try {
      await audio.play();
    } catch (error) {
      emit('error', error as Error);
    }
    return;
  }

  audio.pause();
}

function handleLoadedMetadata() {
  duration.value = audioRef.value?.duration ?? 0;
}

function handleTimeUpdate() {
  currentTime.value = audioRef.value?.currentTime ?? 0;
}

function handlePlay() {
  isPlaying.value = true;
}

function handlePause() {
  isPlaying.value = false;
}

function handleEnded() {
  isPlaying.value = false;
}

function handleAudioError() {
  const mediaError = audioRef.value?.error;
  const code = mediaError?.code;

  let message = 'Не удалось воспроизвести аудио';
  if (code === 1) message = 'Воспроизведение аудио прервано';
  if (code === 2) message = 'Ошибка сети при загрузке аудио';
  if (code === 3) message = 'Ошибка декодирования аудио';
  if (code === 4) message = 'Аудиоформат не поддерживается';

  emit('error', new Error(message));
}

function resetPlayer() {
  const audio = audioRef.value;
  if (!audio) {
    return;
  }

  audio.pause();
  audio.currentTime = 0;
  duration.value = 0;
  currentTime.value = 0;
  isPlaying.value = false;
}

async function tryAutoplay() {
  if (!props.autoplay || !props.audioUrl) {
    return;
  }

  await nextTick();
  try {
    await audioRef.value?.play();
  } catch (error) {
    emit('error', error as Error);
  }
}

watch(
  () => props.audioUrl,
  (value, previous) => {
    if (value === previous) {
      return;
    }

    resetPlayer();
    if (value) {
      void tryAutoplay();
    }
  },
);

onMounted(() => {
  void tryAutoplay();
});
</script>
