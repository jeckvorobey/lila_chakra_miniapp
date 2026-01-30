<template>
  <div class="l-progress full-width">
    <div v-if="showLabel" class="row justify-between items-center q-mb-xs">
      <span class="text-caption text-secondary text-uppercase">{{ label }}</span>
      <span class="text-body2 text-weight-bold">{{ currentCell }}/{{ maxCell }}</span>
    </div>
    <div class="l-progress__track">
      <div class="l-progress__fill" :style="fillStyle" />
      <div v-if="showMarker" class="l-progress__marker" :style="markerStyle" />
    </div>
    <div v-if="showChakraIndicator" class="row justify-between q-mt-sm q-px-xs">
      <div
        v-for="chakra in 8"
        :key="chakra"
        class="l-progress__chakra"
        :class="{
          'l-progress__chakra--active': chakra <= currentChakra,
        }"
        :style="chakra <= currentChakra ? { backgroundColor: `var(--chakra-${chakra})` } : {}"
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

const progress = computed(() => {
  if (props.currentCell <= 0) return 0;
  return Math.min((props.currentCell / props.maxCell) * 100, 100);
});

const currentChakra = computed(() => {
  if (props.currentCell <= 0) return 0;
  return Math.ceil(props.currentCell / 9);
});

const fillStyle = computed(() => {
  const chakraColors = [
    '#DC2626',
    '#EA580C',
    '#FBBF24',
    '#22C55E',
    '#0EA5E9',
    '#4F46E5',
    '#9333EA',
    '#F5F5F4',
  ];

  const stops = chakraColors
    .slice(0, currentChakra.value || 1)
    .map((color, i, arr) => `${color} ${(i / arr.length) * 100}%`)
    .join(', ');

  return {
    width: `${progress.value}%`,
    background: currentChakra.value > 1 ? `linear-gradient(90deg, ${stops})` : chakraColors[0],
  };
});

const markerStyle = computed(() => ({
  left: `${progress.value}%`,
}));
</script>

<style lang="scss" scoped>
.l-progress {
  &__track {
    position: relative;
    height: 8px;
    background-color: var(--lila-surface);
    border-radius: 9999px;
    overflow: visible;

    .body--light & {
      background-color: var(--lila-border);
    }
  }

  &__fill {
    height: 100%;
    border-radius: 9999px;
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

  &__chakra {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--lila-border);
    transition: all 0.3s ease;

    &--active {
      transform: scale(1.2);
      box-shadow: 0 0 6px currentColor;
    }
  }
}
</style>
