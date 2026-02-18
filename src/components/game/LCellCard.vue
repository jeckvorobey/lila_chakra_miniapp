<template>
  <l-modal v-model="isOpen" :title="cell.name" position="bottom" max-width="100%" :show-handle="false">
    <template #header>
      <div class="l-cell-card__header" :style="headerGradientStyle">
        <div class="row items-center q-gutter-md q-px-md q-py-sm">
          <q-avatar
            :class="`bg-chakra-${rowChakraLevel}`"
            size="48px"
            :text-color="avatarTextColor"
            class="text-weight-bold"
          >
            {{ cell.id }}
          </q-avatar>

          <div class="col">
            <div class="text-h4 text-weight-bold">{{ cell.name }}</div>
            <div v-if="cell.name_sanskrit" class="text-caption text-secondary">
              {{ cell.name_sanskrit }}
            </div>
          </div>

          <q-btn flat round dense icon="close" @click="close" />
        </div>
      </div>
    </template>

    <q-scroll-area style="height: 60vh">
      <div class="l-cell-card q-pa-sm">
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
            {{ bannerType === 'arrow' ? t('transition.arrow') : t('transition.snake') }}
          </div>
          <div class="text-caption">
            <template v-if="isLastMoveTransition">
              {{
                bannerType === 'arrow'
                  ? t('transition.arrived_by_arrow', { from: transitionSource, to: transitionTarget })
                  : t('transition.arrived_by_snake', { from: transitionSource, to: transitionTarget })
              }}
            </template>
            <template v-else>
              {{ bannerType === 'arrow' ? t('transition.arrow_to') : t('transition.snake_to') }}
              <strong>{{ transitionTarget }}</strong>
            </template>
          </div>
          <div v-if="isLastMoveTransition" class="text-caption q-mt-xs">
            {{
              bannerType === 'arrow'
                ? t('transition.arrow_interpretation')
                : t('transition.snake_interpretation')
            }}
          </div>
        </q-banner>

        <div v-if="cell.keywords?.length" class="q-mb-md">
          <div class="text-overline text-secondary q-mb-xs">
            {{ t('cell.keywords') }}
          </div>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="keyword in cell.keywords"
              :key="keyword"
              color="primary"
              text-color="white"
              dense
            >
              {{ keyword }}
            </q-chip>
          </div>
        </div>

        <div class="q-mb-md">
          <div class="text-overline text-secondary q-mb-xs">
            {{ t('cell.description') }}
          </div>
          <p class="text-body1">{{ cell.description }}</p>
        </div>

        <div v-if="cell.question" class="q-mb-md">
          <div class="text-overline text-secondary q-mb-xs">
            {{ t('cell.question') }}
          </div>
          <p class="text-body1">{{ cell.question }}</p>
        </div>

        <div v-if="latestAiInterpretation" class="q-mb-md">
          <div class="text-overline text-secondary q-mb-xs">
            {{ t('cell.ai_interpretation') }}
          </div>
          <p class="text-body1 q-mb-none">
            {{ typingAiInterpretation }}
          </p>
        </div>

        <l-clarification-panel
          v-if="showClarificationPanel"
          :game-id="gameStore.currentGame?.id ?? 0"
          :game-mode="gameStore.currentGame?.mode ?? 'free'"
          :free-left="gameStore.clarificationsFreeLeft"
        />
      </div>
    </q-scroll-area>

    <template #actions>
      <q-btn
        :label="t('actions.write_insight')"
        color="primary"
        icon="mdi-pencil"
        unelevated
        class="full-width"
        @click="openInsightModal"
      />
    </template>
  </l-modal>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { Cell } from 'src/types/game.interface';
import { getChakraColor, getChakraAvatarTextColor } from 'src/data/chakra-colors';
import { cellIdToChakraLevel } from 'src/utils/board-geometry';
import { useGameStore } from 'src/stores/game.store';
import LModal from '../base/LModal.vue';
import LClarificationPanel from './LClarificationPanel.vue';

interface Props {
  modelValue: boolean;
  cell: Cell;
}

const TYPING_DELAY_MS = 30;

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'write-insight'): void;
}>();

const { t } = useI18n();
const $q = useQuasar();
const gameStore = useGameStore();
const isDarkMode = computed(() => $q.dark?.isActive ?? true);
const typingAiInterpretation = ref('');
let typingTimer: ReturnType<typeof setInterval> | null = null;

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const rowChakraLevel = computed(() => cellIdToChakraLevel(props.cell.id));
const avatarTextColor = computed(() =>
  getChakraAvatarTextColor(rowChakraLevel.value, isDarkMode.value),
);

const headerGradientStyle = computed(() => {
  const chakraColor = getChakraColor(rowChakraLevel.value, isDarkMode.value);
  return {
    background: `linear-gradient(180deg, ${chakraColor}33 0%, transparent 100%)`,
  };
});

const isArrow = computed(() => props.cell.is_arrow_start ?? false);

const isSnake = computed(() => props.cell.is_snake_head ?? false);

const latestMoveForCell = computed(() => {
  for (let index = gameStore.moves.length - 1; index >= 0; index -= 1) {
    const move = gameStore.moves[index];
    if (!move || move.final_cell !== props.cell.id) {
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
  if (move.transition_to == null || move.transition_from == null) {
    return null;
  }
  return move;
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
    return transitionFromLastMove.value.transition_from ?? '';
  }
  return props.cell.id;
});

const transitionTarget = computed(() => {
  if (transitionFromLastMove.value) {
    return transitionFromLastMove.value.transition_to ?? '';
  }
  if (isArrow.value) {
    return props.cell.arrow_end ?? '';
  }
  if (isSnake.value) {
    return props.cell.snake_tail ?? '';
  }
  return '';
});

const latestAiInterpretation = computed(() => {
  for (let index = gameStore.moves.length - 1; index >= 0; index -= 1) {
    const move = gameStore.moves[index];
    if (!move) {
      continue;
    }
    if (move.final_cell !== props.cell.id) {
      continue;
    }
    return move.ai_interpretation?.trim() || '';
  }
  return '';
});

const showClarificationPanel = computed(() => {
  if (!gameStore.currentGame) return false;
  return true;
});

function clearTypingTimer(): void {
  if (typingTimer) {
    clearInterval(typingTimer);
    typingTimer = null;
  }
}

function startTypingInterpretation(value: string): void {
  clearTypingTimer();
  typingAiInterpretation.value = '';

  if (!value) {
    return;
  }

  let charIndex = 0;
  typingTimer = setInterval(() => {
    charIndex += 1;
    typingAiInterpretation.value = value.slice(0, charIndex);
    if (charIndex >= value.length) {
      clearTypingTimer();
    }
  }, TYPING_DELAY_MS);
}

function close(): void {
  isOpen.value = false;
}

function openInsightModal(): void {
  emit('write-insight');
}

watch(
  () => latestAiInterpretation.value,
  (value) => {
    startTypingInterpretation(value);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  clearTypingTimer();
});
</script>

<style lang="scss" scoped>
.l-cell-card {
  color: var(--lila-text-primary);
}

.l-cell-card__header {
  border-radius: 24px 24px 0 0;
  margin-top: -1px;
}
</style>
