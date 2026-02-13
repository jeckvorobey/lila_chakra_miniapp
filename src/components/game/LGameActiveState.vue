<template>
  <div class="l-game-active-state column no-wrap full-width full-height col">
    <div class="q-pa-md bg-glass">
      <div class="row items-center q-gutter-sm">
        <q-chip
          :color="currentChakra > 0 ? undefined : 'grey'"
          :class="currentChakra > 0 ? `bg-chakra-${currentChakra}` : undefined"
          text-color="white"
          icon="mdi-map-marker"
        >
          {{ gameStore.currentCell > 0 ? gameStore.currentCell : t('game.outside_board') }}
        </q-chip>
        <q-chip outline color="primary"> {{ t('game.move_count') }} #{{ gameStore.totalMoves }} </q-chip>
      </div>

      <l-progress-bar
        :current-cell="gameStore.currentCell"
        class="q-mt-sm"
      />
    </div>

    <l-game-board-section ref="boardSectionRef" class="col" :current-cell="gameStore.displayCell" />

    <l-game-actions-panel
      :current-cell="gameStore.currentCell"
      :current-cell-info="gameStore.currentCellInfo"
      :current-chakra="currentChakra"
      :is-waiting-for-six="gameStore.isWaitingFor6"
      @show-current-cell-info="showCurrentCellInfo"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useGameStore } from 'src/stores/game.store';
import { LProgressBar } from 'src/components/base';
import LGameBoardSection from './LGameBoardSection.vue';
import LGameActionsPanel from './LGameActionsPanel.vue';

interface LGameBoardSectionExposed {
  openCurrentCellInfo: () => Promise<void>;
}

const { t } = useI18n();
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

<style lang="scss" scoped>
.l-game-active-state {
  min-height: 0;
}
</style>
