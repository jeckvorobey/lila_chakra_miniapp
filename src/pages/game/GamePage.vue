<template>
  <q-page class="game-page">
    <!-- No active game state -->
    <div v-if="!hasActiveGame" class="game-page__empty column items-center justify-center">
      <q-icon name="mdi-gamepad-variant" size="64px" color="primary" class="q-mb-md" />
      <div class="text-h5 text-weight-medium q-mb-sm">{{ $t('game.title') }}</div>
      <p class="text-body2 text-secondary text-center q-mb-lg" style="max-width: 280px">
        {{ $t('onboarding.welcome_desc') }}
      </p>
      <q-btn
        :label="$t('game.new_game')"
        color="primary"
        size="lg"
        unelevated
        icon="mdi-play"
        class="q-px-xl"
        @click="startNewGame"
      />
    </div>

    <!-- Active game -->
    <template v-else>
      <!-- Game info header -->
      <div class="game-page__info">
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

        <!-- Progress bar -->
        <l-progress-bar
          :current-cell="gameStore.currentCell"
          :show-chakra-indicator="true"
          class="q-mt-sm"
        />
      </div>

      <!-- Game board -->
      <div class="game-page__board">
        <l-board
          :current-cell="gameStore.currentCell"
          :show-transitions="true"
          @cell-click="onCellClick"
          @cell-long-press="onCellLongPress"
        />
      </div>

      <!-- Action panel (bottom sheet style) -->
      <div class="game-page__actions">
        <q-card class="game-page__action-card" flat>
          <q-card-section class="q-pa-md">
            <!-- Current cell info (compact) -->
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
      :cell-name="selectedCell.name_ru"
      :chakra-level="selectedCell.chakra_level"
      :chakra-name="selectedCell.chakra_name"
      :description="selectedCell.description_ru"
      :affirmation="selectedCell.affirmation_ru"
      :question="selectedCell.question_ru"
      @write-insight="openInsightModal"
    />

    <!-- Dice modal -->
    <l-modal v-model="showDiceModal" :title="$t('dice.roll')" position="bottom">
      <div class="column items-center q-pa-md">
        <!-- Mode toggle -->
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

        <!-- Auto dice -->
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

        <!-- Manual dice -->
        <template v-else>
          <l-dice-manual v-model="manualDiceValue" @confirm="performManualMove" />
        </template>

        <!-- Roll history (for 6s chain) -->
        <div v-if="gameStore.currentDiceRolls.length > 1" class="q-mt-md text-center">
          <div class="text-caption text-secondary">
            {{ gameStore.currentDiceRolls.join(' + ') }} =
            <strong>{{ gameStore.currentDiceRolls.reduce((a, b) => a + b, 0) }}</strong>
          </div>
        </div>
      </div>
    </l-modal>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useGameStore } from 'src/stores/game.store';
import { useSettingsStore } from 'src/stores/settings.store';
import { LProgressBar } from 'src/components/base';
import { LBoard, LCellCard, LDice, LDiceManual } from 'src/components/game';
import LModal from 'src/components/base/LModal.vue';

const $q = useQuasar();
const router = useRouter();
const gameStore = useGameStore();
const settingsStore = useSettingsStore();

// UI state
const showCellModal = ref(false);
const showDiceModal = ref(false);
const diceMode = ref<'auto' | 'manual'>('auto');
const manualDiceValue = ref<number>(1);
const lastDiceResult = ref<number | null>(null);

interface CellInfo {
  id: number;
  name_ru: string;
  chakra_level: number;
  chakra_name: string;
  description_ru: string;
  affirmation_ru: string;
  question_ru?: string;
}

const selectedCell = ref<CellInfo | null>(null);

// Computed
const hasActiveGame = computed(() => gameStore.isGameActive);
const currentChakra = computed(() => {
  if (gameStore.currentCell <= 0) return 0;
  return Math.ceil(gameStore.currentCell / 9);
});

// Methods
function startNewGame() {
  void router.push('/game/new');
}

function rollDice() {
  showDiceModal.value = true;
}

async function performRoll() {
  const result = await gameStore.rollDice();
  if (result) {
    lastDiceResult.value = result.move.dice_rolls[result.move.dice_rolls.length - 1] ?? null;
    settingsStore.vibrate([30, 20, 50]);

    // Check for special events
    if (result.move.is_triple_six) {
      $q.notify({
        type: 'warning',
        message: '666 - Сгорание!',
        icon: 'mdi-fire',
      });
    }

    if (result.move.transition_type === 'ARROW') {
      $q.notify({
        type: 'positive',
        message: `Стрела! Подъём на клетку ${result.move.final_cell}`,
        icon: 'mdi-arrow-up-bold',
      });
    } else if (result.move.transition_type === 'SNAKE') {
      $q.notify({
        type: 'negative',
        message: `Змея! Спуск на клетку ${result.move.final_cell}`,
        icon: 'mdi-snake',
      });
    }

    if (result.game_completed) {
      showVictory();
    }
  }
}

async function performManualMove(value: number) {
  const result = await gameStore.manualMove(value);
  if (result) {
    showDiceModal.value = false;
    // Same notifications as performRoll
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
    selectedCell.value = cellInfo as CellInfo;
    showCellModal.value = true;
  }
}

function showCellInfo() {
  if (gameStore.currentCellInfo) {
    selectedCell.value = gameStore.currentCellInfo as CellInfo;
    showCellModal.value = true;
  }
}

function openInsightModal() {
  // Open insight writing modal
  showCellModal.value = false;
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

onMounted(() => {
  // Load cells data for board
  void gameStore.fetchAllCells();
});
</script>

<style lang="scss" scoped>
.game-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding-bottom: 64px; // Bottom nav height

  &__empty {
    flex: 1;
    padding: var(--space-xl);
  }

  &__info {
    padding: var(--space-md);
    background: var(--lila-glass-bg);
    backdrop-filter: var(--lila-glass-blur);
  }

  &__board {
    flex: 1;
    overflow: hidden;
    padding: var(--space-sm);
  }

  &__actions {
    position: sticky;
    bottom: 64px; // Above bottom nav
    z-index: 10;
  }

  &__action-card {
    background: var(--lila-glass-bg);
    backdrop-filter: var(--lila-glass-blur);
    border-top: 1px solid var(--lila-border);
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  }
}
</style>
