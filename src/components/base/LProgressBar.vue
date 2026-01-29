<template>
  <div class="l-progress">
    <div v-if="showLabel" class="l-progress__label">
      <span class="l-progress__label-text">{{ label }}</span>
      <span class="l-progress__label-value">{{ currentCell }}/{{ maxCell }}</span>
    </div>
    <div class="l-progress__track">
      <div class="l-progress__fill" :style="fillStyle" />
      <div v-if="showMarker" class="l-progress__marker" :style="markerStyle" />
    </div>
    <div v-if="showChakraIndicator" class="l-progress__chakras">
      <div
        v-for="chakra in 8"
        :key="chakra"
        class="l-progress__chakra"
        :class="{
          'l-progress__chakra--active': chakra <= currentChakra,
          [`l-progress__chakra--${chakra}`]: true,
        }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  currentCell: number;
  maxCell?: number;
  label?: string;
  showLabel?: boolean;
  showMarker?: boolean;
  showChakraIndicator?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  maxCell: 72,
  label: 'Progress',
  showLabel: true,
  showMarker: true,
  showChakraIndicator: false,
});

// Calculate progress percentage
const progress = computed(() => {
  if (props.currentCell <= 0) return 0;
  return Math.min((props.currentCell / props.maxCell) * 100, 100);
});

// Calculate current chakra level (1-8)
const currentChakra = computed(() => {
  if (props.currentCell <= 0) return 0;
  return Math.ceil(props.currentCell / 9);
});

// Generate gradient based on current position
const fillStyle = computed(() => {
  const chakraColors = [
    '#DC2626', // 1 - Muladhara
    '#EA580C', // 2 - Svadhisthana
    '#FBBF24', // 3 - Manipura
    '#22C55E', // 4 - Anahata
    '#0EA5E9', // 5 - Vishuddha
    '#4F46E5', // 6 - Ajna
    '#9333EA', // 7 - Sahasrara
    '#F5F5F4', // 8 - Absolute
  ];

  // Create gradient stops based on progress
  const stops = chakraColors
    .slice(0, currentChakra.value || 1)
    .map((color, i, arr) => `${color} ${(i / arr.length) * 100}%`)
    .join(', ');

  return {
    width: `${progress.value}%`,
    background: currentChakra.value > 1 ? `linear-gradient(90deg, ${stops})` : chakraColors[0],
  };
});

// Marker position
const markerStyle = computed(() => ({
  left: `${progress.value}%`,
}));
</script>

<style lang="scss" scoped>
.l-progress {
  width: 100%;

  &__label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-xs);

    &-text {
      font-size: 12px;
      font-weight: 500;
      color: var(--lila-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    &-value {
      font-size: 14px;
      font-weight: 600;
      color: var(--lila-text-primary);
    }
  }

  &__track {
    position: relative;
    height: 8px;
    background-color: var(--lila-surface);
    border-radius: var(--radius-full);
    overflow: visible;

    .body--light & {
      background-color: var(--lila-border);
    }
  }

  &__fill {
    height: 100%;
    border-radius: var(--radius-full);
    transition: width 0.4s ease;

    .body--dark & {
      box-shadow: 0 0 10px currentColor;
    }
  }

  &__marker {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 16px;
    height: 16px;
    background-color: var(--lila-text-primary);
    border-radius: 50%;
    border: 3px solid var(--lila-surface-elevated);
    transition: left 0.4s ease;
    z-index: 1;

    .body--dark & {
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
    }

    .body--light & {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
  }

  &__chakras {
    display: flex;
    justify-content: space-between;
    margin-top: var(--space-sm);
    padding: 0 4px;
  }

  &__chakra {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--lila-border);
    transition: all 0.3s ease;

    &--active {
      transform: scale(1.2);
    }

    &--1 {
      &.l-progress__chakra--active {
        background-color: var(--chakra-1);
        box-shadow: 0 0 6px var(--chakra-1);
      }
    }

    &--2 {
      &.l-progress__chakra--active {
        background-color: var(--chakra-2);
        box-shadow: 0 0 6px var(--chakra-2);
      }
    }

    &--3 {
      &.l-progress__chakra--active {
        background-color: var(--chakra-3);
        box-shadow: 0 0 6px var(--chakra-3);
      }
    }

    &--4 {
      &.l-progress__chakra--active {
        background-color: var(--chakra-4);
        box-shadow: 0 0 6px var(--chakra-4);
      }
    }

    &--5 {
      &.l-progress__chakra--active {
        background-color: var(--chakra-5);
        box-shadow: 0 0 6px var(--chakra-5);
      }
    }

    &--6 {
      &.l-progress__chakra--active {
        background-color: var(--chakra-6);
        box-shadow: 0 0 6px var(--chakra-6);
      }
    }

    &--7 {
      &.l-progress__chakra--active {
        background-color: var(--chakra-7);
        box-shadow: 0 0 6px var(--chakra-7);
      }
    }

    &--8 {
      &.l-progress__chakra--active {
        background-color: var(--chakra-8);
        box-shadow: 0 0 6px var(--chakra-8);
      }
    }
  }
}
</style>
