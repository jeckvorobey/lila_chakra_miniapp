<template>
  <l-modal v-model="isOpen" position="bottom" data-testid="cell-info-modal" max-width="100%" :show-handle="false">
    <template #header>
      <l-cell-header
        v-if="currentCellInfo"
        :id="cellId"
        :name="cellName"
        :name-sanskrit="cellNameSanskrit"
      />
    </template>

    <div class="q-pa-md">
      <l-cell-keywords v-if="currentCellInfo" :keywords="cellKeywords" />

      <div v-if="showReflectionQuestions">
        <div class="text-overline text-secondary q-mb-xs">
          {{ t('cell.reflection_questions') }}
        </div>
        <ul class="l-cell-info__questions q-pl-md q-mb-none">
          <li
            v-for="question in reflectionQuestionsList"
            :key="question.topic"
            class="q-mb-xs"
          >
            <div class="text-caption text-secondary">
              {{ question.label }}
            </div>
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
    </div>

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

function openInsightModal(): void {
  emit('write-insight');
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
      label: t('query.category.relationships'),
      text: questions.relationships,
    },
    {
      topic: 'money',
      label: t('query.category.finance'),
      text: questions.money,
    },
    {
      topic: 'career',
      label: t('query.category.career'),
      text: questions.career,
    },
  ].filter((item): item is { topic: string; label: string; text: string } => Boolean(item.text));
});

const showReflectionQuestions = computed(
  () => props.gameMode === 'free' && reflectionQuestionsList.value.length > 0,
);

const showClarificationPanel = computed(() => {
  if (!gameStore.currentGame) return false;
  return true;
});
</script>

<style scoped>
.l-cell-info__questions {
  list-style: none;
}
</style>
