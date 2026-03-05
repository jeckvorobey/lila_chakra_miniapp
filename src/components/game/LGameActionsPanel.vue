<template>
  <div class="full-width">
    <q-card
      flat
      bordered
      class="bg-surface"
    >
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
            <div
              v-if="currentChakraLabel"
              class="text-caption text-secondary"
            >
              {{ currentChakraLabel }}
            </div>
          </div>
          <q-btn
            flat
            round
            dense
            icon="mdi-information-outline"
            data-testid="current-cell-info-btn"
            @click="showCellInfoModal = true"
          />
        </div>

        <div
          v-if="isWaitingForSix"
          class="text-center q-mb-md"
        >
          <q-icon
            name="mdi-dice-6"
            size="24px"
            color="warning"
            class="q-mr-sm"
          />
          <span class="text-body2 text-secondary">{{ t('dice.waiting_for_6') }}</span>
        </div>

        <div
          v-if="currentCell !== 68"
          class="row justify-center q-gutter-sm"
        >
          <q-btn
            :label="t('dice.roll')"
            color="primary"
            :size="$q.screen.lt.sm ? 'md' : 'lg'"
            unelevated
            icon="mdi-dice-multiple"
            class="q-px-xl"
            :disable="gameStore.isChipAnimating"
            data-testid="open-dice-modal-btn"
            @click="showDiceModal = true"
          />
        </div>

        <div
          v-if="currentCell !== 68"
          class="row justify-center q-mt-md"
        >
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

    <l-dice-roll-modal
      v-model="showDiceModal"
      @roll-finished="onRollFinished"
    />

    <l-cell-info
      v-model="showCellInfoModal"
      :current-cell-id="currentCell"
      :current-cell-info="currentCellInfo"
      :game-mode="gameMode"
      @write-insight="openInsightModal"
      @go-next="goToExitMeditation"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { getChakraAvatarTextColor } from 'src/data/chakra-colors';
import type { CellBrief, Cell, GameMode, MoveResponse } from 'src/types/game.interface';
import { useGameStore } from 'src/stores/game.store';
import LCellInfo from './LCellInfo.vue';
import LDiceRollModal from './LDiceRollModal.vue';

interface Props {
  currentCell: number;
  currentCellInfo: CellBrief | Cell | null;
  gameMode: GameMode;
  currentChakra: number;
  isWaitingForSix: boolean;
}

const props = defineProps<Props>();

const { t } = useI18n();
const router = useRouter();
const $q = useQuasar();
const gameStore = useGameStore();

const showDiceModal = ref(false);
const showCellInfoModal = ref(false);
const isEndingGame = ref(false);

const isDarkMode = computed(() => $q.dark?.isActive ?? true);

const currentCellAvatarBgClass = computed(() =>
  props.currentChakra > 0 ? `bg-chakra-${props.currentChakra}` : 'bg-grey-6',
);
const currentCellAvatarTextColor = computed(() =>
  getChakraAvatarTextColor(props.currentChakra, isDarkMode.value),
);
const currentCellTitle = computed(() => {
  if (props.currentCell === 0) return t('game.outside_board');
  if (!props.currentCellInfo) return '';
  return 'name_ru' in props.currentCellInfo
    ? props.currentCellInfo.name_ru
    : props.currentCellInfo.name;
});
const currentChakraLabel = computed(() => {
  if (props.currentCell === 0 || props.currentChakra <= 0) return '';
  return t(`chakra.${props.currentChakra}`);
});

watchEffect(() => {
  if (props.currentCell === 68) {
    showCellInfoModal.value = true;
  }
});

/**
 * Обработка завершения броска: анимация → уведомление → победа
 */
async function onRollFinished(result: MoveResponse): Promise<void> {
  if (!result.move) {
    return;
  }

  // Если фишка переместилась - запускаем анимацию и открываем инфо
  if (result.move.final_cell !== result.move.start_cell) {
    await gameStore.startChipAnimation();
    showCellInfoModal.value = true;
  }
}

const lastMoveId = computed(() => {
  const lastMove = gameStore.moves[gameStore.moves.length - 1];
  return lastMove?.id ?? null;
});

function openInsightModal(): void {
  if (!lastMoveId.value) {
    return;
  }

  const lastMove = gameStore.moves[gameStore.moves.length - 1];
  const currentInsight = lastMove?.player_insight ?? '';

  $q.dialog({
    title: t('actions.write_insight'),
    message: t('cell.question'),
    prompt: {
      model: currentInsight,
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

async function goToExitMeditation(): Promise<void> {
  await gameStore.endGame();
  void router.push('/game/meditation/exit');
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
