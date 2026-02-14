<template>
  <div class="column no-wrap">
    <q-card flat bordered class="bg-surface">
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-sm">
          {{ gameStore.currentGame?.query }}
        </div>

        <l-progress-bar :current-cell="gameStore.currentCell" />
      </q-card-section>
    </q-card>

    <div>
      <l-game-board-section ref="boardSectionRef" :current-cell="gameStore.displayCell" />
    </div>

    <div>
      <l-game-actions-panel :current-cell="gameStore.currentCell" :current-cell-info="gameStore.currentCellInfo"
        :current-chakra="currentChakra" :is-waiting-for-six="gameStore.isWaitingFor6"
        @show-current-cell-info="showCurrentCellInfo" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useGameStore } from 'src/stores/game.store';
import { LProgressBar } from 'src/components/base';
import LGameBoardSection from './LGameBoardSection.vue';
import LGameActionsPanel from './LGameActionsPanel.vue';

interface LGameBoardSectionExposed {
  openCurrentCellInfo: () => Promise<void>;
}

const gameStore = useGameStore();
const boardSectionRef = ref<LGameBoardSectionExposed | null>(null);

const currentChakra = computed(() => {
  if (gameStore.currentCell <= 0) return 0;
  return Math.ceil(gameStore.currentCell / 9);
});

function showCurrentCellInfo(): void {
  void boardSectionRef.value?.openCurrentCellInfo();
}
</script>

<style lang="scss" scoped></style>
