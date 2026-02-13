<template>
  <div class="l-dice-manual">
    <div class="text-subtitle2 text-weight-medium q-mb-md text-center">
      {{ $t('dice.select_value') }}
    </div>

    <div class="l-dice-manual__grid">
      <q-btn
        v-for="value in 6"
        :key="value"
        :class="['l-dice-manual__btn', { 'l-dice-manual__btn--selected': selected === value }]"
        :outline="selected !== value"
        :unelevated="selected === value"
        :color="selected === value ? 'primary' : undefined"
        square
        no-caps
        @click="selectValue(value)"
      >
        <div class="l-dice-manual__face">
          <!-- Паттерн точек для каждого значения -->
          <template v-if="value === 1">
            <span class="l-dice-manual__dot l-dice-manual__dot--center" />
          </template>
          <template v-else-if="value === 2">
            <span class="l-dice-manual__dot l-dice-manual__dot--top-right" />
            <span class="l-dice-manual__dot l-dice-manual__dot--bottom-left" />
          </template>
          <template v-else-if="value === 3">
            <span class="l-dice-manual__dot l-dice-manual__dot--top-right" />
            <span class="l-dice-manual__dot l-dice-manual__dot--center" />
            <span class="l-dice-manual__dot l-dice-manual__dot--bottom-left" />
          </template>
          <template v-else-if="value === 4">
            <span class="l-dice-manual__dot l-dice-manual__dot--top-left" />
            <span class="l-dice-manual__dot l-dice-manual__dot--top-right" />
            <span class="l-dice-manual__dot l-dice-manual__dot--bottom-left" />
            <span class="l-dice-manual__dot l-dice-manual__dot--bottom-right" />
          </template>
          <template v-else-if="value === 5">
            <span class="l-dice-manual__dot l-dice-manual__dot--top-left" />
            <span class="l-dice-manual__dot l-dice-manual__dot--top-right" />
            <span class="l-dice-manual__dot l-dice-manual__dot--center" />
            <span class="l-dice-manual__dot l-dice-manual__dot--bottom-left" />
            <span class="l-dice-manual__dot l-dice-manual__dot--bottom-right" />
          </template>
          <template v-else-if="value === 6">
            <span class="l-dice-manual__dot l-dice-manual__dot--top-left" />
            <span class="l-dice-manual__dot l-dice-manual__dot--top-right" />
            <span class="l-dice-manual__dot l-dice-manual__dot--middle-left" />
            <span class="l-dice-manual__dot l-dice-manual__dot--middle-right" />
            <span class="l-dice-manual__dot l-dice-manual__dot--bottom-left" />
            <span class="l-dice-manual__dot l-dice-manual__dot--bottom-right" />
          </template>
        </div>
      </q-btn>
    </div>

    <div class="q-mt-lg">
      <q-btn
        :label="$t('dice.confirm')"
        color="primary"
        class="full-width"
        size="lg"
        unelevated
        @click="confirm"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useSettingsStore } from 'src/stores/settings.store';

interface Props {
  modelValue?: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
  (e: 'confirm', value: number): void;
}>();

const settingsStore = useSettingsStore();
const selected = ref<number>(props.modelValue ?? 1);

watch(
  () => props.modelValue,
  (value) => {
    if (typeof value === 'number' && value >= 1 && value <= 6) {
      selected.value = value;
    }
  },
);

function selectValue(value: number) {
  selected.value = value;
  settingsStore.vibrate(25);
  settingsStore.playSound('tap');
  emit('update:modelValue', value);
}

function confirm() {
  settingsStore.vibrate([30, 20, 50]);
  emit('confirm', selected.value);
}
</script>

<style lang="scss" scoped>
.l-dice-manual {
  padding: var(--space-md);

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-md);
    max-width: 280px;
    margin: 0 auto;
  }

  &__btn {
    aspect-ratio: 1;
    border-radius: var(--radius-md) !important;
    min-height: 70px;
    transition: all 0.2s ease;

    .body--dark & {
      background: var(--lila-surface);
      border-color: var(--lila-border);
    }

    .body--light & {
      background: var(--lila-surface-elevated);
      border-color: var(--lila-border);
    }

    &:active {
      transform: scale(0.95);
    }

    &--selected {
      box-shadow: var(--lila-glow-primary);
      transform: scale(1.05);

      .body--dark & {
        animation: pulse-glow 1.5s ease-in-out infinite;
      }
    }
  }

  &__face {
    position: relative;
    width: 48px;
    height: 48px;
  }

  &__dot {
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: currentColor;

    // Позиции
    &--center {
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    &--top-left {
      top: 4px;
      left: 4px;
    }
    &--top-right {
      top: 4px;
      right: 4px;
    }
    &--middle-left {
      top: 50%;
      left: 4px;
      transform: translateY(-50%);
    }
    &--middle-right {
      top: 50%;
      right: 4px;
      transform: translateY(-50%);
    }
    &--bottom-left {
      bottom: 4px;
      left: 4px;
    }
    &--bottom-right {
      bottom: 4px;
      right: 4px;
    }
  }
}

@keyframes pulse-glow {
  0%,
  100% {
    box-shadow: 0 0 15px rgba(107, 70, 193, 0.4);
  }
  50% {
    box-shadow: 0 0 25px rgba(107, 70, 193, 0.6);
  }
}
</style>
