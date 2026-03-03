<template>
  <div class="full-width">
    <div
      v-if="showLabel"
      class="row justify-between items-center q-mb-xs"
    >
      <span class="text-caption text-secondary text-uppercase">{{ t('game.progress') }}</span>
      <span class="text-body2 text-weight-bold">{{ currentCell }}/{{ maxCell }}</span>
    </div>
    <div class="l-progress__track rounded-borders">
      <div
        class="l-progress__fill rounded-borders"
        :style="fillStyle"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { cellIdToChakraLevel } from 'src/utils/board-geometry';

interface Props {
  currentCell: number;
  maxCell?: number;
  showLabel?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  maxCell: 72,
  showLabel: true,
});

const { t } = useI18n();

const progress = computed(() => {
  if (props.currentCell <= 0) return 0;
  return Math.min((props.currentCell / props.maxCell) * 100, 100);
});

const currentChakra = computed(() => cellIdToChakraLevel(props.currentCell));

const fillStyle = computed(() => {
  const level = currentChakra.value || 1;
  let bg: string;

  if (level <= 1) {
    bg = 'var(--chakra-1)';
  } else {
    const stops = Array.from({ length: level }, (_, i) => {
      const pct = (i / (level - 1)) * 100;
      return `var(--chakra-${i + 1}) ${pct}%`;
    }).join(', ');
    bg = `linear-gradient(90deg, ${stops})`;
  }

  return {
    width: `${progress.value}%`,
    background: bg,
  };
});
</script>

<style lang="scss" scoped>
.l-progress {
  &__track {
    height: 8px;
    background-color: var(--color-surface);
    overflow: hidden;

    .body--light & {
      background-color: var(--color-border);
    }
  }

  &__fill {
    height: 100%;
    transition: width 0.4s ease;

    .body--dark & {
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.15);
    }
  }
}
</style>
