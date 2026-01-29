<template>
  <q-dialog
    v-model="modelValue"
    :position="position"
    :persistent="persistent"
    :maximized="fullscreen"
    transition-show="slide-up"
    transition-hide="slide-down"
    :transition-duration="350"
    @hide="onHide"
  >
    <q-card :class="modalClasses">
      <!-- Drag handle -->
      <div v-if="showHandle" class="l-modal__handle">
        <div class="l-modal__handle-bar" />
      </div>

      <!-- Header -->
      <q-card-section v-if="title || showClose || $slots.header" class="l-modal__header">
        <slot name="header">
          <div class="l-modal__title">{{ title }}</div>
          <q-btn
            v-if="showClose"
            flat
            round
            dense
            icon="close"
            class="l-modal__close"
            @click="close"
          />
        </slot>
      </q-card-section>

      <!-- Content -->
      <q-card-section class="l-modal__content" :class="{ 'l-modal__content--scroll': scrollable }">
        <slot />
      </q-card-section>

      <!-- Actions -->
      <q-card-actions v-if="$slots.actions" class="l-modal__actions" align="stretch">
        <slot name="actions" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type ModalPosition = 'standard' | 'top' | 'right' | 'bottom' | 'left';

interface Props {
  modelValue: boolean;
  title?: string;
  position?: ModalPosition;
  persistent?: boolean;
  fullscreen?: boolean;
  showHandle?: boolean;
  showClose?: boolean;
  scrollable?: boolean;
  maxWidth?: string;
}

const props = withDefaults(defineProps<Props>(), {
  position: 'bottom',
  persistent: false,
  fullscreen: false,
  showHandle: true,
  showClose: true,
  scrollable: true,
  maxWidth: '600px',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'hide'): void;
}>();

const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const modalClasses = computed(() => [
  'l-modal',
  `l-modal--${props.position}`,
  {
    'l-modal--fullscreen': props.fullscreen,
  },
]);

function close() {
  modelValue.value = false;
}

function onHide() {
  emit('hide');
}
</script>

<style lang="scss" scoped>
.l-modal {
  background-color: var(--lila-surface-elevated);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  max-height: 90vh;
  display: flex;
  flex-direction: column;

  // Position variants
  &--bottom {
    width: 100%;
    max-width: v-bind(maxWidth);
    margin: 0 auto;
  }

  &--standard {
    border-radius: var(--radius-xl);
    margin: auto;
    width: 90%;
    max-width: v-bind(maxWidth);
  }

  &--fullscreen {
    border-radius: 0;
    max-height: 100vh;
    height: 100vh;
  }

  // Handle
  &__handle {
    display: flex;
    justify-content: center;
    padding: var(--space-sm) 0;
    cursor: grab;

    &-bar {
      width: 40px;
      height: 4px;
      background-color: var(--lila-border);
      border-radius: var(--radius-full);
    }
  }

  // Header
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: var(--space-sm);
    border-bottom: 1px solid var(--lila-border);
  }

  &__title {
    font-size: 20px;
    font-weight: 600;
    color: var(--lila-text-primary);
  }

  &__close {
    color: var(--lila-text-secondary);

    &:hover {
      color: var(--lila-text-primary);
    }
  }

  // Content
  &__content {
    flex: 1;
    color: var(--lila-text-primary);

    &--scroll {
      overflow-y: auto;
    }
  }

  // Actions
  &__actions {
    padding: var(--space-md) var(--space-lg) var(--space-lg);
    gap: var(--space-sm);
    border-top: 1px solid var(--lila-border);

    // Safe area for mobile
    padding-bottom: calc(var(--space-lg) + env(safe-area-inset-bottom));
  }
}

// Dark theme specific overlay
.body--dark {
  :deep(.q-dialog__backdrop) {
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
  }
}

.body--light {
  :deep(.q-dialog__backdrop) {
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(2px);
  }
}
</style>
