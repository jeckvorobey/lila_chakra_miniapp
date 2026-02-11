<template>
  <div class="l-board">
    <div class="l-board__shell">
      <div class="l-board__grid-wrap">
        <div class="l-board__grid">
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

      </div>
    </div>

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
import { computed, onMounted } from 'vue';
import { CHAKRA_ROWS, CELLS_PER_ROW } from 'src/stores/game.store';
import { useReferenceStore } from 'src/stores/reference.store';
import LCell from './LCell.vue';

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

const referenceStore = useReferenceStore();

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

const currentChakra = computed(() => {
  if (props.currentCell <= 0) return 0;
  return Math.ceil(props.currentCell / CELLS_PER_ROW);
});

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
  await referenceStore.fetchBoardCellIds();
});
</script>

<style lang="scss" scoped>
.l-board {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  flex: 1 1 auto;
  gap: 12px;

  &__shell {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 0;
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    padding: 16px;
    border: 1px solid #ffffff1a;
    border-radius: 16px;
    background: linear-gradient(180deg, #0f0d1a 0%, #1a1625 100%);
  }

  &__grid-wrap {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 0;
    flex: 1 1 auto;
  }

  &__grid {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-rows: repeat(8, minmax(0, 1fr));
    width: 100%;
    height: 100%;
    min-height: 0;
    gap: 2px;
  }

  &__row {
    display: grid;
    grid-template-columns: repeat(9, minmax(0, 1fr));
    gap: 2px;
  }

  &__indicator {
    display: flex;
    justify-content: center;
  }
}
</style>
