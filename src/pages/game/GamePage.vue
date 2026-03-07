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
import { useRouter } from 'vue-router';
import { useGameStore } from 'src/stores/game.store';
import { LGameActiveState, LGameEmptyState } from 'src/components/game';
import LPageSkeleton from 'src/components/common/LPageSkeleton.vue';

/**
 * Страница игры восстанавливает последнюю активную сессию
 * и перенаправляет на входную медитацию, если она ещё не завершена.
 */
const gameStore = useGameStore();
const router = useRouter();
const isRestoringGame = ref(false);

const hasActiveGame = computed(() => gameStore.isGameActive);
const showEmptyState = computed(() => !isRestoringGame.value && !hasActiveGame.value);

async function redirectToEntryMeditationIfNeeded(): Promise<boolean> {
  if (!gameStore.needsEntryMeditation) {
    return false;
  }

  await router.replace('/game/meditation/entry');
  return true;
}

onMounted(async () => {
  if (hasActiveGame.value) {
    await redirectToEntryMeditationIfNeeded();
    return;
  }

  isRestoringGame.value = true;
  await gameStore.loadLatestActiveGame();
  isRestoringGame.value = false;

  await redirectToEntryMeditationIfNeeded();
});
</script>

<style lang="scss" scoped>
.game-page {
  overflow: hidden;
  padding: 0 var(--layout-gap);
}
</style>
