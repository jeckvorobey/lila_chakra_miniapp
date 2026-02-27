<template>
  <q-card :class="cardClasses" :flat="flat" :bordered="bordered" v-bind="$attrs">
    <!-- Header -->
    <q-card-section v-if="$slots.header || title" class="row items-center no-wrap q-gutter-md">
      <slot name="header">
        <div v-if="icon || $slots.icon" class="text-primary">
          <slot name="icon">
            <q-icon :name="icon" size="24px" />
          </slot>
        </div>
        <div class="col">
          <div v-if="title" class="text-subtitle1 text-weight-bold">{{ title }}</div>
          <div v-if="subtitle" class="text-caption text-secondary">{{ subtitle }}</div>
        </div>
        <div v-if="$slots.headerAction">
          <slot name="headerAction" />
        </div>
      </slot>
    </q-card-section>

    <!-- Content -->
    <q-card-section>
      <slot />
    </q-card-section>

    <!-- Actions -->
    <q-card-actions v-if="$slots.actions" align="right" class="q-pt-none">
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
    'l-card--interactive cursor-pointer': props.interactive,
    [`l-card--chakra-${props.chakraColor}`]: props.chakraColor,
  },
]);
</script>

<style lang="scss" scoped>
.l-card {
  background-color: var(--lila-surface);
  box-shadow: var(--lila-shadow);
  transition: all 0.2s ease;

  &--highlighted {
    border-color: $primary;
    box-shadow: var(--lila-glow-primary);
  }

  &--glass {
    background: var(--lila-glass-bg);
    backdrop-filter: var(--lila-glass-blur);
    -webkit-backdrop-filter: var(--lila-glass-blur);
  }

  &--interactive {
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }

    &:active {
      transform: translateY(-2px);
    }
  }

  // Варианты свечения чакры
  @for $i from 1 through 8 {
    &--chakra-#{$i} {
      border-color: var(--chakra-#{$i});
      box-shadow: 0 0 20px color-mix(in srgb, var(--chakra-#{$i}) 30%, transparent);
    }
  }
}
</style>
