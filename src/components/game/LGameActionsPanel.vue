<template>
  <div class="game-actions full-width">
    <q-card flat bordered class="bg-surface">
      <q-card-section class="q-pa-md">
        <div class="row items-center q-mb-md">
          <q-avatar
            :class="['text-weight-bold q-mr-sm', currentCellAvatarBgClass]"
            size="40px"
            :text-color="currentCellAvatarTextColor"
          >
            {{ currentCell }}
          </q-avatar>
          <div class="col">
            <div class="text-subtitle2 text-weight-medium ellipsis">
              {{ currentCellTitle }}
            </div>
            <div class="text-caption text-secondary">
              {{ currentChakraLabel }}
            </div>
          </div>
          <q-btn
            flat
            round
            dense
            icon="mdi-information-outline"
            data-testid="current-cell-info-btn"
            @click="emit('show-current-cell-info')"
          />
        </div>

        <div v-if="isWaitingForSix" class="text-center q-mb-md">
          <q-icon name="mdi-dice-6" size="24px" color="warning" class="q-mr-sm" />
          <span class="text-body2 text-secondary">{{ t('dice.waiting_for_6') }}</span>
        </div>

        <div class="row justify-center q-gutter-sm">
          <q-btn
            :label="t('dice.roll')"
            color="primary"
            size="lg"
            unelevated
            icon="mdi-dice-multiple"
            class="q-px-xl"
            :disable="gameStore.isChipAnimating"
            data-testid="open-dice-modal-btn"
            @click="showDiceModal = true"
          />
        </div>

        <div class="row justify-center q-mt-md">
          <q-btn
            :label="t('game.end_game')"
            color="negative"
            flat
            size="sm"
            :loading="isEndingGame"
            data-testid="end-game-btn"
            @click="confirmEndGame"
          />
        </div>
      </q-card-section>
    </q-card>

    <l-dice-roll-modal v-model="showDiceModal" @roll-finished="onRollFinished" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { getChakraAvatarTextColor } from 'src/data/chakra-colors';
import type { CellBrief, MoveResponse } from 'src/types/game.interface';
import { useGameStore } from 'src/stores/game.store';
import LDiceRollModal from './LDiceRollModal.vue';

interface Props {
  currentCell: number;
  currentCellInfo: CellBrief | null;
  currentChakra: number;
  isWaitingForSix: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'show-current-cell-info'): void;
}>();

const { t } = useI18n();
const router = useRouter();
const $q = useQuasar();
const gameStore = useGameStore();

const showDiceModal = ref(false);
const isEndingGame = ref(false);
const isDarkMode = computed(() => $q.dark?.isActive ?? true);

const currentCellAvatarBgClass = computed(() =>
  props.currentChakra > 0 ? `bg-chakra-${props.currentChakra}` : 'bg-grey-6',
);
const currentCellAvatarTextColor = computed(() =>
  getChakraAvatarTextColor(props.currentChakra, isDarkMode.value),
);
const currentCellTitle = computed(() => props.currentCellInfo?.name_ru || t('game.outside_board'));
const currentChakraLabel = computed(() =>
  props.currentChakra > 0 ? t(`chakra.${props.currentChakra}`) : 'chakra.0',
);

/**
 * Обработка завершения броска: анимация → уведомление → победа
 */
async function onRollFinished(result: MoveResponse): Promise<void> {
  if (!result.move) {
    return;
  }

  await gameStore.startChipAnimation();
  notifyTransition(result);

  if (result.is_victory) {
    showVictoryDialog();
  }
}

function notifyTransition(result: MoveResponse): void {
  if (!result.move) {
    return;
  }

  if (result.move.transition_type === 'arrow') {
    $q.notify({
      type: 'positive',
      message: t('game.arrow_notify', { cell: result.move.final_cell }),
      icon: 'mdi-arrow-up-bold',
    });
  } else if (result.move.transition_type === 'snake') {
    $q.notify({
      type: 'negative',
      message: t('game.snake_notify', { cell: result.move.final_cell }),
      icon: 'mdi-snake',
    });
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

<style lang="scss" scoped>
.game-actions {
  margin-top: auto;
  position: sticky;
  bottom: var(--lila-layout-gap);
  z-index: 10;
  width: 100%;
}
</style>
