<template>
  <div :class="cellClasses" :style="cellStyle" @click="handleClick" @long-press="handleLongPress">
    <!-- Номер клетки -->
    <span class="l-cell__number">{{ cellId }}</span>

    <!-- Специальный индикатор (стрела/змея) -->
    <q-icon
      v-if="isArrow"
      name="mdi-arrow-up-bold"
      class="l-cell__icon l-cell__icon--arrow"
      size="16px"
    />
    <q-icon
      v-else-if="isSnake"
      name="mdi-snake"
      class="l-cell__icon l-cell__icon--snake"
      size="16px"
    />

    <!-- Индикатор фишки игрока -->
    <div v-if="hasPlayer" class="l-cell__player">
      <div class="l-cell__player-dot" />
    </div>

    <!-- Подсказка при наведении/касании -->
    <q-tooltip v-if="showTooltip" anchor="top middle" self="bottom middle" class="l-cell__tooltip">
      <div class="text-weight-medium">{{ cellName }}</div>
      <div v-if="isArrow" class="text-caption text-positive">
        {{ $t('transition.arrow_to') }} {{ arrowTarget }}
      </div>
      <div v-if="isSnake" class="text-caption text-negative">
        {{ $t('transition.snake_to') }} {{ snakeTarget }}
      </div>
    </q-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ARROWS, SNAKES } from 'src/stores/game.store';

interface Props {
  cellId: number;
  cellName?: string;
  isCurrentPosition?: boolean;
  hasPlayer?: boolean;
  disabled?: boolean;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  cellName: '',
  isCurrentPosition: false,
  hasPlayer: false,
  disabled: false,
  showTooltip: true,
  size: 'md',
});

const emit = defineEmits<{
  (e: 'click', cellId: number): void;
  (e: 'long-press', cellId: number): void;
}>();

// Рассчитать уровень чакры (1-8)
const chakraLevel = computed(() => {
  if (props.cellId <= 0) return 0;
  return Math.ceil(props.cellId / 9);
});

// Проверить наличие специальных клеток
const isArrow = computed(() => props.cellId in ARROWS);
const isSnake = computed(() => props.cellId in SNAKES);
const arrowTarget = computed(() => ARROWS[props.cellId]);
const snakeTarget = computed(() => SNAKES[props.cellId]);

// Это победная клетка (68)?
const isWinningCell = computed(() => props.cellId === 68);

const cellClasses = computed(() => [
  'l-cell',
  `l-cell--size-${props.size}`,
  `l-cell--chakra-${chakraLevel.value}`,
  {
    'l-cell--current': props.isCurrentPosition,
    'l-cell--arrow': isArrow.value,
    'l-cell--snake': isSnake.value,
    'l-cell--winning': isWinningCell.value,
    'l-cell--disabled': props.disabled,
    'l-cell--has-player': props.hasPlayer,
  },
]);

const cellStyle = computed(() => ({
  '--chakra-color': `var(--chakra-${chakraLevel.value})`,
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
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;

  // Базовые стили
  background: var(--lila-surface);
  border: 1px solid var(--lila-border);

  // Размеры
  &--size-sm {
    width: 32px;
    height: 32px;
    font-size: 10px;
  }

  &--size-md {
    width: 40px;
    height: 40px;
    font-size: 12px;
  }

  &--size-lg {
    width: 48px;
    height: 48px;
    font-size: 14px;
  }

  // Цвета чакр (тонкий фоновый оттенок)
  @for $i from 1 through 8 {
    &--chakra-#{$i} {
      background: linear-gradient(
        135deg,
        rgba(var(--chakra-#{$i}-rgb, 107, 70, 193), 0.1),
        transparent
      );
      border-color: rgba(var(--chakra-#{$i}-rgb, 107, 70, 193), 0.3);
    }
  }

  // Текущая позиция
  &--current {
    border-color: var(--chakra-color);
    box-shadow: 0 0 12px var(--chakra-color);
    animation: cell-pulse 2s ease-in-out infinite;
  }

  // Клетка со стрелой
  &--arrow {
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), transparent);
    }
  }

  // Клетка со змеёй
  &--snake {
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), transparent);
    }
  }

  // Победная клетка (68)
  &--winning {
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(147, 51, 234, 0.3));
    border-color: var(--chakra-8);
    box-shadow: 0 0 15px rgba(251, 191, 36, 0.5);
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--has-player {
    z-index: 10;
  }

  // Эффект наведения
  &:hover:not(&--disabled) {
    transform: scale(1.1);
    z-index: 5;
  }

  &:active:not(&--disabled) {
    transform: scale(0.95);
  }

  // Номер
  &__number {
    font-weight: 600;
    color: var(--lila-text-primary);
    z-index: 1;
  }

  // Иконки
  &__icon {
    position: absolute;
    top: 2px;
    right: 2px;
    z-index: 2;

    &--arrow {
      color: var(--lila-success);
    }

    &--snake {
      color: var(--lila-error);
    }
  }

  // Индикатор игрока
  &__player {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3;

    &-dot {
      width: 60%;
      height: 60%;
      background: var(--lila-primary);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--lila-primary);
      animation: player-pulse 1.5s ease-in-out infinite;
    }
  }

  &__tooltip {
    background: var(--lila-surface-elevated);
    color: var(--lila-text-primary);
    border: 1px solid var(--lila-border);
    padding: var(--space-sm) var(--space-md);
  }
}

@keyframes cell-pulse {
  0%,
  100% {
    box-shadow: 0 0 8px var(--chakra-color);
  }
  50% {
    box-shadow: 0 0 16px var(--chakra-color);
  }
}

@keyframes player-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}
</style>
