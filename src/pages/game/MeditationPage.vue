<template>
  <q-page class="meditation-page">
    <!-- Animated background -->
    <div class="meditation-page__background">
      <div class="meditation-page__particles">
        <span v-for="i in 20" :key="i" class="meditation-page__particle" :style="particleStyle(i)" />
      </div>
    </div>

    <div class="meditation-page__content">
      <!-- Breathing guide -->
      <div class="meditation-page__breathing" :class="{ 'meditation-page__breathing--active': isPlaying }">
        <div class="meditation-page__circle" />
      </div>

      <!-- Title -->
      <h1 class="text-h4 text-weight-medium text-center q-mb-sm">
        {{ isEntry ? $t('meditation.entry_title') : $t('meditation.exit_title') }}
      </h1>

      <p class="text-body1 text-secondary text-center q-mb-xl">
        {{ $t('meditation.instruction') }}
      </p>

      <!-- Audio player -->
      <div class="meditation-page__player">
        <!-- Waveform visualization -->
        <div class="meditation-page__waveform">
          <span
            v-for="i in 20"
            :key="i"
            class="meditation-page__bar"
            :style="barStyle(i)"
          />
        </div>

        <!-- Progress -->
        <div class="meditation-page__progress q-my-md">
          <span class="text-caption">{{ formatTime(currentTime) }}</span>
          <q-slider
            v-model="progress"
            :min="0"
            :max="100"
            color="primary"
            track-size="4px"
            thumb-size="12px"
            class="q-mx-sm"
            @change="onSeek"
          />
          <span class="text-caption">{{ formatTime(duration) }}</span>
        </div>

        <!-- Controls -->
        <div class="meditation-page__controls">
          <q-btn round flat icon="mdi-rewind-10" size="lg" @click="rewind" />
          <q-btn
            round
            :icon="isPlaying ? 'mdi-pause' : 'mdi-play'"
            color="primary"
            size="xl"
            unelevated
            @click="togglePlay"
          />
          <q-btn round flat icon="mdi-fast-forward-10" size="lg" @click="forward" />
        </div>
      </div>

      <!-- Skip button (after 30s) -->
      <transition name="fade">
        <q-btn
          v-if="canSkip"
          :label="$t('meditation.skip')"
          flat
          color="grey"
          class="q-mt-xl"
          @click="skipMeditation"
        />
      </transition>
    </div>

    <!-- Complete button -->
    <div class="meditation-page__footer">
      <q-btn
        :label="$t('meditation.complete')"
        color="primary"
        size="lg"
        unelevated
        class="full-width"
        :disable="!canComplete"
        @click="completeMeditation"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGameStore } from 'src/stores/game.store';

const route = useRoute();
const router = useRouter();
const gameStore = useGameStore();

// Meditation type
const isEntry = computed(() => route.params.type === 'entry');

// Audio state
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(180); // 3 minutes default
const progress = ref(0);
const canSkip = ref(false);
const canComplete = ref(false);

// Audio progress interval
let progressInterval: ReturnType<typeof setInterval> | null = null;

// Generate particle styles
function particleStyle(index: number) {
  const x = (index * 5) % 100;
  const delay = (index * 0.3) % 5;
  const size = 2 + (index % 4);
  const animDuration = 10 + (index % 10);

  return {
    left: `${x}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`,
    animationDuration: `${animDuration}s`,
  };
}

// Generate waveform bar styles
function barStyle(index: number) {
  const height = isPlaying.value
    ? 10 + Math.random() * 40
    : 10 + Math.sin(index * 0.5) * 20;

  return {
    height: `${height}px`,
    animationDelay: `${index * 0.05}s`,
  };
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function togglePlay() {
  isPlaying.value = !isPlaying.value;

  if (isPlaying.value) {
    startProgress();
  } else {
    stopProgress();
  }
}

function startProgress() {
  progressInterval = setInterval(() => {
    if (currentTime.value < duration.value) {
      currentTime.value += 1;
      progress.value = (currentTime.value / duration.value) * 100;

      // Enable skip after 30 seconds
      if (currentTime.value >= 30) {
        canSkip.value = true;
      }

      // Enable complete when finished
      if (currentTime.value >= duration.value) {
        canComplete.value = true;
        isPlaying.value = false;
        stopProgress();
      }
    }
  }, 1000);
}

function stopProgress() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
}

function onSeek(value: number) {
  currentTime.value = (value / 100) * duration.value;
}

function rewind() {
  currentTime.value = Math.max(0, currentTime.value - 10);
  progress.value = (currentTime.value / duration.value) * 100;
}

function forward() {
  currentTime.value = Math.min(duration.value, currentTime.value + 10);
  progress.value = (currentTime.value / duration.value) * 100;
}

function skipMeditation() {
  canComplete.value = true;
  isPlaying.value = false;
  stopProgress();
}

async function completeMeditation() {
  if (isEntry.value) {
    await gameStore.completeEntryMeditation();
    void router.push('/game');
  } else {
    await gameStore.completeExitMeditation();
    void router.push('/diary');
  }
}

onMounted(() => {
  // Start playing automatically
  setTimeout(() => {
    togglePlay();
  }, 1000);
});

onUnmounted(() => {
  stopProgress();
});
</script>

<style lang="scss" scoped>
.meditation-page {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--lila-bg);
  overflow: hidden;

  &__background {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(107, 70, 193, 0.2) 0%,
      transparent 50%,
      rgba(107, 70, 193, 0.1) 100%
    );
  }

  &__particles {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  &__particle {
    position: absolute;
    bottom: -10px;
    background: var(--lila-primary);
    border-radius: 50%;
    opacity: 0.3;
    animation: float-up 15s linear infinite;
  }

  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-xl);
    z-index: 1;
  }

  &__breathing {
    width: 150px;
    height: 150px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--space-xl);

    &--active .meditation-page__circle {
      animation: breathe 8s ease-in-out infinite;
    }
  }

  &__circle {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      var(--lila-primary) 0%,
      rgba(107, 70, 193, 0.3) 70%,
      transparent 100%
    );
    box-shadow: 0 0 60px var(--lila-primary);
  }

  &__player {
    width: 100%;
    max-width: 320px;
  }

  &__waveform {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    height: 60px;
  }

  &__bar {
    width: 4px;
    background: var(--lila-primary);
    border-radius: var(--radius-full);
    transition: height 0.2s ease;
  }

  &__progress {
    display: flex;
    align-items: center;
    color: var(--lila-text-secondary);
  }

  &__controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-md);
  }

  &__footer {
    padding: var(--space-lg);
    padding-bottom: calc(var(--space-lg) + env(safe-area-inset-bottom));
    z-index: 1;
  }
}

@keyframes float-up {
  0% {
    transform: translateY(0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 0.3;
  }
  90% {
    opacity: 0.3;
  }
  100% {
    transform: translateY(-100vh) scale(0.5);
    opacity: 0;
  }
}

@keyframes breathe {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.5);
    opacity: 1;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
