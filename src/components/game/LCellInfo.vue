<template>
  <l-modal
    v-model="isOpen"
    position="bottom"
    data-testid="cell-info-modal"
    max-width="100%"
    :show-handle="false"
  >
    <template #header>
      <l-cell-header
        v-if="currentCellInfo"
        :id="cellId"
        :name="cellName"
        :name-sanskrit="cellNameSanskrit"
      >
        <template #action>
          <q-btn
            flat
            round
            dense
            icon="close"
            @click="close"
          />
        </template>
      </l-cell-header>
    </template>

    <div class="q-pa-md">
      <template>
        <l-transition-banner
          v-if="cellId"
          :cell-id="cellId"
        />
        <l-cell-keywords
          v-if="currentCellInfo"
          :keywords="cellKeywords"
        />
      </template>

      <div
        v-if="cellDescription"
        class="q-mb-md"
      >
        <div class="text-overline text-secondary q-mb-xs">
          {{ t('cell.description') }}
        </div>
        <p class="text-body1">{{ cellDescription }}</p>
      </div>

      <!-- AI Mentor Block -->
      <div
        v-if="isPaidGame"
        class="q-mb-md"
      >
        <div v-if="isAiMentorLoading">
          <l-ai-loader
            :text="t('cell.ai_mentor_loading', 'Ментор размышляет над вашим ходом...')"
          />
        </div>
        <div v-else-if="aiInterpretationText">
          <div class="text-overline text-secondary q-mb-xs">
            {{ t('cell.ai_mentor_interpretation', 'Интерпретация хода') }}
          </div>
          <p
            class="text-body1"
            style="white-space: pre-wrap"
          >
            {{ aiInterpretationText }}
          </p>

          <div
            v-if="aiReflectionPoints"
            class="q-mt-md"
          >
            <div class="text-overline text-secondary q-mb-xs">
              {{ t('cell.reflection_questions', 'Вопросы для размышления') }}
            </div>
            <ol class="q-pl-lg q-mb-none">
              <li
                v-for="(question, index) in aiReflectionPoints"
                :key="index"
                class="q-mb-xs"
              >
                <div class="text-body2">
                  {{ question }}
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <!-- Free Game Reflection Questions -->
      <div
        v-else-if="showFreeReflectionQuestions"
        class="q-mb-md"
      >
        <div class="text-overline text-secondary q-mb-xs">
          {{ t('cell.reflection_questions', 'Вопросы для размышления') }}
        </div>
        <ul class="q-pl-lg q-mb-none">
          <li
            v-for="question in freeReflectionQuestions"
            :key="question.topic"
            class="q-mb-xs"
          >
            <div class="text-body2">
              {{ question.text }}
            </div>
          </li>
        </ul>
      </div>

      <l-clarification-panel
        v-else-if="showClarificationPanel && !isVictoryCell"
        :game-id="gameStore.currentGame?.id ?? 0"
        :game-mode="gameStore.currentGame?.mode ?? 'free'"
        :free-left="gameStore.clarificationsFreeLeft"
        :initial-clarifications="clarificationHistory"
        @clarification-added="onClarificationAdded"
      />

      <div
        v-if="currentMoveInsight"
        class="q-mt-lg q-pa-md bg-grey-2 rounded-borders dark-bg-custom"
      >
        <div class="text-overline text-secondary q-mb-xs">Ваш инсайт</div>
        <p
          class="text-body1 q-mb-none"
          style="white-space: pre-wrap"
        >
          {{ currentMoveInsight }}
        </p>
      </div>
    </div>

    <template #actions>
      <div class="row q-col-gutter-sm full-width">
        <div :class="isVictoryCell ? 'col-12 col-sm-6' : 'col-12'">
          <q-btn
            :label="currentMoveInsight ? t('actions.add_insight') : t('actions.write_insight')"
            color="primary"
            icon="mdi-pencil"
            unelevated
            class="full-width"
            data-testid="write-insight-btn"
            @click="openInsightModal"
          />
        </div>
        <div
          v-if="isVictoryCell"
          class="col-12 col-sm-6"
        >
          <q-btn
            :label="t('actions.finish_game')"
            color="accent"
            unelevated
            class="full-width"
            data-testid="victory-continue-btn"
            @click="goNext"
          />
        </div>
      </div>
    </template>
  </l-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { gamesApi } from 'src/services/api';
import type { CellBrief, Cell, ClarificationHistoryItem, GameMode } from 'src/types/game.interface';
import { useGameStore } from 'src/stores/game.store';
import { useTypewriter } from 'src/composables/useTypewriter';
import LModal from 'src/components/base/LModal.vue';
import LCellHeader from './LCellHeader.vue';
import LCellKeywords from './LCellKeywords.vue';
import LClarificationPanel from './LClarificationPanel.vue';
import LTransitionBanner from './LTransitionBanner.vue';
import LAiLoader from 'src/components/common/LAiLoader.vue';

interface Props {
  modelValue: boolean;
  currentCellInfo: CellBrief | Cell | null;
  gameMode: GameMode;
}

interface ClarificationEntry {
  question: string;
  answer: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'write-insight'): void;
  (e: 'go-next'): void;
}>();

const { t } = useI18n();
const gameStore = useGameStore();
const clarificationHistory = ref<ClarificationEntry[]>([]);
const loadedHistoryGameId = ref<number | null>(null);

const {
  typingAnswer: aiInterpretationText,
  enqueueTypewriterText,
  resetTypewriter,
} = useTypewriter();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => {
    if (!value) {
      resetTypewriter();
    }
    emit('update:modelValue', value);
  },
});

