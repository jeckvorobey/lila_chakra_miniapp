<template>
  <l-modal
    v-model="isOpen"
    :title="t('dice.roll')"
    position="bottom"
    data-testid="dice-roll-modal"
  >
    <div class="column items-center q-pa-md">
      <q-btn-toggle
        v-model="diceMode"
        :options="diceModeOptions"
        class="q-mb-lg"
        toggle-color="primary"
        rounded
        unelevated
      />

      <template v-if="diceMode === 'auto'">
        <l-dice :result="lastDiceResult" :is-rolling="isRollingVisual" :size="120" />
        <q-btn
          :label="t('dice.roll')"
          color="primary"
          size="lg"
          unelevated
          :loading="isSubmitting"
          class="q-mt-lg q-px-xl"
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
          <strong>{{ gameStore.currentDiceRolls.reduce((a: number, b: number) => a + b, 0) }}</strong>
        </div>
      </div>
    </div>
  </l-modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
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

const MIN_ROLL_DELAY_MS = 1200;
const RESULT_SETTLE_DELAY_MS = 550;

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const { t } = useI18n();
const $q = useQuasar();
const router = useRouter();
const gameStore = useGameStore();
const settingsStore = useSettingsStore();

const diceMode = ref<'auto' | 'manual'>('auto');
const manualDiceValue = ref<number>(1);
const lastDiceResult = ref<number | null>(null);
const isRollingVisual = ref(false);
const isSubmitting = ref(false);

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

function notifyTransition(result: MoveResponse): void {
  if (result.move.transition_type === 'arrow') {
    $q.notify({
      type: 'positive',
      message: t('game.arrow_notify', { cell: result.move.final_cell }),
      icon: 'mdi-arrow-up-bold',
    });
    return;
  }

  if (result.move.transition_type === 'snake') {
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

async function executeRoll(rollFn: () => Promise<MoveResponse | null>): Promise<void> {
  if (isSubmitting.value) {
    return;
  }

  isSubmitting.value = true;
  isRollingVisual.value = true;

  try {
    const startedAt = Date.now();
    const result = await rollFn();
    const elapsed = Date.now() - startedAt;

    if (elapsed < MIN_ROLL_DELAY_MS) {
      await sleep(MIN_ROLL_DELAY_MS - elapsed);
    }

    isRollingVisual.value = false;

    if (!result) {
      $q.notify({
        type: 'negative',
        message: gameStore.error || t('error.generic'),
      });
      return;
    }

    lastDiceResult.value = result.move.dice_rolls[result.move.dice_rolls.length - 1] ?? null;
    await sleep(RESULT_SETTLE_DELAY_MS);

    settingsStore.vibrate([30, 20, 50]);

    if (result.move.is_triple_six) {
      $q.notify({ type: 'warning', message: t('dice.burned'), icon: 'mdi-fire' });
    }

    notifyTransition(result);

    isOpen.value = false;

    if (result.is_victory) {
      showVictoryDialog();
    }
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
