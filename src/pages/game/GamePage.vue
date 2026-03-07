<template>
  <q-page class="column no-wrap full-height q-pa-sm">
    <l-page-skeleton
      v-if="isRestoringGame"
      variant="game-home"
    />

    <!-- Нет активной игры -->
    <l-game-empty-state v-else-if="showEmptyState" />

    <!-- Активная игра -->
    <l-game-active-state
      v-else
      class="col"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useGameStore } from 'src/stores/game.store';
import { LGameActiveState, LGameEmptyState } from 'src/components/game';
import LPageSkeleton from 'src/components/common/LPageSkeleton.vue';

const gameStore = useGameStore();
const isRestoringGame = ref(false);

const hasActiveGame = computed(() => gameStore.isGameActive);
const showEmptyState = computed(() => !isRestoringGame.value && !hasActiveGame.value);

onMounted(async () => {
  if (hasActiveGame.value) {
    return;
  }

  isRestoringGame.value = true;
  await gameStore.loadLatestActiveGame();
  isRestoringGame.value = false;
});
</script>

<style lang="scss" scoped>
.game-page {
  overflow: hidden;
  padding: 0 var(--layout-gap);
}
</style>
