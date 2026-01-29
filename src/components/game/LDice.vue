<template>
  <div class="l-dice-container">
    <div
      class="l-dice"
      :class="{
        'l-dice--rolling': isRolling,
        'l-dice--result': showResult,
      }"
      :style="diceStyle"
    >
      <!-- 6 faces of the dice -->
      <div class="l-dice__face l-dice__face--1">
        <span class="l-dice__dot l-dice__dot--center" />
      </div>
      <div class="l-dice__face l-dice__face--2">
        <span class="l-dice__dot l-dice__dot--top-right" />
        <span class="l-dice__dot l-dice__dot--bottom-left" />
      </div>
      <div class="l-dice__face l-dice__face--3">
        <span class="l-dice__dot l-dice__dot--top-right" />
        <span class="l-dice__dot l-dice__dot--center" />
        <span class="l-dice__dot l-dice__dot--bottom-left" />
      </div>
      <div class="l-dice__face l-dice__face--4">
        <span class="l-dice__dot l-dice__dot--top-left" />
        <span class="l-dice__dot l-dice__dot--top-right" />
        <span class="l-dice__dot l-dice__dot--bottom-left" />
        <span class="l-dice__dot l-dice__dot--bottom-right" />
      </div>
      <div class="l-dice__face l-dice__face--5">
        <span class="l-dice__dot l-dice__dot--top-left" />
        <span class="l-dice__dot l-dice__dot--top-right" />
        <span class="l-dice__dot l-dice__dot--center" />
        <span class="l-dice__dot l-dice__dot--bottom-left" />
        <span class="l-dice__dot l-dice__dot--bottom-right" />
      </div>
      <div class="l-dice__face l-dice__face--6">
        <span class="l-dice__dot l-dice__dot--top-left" />
        <span class="l-dice__dot l-dice__dot--top-right" />
        <span class="l-dice__dot l-dice__dot--middle-left" />
        <span class="l-dice__dot l-dice__dot--middle-right" />
        <span class="l-dice__dot l-dice__dot--bottom-left" />
        <span class="l-dice__dot l-dice__dot--bottom-right" />
      </div>
    </div>

    <!-- Shadow -->
    <div class="l-dice__shadow" :class="{ 'l-dice__shadow--rolling': isRolling }" />

    <!-- Result display -->
    <transition name="fade">
      <div v-if="showResult && result" class="l-dice__result">
        <q-badge
          :color="result === 6 ? 'warning' : 'primary'"
          :label="String(result)"
          class="l-dice__result-badge text-h5"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useSettingsStore } from 'src/stores/settings.store';

interface Props {
  result?: number | null;
  isRolling?: boolean;
  size?: number;
}

const props = withDefaults(defineProps<Props>(), {
  result: null,
  isRolling: false,
  size: 100,
});

const emit = defineEmits<{
  (e: 'roll-complete', value: number): void;
}>();

const settingsStore = useSettingsStore();
const showResult = ref(false);
const finalRotation = ref({ x: 0, y: 0, z: 0 });

// Rotations to show each face
const faceRotations: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
  5: { x: 0, y: 90 },
  6: { x: 180, y: 0 },
};

