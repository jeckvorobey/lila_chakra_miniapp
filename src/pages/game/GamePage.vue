<template>
  <q-page class="column" style="padding-bottom: 64px">
    <!-- No active game state -->
    <l-game-empty-state v-if="!hasActiveGame" />

    <!-- Active game -->
    <template v-else>
      <!-- Game info header -->
      <div class="q-pa-md bg-glass">
        <div class="row items-center q-gutter-sm">
          <q-chip
            :color="currentChakra > 0 ? undefined : 'grey'"
            :style="currentChakra > 0 ? { background: `var(--chakra-${currentChakra})` } : {}"
            text-color="white"
            icon="mdi-map-marker"
          >
            {{ gameStore.currentCell > 0 ? gameStore.currentCell : $t('game.outside_board') }}
          </q-chip>
          <q-chip outline color="primary">
            {{ $t('game.move_count') }} #{{ gameStore.totalMoves }}
          </q-chip>
        </div>

        <l-progress-bar
          :current-cell="gameStore.currentCell"
          :show-chakra-indicator="true"
          class="q-mt-sm"
        />
      </div>

      <!-- Game board -->
      <div class="col scroll q-pa-sm">
        <l-board
          :current-cell="gameStore.currentCell"
          :show-transitions="true"
          @cell-click="onCellClick"
          @cell-long-press="onCellLongPress"
        />
      </div>

      <!-- Action panel -->
      <div class="game-actions">
        <q-card flat class="bg-glass rounded-borders-top">
          <q-card-section class="q-pa-md">
            <!-- Current cell info -->
            <div v-if="gameStore.currentCellInfo" class="row items-center q-mb-md">
              <q-avatar
                :style="{ background: `var(--chakra-${currentChakra})` }"
                size="40px"
                text-color="white"
                class="text-weight-bold q-mr-sm"
              >
                {{ gameStore.currentCell }}
              </q-avatar>
              <div class="col">
                <div class="text-subtitle2 text-weight-medium ellipsis">
                  {{ gameStore.currentCellInfo.name_ru }}
                </div>
                <div class="text-caption text-secondary">
                  {{ $t(`chakra.${currentChakra}`) }}
                </div>
              </div>
              <q-btn flat round dense icon="mdi-information-outline" @click="showCellInfo" />
            </div>

            <!-- Waiting for 6 message -->
            <div v-if="gameStore.isWaitingFor6" class="text-center q-mb-md">
              <q-icon name="mdi-dice-6" size="24px" color="warning" class="q-mr-sm" />
              <span class="text-body2 text-secondary">{{ $t('dice.waiting_for_6') }}</span>
            </div>

            <!-- Dice button -->
            <div class="row justify-center q-gutter-sm">
              <q-btn
                :label="$t('dice.roll')"
                color="primary"
                size="lg"
                unelevated
                icon="mdi-dice-multiple"
                :loading="gameStore.isRolling"
                class="q-px-xl"
                @click="rollDice"
              />
            </div>

            <!-- End game button -->
            <div class="row justify-center q-mt-md">
              <q-btn
                :label="$t('game.end_game')"
                color="negative"
                flat
                size="sm"
                @click="confirmEndGame"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </template>

    <!-- Cell info modal -->
    <l-cell-card
      v-if="selectedCell"
      v-model="showCellModal"
      :cell-id="selectedCell.id"
      :cell-name="selectedCell.name"
      :chakra-level="selectedCell.chakra_level"
      :chakra-name="selectedCell.chakra_name"
      :description="selectedCell.description"
      :affirmation="selectedCell.affirmation"
      :question="selectedCell.question ?? ''"
      @write-insight="openInsightModal"
    />

    <!-- Dice modal -->
    <l-modal v-model="showDiceModal" :title="$t('dice.roll')" position="bottom">
      <div class="column items-center q-pa-md">
        <q-btn-toggle
          v-model="diceMode"
          :options="[
            { label: $t('dice.auto'), value: 'auto' },
            { label: $t('dice.manual'), value: 'manual' },
          ]"
          class="q-mb-lg"
          toggle-color="primary"
          rounded
          unelevated
        />

        <template v-if="diceMode === 'auto'">
          <l-dice
            :result="lastDiceResult"
            :is-rolling="gameStore.isRolling"
            :size="120"
            @roll-complete="onDiceComplete"
          />
          <q-btn
            :label="$t('dice.roll')"
            color="primary"
            size="lg"
            unelevated
            :loading="gameStore.isRolling"
            class="q-mt-lg q-px-xl"
            @click="performRoll"
          />
        </template>

        <template v-else>
          <l-dice-manual v-model="manualDiceValue" @confirm="performManualMove" />
        </template>

        <div v-if="gameStore.currentDiceRolls.length > 1" class="q-mt-md text-center">
          <div class="text-caption text-secondary">
            {{ gameStore.currentDiceRolls.join(' + ') }} =
            <strong>{{
              gameStore.currentDiceRolls.reduce((a: number, b: number) => a + b, 0)
            }}</strong>
          </div>
        </div>
      </div>
    </l-modal>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useGameStore } from 'src/stores/game.store';
