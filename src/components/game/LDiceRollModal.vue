<template>
  <l-modal
    v-model="isOpen"
    position="bottom"
    data-testid="dice-roll-modal"
  >
    <div class="column items-center justify-between l-dice-modal__content">
      <template v-if="showDiceVisual">
        <div class="col column items-center justify-center">
          <l-dice
            :result="lastDiceResult"
            :is-rolling="isRollingVisual"
            :size="120"
            @roll-complete="onRollComplete"
          />
        </div>

        <q-btn
          v-if="diceMode === 'auto'"
          :label="pendingAutoRolls.length > 0 ? t('dice.roll_again') : t('dice.roll')"
          color="primary"
          size="lg"
          unelevated
          :loading="isSubmitting"
          class="q-mt-md full-width"
          data-testid="dice-auto-roll-btn"
          @click="performAutoRoll"
        />
      </template>

      <template v-else>
        <l-dice-manual
          v-model="manualDiceValue"
          :pending-rolls="pendingManualRolls"
          :pending-message="pendingMessage"
          @confirm="performManualRoll"
          @six-selected="handleManualSixSelected"
        />
      </template>

      <div
        v-if="diceMode === 'auto' && pendingMessage"
        class="q-mt-md text-warning text-center text-body2"
      >
        {{ pendingMessage }}
      </div>

      <div
        v-if="displayRolls.length > 1"
        class="q-mt-md text-center"
      >
        <div class="text-caption text-secondary">
          {{ displayRolls.join(' + ') }} =
          <strong>{{ displayRolls.reduce((a: number, b: number) => a + b, 0) }}</strong>
        </div>
      </div>

      <div class="q-mt-md text-center text-caption text-secondary">
        {{ t('dice.change_mode_prefix')
        }}<router-link
          to="/profile"
          class="text-primary"
          style="text-decoration: underline"
          >{{ t('dice.change_mode_link') }}</router-link
        >
      </div>
    </div>
  </l-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import type { MoveResponse } from 'src/types/game.interface';
import LModal from 'src/components/base/LModal.vue';
import { useGameStore } from 'src/stores/game.store';
import { useSettingsStore } from 'src/stores/settings.store';
import { useUserStore } from 'src/stores/user.store';
import LDice from './LDice.vue';
import LDiceManual from './LDiceManual.vue';

interface Props {
  modelValue: boolean;
}

const MIN_ROLL_DELAY_MS = 2000;
const RESULT_VIEW_DELAY_MS = 450;

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'roll-finished', result: MoveResponse): void;
}>();

const { t } = useI18n();
const $q = useQuasar();
const gameStore = useGameStore();
const settingsStore = useSettingsStore();
const userStore = useUserStore();

