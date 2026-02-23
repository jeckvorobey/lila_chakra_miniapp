<template>
  <l-modal v-model="isOpen" position="bottom" data-testid="cell-info-modal" max-width="100%" :show-handle="false">
    <template #header>
      <l-cell-header
        v-if="currentCellInfo"
        :id="cellId"
        :name="cellName"
        :name-sanskrit="cellNameSanskrit"
      >
        <template #action>
          <q-btn flat round dense icon="close" @click="close" />
        </template>
      </l-cell-header>
    </template>

    <div class="q-pa-md">
      <l-cell-keywords v-if="currentCellInfo" :keywords="cellKeywords" />

      <div v-if="cellDescription" class="q-mb-md">
        <div class="text-overline text-secondary q-mb-xs">
          {{ t('cell.description') }}
        </div>
        <p class="text-body1">{{ cellDescription }}</p>
      </div>

      <div v-if="showReflectionQuestions">
        <div class="text-overline text-secondary q-mb-xs">
          {{ t('cell.reflection_questions') }}
        </div>
        <ul class="q-pl-lg q-mb-none">
          <li
            v-for="question in reflectionQuestionsList"
            :key="question.topic"
            class="q-mb-xs"
          >
            <div class="text-body2">
              {{ question.text }}
            </div>
          </li>
        </ul>
      </div>
      <div v-else class="text-center text-secondary q-py-md">
        Отражение не найдено
      </div>

      <l-clarification-panel
        v-if="showClarificationPanel"
        :game-id="gameStore.currentGame?.id ?? 0"
        :game-mode="gameStore.currentGame?.mode ?? 'free'"
        :free-left="gameStore.clarificationsFreeLeft"
      />

      <div v-if="currentMoveInsight" class="q-mt-lg q-pa-md bg-grey-2 rounded-borders dark-bg-custom">
        <div class="text-overline text-secondary q-mb-xs">
          Ваш инсайт
        </div>
        <p class="text-body1 q-mb-none" style="white-space: pre-wrap;">{{ currentMoveInsight }}</p>
      </div>
    </div>

    <template #actions>
      <q-btn
        :label="currentMoveInsight ? 'Дополнить инсайт' : t('actions.write_insight')"
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
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CellBrief, Cell, GameMode } from 'src/types/game.interface';
import { useGameStore } from 'src/stores/game.store';
import LModal from 'src/components/base/LModal.vue';
import LCellHeader from './LCellHeader.vue';
import LCellKeywords from './LCellKeywords.vue';
import LClarificationPanel from './LClarificationPanel.vue';

interface Props {
  modelValue: boolean;
  currentCellInfo: CellBrief | Cell | null;
  gameMode: GameMode;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'write-insight'): void;
}>();

const { t } = useI18n();
const gameStore = useGameStore();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const cellId = computed(() => props.currentCellInfo?.id ?? 0);

const cellName = computed(() => {
  if (!props.currentCellInfo) return '';
  return 'name' in props.currentCellInfo ? props.currentCellInfo.name : props.currentCellInfo.name_ru;
});

const cellNameSanskrit = computed(() => {
  if (!props.currentCellInfo) return '';
  return 'name_sanskrit' in props.currentCellInfo ? props.currentCellInfo.name_sanskrit : '';
});

const cellKeywords = computed(() => {
  if (!props.currentCellInfo) return [];
  return 'keywords' in props.currentCellInfo ? props.currentCellInfo.keywords : [];
});

const cellDescription = computed(() => {
  if (!props.currentCellInfo) return '';
  const isRevisit = 'is_revisit' in props.currentCellInfo ? props.currentCellInfo.is_revisit : false;
  if (isRevisit && 'description_revisit' in props.currentCellInfo && props.currentCellInfo.description_revisit) {
    return props.currentCellInfo.description_revisit;
  }
  return 'description' in props.currentCellInfo ? props.currentCellInfo.description : '';
});

function openInsightModal(): void {
  emit('write-insight');
}

function close(): void {
  isOpen.value = false;
}

const reflectionQuestionsList = computed(() => {
  if (!props.currentCellInfo) return [];
  const isRevisit = 'is_revisit' in props.currentCellInfo ? props.currentCellInfo.is_revisit : false;

  const questions = isRevisit
    ? (props.currentCellInfo.questions_revisit ?? props.currentCellInfo.reflection_questions)
    : (props.currentCellInfo.questions_first ?? props.currentCellInfo.reflection_questions);
  
  if (!questions) {
    return [];
  }

  return [
    {
      topic: 'relationships',
      text: questions.relationships,
    },
    {
      topic: 'money',
      text: questions.money,
    },
    {
      topic: 'career',
      text: questions.career,
    },
  ].filter((item): item is { topic: string; text: string } => Boolean(item.text));
});

const showReflectionQuestions = computed(
  () => props.gameMode === 'free' && reflectionQuestionsList.value.length > 0,
);

const showClarificationPanel = computed(() => {
  if (!gameStore.currentGame) return false;
  return true;
});

const currentMoveInsight = computed(() => {
  const moves = gameStore.moves;
  if (!moves || !moves.length) return '';
  const lastMove = moves[moves.length - 1];
  return lastMove?.player_insight || '';
});
</script>

<style scoped>
.dark-bg-custom {
  background-color: var(--q-dark-page);
}
.body--dark .dark-bg-custom {
  background-color: rgba(255, 255, 255, 0.05) !important;
}
</style>
