<template>
  <div class="l-game-board-section">
    <l-board
      :current-cell="currentCell"
      :transition="gameStore.activeTransition"
      :show-transitions="true"
      @cell-click="onCellClick"
      @cell-long-press="onCellLongPress"
      @transition-end="onTransitionEnd"
    />

    <l-cell-card
      v-if="selectedCell"
      v-model="showCellModal"
      :cell="selectedCell"
      @write-insight="openInsightModal"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import type { Cell } from 'src/types/game.interface';
import { useGameStore } from 'src/stores/game.store';
import LBoard from './LBoard.vue';
import LCellCard from './LCellCard.vue';

interface Props {
  currentCell: number;
}

const props = defineProps<Props>();

const { t } = useI18n();
const $q = useQuasar();
const gameStore = useGameStore();

const selectedCell = ref<Cell | null>(null);
const showCellModal = ref(false);
const activeRequestId = ref(0);

const lastMoveId = computed(() => {
  const lastMove = gameStore.moves[gameStore.moves.length - 1];
  return lastMove?.id ?? null;
});

function buildCurrentCellModalData(baseCell: Cell): Cell {
  const context = gameStore.currentCellInfo;
  if (!context || context.id !== baseCell.id) {
    return baseCell;
  }

  return {
    ...baseCell,
    description: context.description ?? baseCell.description,
    description_revisit: context.description_revisit ?? baseCell.description_revisit ?? null,
    reflection_questions:
      gameStore.currentGame?.mode === 'free' ? (context.reflection_questions ?? null) : null,
  };
}

async function showCellInfoById(
  cellId: number,
  source: 'board' | 'current-cell' = 'board',
): Promise<void> {
  const requestId = activeRequestId.value + 1;
  activeRequestId.value = requestId;

  const cellInfo = await gameStore.getCellInfo(cellId, true);

  if (requestId !== activeRequestId.value) {
    return;
  }

  if (!cellInfo) {
    $q.notify({
      type: 'negative',
      message: gameStore.error || t('game.cell_info_load_error'),
    });
    return;
  }

  selectedCell.value = source === 'current-cell' ? buildCurrentCellModalData(cellInfo) : cellInfo;
  showCellModal.value = true;
}

function onCellClick(cellId: number): void {
  void showCellInfoById(cellId);
}

function onCellLongPress(cellId: number): void {
  void showCellInfoById(cellId);
}

function onTransitionEnd(): void {
  gameStore.onTransitionAnimationEnd();
}

function openInsightModal(): void {
  showCellModal.value = false;

  if (!lastMoveId.value) {
    return;
  }

  $q.dialog({
    title: t('actions.write_insight'),
    message: t('cell.question'),
    prompt: {
      model: '',
      type: 'textarea',
      isValid: (val: string) => val.trim().length >= 3,
      autogrow: true,
    },
    persistent: true,
    ok: t('actions.save'),
    cancel: t('actions.cancel'),
  }).onOk((insight: string) => {
    void gameStore.saveInsight(lastMoveId.value as number, insight.trim());
  });
}

defineExpose({
  openCellInfoById: showCellInfoById,
  openCurrentCellInfo: async () => {
    if (!props.currentCell) {
      return;
    }

    await showCellInfoById(props.currentCell, 'current-cell');
  },
});
</script>

<style lang="scss" scoped>
.l-game-board-section {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
