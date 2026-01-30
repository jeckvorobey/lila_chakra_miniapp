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
    <q-card :class="modalClasses" class="column">
      <!-- Drag handle -->
      <div v-if="showHandle" class="row justify-center q-py-sm">
        <div class="l-modal__handle-bar" />
      </div>

      <!-- Header -->
      <q-card-section
        v-if="title || showClose || $slots.header"
        class="row items-center justify-between q-pb-sm"
      >
        <slot name="header">
          <div class="text-h6 text-weight-bold">{{ title }}</div>
          <q-btn v-if="showClose" flat round dense icon="close" color="grey" @click="close" />
        </slot>
      </q-card-section>

      <!-- Content -->
      <q-card-section :class="['col', { scroll: scrollable }]">
        <slot />
      </q-card-section>

      <!-- Actions -->
      <q-card-actions v-if="$slots.actions" align="stretch" class="q-pa-md safe-area-bottom">
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
  border-radius: 24px 24px 0 0;
  max-height: 90vh;

  &--bottom {
    width: 100%;
    max-width: v-bind(maxWidth);
    margin: 0 auto;
  }

  &--standard {
    border-radius: 24px;
    margin: auto;
    width: 90%;
    max-width: v-bind(maxWidth);
  }

  &--fullscreen {
    border-radius: 0;
    max-height: 100vh;
    height: 100vh;
  }

  &__handle-bar {
    width: 40px;
    height: 4px;
    background-color: var(--lila-border);
    border-radius: 9999px;
  }
}

// Backdrop styles
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
