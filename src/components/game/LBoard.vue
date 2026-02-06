<template>
  <div class="l-board" :class="{ 'l-board--zoomed': isZoomed }">
    <!-- Элементы управления масштабом -->
    <div class="l-board__controls">
      <q-btn-group flat class="l-board__zoom-controls">
        <q-btn flat dense icon="mdi-minus" :disable="zoom <= 0.5" @click="zoomOut" />
        <q-btn flat dense icon="mdi-magnify-scan" @click="resetZoom" />
        <q-btn flat dense icon="mdi-plus" :disable="zoom >= 2" @click="zoomIn" />
      </q-btn-group>
    </div>

    <!-- Контейнер доски с сенсорными жестами -->
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
        <!-- Фоновое изображение -->
        <div class="l-board__background" />

        <!-- Сетка -->
        <div class="l-board__grid">
          <!-- Строки (чакры сверху вниз: 8 → 1) -->
          <div
            v-for="row in 8"
            :key="row"
            class="l-board__row"
            :class="`l-board__row--chakra-${9 - row}`"
          >
            <!-- Клетки в зигзагообразном порядке -->
            <l-cell
              v-for="cellId in getRowCells(9 - row)"
              :key="cellId"
              :cell-id="cellId"
              :is-current-position="cellId === currentCell"
              :has-player="cellId === currentCell"
              :size="cellSize"
              @click="onCellClick"
              @long-press="onCellLongPress"
            />
          </div>
        </div>

        <!-- Пути стрел (SVG слой) -->
        <svg v-if="showTransitions" class="l-board__transitions">
          <!-- Стрелы -->
          <g v-for="(target, start) in ARROWS" :key="`arrow-${start}`">
            <path :d="getTransitionPath(Number(start), target)" class="l-board__arrow-path" />
          </g>
          <!-- Змеи -->
          <g v-for="(target, start) in SNAKES" :key="`snake-${start}`">
            <path :d="getTransitionPath(Number(start), target)" class="l-board__snake-path" />
          </g>
        </svg>

        <!-- Фишка игрока -->
        <l-chip
          v-if="currentCell > 0"
          :position="currentCell"
          :style="chipStyle"
          class="l-board__chip"
        />
      </div>
    </q-scroll-area>

    <!-- Индикатор текущей позиции -->
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

// Состояние масштабирования
const zoom = ref(1);
const isZoomed = computed(() => zoom.value !== 1);
import type { QScrollArea } from 'quasar';

const scrollArea = ref<InstanceType<typeof QScrollArea> | null>(null);

// Размер клетки в зависимости от масштаба
const cellSize = computed<'sm' | 'md' | 'lg'>(() => {
  if (zoom.value < 0.8) return 'sm';
  if (zoom.value > 1.3) return 'lg';
  return 'md';
});

// Текущий уровень чакры
const currentChakra = computed(() => {
  if (props.currentCell <= 0) return 0;
  return Math.ceil(props.currentCell / CELLS_PER_ROW);
});

// Стиль доски с масштабом
const boardStyle = computed(() => ({
  transform: `scale(${zoom.value})`,
  transformOrigin: 'center center',
}));

// Стиль позиции фишки
const chipStyle = computed(() => {
  if (props.currentCell <= 0) return { display: 'none' };

  const row = Math.ceil(props.currentCell / CELLS_PER_ROW);
  const posInRow = (props.currentCell - 1) % CELLS_PER_ROW;

  // Зигзагообразный порядок: чётные строки идут справа налево
  const col = row % 2 === 1 ? posInRow : CELLS_PER_ROW - 1 - posInRow;

  // Расчёт позиции (с учётом размера клетки и зазоров)
  const cellWidth = 44; // средний размер + отступ
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

// Получить клетки для строки в зигзагообразном порядке
function getRowCells(chakraLevel: number): number[] {
  const startCell = (chakraLevel - 1) * CELLS_PER_ROW + 1;
  const cells = Array.from({ length: CELLS_PER_ROW }, (_, i) => startCell + i);

  // Развернуть чётные строки для зигзага
  return chakraLevel % 2 === 0 ? cells.reverse() : cells;
}

// Генерировать SVG путь для стрелы/змеи
function getTransitionPath(from: number, to: number): string {
  // Упрощённый изогнутый путь - будет рассчитан на основе позиций клеток
  const fromRow = Math.ceil(from / CELLS_PER_ROW);
  const toRow = Math.ceil(to / CELLS_PER_ROW);
  const fromCol = (from - 1) % CELLS_PER_ROW;
  const toCol = (to - 1) % CELLS_PER_ROW;

  const x1 = fromCol * 44 + 22;
  const y1 = (8 - fromRow) * 44 + 22;
  const x2 = toCol * 44 + 22;
  const y2 = (8 - toRow) * 44 + 22;

  // Кривая Безье
  const cx = (x1 + x2) / 2;
  const cy = Math.min(y1, y2) - 50;

  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

// Управление масштабом
function zoomIn() {
  zoom.value = Math.min(zoom.value + 0.25, 2);
}

function zoomOut() {
  zoom.value = Math.max(zoom.value - 0.25, 0.5);
}

function resetZoom() {
  zoom.value = 1;
}

// Обработка сенсорных жестов для масштабирования пинчем
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

// Обработчики взаимодействия с клетками
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

// Прокрутить к текущей клетке при изменении позиции
watch(
  () => props.currentCell,
  (newCell) => {
    if (newCell > 0 && scrollArea.value) {
      // Логика прокрутки будет здесь
    }
  },
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

    // Фон для строк чакр
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

// Цвета фишек по чакрам
:deep(.q-chip) {
  @for $i from 1 through 8 {
    &.bg-chakra-#{$i} {
      background: var(--chakra-#{$i}) !important;
    }
  }
}
</style>
