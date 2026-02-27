<template>
  <div
    class="l-chip"
    :class="{
      'l-chip--moving': isMoving,
      'l-chip--arrow': transitionType === 'arrow',
      'l-chip--snake': transitionType === 'snake',
    }"
  >
    <!-- Круглая фишка -->
    <div
      class="l-chip__circle full-width full-height flex flex-center"
      :style="{
        background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
        color: textColor,
      }"
    >
      <div
        class="l-chip__inner full-width full-height relative-position flex flex-center overflow-hidden"
      >
        <!-- Внутреннее свечение и блик -->
        <div class="l-chip__highlight absolute"></div>
        <span class="l-chip__text text-weight-bold z-top">{{ position }}</span>
      </div>
    </div>

    <!-- Эффекты частиц во время переходов -->
    <div
      v-if="isMoving"
      class="l-chip__particles"
    >
      <span
        v-for="i in 6"
        :key="i"
        class="l-chip__particle"
        :style="particleStyle(i)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { cellIdToChakraLevel } from 'src/utils/board-geometry';

type TransitionType = 'arrow' | 'snake' | null;

interface Props {
  position: number;
  color?: string;
  textColor?: string;
  isMoving?: boolean;
  transitionType?: TransitionType;
}

const props = withDefaults(defineProps<Props>(), {
  color: '#6B46C1', // Цвет фишки по умолчанию
  textColor: '#FFFFFF', // Цвет текста фишки по умолчанию
  isMoving: false,
  transitionType: null,
});

// Рассчитать уровень чакры по позиции для цвета
const chakraLevel = computed(() => cellIdToChakraLevel(props.position) || 1);

// Цвета чакр
const chakraColors: Record<number, { start: string; end: string }> = {
  1: { start: '#DC2626', end: '#991B1B' },
  2: { start: '#EA580C', end: '#C2410C' },
  3: { start: '#FBBF24', end: '#D97706' },
  4: { start: '#22C55E', end: '#16A34A' },
  5: { start: '#0EA5E9', end: '#0284C7' },
  6: { start: '#4F46E5', end: '#4338CA' },
  7: { start: '#9333EA', end: '#7C3AED' },
  8: { start: '#F5F5F4', end: '#E7E5E4' },
};

const gradientStart = computed(() => {
  if (props.transitionType === 'arrow') return '#22C55E';
  if (props.transitionType === 'snake') return '#EF4444';
  return chakraColors[chakraLevel.value]?.start || props.color;
});

const gradientEnd = computed(() => {
  if (props.transitionType === 'arrow') return '#16A34A';
  if (props.transitionType === 'snake') return '#DC2626';
  return chakraColors[chakraLevel.value]?.end || props.color;
});

function particleStyle(index: number) {
  const angle = (index / 6) * 360;
  const delay = index * 0.1;

  return {
    '--particle-angle': `${angle}deg`,
    '--particle-delay': `${delay}s`,
  };
}
</script>

<style lang="scss" scoped>
.l-chip {
  position: relative;
  width: 40px;
  height: 40px;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));

  // Анимация плавающего движения в покое
  animation: chip-float 3s ease-in-out infinite;

  &__circle {
    border-radius: 50%;
    box-shadow: inset 0 -2px 6px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
  }

  &__inner {
    border-radius: 50%;
  }

  &__highlight {
    top: 0;
    left: 20%;
    right: 20%;
    height: 40%;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.6), transparent);
    border-radius: 50%;
    pointer-events: none;
  }

  &__text {
    font-size: 16px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  // Состояние движения
  &--moving {
    animation: chip-move 0.8s ease-out;

    .l-chip__circle {
      box-shadow:
        inset 0 -2px 6px rgba(0, 0, 0, 0.5),
        0 0 8px rgba(255, 255, 255, 0.8);
    }
  }

  // Переход со стрелой (восхождение)
  &--arrow {
    animation: chip-arrow 1.2s ease-out;

    .l-chip__circle {
      filter: brightness(1.2);
    }
  }

  // Переход со змеёй (спуск)
  &--snake {
    animation: chip-snake 1.5s ease-out;

    .l-chip__circle {
      filter: saturate(0.8);
    }
  }

  // Частицы
  &__particles {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &__particle {
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: currentColor;
    top: 50%;
    left: 50%;
    opacity: 0;
    animation: particle-burst 0.6s ease-out var(--particle-delay) forwards;
  }
}

@keyframes chip-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@keyframes sparkle-twinkle {
  0%,
  100% {
    opacity: 0;
    transform: scale(0.5);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

@keyframes chip-move {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1) translateY(-5px);
  }
  100% {
    transform: scale(1) translateY(0);
  }
}

@keyframes chip-arrow {
  0% {
    transform: scale(1);
    filter: brightness(1);
  }
  30% {
    transform: scale(1.3) translateY(-20px);
    filter: brightness(1.5);
  }
  100% {
    transform: scale(1) translateY(0);
    filter: brightness(1);
  }
}

@keyframes chip-snake {
  0% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-15deg) translateY(5px);
  }
  50% {
    transform: rotate(15deg) translateY(10px);
  }
  75% {
    transform: rotate(-10deg) translateY(5px);
  }
  100% {
    transform: rotate(0deg) translateY(0);
  }
}

@keyframes particle-burst {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(var(--particle-angle)) translateX(0);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(var(--particle-angle)) translateX(30px);
  }
}
</style>
