<template>
  <l-cell-info
    :current-cell="currentCell"
    :current-cell-info="currentCellInfo"
    :current-chakra="currentChakra"
    :is-waiting-for-six="isWaitingForSix"
    :is-chip-animating="gameStore.isChipAnimating"
    :is-ending-game="isEndingGame"
    @show-current-cell-info="emit('show-current-cell-info')"
    @roll-finished="onRollFinished"
    @confirm-end-game="confirmEndGame"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import type { CellBrief, MoveResponse } from 'src/types/game.interface';
import { useGameStore } from 'src/stores/game.store';
import LCellInfo from './LCellInfo.vue';

interface Props {
  currentCell: number;
  currentCellInfo: CellBrief | null;
  currentChakra: number;
  isWaitingForSix: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'show-current-cell-info'): void;
}>();

const { t } = useI18n();
const router = useRouter();
const $q = useQuasar();
const gameStore = useGameStore();

const isEndingGame = ref(false);

/**
 * Обработка завершения броска: анимация → уведомление → победа
 */
async function onRollFinished(result: MoveResponse): Promise<void> {
  if (!result.move) {
    return;
  }

  await gameStore.startChipAnimation();
  emit('show-current-cell-info');

  if (result.is_victory) {
    showVictoryDialog();
  }
}



function showVictoryDialog(): void {
  $q.dialog({
    title: t('victory.title'),
    message: t('victory.message'),
    ok: t('victory.meditation'),
  }).onOk(() => {
    void router.push('/game/meditation/exit');
  });
}

async function endGame(): Promise<void> {
  if (isEndingGame.value) {
    return;
  }

  isEndingGame.value = true;

  try {
    const success = await gameStore.endGame();
    if (!success) {
      $q.notify({
        type: 'negative',
        message: gameStore.error || t('error.generic'),
      });
      return;
    }

    await router.push('/game/meditation/exit');
  } finally {
    isEndingGame.value = false;
  }
}

function confirmEndGame(): void {
  $q.dialog({
    title: t('game.end_confirm_title'),
    message: t('game.end_confirm_message'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void endGame();
  });
}
</script>