const diceMode = computed(() => userStore.profile?.dice_mode || 'auto');
const manualDiceValue = ref<number>(1);
const lastDiceResult = ref<number | null>(null);
const isRollingVisual = ref(false);
const isSubmitting = ref(false);
const pendingResult = ref<MoveResponse | null>(null);
const pendingManualRolls = ref<number[]>([]);
const pendingAutoRolls = ref<number[]>([]);
const pendingMessage = ref('');

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});
const showDiceVisual = computed(
  () =>
    diceMode.value === 'auto' ||
    isRollingVisual.value ||
    pendingResult.value !== null ||
    lastDiceResult.value !== null,
);
const displayRolls = computed(() => {
  if (diceMode.value === 'manual' && pendingManualRolls.value.length > 0) {
    return pendingManualRolls.value;
  }
  if (pendingAutoRolls.value.length > 0) {
    return pendingAutoRolls.value;
  }
  return gameStore.currentDiceRolls;
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Обработка завершения анимации приземления кубика */
async function onRollComplete(): Promise<void> {
  isRollingVisual.value = false;

  // Пауза для просмотра результата
  await sleep(RESULT_VIEW_DELAY_MS);

  const result = pendingResult.value;
  pendingResult.value = null;

  if (!result) return;

  settingsStore.vibrate([30, 20, 50]);

  if (result.move?.is_triple_six) {
    $q.notify({ type: 'warning', message: t('dice.burned'), icon: 'mdi-fire' });
  }

  isOpen.value = false;
  emit('roll-finished', result);
}

async function executeRoll(rollFn: () => Promise<MoveResponse | null>): Promise<void> {
  if (isSubmitting.value) {
    return;
  }

  isSubmitting.value = true;
  isRollingVisual.value = true;
  lastDiceResult.value = null;
  pendingResult.value = null;

  try {
    const startedAt = Date.now();
    const result = await rollFn();
    const elapsed = Date.now() - startedAt;

    if (!result) {
      isRollingVisual.value = false;
      $q.notify({
        type: 'negative',
        message: gameStore.error || t('error.generic'),
      });
      return;
    }

    // Минимальная длительность loop-анимации
    if (elapsed < MIN_ROLL_DELAY_MS) {
      await sleep(MIN_ROLL_DELAY_MS - elapsed);
    }

    if (result.requires_another_roll && result.intermediate) {
      pendingAutoRolls.value = [...result.intermediate.accumulated_rolls];
      pendingMessage.value = t(result.intermediate.message_key);
      pendingResult.value = null;
      lastDiceResult.value = result.intermediate.dice_value;
      return;
    }

    if (!result.move) {
      isRollingVisual.value = false;
      $q.notify({
        type: 'negative',
        message: gameStore.error || t('error.generic'),
      });
      return;
    }

    pendingMessage.value = '';
    pendingAutoRolls.value = [];
    pendingResult.value = result;
    lastDiceResult.value = result.move.dice_rolls[result.move.dice_rolls.length - 1] ?? null;

    // Дальнейшая логика (notify, закрытие) — в onRollComplete
  } catch {
    isRollingVisual.value = false;
    $q.notify({
      type: 'negative',
      message: gameStore.error || t('error.generic'),
    });
  } finally {
    isSubmitting.value = false;
  }
}

function performAutoRoll(): void {
  void executeRoll(() => gameStore.rollDiceAuto());
}

async function executeManualRoll(value: number): Promise<void> {
  if (isSubmitting.value) {
    return;
  }

  isSubmitting.value = true;
  pendingResult.value = null;
  lastDiceResult.value = null;
  isRollingVisual.value = false;

  try {
    const result = await gameStore.rollDiceManual(value);

    if (!result || !result.move) {
      $q.notify({
        type: 'negative',
        message: gameStore.error || t('error.generic'),
      });
      return;
    }

    if (result.move.is_triple_six) {
      $q.notify({ type: 'warning', message: t('dice.burned'), icon: 'mdi-fire' });
    }

    pendingManualRolls.value = [];
    pendingMessage.value = '';
    gameStore.resetManualRolls();

    isOpen.value = false;
    emit('roll-finished', result);
  } catch {
    $q.notify({
      type: 'negative',
      message: gameStore.error || t('error.generic'),
    });
  } finally {
    isSubmitting.value = false;
  }
}

function performManualRoll(value: number): void {
  manualDiceValue.value = value;
  void executeManualRoll(value);
}

function handleManualSixSelected(): void {
  const accumulated = gameStore.addManualSix();
  pendingManualRolls.value = [...accumulated];

  const count = pendingManualRolls.value.length;
  pendingMessage.value =
    count >= 3 ? t('dice.triple_six_burn_manual') : t('dice.manual_six_roll_again');
}

watch(
  () => props.modelValue,
  (isModalOpen) => {
    if (isModalOpen) return;

    isRollingVisual.value = false;
    isSubmitting.value = false;
    lastDiceResult.value = null;
    pendingResult.value = null;
    pendingManualRolls.value = [];
    pendingAutoRolls.value = [];
    pendingMessage.value = '';
    gameStore.resetManualRolls();
  },
);
</script>

<style lang="scss" scoped>
.l-dice-modal__content {
  min-height: 340px;
  padding: 8px 0 16px;
}
</style>
