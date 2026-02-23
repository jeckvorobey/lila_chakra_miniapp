<template>
  <div class="l-clarification-panel q-mt-md">
    <div v-for="(entry, index) in clarifications" :key="`${index}-${entry.question}`" class="q-mb-sm">
      <q-card flat bordered class="bg-surface">
        <q-card-section class="q-pa-sm">
          <div class="text-caption text-secondary q-mb-xs">
            {{ entry.question }}
          </div>
          <div class="text-body2">
            {{ entry.answer }}
          </div>
        </q-card-section>
      </q-card>
    </div>

    <q-card v-if="isTyping && pendingQuestion" flat bordered class="bg-surface q-mb-sm">
      <q-card-section class="q-pa-sm">
        <div class="text-caption text-secondary q-mb-xs">
          {{ pendingQuestion }}
        </div>
        <div class="text-body2">
          {{ typingAnswer }}
        </div>
      </q-card-section>
    </q-card>

    <div v-if="isLoading" class="row items-center q-gutter-sm q-mb-sm">
      <q-spinner-dots color="primary" size="24px" />
      <span class="text-body2 text-secondary">{{ t('clarification.loading') }}</span>
    </div>

    <q-banner v-else-if="errorMessage" class="bg-negative-light text-negative rounded-borders q-mb-sm">
      <div class="row items-center justify-between q-gutter-sm">
        <span>{{ errorMessage }}</span>
        <q-btn
          flat
          dense
          color="negative"
          :label="t('clarification.retry')"
          @click="openInputDialog"
        />
      </div>
    </q-banner>

    <q-btn
      v-if="showAskButton"
      color="primary"
      outline
      class="full-width"
      :label="buttonLabel"
      @click="openInputDialog"
    />

    <q-dialog v-model="showInputDialog" persistent>
      <q-card class="l-clarification-panel__dialog">
        <q-card-section class="row items-center justify-between q-pb-sm">
          <div class="text-h6">{{ t('clarification.dialog_title') }}</div>
          <q-btn flat round dense icon="close" @click="closeInputDialog" />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="questionDraft"
            type="textarea"
            autogrow
            maxlength="500"
            counter
            :hint="t('query.assistant.min_chars_hint')"
            :placeholder="t('clarification.placeholder')"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="t('actions.close')" @click="closeInputDialog" />
          <q-btn
            color="primary"
            unelevated
            :label="t('clarification.submit')"
            :disable="!canSubmitQuestion"
            @click="submitQuestion"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { gamesApi } from 'src/services/api';
import { useGameStore } from 'src/stores/game.store';
import { useUserStore } from 'src/stores/user.store';
import type { ClarificationStreamEvent, GameMode } from 'src/types/game.interface';

interface Props {
  gameId: number;
  gameMode: GameMode;
  freeLeft: number;
}

interface ClarificationEntry {
  question: string;
  answer: string;
}

const props = defineProps<Props>();

const { t } = useI18n();
const gameStore = useGameStore();
const userStore = useUserStore();

const showInputDialog = ref(false);
const questionDraft = ref('');
const clarifications = ref<ClarificationEntry[]>([]);
const pendingQuestion = ref('');
const typingAnswer = ref('');
const errorMessage = ref<string | null>(null);
const isLoading = ref(false);
const isTyping = ref(false);

let streamAbortController: AbortController | null = null;

const canSubmitQuestion = computed(() => {
  const normalized = questionDraft.value.trim();
  return normalized.length >= 5 && normalized.length <= 500 && !isLoading.value;
});

const buttonLabel = computed(() => {
  const hasFreeQuestion =
    props.gameMode !== 'free' && props.freeLeft > 0;
  return hasFreeQuestion ? t('clarification.button_free') : t('clarification.button_paid');
});

const showAskButton = computed(
  () => !isLoading.value && !isTyping.value && !showInputDialog.value,
);

function clearStreamController(): void {
  if (streamAbortController) {
    streamAbortController.abort();
    streamAbortController = null;
  }
}

function openInputDialog(): void {
  errorMessage.value = null;
  showInputDialog.value = true;
}

function closeInputDialog(): void {
  showInputDialog.value = false;
}

function applyMeta(event: Extract<ClarificationStreamEvent, { type: 'meta' }>): void {
  userStore.updateBalance(event.balance_tkn);
  if (gameStore.currentGame && props.gameMode !== 'free') {
    gameStore.currentGame.clarifications_used = Math.max(0, 3 - event.free_left);
  }
}

function resolveErrorMessage(error: unknown): string {
  const axiosError = error as { response?: { data?: { detail?: string } }; message?: string };
  const detail = axiosError?.response?.data?.detail || axiosError?.message;
  if (detail === 'errors.insufficient_balance') {
    return t('clarification.insufficient_balance');
  }
  if (detail === 'errors.ai_quota_exceeded') {
    return t('clarification.quota_exceeded');
  }
  return t('clarification.error');
}

async function submitQuestion(): Promise<void> {
  const normalizedQuestion = questionDraft.value.trim();
  if (normalizedQuestion.length < 5 || normalizedQuestion.length > 500) {
    return;
  }

  showInputDialog.value = false;
  isLoading.value = true;
  errorMessage.value = null;
  pendingQuestion.value = normalizedQuestion;
  typingAnswer.value = '';
  isTyping.value = true;

  clearStreamController();
  streamAbortController = new AbortController();

  try {
    let finalAnswer = '';

    for await (const event of gamesApi.askClarificationStream(
      props.gameId,
      normalizedQuestion,
      streamAbortController.signal,
    )) {
      if (event.type === 'meta') {
        applyMeta(event);
        isLoading.value = false;
        continue;
      }
      if (event.type === 'delta') {
        typingAnswer.value += event.text;
        isLoading.value = false;
        continue;
      }
      if (event.type === 'done') {
        finalAnswer = event.answer.trim();
      }
    }

    const normalizedAnswer = (finalAnswer || typingAnswer.value).trim();
    clarifications.value.push({ question: normalizedQuestion, answer: normalizedAnswer });
    questionDraft.value = '';
    pendingQuestion.value = '';
    typingAnswer.value = '';
    isTyping.value = false;
    isLoading.value = false;
  } catch (error: unknown) {
    if (streamAbortController?.signal.aborted) {
      return;
    }
    isLoading.value = false;
    isTyping.value = false;
    pendingQuestion.value = '';
    typingAnswer.value = '';
    errorMessage.value = resolveErrorMessage(error);
  } finally {
    streamAbortController = null;
  }
}

onBeforeUnmount(() => {
  clearStreamController();
});
</script>

<style lang="scss" scoped>
.l-clarification-panel__dialog {
  width: min(640px, 92vw);
}
</style>
