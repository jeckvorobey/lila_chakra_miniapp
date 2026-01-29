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
    <template v-if="loading" #loading>
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
  'l-button',
  `l-button--${props.variant}`,
  `l-button--${props.size}`,
  {
    'l-button--full-width': props.fullWidth,
    'l-button--loading': props.loading,
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

function handleClick(event: MouseEvent) {
  if (!props.disable && !props.loading) {
    // Haptic feedback
    settingsStore.vibrate(25);
    emit('click', event);
  }
}
</script>

<style lang="scss" scoped>
.l-button {
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: 16px;
  transition: all 0.15s ease;

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  // Sizes
  &--sm {
    height: 40px;
    padding: 0 var(--space-md);
    font-size: 14px;
  }

  &--md {
    height: 52px;
    padding: 0 var(--space-lg);
  }

  &--lg {
    height: 60px;
    padding: 0 var(--space-xl);
    font-size: 18px;
  }

  &--full-width {
    width: 100%;
  }

  // Variants
  &--primary {
    background: linear-gradient(135deg, var(--lila-primary), darken(#6B46C1, 10%));
    color: white;

    &:hover:not(:disabled) {
      filter: brightness(1.1);
      transform: scale(1.02);
    }
  }

  &--secondary {
    background: transparent;
    border: 1px solid var(--lila-primary);
    color: var(--lila-primary);

    .body--light & {
      background: rgba(107, 70, 193, 0.1);
    }

    &:hover:not(:disabled) {
      background: rgba(107, 70, 193, 0.15);
    }
  }

  &--ghost {
    background: transparent;
    color: var(--lila-text-primary);

    &:hover:not(:disabled) {
      background: var(--lila-surface);
    }
  }

  &--danger {
    background: linear-gradient(135deg, var(--lila-error), darken(#EF4444, 10%));
    color: white;

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
