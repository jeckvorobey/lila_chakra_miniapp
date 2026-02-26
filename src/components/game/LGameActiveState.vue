<template>
  <div class="column no-wrap justify-between overflow-hidden">
    <q-card flat bordered>
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium">
          {{ gameStore.currentGame?.query }}
        </div>

        <l-progress-bar :current-cell="gameStore.progressCell" />
      </q-card-section>
    </q-card>

    <q-card-section class="col q-px-none q-py-sm items-center justify-center">
      <l-game-board-section
        :current-cell="gameStore.displayCell"
      />
    </q-card-section>

    <l-game-actions-panel
      :current-cell="gameStore.currentCell"
      :current-cell-info="gameStore.currentCellInfo"
      :game-mode="gameStore.currentGame?.mode ?? 'free'"
      :current-chakra="currentChakra"
      :is-waiting-for-six="gameStore.isWaitingFor6"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from 'src/stores/game.store';
import { cellIdToChakraLevel } from 'src/utils/board-geometry';
import { LProgressBar } from 'src/components/base';
import LGameBoardSection from './LGameBoardSection.vue';
import LGameActionsPanel from './LGameActionsPanel.vue';

const gameStore = useGameStore();

const currentChakra = computed(() => cellIdToChakraLevel(gameStore.currentCell));
</script>

<style lang="scss" scoped>
.l-game-active__board {
  min-height: 0;
  overflow: hidden;
}
</style>
