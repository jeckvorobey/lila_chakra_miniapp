<template>
  <l-modal v-model="isOpen" position="bottom" data-testid="dice-roll-modal">
    <div class="column items-center justify-between l-dice-modal__content">
      <q-btn-toggle
        v-model="diceMode"
        :options="diceModeOptions"
        toggle-color="primary"
        class="q-mb-md"
        rounded
        unelevated
      />

      <template v-if="diceMode === 'auto'">
        <div class="col column items-center justify-center">
          <l-dice
            :result="lastDiceResult"
            :is-rolling="isRollingVisual"
            :size="120"
            @roll-complete="onRollComplete"
          />
        </div>

        <q-btn
          :label="t('dice.roll')"
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
        <l-dice-manual v-model="manualDiceValue" @confirm="performManualRoll" />
      </template>

      <div v-if="gameStore.currentDiceRolls.length > 1" class="q-mt-md text-center">
        <div class="text-caption text-secondary">
          {{ gameStore.currentDiceRolls.join(' + ') }} =
          <strong>{{gameStore.currentDiceRolls.reduce((a: number, b: number) => a + b, 0)}}</strong>
        </div>
      </div>
    </div>
  </l-modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import type { MoveResponse } from 'src/types/game.interface';
import LModal from 'src/components/base/LModal.vue';
import { useGameStore } from 'src/stores/game.store';
import { useSettingsStore } from 'src/stores/settings.store';
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

const diceMode = ref<'auto' | 'manual'>('auto');
const manualDiceValue = ref<number>(1);
const lastDiceResult = ref<number | null>(null);
const isRollingVisual = ref(false);
const isSubmitting = ref(false);

// Хранение результата для обработки после roll-complete
let pendingResult: MoveResponse | null = null;

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const diceModeOptions = computed(() => [
  { label: t('dice.auto'), value: 'auto' },
  { label: t('dice.manual'), value: 'manual' },
]);

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

  const result = pendingResult;
  pendingResult = null;

  if (!result) return;

  settingsStore.vibrate([30, 20, 50]);

  if (result.move.is_triple_six) {
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
  pendingResult = null;

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

    // Устанавливаем результат — LDice переключится с loop на landing
    pendingResult = result;
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
  void executeRoll(() => gameStore.rollDice());
}

function performManualRoll(value: number): void {
  manualDiceValue.value = value;
  void executeRoll(() => gameStore.manualMove(value));
}
</script>

<style lang="scss" scoped>
.l-dice-modal__content {
  min-height: 340px;
  padding: 8px 0 16px;
}
</style>