const cellId = computed(() => props.currentCellInfo?.id ?? 0);
const isVictoryCell = computed(() => cellId.value === 68);
const isPaidGame = computed(() => props.gameMode !== 'free');

const lastMove = computed(() => {
  const moves = gameStore.moves;
  return moves && moves.length > 0 ? moves[moves.length - 1] : null;
});

const isAiMentorLoading = computed(() => {
  return (
    isPaidGame.value &&
    lastMove.value?.final_cell === cellId.value &&
    !lastMove.value?.ai_interpretation
  );
});

const aiReflectionPoints = computed(() => {
  if (
    isPaidGame.value &&
    props.currentCellInfo &&
    'ai_reflection_points' in props.currentCellInfo
  ) {
    return props.currentCellInfo.ai_reflection_points || [];
  }
  return [];
});

const cellName = computed(() => {
  if (!props.currentCellInfo) return '';
  return 'name' in props.currentCellInfo
    ? props.currentCellInfo.name
    : props.currentCellInfo.name_ru;
});

const cellNameSanskrit = computed(() => {
  if (!props.currentCellInfo) return '';
  return 'name_sanskrit' in props.currentCellInfo ? props.currentCellInfo.name_sanskrit : '';
});

const cellKeywords = computed(() => {
  if (!props.currentCellInfo) return [];
  return 'keywords' in props.currentCellInfo ? props.currentCellInfo.keywords : [];
});

function normalizeLocalizedText(value: string | null | undefined): string {
  if (!value) return '';
  const trimmed = value.trim();
  return !trimmed || /^cells\./.test(trimmed) ? '' : trimmed;
}

const cellDescription = computed(() => {
  if (!props.currentCellInfo) return '';
  const isRevisit =
    'is_revisit' in props.currentCellInfo ? props.currentCellInfo.is_revisit : false;
  if (
    isRevisit &&
    'description_revisit' in props.currentCellInfo &&
    props.currentCellInfo.description_revisit
  ) {
    return normalizeLocalizedText(props.currentCellInfo.description_revisit);
  }
  return 'description' in props.currentCellInfo
    ? normalizeLocalizedText(props.currentCellInfo.description)
    : '';
});

function openInsightModal(): void {
  emit('write-insight');
}

function close(): void {
  isOpen.value = false;
}

function goNext(): void {
  emit('go-next');
}

const freeReflectionQuestions = computed(() => {
  if (!props.currentCellInfo || props.gameMode !== 'free') return [];
  const isRevisit =
    'is_revisit' in props.currentCellInfo ? props.currentCellInfo.is_revisit : false;
  const questions = isRevisit
    ? (props.currentCellInfo.questions_revisit ?? props.currentCellInfo.reflection_questions)
    : (props.currentCellInfo.questions_first ?? props.currentCellInfo.reflection_questions);

  if (!questions) return [];
  return [
    { topic: 'relationships', text: questions.relationships },
    { topic: 'money', text: questions.money },
    { topic: 'career', text: questions.career },
  ].filter((item): item is { topic: string; text: string } => Boolean(item.text));
});

const showFreeReflectionQuestions = computed(
  () =>
    props.gameMode === 'free' && freeReflectionQuestions.value.length > 0 && !isVictoryCell.value,
);

const showClarificationPanel = computed(() => !!gameStore.currentGame);

function mapHistoryToClarifications(
  items: ClarificationHistoryItem[],
  targetCellId: number,
): ClarificationEntry[] {
  return items
    .filter((item) => item.cell_id === targetCellId)
    .map((item) => ({
      question: item.question.trim(),
      answer: item.answer.trim(),
    }))
    .filter((item) => item.question.length > 0 && item.answer.length > 0);
}

function onClarificationAdded(entry: ClarificationEntry): void {
  const exists = clarificationHistory.value.some(
    (item) => item.question === entry.question && item.answer === entry.answer,
  );
  if (!exists) {
    clarificationHistory.value.push(entry);
  }
}

async function loadClarificationHistory(gameId: number): Promise<void> {
  if (!cellId.value) return;
  try {
    const response = await gamesApi.getClarificationHistory(gameId);
    clarificationHistory.value = mapHistoryToClarifications(response.items, cellId.value);
    loadedHistoryGameId.value = gameId;
  } catch {
    loadedHistoryGameId.value = gameId;
  }
}

watch(
  () => lastMove.value?.ai_interpretation,
  (newInterpretation) => {
    if (newInterpretation && lastMove.value?.final_cell === cellId.value) {
      resetTypewriter();
      void nextTick(() => {
        enqueueTypewriterText(newInterpretation);
      });
    }
  },
  { immediate: true },
);

watch(
  () => [isOpen.value, gameStore.currentGame?.id, cellId.value] as const,
  ([open, gameId, currentCellId]) => {
    if (!open || !gameId) {
      clarificationHistory.value = [];
      return;
    }
    if (!currentCellId) {
      clarificationHistory.value = [];
      return;
    }
    if (loadedHistoryGameId.value !== gameId) {
      void loadClarificationHistory(gameId);
    }
  },
  { immediate: true },
);

watch(
  () => gameStore.currentGame?.id,
  (nextGameId, prevGameId) => {
    if (nextGameId !== prevGameId) {
      clarificationHistory.value = [];
      loadedHistoryGameId.value = null;
    }
  },
);

const currentMoveInsight = computed(() => lastMove.value?.player_insight || '');
</script>

<style scoped>
.dark-bg-custom {
  background-color: var(--q-dark-page);
}

.body--dark .dark-bg-custom {
  background-color: rgba(255, 255, 255, 0.05) !important;
}
</style>
