<template>
  <div class="l-board" :class="{ 'l-board--zoomed': isZoomed }">
    <!-- Zoom controls -->
    <div class="l-board__controls">
      <q-btn-group flat class="l-board__zoom-controls">
        <q-btn
          flat
          dense
          icon="mdi-minus"
          :disable="zoom <= 0.5"
          @click="zoomOut"
        />
        <q-btn
          flat
          dense
          icon="mdi-magnify-scan"
          @click="resetZoom"
        />
        <q-btn
          flat
          dense
          icon="mdi-plus"
          :disable="zoom >= 2"
          @click="zoomIn"
        />
      </q-btn-group>
    </div>

    <!-- Board container with touch gestures -->
    <q-scroll-area
      ref="scrollArea"
      class="l-board__scroll"
      :thumb-style="thumbStyle"
      @touchmove.prevent
    >
      <div
        ref="boardContent"
        class="l-board__content"
        :style="boardStyle"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <!-- Background image -->
        <div class="l-board__background" />

        <!-- Grid overlay -->
        <div class="l-board__grid">
          <!-- Rows (chakras from top to bottom: 8 → 1) -->
          <div
            v-for="row in 8"
            :key="row"
            class="l-board__row"
            :class="`l-board__row--chakra-${9 - row}`"
          >
            <!-- Cells in serpentine pattern -->
            <l-cell
              v-for="cellId in getRowCells(9 - row)"
              :key="cellId"
              :cell-id="cellId"
              :cell-name="getCellName(cellId)"
              :is-current-position="cellId === currentCell"
              :has-player="cellId === currentCell"
              :size="cellSize"
              @click="onCellClick"
              @long-press="onCellLongPress"
            />
          </div>
        </div>

        <!-- Arrow paths (SVG overlay) -->
        <svg v-if="showTransitions" class="l-board__transitions">
          <!-- Arrows -->
          <g v-for="(target, start) in ARROWS" :key="`arrow-${start}`">
            <path
              :d="getTransitionPath(Number(start), target)"
              class="l-board__arrow-path"
            />
          </g>
          <!-- Snakes -->
          <g v-for="(target, start) in SNAKES" :key="`snake-${start}`">
            <path
              :d="getTransitionPath(Number(start), target)"
              class="l-board__snake-path"
            />
          </g>
        </svg>

        <!-- Player chip -->
        <l-chip
          v-if="currentCell > 0"
          :position="currentCell"
          :style="chipStyle"
          class="l-board__chip"
        />
      </div>
    </q-scroll-area>

    <!-- Current position indicator -->
    <div class="l-board__indicator">
      <q-chip
        :color="currentCell > 0 ? `chakra-${currentChakra}` : 'grey'"
        text-color="white"
        icon="mdi-map-marker"
        size="md"
      >
        {{ currentCell > 0 ? currentCell : $t('game.outside_board') }}
      </q-chip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ARROWS, SNAKES, CELLS_PER_ROW } from 'src/stores/game.store';
import LCell from './LCell.vue';
import LChip from './LChip.vue';

interface Props {
  currentCell: number;
  showTransitions?: boolean;
  interactive?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showTransitions: true,
  interactive: true,
});

const emit = defineEmits<{
  (e: 'cell-click', cellId: number): void;
  (e: 'cell-long-press', cellId: number): void;
}>();

// Zoom state
const zoom = ref(1);
const isZoomed = computed(() => zoom.value !== 1);
import type { QScrollArea } from 'quasar';

const scrollArea = ref<InstanceType<typeof QScrollArea> | null>(null);

// Cell size based on zoom
const cellSize = computed<'sm' | 'md' | 'lg'>(() => {
  if (zoom.value < 0.8) return 'sm';
  if (zoom.value > 1.3) return 'lg';
  return 'md';
});

// Current chakra level
const currentChakra = computed(() => {
  if (props.currentCell <= 0) return 0;
  return Math.ceil(props.currentCell / CELLS_PER_ROW);
});

// Board style with zoom
const boardStyle = computed(() => ({
  transform: `scale(${zoom.value})`,
  transformOrigin: 'center center',
}));

// Chip position style
const chipStyle = computed(() => {
  if (props.currentCell <= 0) return { display: 'none' };

  const row = Math.ceil(props.currentCell / CELLS_PER_ROW);
  const posInRow = (props.currentCell - 1) % CELLS_PER_ROW;

  // Serpentine pattern: even rows go right-to-left
  const col = row % 2 === 1 ? posInRow : CELLS_PER_ROW - 1 - posInRow;

  // Calculate position (adjust for cell size and gaps)
  const cellWidth = 44; // md size + gap
  const cellHeight = 44;

  return {
    left: `${col * cellWidth + cellWidth / 2}px`,
    bottom: `${(row - 1) * cellHeight + cellHeight / 2}px`,
  };
});

const thumbStyle = {
  backgroundColor: 'var(--lila-primary)',
  opacity: '0.5',
  borderRadius: '4px',
};

// Cell name getter (from store or props)
function getCellName(cellId: number): string {
  // Will be connected to cells data from store
  return `Cell ${cellId}`;
}

