<template>
  <div class="column no-wrap fit justify-evenly overflow-hidden">
    <q-card flat bordered class="bg-surface col-auto">
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-sm">
          {{ gameStore.currentGame?.query }}
        </div>

        <l-progress-bar :current-cell="gameStore.progressCell" />
      </q-card-section>
    </q-card>

    <l-game-board-section
      ref="boardSectionRef"
      class="l-game-active__board"
      :current-cell="gameStore.displayCell"
    />

    <l-game-actions-panel
      class="col-auto"
      :current-cell="gameStore.currentCell"
      :current-cell-info="gameStore.currentCellInfo"
      :game-mode="gameStore.currentGame?.mode ?? 'free'"
      :current-chakra="currentChakra"
      :is-waiting-for-six="gameStore.isWaitingFor6"
      @show-current-cell-info="showCurrentCellInfo"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useGameStore } from 'src/stores/game.store';
import { cellIdToChakraLevel } from 'src/utils/board-geometry';
import { LProgressBar } from 'src/components/base';
import LGameBoardSection from './LGameBoardSection.vue';
import LGameActionsPanel from './LGameActionsPanel.vue';

interface LGameBoardSectionExposed {
  openCurrentCellInfo: () => Promise<void>;
}

const gameStore = useGameStore();
const boardSectionRef = ref<LGameBoardSectionExposed | null>(null);

const currentChakra = computed(() => cellIdToChakraLevel(gameStore.currentCell));

function showCurrentCellInfo(): void {
  void boardSectionRef.value?.openCurrentCellInfo();
}
</script>

<style lang="scss" scoped>
.l-game-active__board {
  min-height: 0;
  overflow: hidden;
}
</style>
