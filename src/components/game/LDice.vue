<template>
  <div class="l-dice-container">
    <div
      ref="diceRef"
      class="l-dice"
      :style="{ '--dice-size': `${size}px` }"
    >
      <!-- 6 граней кубика -->
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

    <!-- Тень -->
    <div
      class="l-dice__shadow"
      :class="{ 'l-dice__shadow--airborne': phase !== 'idle' }"
    />

    <!-- Отображение результата -->
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
import { ref, watch } from 'vue';
import { useSettingsStore } from 'src/stores/settings.store';
import { useDiceAnimation } from 'src/composables/useDiceAnimation';

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
const diceRef = ref<HTMLElement | null>(null);
const showResult = ref(false);

const { phase, startLoop, landOnFace, stop } = useDiceAnimation({
  diceEl: diceRef,
});

// Запуск анимации при начале броска
watch(
  () => props.isRolling,
  (rolling) => {
    if (rolling) {
      showResult.value = false;
      settingsStore.playSound('dice-roll');

      if (props.result && props.result >= 1 && props.result <= 6) {
        // Результат уже есть — сразу приземляемся
        void doLanding(props.result);
      } else {
        startLoop();
      }
    } else if (phase.value !== 'idle') {
      stop();
    }
  },
);

// Получение результата во время вращения
watch(
  () => props.result,
  (newResult) => {
    if (
      newResult &&
      newResult >= 1 &&
      newResult <= 6 &&
      (props.isRolling || phase.value === 'looping')
    ) {
      void doLanding(newResult);
    }
  },
);

async function doLanding(face: number): Promise<void> {
  await landOnFace(face);

  showResult.value = true;
  settingsStore.vibrate([50, 30, 50]);
  emit('roll-complete', face);
}
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
  will-change: transform;

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

    // Позиция каждой грани
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

    // Позиции
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
    transition: opacity 0.3s ease, transform 0.3s ease;

    &--airborne {
      opacity: 0.3;
      transform: translateX(-50%) scale(0.5);
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
