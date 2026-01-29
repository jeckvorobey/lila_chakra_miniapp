<template>
  <q-card
    :class="cardClasses"
    :flat="flat"
    :bordered="bordered"
    v-bind="$attrs"
  >
    <!-- Header -->
    <q-card-section v-if="$slots.header || title" class="l-card__header">
      <slot name="header">
        <div v-if="icon || $slots.icon" class="l-card__header-icon">
          <slot name="icon">
            <q-icon :name="icon" size="24px" />
          </slot>
        </div>
        <div class="l-card__header-text">
          <div v-if="title" class="l-card__title">{{ title }}</div>
          <div v-if="subtitle" class="l-card__subtitle">{{ subtitle }}</div>
        </div>
        <div v-if="$slots.headerAction" class="l-card__header-action">
          <slot name="headerAction" />
        </div>
      </slot>
    </q-card-section>

    <!-- Content -->
    <q-card-section class="l-card__content">
      <slot />
    </q-card-section>

    <!-- Actions -->
    <q-card-actions v-if="$slots.actions" class="l-card__actions" align="right">
      <slot name="actions" />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type CardVariant = 'default' | 'highlighted' | 'glass';

interface Props {
  variant?: CardVariant;
  title?: string;
  subtitle?: string;
  icon?: string;
  flat?: boolean;
  bordered?: boolean;
  interactive?: boolean;
  chakraColor?: number; // 1-8 for chakra glow
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  flat: false,
  bordered: false,
  interactive: false,
});

const cardClasses = computed(() => [
  'l-card',
  `l-card--${props.variant}`,
  {
    'l-card--interactive': props.interactive,
    [`l-card--chakra-${props.chakraColor}`]: props.chakraColor,
  },
]);
</script>

<style lang="scss" scoped>
.l-card {
  background-color: var(--lila-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--lila-border);
  box-shadow: var(--lila-shadow);
  overflow: hidden;
  transition: all 0.2s ease;

  // Variants
  &--default {
    // Default styles from above
  }

  &--highlighted {
    border-color: var(--lila-primary);
    box-shadow: var(--lila-glow-primary);
  }

  &--glass {
    background: var(--lila-glass-bg);
    backdrop-filter: var(--lila-glass-blur);
    -webkit-backdrop-filter: var(--lila-glass-blur);
  }

  &--interactive {
    cursor: pointer;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }

    &:active {
      transform: translateY(-2px);
    }
  }

  // Chakra glow variants
  @for $i from 1 through 8 {
    &--chakra-#{$i} {
      border-color: var(--chakra-#{$i});
      box-shadow: 0 0 20px rgba(var(--chakra-#{$i}), 0.3);
    }
  }

  // Header
  &__header {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding-bottom: 0;
  }

  &__header-icon {
    flex-shrink: 0;
    color: var(--lila-primary);
  }

  &__header-text {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: var(--lila-text-primary);
    line-height: 1.3;
  }

  &__subtitle {
    font-size: 14px;
    color: var(--lila-text-secondary);
    margin-top: 2px;
  }

  &__header-action {
    flex-shrink: 0;
  }

  // Content
  &__content {
    color: var(--lila-text-primary);
  }

  // Actions
  &__actions {
    padding: var(--space-md) var(--space-lg);
    border-top: 1px solid var(--lila-border);
  }
}
</style>
