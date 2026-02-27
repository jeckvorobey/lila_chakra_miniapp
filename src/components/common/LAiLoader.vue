<template>
  <div class="row items-center q-gutter-sm q-mb-sm">
    <q-spinner-dots
      :color="color"
      :size="size"
    />
    <span
      class="text-body2"
      :class="`text-${colorText}`"
      >{{ text }}</span
    >
  </div>
</template>

<script setup lang="ts">
type QuasarColor =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'dark'
  | 'positive'
  | 'negative'
  | 'info'
  | 'warning'
  | (string & {});
interface Props {
  /** Текст сообщения */
  text: string;
  /**
   * Размер спиннера
   * @example '24px', '2rem', '1em'
   */
  size?: string;
  /** Цвет спиннера из палитры Quasar или CSS цвет */
  color?: QuasarColor;
  /** Цвет текста из палитры Quasar */
  colorText?: QuasarColor;
}

withDefaults(defineProps<Props>(), {
  size: '24px',
  color: 'primary',
  colorText: 'secondary',
});
</script>
