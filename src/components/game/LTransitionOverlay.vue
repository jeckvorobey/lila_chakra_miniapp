<template>
  <div class="l-transition-overlay">
    <svg
      ref="overlayRef"
      class="l-transition-overlay__svg"
      :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient :id="gradientId" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" :stop-color="startColor" />
          <stop offset="100%" :stop-color="endColor" />
        </linearGradient>
        <filter :id="glowId" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path
        ref="pathRef"
        class="l-transition-overlay__path"
        :d="pathData"
        :stroke="`url(#${gradientId})`"
        :stroke-width="strokeWidth"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
        :filter="`url(#${glowId})`"
      />

      <path
        v-if="type === 'arrow'"
        class="l-transition-overlay__arrow-head"
        :d="arrowHeadPath"
        :fill="endColor"
        :filter="`url(#${glowId})`"
      />

      <g v-if="type === 'snake' && snakeHeadPos">
        <circle
          class="l-transition-overlay__snake-head"
          :cx="snakeHeadPos.x"
          :cy="snakeHeadPos.y"
          :r="6.5"
          :fill="endColor"
          :filter="`url(#${glowId})`"
        />
        <circle :cx="snakeHeadPos.x - 2.2" :cy="snakeHeadPos.y - 1.6" r="1" fill="#ffffff" />
        <circle :cx="snakeHeadPos.x + 2.2" :cy="snakeHeadPos.y - 1.6" r="1" fill="#ffffff" />
      </g>
    </svg>

    <div
      ref="chipRef"
      :class="[
        'l-transition-overlay__chip',
        { 'l-transition-overlay__chip--hidden': phase !== 'chip-moving' },
      ]"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { CELLS_PER_ROW } from 'src/data/game-constants';
import { getChakraColor } from 'src/data/chakra-colors';
import type { CellPosition } from 'src/utils/board-geometry';
import { getCellPixelPosition } from 'src/utils/board-geometry';
import { createArrowHead, createArrowPath, createSnakePath } from 'src/utils/transition-paths';
import { useTransitionAnimation } from 'src/composables/useTransitionAnimation';

interface Props {
  type: 'arrow' | 'snake';
  startCellId: number;
  endCellId: number;
  gridEl: HTMLElement | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'animation-start'): void;
  (e: 'animation-end'): void;
}>();

const $q = useQuasar();
const isDarkMode = computed(() => $q.dark?.isActive ?? true);

const overlayRef = ref<SVGSVGElement | null>(null);
const pathRef = ref<SVGPathElement | null>(null);
const chipRef = ref<HTMLElement | null>(null);

const gridSize = ref({ width: 1, height: 1 });
const animationStarted = ref(false);
let resizeObserver: ResizeObserver | null = null;

const { phase, animate, stop } = useTransitionAnimation();

const gradientId = `transition-gradient-${Math.random().toString(36).slice(2, 9)}`;
const glowId = `transition-glow-${Math.random().toString(36).slice(2, 9)}`;

const startChakraLevel = computed(() => Math.ceil(props.startCellId / CELLS_PER_ROW));
const endChakraLevel = computed(() => Math.ceil(props.endCellId / CELLS_PER_ROW));

const startColor = computed(() => getChakraColor(startChakraLevel.value, isDarkMode.value));
const endColor = computed(() => getChakraColor(endChakraLevel.value, isDarkMode.value));
const strokeWidth = computed(() => (props.type === 'snake' ? 4.5 : 3));

const startPos = computed<CellPosition | null>(() => {
  if (!props.gridEl) return null;
  return getCellPixelPosition(props.startCellId, props.gridEl);
});

const endPos = computed<CellPosition | null>(() => {
  if (!props.gridEl) return null;
  return getCellPixelPosition(props.endCellId, props.gridEl);
});

const pathData = computed(() => {
  if (!startPos.value || !endPos.value) return '';
  if (props.type === 'arrow') {
    return createArrowPath(startPos.value, endPos.value);
  }

  return createSnakePath(endPos.value, startPos.value);
});

const arrowHeadPath = computed(() => {
  if (props.type !== 'arrow' || !startPos.value || !endPos.value) return '';
  return createArrowHead(endPos.value, startPos.value, 8);
});

const snakeHeadPos = computed(() => {
  if (props.type !== 'snake') return null;
  return startPos.value;
});

const svgWidth = computed(() => Math.max(1, gridSize.value.width));
const svgHeight = computed(() => Math.max(1, gridSize.value.height));

function updateGridSize(): void {
  if (!props.gridEl) return;
  const rect = props.gridEl.getBoundingClientRect();
  gridSize.value = {
    width: rect.width,
    height: rect.height,
  };
}

function observeGrid(): void {
  unobserveGrid();
  if (!props.gridEl || typeof ResizeObserver === 'undefined') return;

  resizeObserver = new ResizeObserver(() => {
    updateGridSize();
  });
  resizeObserver.observe(props.gridEl);
}

function unobserveGrid(): void {
  resizeObserver?.disconnect();
  resizeObserver = null;
}

async function startOverlayAnimation(): Promise<void> {
  if (animationStarted.value) return;
  if (!props.gridEl || !startPos.value || !endPos.value || !pathData.value) {
    emit('animation-end');
    return;
  }

  animationStarted.value = true;
  emit('animation-start');

  await nextTick();

  try {
    await animate({
      type: props.type,
      startPos: startPos.value,
      endPos: endPos.value,
      pathEl: pathRef,
      overlayEl: overlayRef,
      chipEl: chipRef,
    });
  } finally {
    emit('animation-end');
  }
}

watch(
  () => props.gridEl,
  () => {
    updateGridSize();
    observeGrid();
  },
  { immediate: true },
);

onMounted(async () => {
  updateGridSize();
  await startOverlayAnimation();
});

onBeforeUnmount(() => {
  stop();
  unobserveGrid();
});
</script>

<style scoped lang="scss">
.l-transition-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;

  &__svg {
    width: 100%;
    height: 100%;
    overflow: visible;
    opacity: 1;
  }

  &__path {
    opacity: 1;
  }

  &__chip {
    position: absolute;
    top: 0;
    left: 0;
    width: 20px;
    height: 26px;
    border-radius: 8px;
    transform: translate(-50%, -50%);
    background: linear-gradient(180deg, #9333ea 0%, #7c3aed 100%);
    box-shadow: 0 0 14px #9333ea99;
    will-change: transform, opacity;

    &--hidden {
      opacity: 0;
    }
  }
}
</style>
