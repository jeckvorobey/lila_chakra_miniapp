<template>
  <div
    :class="cellClasses"
    :style="cellStyle"
    @click="handleClick"
    @long-press="handleLongPress"
  >
    <span
      v-if="!shouldRenderPlayer"
      class="l-cell__number"
      >{{ cellId }}</span
    >

    <q-icon
      v-if="isArrow"
      name="mdi-arrow-up-bold"
      class="l-cell__icon l-cell__icon--arrow"
      size="12px"
    />
    <q-icon
      v-else-if="isSnake"
      name="mdi-snake"
      class="l-cell__icon l-cell__icon--snake"
      size="12px"
    />

    <div
      v-if="shouldRenderPlayer"
      class="l-cell__player"
      :style="playerStyle"
    >
      <span class="l-cell__player-text">{{ cellId }}</span>
    </div>

    <q-tooltip
      v-if="showTooltip"
      anchor="top middle"
      self="bottom middle"
      class="l-cell__tooltip"
    >
      <div class="text-weight-medium">{{ cellId }}</div>
      <div
        v-if="isArrow"
        class="text-caption text-positive"
      >
        {{ $t('transition.arrow_to') }} {{ arrowTarget }}
      </div>
      <div
        v-if="isSnake"
        class="text-caption text-negative"
      >
        {{ $t('transition.snake_to') }} {{ snakeTarget }}
      </div>
    </q-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { useGameStore } from 'src/stores/game.store';
import { useUserStore } from 'src/stores/user.store';
import { getChakraColor } from 'src/data/chakra-colors';
import { cellIdToChakraLevel } from 'src/utils/board-geometry';

interface Props {
  cellId: number;
  isCurrentPosition?: boolean;
  hasPlayer?: boolean;
  disabled?: boolean;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  isCurrentPosition: false,
  hasPlayer: false,
  disabled: false,
  showTooltip: false,
  size: 'md',
});

const emit = defineEmits<{
  (e: 'click', cellId: number): void;
  (e: 'long-press', cellId: number): void;
}>();
const $q = useQuasar();
const gameStore = useGameStore();
const userStore = useUserStore();
const isDarkMode = computed(() => $q.dark?.isActive ?? true);

const chakraLevel = computed(() => cellIdToChakraLevel(props.cellId));

const isArrow = computed(() => props.cellId in gameStore.arrowsMap);
const isSnake = computed(() => props.cellId in gameStore.snakesMap);
const arrowTarget = computed(() => gameStore.arrowsMap[props.cellId]);
const snakeTarget = computed(() => gameStore.snakesMap[props.cellId]);
const shouldRenderPlayer = computed(() => props.hasPlayer && gameStore.displayCell !== -1);
const chipColor = computed(() => userStore.profile?.settings?.chip_color ?? '#6B46C1');
const chipTextColor = computed(() => userStore.profile?.settings?.chip_text_color ?? '#FFFFFF');

const isWinningCell = computed(() => props.cellId === 68);
const isStartCell = computed(() => props.cellId === 1);
const isTrapCell = computed(() => props.cellId === 72);

function withAlpha(hexColor: string, alphaHex: string): string {
  return `${hexColor}${alphaHex}`;
}

const cellClasses = computed(() => [
  'l-cell',
  {
    'l-cell--current': props.isCurrentPosition,
    'l-cell--arrow': isArrow.value,
    'l-cell--snake': isSnake.value,
    'l-cell--winning': isWinningCell.value,
    'l-cell--start': isStartCell.value,
    'l-cell--trap': isTrapCell.value,
    'l-cell--disabled': props.disabled,
    'l-cell--has-player': shouldRenderPlayer.value,
  },
]);

const cellStyle = computed(() => {
  const color = getChakraColor(chakraLevel.value, isDarkMode.value);

  return {
    '--cell-bg': withAlpha(color, '10'),
    '--cell-text': withAlpha(color, '80'),
    '--cell-border': 'transparent',
  };
});

const playerStyle = computed(() => ({
  '--chip-color': chipColor.value,
  '--chip-text-color': chipTextColor.value,
}));

function handleClick() {
  if (!props.disabled) {
    emit('click', props.cellId);
  }
}

function handleLongPress() {
  if (!props.disabled) {
    emit('long-press', props.cellId);
  }
}
</script>

<style lang="scss" scoped>
.l-cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  overflow: hidden;
  background: var(--cell-bg);
  border: 1px solid var(--cell-border);

  &__number {
    z-index: 2;
    color: var(--cell-text);
    font-size: clamp(12px, 1.45vw, 22px);
    font-weight: 500;
    line-height: 1;
  }

  &__icon {
    position: absolute;
    top: 3px;
    right: 3px;
    z-index: 2;
    opacity: 0.9;

    &--arrow {
      color: #22c55e;
    }

    &--snake {
      color: #ef4444;
    }
  }

  &__player {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 1;
    width: 68%;
    height: 68%;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    background: var(--chip-color, #6b46c1);
    color: var(--chip-text-color, #ffffff);
    box-shadow: 0 0 12px color-mix(in srgb, var(--chip-color, #6b46c1) 65%, transparent);
    animation: chip-step 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__player-text {
    font-size: clamp(10px, 1.25vw, 16px);
    font-weight: 700;
    line-height: 1;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
  }

  @keyframes chip-step {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.6);
    }

    60% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.05);
    }

    100% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  &__tooltip {
    background: var(--lila-surface-elevated);
    color: var(--lila-text-primary);
    border: 1px solid var(--lila-border);
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--start {
    --cell-bg: #dc262630;
    --cell-text: #dc2626;
    --cell-border: #dc2626;
    box-shadow: 0 0 6px #dc262640;

    .l-cell__number {
      font-weight: 600;
    }
  }

  &--trap {
    --cell-bg: #f5f5f420;
    --cell-text: #f5f5f4;

    .l-cell__number {
      font-weight: 500;
    }
  }

  &--winning {
    --cell-bg: #f5f5f430;
    --cell-text: #f5f5f4;
    --cell-border: #f5f5f4;
    box-shadow:
      inset 0 0 0 2px #f5f5f4,
      0 0 10px #f5f5f499;
    position: relative;

    .l-cell__number {
      font-weight: 600;
    }

    .body--light & {
      --cell-bg: #ffffff;
      --cell-text: #1c1917;
      --cell-border: #1c1917;
      box-shadow:
        inset 0 0 0 2px #1c1917,
        0 0 0 1px #1c191733;
    }
  }

  &--current {
    --cell-bg: #eab30830;
    --cell-text: #eab308;
    --cell-border: #6b46c1;
    border-width: 2px;
    box-shadow: 0 0 8px #6b46c160;

    .l-cell__number {
      font-weight: 600;
    }
  }

  &--has-player {
    z-index: 4;
  }
}
</style>
