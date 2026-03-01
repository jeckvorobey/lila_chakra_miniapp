<template>
  <div class="l-dice-container">
    <div
      ref="diceRef"
      class="l-dice"
      :style="{ '--dice-size': `${size}px` }"
    >
      <!-- 6 граней кубика -->
      <div
        v-for="n in 6"
        :key="n"
        class="l-dice__face"
        :class="[
          `l-dice__face--${n}`,
          {
            'is-rolling': isRollingState,
            'is-result': isResultState,
          },
        ]"
      >
        <span
          v-for="(dotClass, dotIdx) in getFaceDots(n)"
          :key="dotIdx"
          class="l-dice__dot"
          :class="dotClass"
        />
      </div>
    </div>

    <!-- Тень -->
    <div
      class="l-dice__shadow"
      :class="{ 'l-dice__shadow--airborne': phase !== 'idle' }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
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

const { phase, startLoop, landOnFace, stop } = useDiceAnimation({
  diceEl: diceRef,
});

const isRollingState = computed(() => phase.value === 'looping' || phase.value === 'landing');
const isResultState = computed(() => phase.value === 'idle' && props.result !== null);

// Запуск анимации при начале броска
watch(
  () => props.isRolling,
  (rolling) => {
    if (rolling) {
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

  settingsStore.vibrate([50, 30, 50]);
  emit('roll-complete', face);
}

function getFaceDots(n: number): string[] {
  switch (n) {
    case 1:
      return ['l-dice__dot--center'];
    case 2:
      return ['l-dice__dot--top-right', 'l-dice__dot--bottom-left'];
    case 3:
      return ['l-dice__dot--top-right', 'l-dice__dot--center', 'l-dice__dot--bottom-left'];
    case 4:
      return [
        'l-dice__dot--top-left',
        'l-dice__dot--top-right',
        'l-dice__dot--bottom-left',
        'l-dice__dot--bottom-right',
      ];
    case 5:
      return [
        'l-dice__dot--top-left',
        'l-dice__dot--top-right',
        'l-dice__dot--center',
        'l-dice__dot--bottom-left',
        'l-dice__dot--bottom-right',
      ];
    case 6:
      return [
        'l-dice__dot--top-left',
        'l-dice__dot--top-right',
        'l-dice__dot--middle-left',
        'l-dice__dot--middle-right',
        'l-dice__dot--bottom-left',
        'l-dice__dot--bottom-right',
      ];
    default:
      return [];
  }
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
    transition:
      border-color 0.3s ease,
      box-shadow 0.3s ease;

    .body--dark & {
      background: var(--lila-surface-elevated);
      border: 1px solid var(--lila-border);
      box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.2);

      &.is-rolling {
        border: 2px solid #6b46c1;
        box-shadow:
          inset 0 0 20px rgba(0, 0, 0, 0.2),
          0 0 30px rgba(107, 70, 193, 0.25);
      }

      &.is-result {
        border: 2px solid var(--chakra-4);
        box-shadow:
          inset 0 0 20px rgba(0, 0, 0, 0.2),
          0 0 24px rgba(34, 197, 94, 0.35);
      }
    }

    .body--light & {
      background: white;
      border: 1px solid var(--lila-border);
      box-shadow:
        inset 0 2px 4px rgba(0, 0, 0, 0.05),
        0 2px 8px rgba(0, 0, 0, 0.1);

      &.is-rolling {
        border: 2px solid #6b46c1;
        box-shadow:
          0 0 30px rgba(107, 70, 193, 0.2),
          0 2px 8px rgba(0, 0, 0, 0.1);
      }

      &.is-result {
        border: 2px solid var(--chakra-4);
        box-shadow:
          0 0 24px rgba(34, 197, 94, 0.3),
          0 2px 8px rgba(0, 0, 0, 0.1);
      }
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
    transition:
      opacity 0.3s ease,
      transform 0.3s ease;

    &--airborne {
      opacity: 0.3;
      transform: translateX(-50%) scale(0.5);
    }
  }
}
</style>
