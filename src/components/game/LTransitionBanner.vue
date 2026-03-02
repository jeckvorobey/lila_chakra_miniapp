<template>
  <q-banner
    v-if="showTransitionBanner"
    :class="bannerType === 'arrow' ? 'bg-positive-light' : 'bg-negative-light'"
    class="rounded-borders q-mb-md"
  >
    <template #avatar>
      <q-icon
        :name="bannerType === 'arrow' ? 'mdi-arrow-up-bold' : 'mdi-snake'"
        :color="bannerType === 'arrow' ? 'positive' : 'negative'"
        size="32px"
      />
    </template>

    <div class="text-weight-medium">
      {{
        transitionName || (bannerType === 'arrow' ? t('transition.arrow') : t('transition.snake'))
      }}
    </div>
    <div class="text-caption">
      <template v-if="isLastMoveTransition">
        {{
          bannerType === 'arrow'
            ? t('transition.arrived_by_arrow', { from: formattedSource, to: formattedTarget })
            : t('transition.arrived_by_snake', { from: formattedSource, to: formattedTarget })
        }}
      </template>
      <template v-else>
        {{ bannerType === 'arrow' ? t('transition.arrow_to') : t('transition.snake_to') }}
        <strong>{{ formattedTarget }}</strong>
      </template>
    </div>
    <div
      v-if="isLastMoveTransition"
      class="text-caption q-mt-xs"
    >
      {{
        bannerType === 'arrow'
          ? t('transition.arrow_interpretation')
          : t('transition.snake_interpretation')
      }}
    </div>
    <div
      v-if="transitionDescription"
      class="text-caption q-mt-xs"
    >
      {{ transitionDescription }}
    </div>
  </q-banner>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useGameStore } from 'src/stores/game.store';
import { useReferenceStore } from 'src/stores/reference.store';
import type { Cell } from 'src/types/game.interface';

interface Props {
  cellId: number;
}

const props = defineProps<Props>();
const { t } = useI18n();
const gameStore = useGameStore();
const referenceStore = useReferenceStore();

const isArrow = computed(() => gameStore.isArrowStart(props.cellId));
const isSnake = computed(() => gameStore.isSnakeHead(props.cellId));

const latestMoveForCell = computed(() => {
  for (let index = gameStore.moves.length - 1; index >= 0; index -= 1) {
    const move = gameStore.moves[index];
    if (!move || move.final_cell !== props.cellId) {
      continue;
    }
    return move;
  }
  return null;
});

const transitionFromLastMove = computed(() => {
  const move = latestMoveForCell.value;
  if (!move || move.transition_type === 'none') {
    return null;
  }

  return {
    ...move,
    transition_from: move.transition_from ?? move.end_cell ?? props.cellId,
    transition_to: move.transition_to ?? move.final_cell ?? props.cellId,
  };
});

const isLastMoveTransition = computed(() => transitionFromLastMove.value !== null);

const bannerType = computed<'arrow' | 'snake' | null>(() => {
  const move = transitionFromLastMove.value;
  if (move?.transition_type === 'arrow' || move?.transition_type === 'snake') {
    return move.transition_type;
  }
  if (isArrow.value) {
    return 'arrow';
  }
  if (isSnake.value) {
    return 'snake';
  }
  return null;
});

const showTransitionBanner = computed(() => bannerType.value !== null);

const transitionSource = computed(() => {
  if (transitionFromLastMove.value) {
    return transitionFromLastMove.value.transition_from ?? props.cellId;
  }
  return props.cellId;
});

const transitionTarget = computed(() => {
  if (transitionFromLastMove.value) {
    return transitionFromLastMove.value.transition_to ?? props.cellId;
  }
  const transition = gameStore.getTransition(props.cellId);
  return transition.to ?? props.cellId;
});

const sourceCell = ref<Cell | null>(null);
const targetCell = ref<Cell | null>(null);

watch(
  () => transitionSource.value,
  async (id) => {
    if (id) {
      sourceCell.value = await referenceStore.fetchCellById(id);
    }
  },
  { immediate: true },
);

watch(
  () => transitionTarget.value,
  async (id) => {
    if (id) {
      targetCell.value = await referenceStore.fetchCellById(id);
    }
  },
  { immediate: true },
);

const transitionName = computed(() => sourceCell.value?.transition?.name || '');
const transitionDescription = computed(() => sourceCell.value?.transition?.description || '');

function formatCellLabel(cellId: number, cell: Cell | null): string {
  if (!cell) return String(cellId);
  return cell.name ? `${cellId} (${cell.name})` : String(cellId);
}

const formattedSource = computed(() => {
  return formatCellLabel(transitionSource.value, sourceCell.value);
});

const formattedTarget = computed(() => {
  return formatCellLabel(transitionTarget.value, targetCell.value);
});
</script>
