<template>
  <q-btn
    :class="buttonClasses"
    :disable="disable || loading"
    :loading="loading"
    :icon="icon"
    :icon-right="iconRight"
    :no-caps="noCaps"
    :unelevated="variant !== 'primary'"
    :outline="variant === 'secondary'"
    :flat="variant === 'ghost'"
    :color="buttonColor"
    :text-color="textColor"
    v-bind="$attrs"
    @click="handleClick"
  >
    <slot />
    <template
      v-if="loading"
      #loading
    >
      <q-spinner-dots size="20px" />
    </template>
  </q-btn>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSettingsStore } from 'src/stores/settings.store';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface Props {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disable?: boolean;
  icon?: string;
  iconRight?: string;
  noCaps?: boolean;
  fullWidth?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disable: false,
  noCaps: true,
  fullWidth: false,
});

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const settingsStore = useSettingsStore();

const buttonClasses = computed(() => [
  'l-btn',
  `l-btn--${props.variant}`,
  `l-btn--${props.size}`,
  {
    'full-width': props.fullWidth,
    'l-btn--loading': props.loading,
  },
]);

const buttonColor = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'primary';
    case 'secondary':
      return 'primary';
    case 'danger':
      return 'negative';
    case 'ghost':
    default:
      return undefined;
  }
});

const textColor = computed(() => {
  if (props.variant === 'ghost') {
    return settingsStore.theme === 'light' ? 'dark' : 'white';
  }
  return undefined;
});

function handleClick(event: Event) {
  if (!props.disable && !props.loading) {
    settingsStore.vibrate(25);
    emit('click', event as MouseEvent);
  }
}
</script>

<style lang="scss" scoped>
@use 'sass:color';

.l-btn {
  font-weight: 600;
  transition: all 0.15s ease;

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  // Размеры
  &--sm {
    height: 40px;
    padding: 0 16px;
    font-size: 14px;
  }

  &--md {
    height: 52px;
    padding: 0 24px;
  }

  &--lg {
    height: 60px;
    padding: 0 32px;
    font-size: 18px;
  }

  // Варианты
  &--primary {
    background: linear-gradient(
      135deg,
      $primary,
      color.adjust($primary, $lightness: -10%)
    ) !important;

    &:hover:not(:disabled) {
      filter: brightness(1.1);
      transform: scale(1.02);
    }
  }

  &--secondary {
    .body--light & {
      background: rgba($primary, 0.1);
    }

    &:hover:not(:disabled) {
      background: rgba($primary, 0.15);
    }
  }

  &--ghost {
    &:hover:not(:disabled) {
      background: var(--lila-surface);
    }
  }

  &--danger {
    background: linear-gradient(
      135deg,
      $negative,
      color.adjust($negative, $lightness: -10%)
    ) !important;

    &:hover:not(:disabled) {
      filter: brightness(1.1);
    }
  }

  &--loading {
    opacity: 0.8;
    cursor: wait;
  }
}
</style>