import { useSettingsStore } from 'src/stores/settings.store';
import { LProgressBar } from 'src/components/base';
import { LBoard, LCellCard, LDice, LDiceManual, LGameEmptyState } from 'src/components/game';
import LModal from 'src/components/base/LModal.vue';

const $q = useQuasar();
const { t } = useI18n();
const router = useRouter();
const gameStore = useGameStore();
const settingsStore = useSettingsStore();

const showCellModal = ref(false);
const showDiceModal = ref(false);
const diceMode = ref<'auto' | 'manual'>('auto');
const manualDiceValue = ref<number>(1);
const lastDiceResult = ref<number | null>(null);

interface CellInfo {
  id: number;
  name: string;
  chakra_level: number;
  chakra_name: string;
  description: string;
  affirmation: string;
  question?: string | null;
}

const selectedCell = ref<CellInfo | null>(null);

const hasActiveGame = computed(() => gameStore.isGameActive);
const currentChakra = computed(() => {
  if (gameStore.currentCell <= 0) return 0;
  return Math.ceil(gameStore.currentCell / 9);
});

const lastMoveId = computed(() => {
  const lastMove = gameStore.moves[gameStore.moves.length - 1];
  return lastMove?.id ?? null;
});

function rollDice() {
  showDiceModal.value = true;
}

async function performRoll() {
  const result = await gameStore.rollDice();
  if (result) {
    lastDiceResult.value = result.move.dice_rolls[result.move.dice_rolls.length - 1] ?? null;
    settingsStore.vibrate([30, 20, 50]);

    if (result.move.is_triple_six) {
      $q.notify({ type: 'warning', message: '666 - Сгорание!', icon: 'mdi-fire' });
    }

    if (result.move.transition_type === 'arrow') {
      $q.notify({
        type: 'positive',
        message: `Стрела! Подъём на клетку ${result.move.final_cell}`,
        icon: 'mdi-arrow-up-bold',
      });
    } else if (result.move.transition_type === 'snake') {
      $q.notify({
        type: 'negative',
        message: `Змея! Спуск на клетку ${result.move.final_cell}`,
        icon: 'mdi-snake',
      });
    }

    if (result.is_victory) {
      showVictory();
    }
  }
}

async function performManualMove(value: number) {
  const result = await gameStore.manualMove(value);
  if (result) {
    showDiceModal.value = false;

    if (result.move.transition_type === 'arrow') {
      $q.notify({
        type: 'positive',
        message: `Стрела! Подъём на клетку ${result.move.final_cell}`,
        icon: 'mdi-arrow-up-bold',
      });
    } else if (result.move.transition_type === 'snake') {
      $q.notify({
        type: 'negative',
        message: `Змея! Спуск на клетку ${result.move.final_cell}`,
        icon: 'mdi-snake',
      });
    }

    if (result.is_victory) {
      showVictory();
    }
  }
}

function onDiceComplete(result: number) {
  console.log('Dice result:', result);
}

function onCellClick(cellId: number) {
  void showCellInfoById(cellId);
}

function onCellLongPress(cellId: number) {
  void showCellInfoById(cellId);
}

async function showCellInfoById(cellId: number) {
  const cellInfo = await gameStore.getCellInfo(cellId);
  if (cellInfo) {
    selectedCell.value = {
      id: cellInfo.id,
      name: cellInfo.name,
      chakra_level: cellInfo.chakra_level,
      chakra_name: t(`chakra.${cellInfo.chakra_level}`),
      description: cellInfo.description,
      affirmation: cellInfo.affirmation,
      question: cellInfo.question ?? null,
    };
    showCellModal.value = true;
  }
}

async function showCellInfo() {
  if (gameStore.currentCell) {
    await showCellInfoById(gameStore.currentCell);
  }
}

function openInsightModal() {
  showCellModal.value = false;
  if (!lastMoveId.value) return;

  $q.dialog({
    title: t('actions.write_insight'),
    message: t('cell.question'),
    prompt: {
      model: '',
      type: 'textarea',
      isValid: (val) => val.trim().length >= 3,
      autogrow: true,
    },
    persistent: true,
    ok: t('actions.save'),
    cancel: t('actions.cancel'),
  }).onOk((insight: string) => {
    void gameStore.saveInsight(lastMoveId.value as number, insight.trim());
  });
}

function confirmEndGame() {
  $q.dialog({
    title: 'Завершить игру?',
    message: 'Вы уверены, что хотите завершить текущую игру?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void gameStore.endGame().then(() => {
      void router.push('/game/meditation/exit');
    });
  });
}

function showVictory() {
  $q.dialog({
    title: '🎉 Просветление!',
    message: 'Поздравляем! Вы достигли клетки 68 - Космическое Сознание!',
    ok: 'Выходная медитация',
  }).onOk(() => {
    void router.push('/game/meditation/exit');
  });
}

</script>

<style lang="scss" scoped>
.game-actions {
  position: sticky;
  bottom: 64px;
  z-index: 10;
}

.rounded-borders-top {
  border-radius: 24px 24px 0 0;
  border-top: 1px solid var(--lila-border);
}
</style>
