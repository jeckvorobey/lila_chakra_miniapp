<template>
  <div class="l-board">
    <div class="l-board__shell">
      <div class="l-board__grid-wrap">
        <div
          ref="gridRef"
          class="l-board__grid"
        >
          <div
            v-for="chakraLevel in displayRows"
            :key="chakraLevel"
            class="l-board__row"
          >
            <l-cell
              v-for="cellId in getRowCells(chakraLevel)"
              :key="cellId"
              :cell-id="cellId"
              :is-current-position="cellId === currentCell"
              :has-player="cellId === currentCell"
              @click="onCellClick"
              @long-press="onCellLongPress"
            />
          </div>
        </div>

        <l-transition-overlay
          v-if="showTransitions && transition && gridRef"
          :key="`${transition.type}-${transition.startCellId}-${transition.endCellId}`"
          :type="transition.type"
          :start-cell-id="transition.startCellId"
          :end-cell-id="transition.endCellId"
          :grid-el="gridRef"
          @animation-end="emit('transition-end')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { CHAKRA_ROWS, CELLS_PER_ROW } from 'src/stores/game.store';
import { useReferenceStore } from 'src/stores/reference.store';
import LCell from './LCell.vue';
import LTransitionOverlay from './LTransitionOverlay.vue';

interface BoardTransition {
  type: 'arrow' | 'snake';
  startCellId: number;
  endCellId: number;
}

interface Props {
  currentCell: number;
  showTransitions?: boolean;
  interactive?: boolean;
  transition?: BoardTransition | null;
}

const props = withDefaults(defineProps<Props>(), {
  showTransitions: true,
  interactive: true,
  transition: null,
});

const emit = defineEmits<{
  (e: 'cell-click', cellId: number): void;
  (e: 'cell-long-press', cellId: number): void;
  (e: 'transition-end'): void;
}>();

const referenceStore = useReferenceStore();
const gridRef = ref<HTMLElement | null>(null);

const fallbackCellIds = Array.from(
  { length: CHAKRA_ROWS * CELLS_PER_ROW },
  (_, index) => index + 1,
);

const boardCellIds = computed(() => {
  if (referenceStore.boardCellIds.length === 0) {
    return fallbackCellIds;
  }

  return referenceStore.boardCellIds;
});

const displayRows = computed(() =>
  Array.from({ length: CHAKRA_ROWS }, (_, index) => CHAKRA_ROWS - index),
);

function getRowCells(chakraLevel: number): number[] {
  const startCell = (chakraLevel - 1) * CELLS_PER_ROW + 1;
  const endCell = startCell + CELLS_PER_ROW - 1;

  const rowCells = boardCellIds.value
    .filter((cellId) => cellId >= startCell && cellId <= endCell)
    .sort((a, b) => a - b);

  return chakraLevel % 2 === 0 ? rowCells.reverse() : rowCells;
}

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

onMounted(async () => {
  await referenceStore.fetchBoardCells();
});
</script>

<style lang="scss" scoped>
.l-board {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 0;

  &__shell {
    position: relative;
    aspect-ratio: 9 / 8;
    width: 100%;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    padding: 16px;
    border: 1px solid rgba(255, 255, 255, 0.28);
    border-radius: 16px;
    background: linear-gradient(180deg, #0f0d1a 0%, #1a1625 100%);

    .body--light & {
      border-color: rgba(0, 0, 0, 0.12);
      background: linear-gradient(180deg, #ffffff 0%, #f5f5f4 100%);
      box-shadow: var(--lila-shadow);
    }
  }

  &__grid-wrap {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    flex: 1 1 auto;
    min-height: 0;
  }

  &__grid {
    position: relative;
    z-index: 2;
    display: grid;
    flex: 1 1 auto;
    grid-template-rows: repeat(8, minmax(0, 1fr));
    grid-auto-rows: minmax(0, 1fr);
    width: 100%;
    height: 100%;
    min-height: 0;
    gap: 2px;
    align-content: stretch;
  }

  &__row {
    display: grid;
    grid-template-columns: repeat(9, minmax(0, 1fr));
    height: 100%;
    min-height: 0;
    gap: 2px;
  }

  &__indicator {
    display: flex;
    justify-content: center;
  }
}
</style>