const diceStyle = computed(() => {
  if (props.isRolling) {
    return {
      '--dice-size': `${props.size}px`,
    };
  }

  const rot = finalRotation.value;
  return {
    '--dice-size': `${props.size}px`,
    transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg) rotateZ(${rot.z}deg)`,
  };
});

// Watch for result changes to animate to final position
watch(
  () => props.result,
  (newResult) => {
    if (newResult && newResult >= 1 && newResult <= 6) {
      showResult.value = false;
      const rotation = faceRotations[newResult] || { x: 0, y: 0 };
      // Add extra rotations for visual effect
      finalRotation.value = {
        x: rotation.x + 360 * 2,
        y: rotation.y + 360 * 2,
        z: 0,
      };

      // Show result badge after animation
      setTimeout(() => {
        showResult.value = true;
        settingsStore.vibrate([50, 30, 50]);
        emit('roll-complete', newResult);
      }, 500);
    }
  }
);

// Reset when rolling starts
watch(
  () => props.isRolling,
  (rolling) => {
    if (rolling) {
      showResult.value = false;
      settingsStore.playSound('dice-roll');
    }
  }
);
</script>

<style lang="scss" scoped>
.l-dice-container {
  position: relative;
  width: var(--dice-size, 100px);
  height: var(--dice-size, 100px);
  perspective: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.l-dice {
  --dice-size: 100px;
  --half-size: calc(var(--dice-size) / 2);

  width: var(--dice-size);
  height: var(--dice-size);
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  &--rolling {
    animation: dice-roll 2s ease-out forwards;
  }

  &--result {
    animation: dice-bounce 0.3s ease-out;
  }

  &__face {
    position: absolute;
    width: var(--dice-size);
    height: var(--dice-size);
    border-radius: 12px;
    display: flex;
    flex-wrap: wrap;
    align-content: center;
    justify-content: center;
    padding: 15%;
    box-sizing: border-box;

    .body--dark & {
      background: var(--lila-surface-elevated);
      border: 1px solid var(--lila-border);
      box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.2);
    }

    .body--light & {
      background: white;
      border: 1px solid var(--lila-border);
      box-shadow:
        inset 0 2px 4px rgba(0, 0, 0, 0.05),
        0 2px 8px rgba(0, 0, 0, 0.1);
    }

    // Position each face
    &--1 {
      transform: translateZ(var(--half-size));
    }
    &--6 {
      transform: rotateY(180deg) translateZ(var(--half-size));
    }
    &--2 {
      transform: rotateY(-90deg) translateZ(var(--half-size));
    }
    &--5 {
      transform: rotateY(90deg) translateZ(var(--half-size));
    }
    &--3 {
      transform: rotateX(90deg) translateZ(var(--half-size));
    }
    &--4 {
      transform: rotateX(-90deg) translateZ(var(--half-size));
    }
  }

  &__dot {
    position: absolute;
    width: 18%;
    height: 18%;
    border-radius: 50%;

    .body--dark & {
      background: var(--lila-text-primary);
      box-shadow: 0 0 4px rgba(255, 255, 255, 0.3);
    }

    .body--light & {
      background: var(--lila-text-primary);
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
    }

    // Positions
    &--center {
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    &--top-left {
      top: 18%;
      left: 18%;
    }
    &--top-right {
      top: 18%;
      right: 18%;
    }
    &--middle-left {
      top: 50%;
      left: 18%;
      transform: translateY(-50%);
    }
    &--middle-right {
      top: 50%;
      right: 18%;
      transform: translateY(-50%);
    }
    &--bottom-left {
      bottom: 18%;
      left: 18%;
    }
    &--bottom-right {
      bottom: 18%;
      right: 18%;
    }
  }

  &__shadow {
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    height: 20px;
    background: radial-gradient(ellipse, rgba(0, 0, 0, 0.3) 0%, transparent 70%);
    border-radius: 50%;
    transition: all 0.3s ease;

    &--rolling {
      animation: shadow-shrink 2s ease-out forwards;
    }
  }

  &__result {
    position: absolute;
    top: -40px;
    left: 50%;
    transform: translateX(-50%);
  }

  &__result-badge {
    font-size: 24px;
    padding: 8px 16px;
  }
}

@keyframes dice-roll {
  0% {
    transform: translateY(0) rotateX(0) rotateY(0) rotateZ(0);
  }
  15% {
    transform: translateY(-120px) rotateX(180deg) rotateY(90deg) rotateZ(45deg);
  }
  50% {
    transform: translateY(-80px) rotateX(540deg) rotateY(360deg) rotateZ(180deg);
  }
  75% {
    transform: translateY(-20px) rotateX(720deg) rotateY(540deg) rotateZ(270deg);
  }
  100% {
    transform: translateY(0) rotateX(var(--final-x, 720deg)) rotateY(var(--final-y, 720deg)) rotateZ(360deg);
  }
}

@keyframes dice-bounce {
  0% {
    transform: translateY(-10px);
  }
  50% {
    transform: translateY(5px);
  }
  100% {
    transform: translateY(0);
  }
}

@keyframes shadow-shrink {
  0%,
  100% {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }
  50% {
    opacity: 0.3;
    transform: translateX(-50%) scale(0.5);
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