// Get cells for a row in serpentine pattern
function getRowCells(chakraLevel: number): number[] {
  const startCell = (chakraLevel - 1) * CELLS_PER_ROW + 1;
  const cells = Array.from({ length: CELLS_PER_ROW }, (_, i) => startCell + i);

  // Reverse even rows for serpentine
  return chakraLevel % 2 === 0 ? cells.reverse() : cells;
}

// Generate SVG path for arrow/snake
function getTransitionPath(from: number, to: number): string {
  // Simplified curved path - would be calculated based on cell positions
  const fromRow = Math.ceil(from / CELLS_PER_ROW);
  const toRow = Math.ceil(to / CELLS_PER_ROW);
  const fromCol = (from - 1) % CELLS_PER_ROW;
  const toCol = (to - 1) % CELLS_PER_ROW;

  const x1 = fromCol * 44 + 22;
  const y1 = (8 - fromRow) * 44 + 22;
  const x2 = toCol * 44 + 22;
  const y2 = (8 - toRow) * 44 + 22;

  // Bezier curve
  const cx = (x1 + x2) / 2;
  const cy = Math.min(y1, y2) - 50;

  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

// Zoom controls
function zoomIn() {
  zoom.value = Math.min(zoom.value + 0.25, 2);
}

function zoomOut() {
  zoom.value = Math.max(zoom.value - 0.25, 0.5);
}

function resetZoom() {
  zoom.value = 1;
}

// Touch gesture handling for pinch zoom
let initialDistance = 0;
let initialZoom = 1;

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 2) {
    initialDistance = getTouchDistance(e.touches);
    initialZoom = zoom.value;
  }
}

function onTouchMove(e: TouchEvent) {
  if (e.touches.length === 2) {
    const currentDistance = getTouchDistance(e.touches);
    const scale = currentDistance / initialDistance;
    zoom.value = Math.min(Math.max(initialZoom * scale, 0.5), 2);
  }
}

function onTouchEnd() {
  initialDistance = 0;
}

function getTouchDistance(touches: TouchList): number {
  const touch0 = touches[0];
  const touch1 = touches[1];
  if (!touch0 || !touch1) return 0;
  const dx = touch0.clientX - touch1.clientX;
  const dy = touch0.clientY - touch1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// Cell interaction handlers
function onCellClick(cellId: number) {
  if (props.interactive) {
    emit('cell-click', cellId);
  }
}

function onCellLongPress(cellId: number) {
  if (props.interactive) {
    emit('cell-long-press', cellId);
  }
}

// Scroll to current cell when position changes
watch(
  () => props.currentCell,
  (newCell) => {
    if (newCell > 0 && scrollArea.value) {
      // Scroll logic would go here
    }
  }
);
</script>

<style lang="scss" scoped>
.l-board {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
  display: flex;
  flex-direction: column;

  &__controls {
    position: absolute;
    top: var(--space-sm);
    right: var(--space-sm);
    z-index: 100;
  }

  &__zoom-controls {
    background: var(--lila-glass-bg);
    backdrop-filter: var(--lila-glass-blur);
    border-radius: var(--radius-md);
    border: 1px solid var(--lila-border);
  }

  &__scroll {
    flex: 1;
    width: 100%;
  }

  &__content {
    position: relative;
    min-width: 400px;
    min-height: 360px;
    padding: var(--space-md);
    transition: transform 0.3s ease;
  }

  &__background {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(147, 51, 234, 0.1) 0%,
      rgba(107, 70, 193, 0.05) 50%,
      rgba(220, 38, 38, 0.1) 100%
    );
    border-radius: var(--radius-lg);
    pointer-events: none;
  }

  &__grid {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 4px;
    z-index: 1;
  }

  &__row {
    display: flex;
    gap: 4px;
    justify-content: center;

    // Chakra row backgrounds
    @for $i from 1 through 8 {
      &--chakra-#{$i} {
        position: relative;

        &::before {
          content: '';
          position: absolute;
          left: -8px;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 80%;
          background: var(--chakra-#{$i});
          border-radius: var(--radius-full);
          opacity: 0.5;
        }
      }
    }
  }

  &__transitions {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 2;
  }

  &__arrow-path {
    fill: none;
    stroke: var(--lila-success);
    stroke-width: 2;
    stroke-dasharray: 4 2;
    opacity: 0.6;
  }

  &__snake-path {
    fill: none;
    stroke: var(--lila-error);
    stroke-width: 2;
    stroke-dasharray: 4 2;
    opacity: 0.6;
  }

  &__chip {
    position: absolute;
    z-index: 10;
    transform: translate(-50%, 50%);
    transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  &__indicator {
    position: absolute;
    bottom: var(--space-md);
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
  }

  &--zoomed {
    .l-board__scroll {
      overflow: auto;
    }
  }
}

// Chakra chip colors
:deep(.q-chip) {
  @for $i from 1 through 8 {
    &.bg-chakra-#{$i} {
      background: var(--chakra-#{$i}) !important;
    }
  }
}
</style>
