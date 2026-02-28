<template>
  <div class="l-clarification-panel q-mt-md">
    <LClarificationList
      :items="clarifications"
      :is-typing="isTyping"
      :pending-question="pendingQuestion"
      :typing-answer="typingAnswer"
    />

    <LAiLoader
      v-if="isLoading"
      :text="t('clarification.loading')"
    />

    <q-banner
      v-else-if="errorMessage"
      class="bg-negative-light text-negative rounded-borders q-mb-sm"
    >
      <div class="row items-center justify-between q-gutter-sm">
        <span>{{ errorMessage }}</span>
        <q-btn
          flat
          dense
          color="negative"
          :label="t('clarification.retry')"
          @click="executeSubmit(questionDraft)"
        />
      </div>
    </q-banner>

    <q-btn
      v-if="showAskButton"
      color="primary"
      outline
      class="full-width l-clarification-ask-btn"
      @click="openInputDialog"
    >
      <span>{{ t('clarification.button_paid_base') }}</span>
      <span
        v-if="isPaid"
        class="text-accent q-ml-xs"
        >({{ t('clarification.button_paid_cost') }})</span
      >
    </q-btn>

    <q-dialog
      v-model="showInputDialog"
      persistent
    >
      <q-card class="l-clarification-panel__dialog">
        <q-card-section class="row items-center justify-between q-pb-sm">
          <div class="text-h6">{{ t('clarification.dialog_title') }}</div>
          <q-btn
            flat
            round
            dense
            icon="close"
            @click="closeInputDialog"
          />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="questionDraft"
            type="textarea"
            autofocus
            autogrow
            maxlength="500"
            counter
            :hint="t('query.assistant.min_chars_hint')"
            :placeholder="t('clarification.placeholder')"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            :label="t('actions.close')"
            @click="closeInputDialog"
          />
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
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { gamesApi } from 'src/services/api';
import { useGameStore } from 'src/stores/game.store';
import { useUserStore } from 'src/stores/user.store';
import { useUiStore } from 'src/stores/ui.store';
import type { ClarificationStreamEvent } from 'src/types/game.interface';
import LAiLoader from 'src/components/common/LAiLoader.vue';
import { useTypewriter } from 'src/composables/useTypewriter';
import LClarificationList from './LClarificationList.vue';

interface Props {
  gameId: number;
  isNextClarificationPaid: boolean;
  initialClarifications?: ClarificationEntry[];
}

interface ClarificationEntry {
  question: string;
  answer: string;
}

const props = withDefaults(defineProps<Props>(), {
  initialClarifications: () => [],
});
const emit = defineEmits<{
  (e: 'clarification-added', payload: ClarificationEntry): void;
}>();

const { t } = useI18n();
const gameStore = useGameStore();
const userStore = useUserStore();
const uiStore = useUiStore();

const {
  isTyping,
  typingAnswer,
  enqueueTypewriterText,
  waitTypewriterDrain,
  resetTypewriter,
  stopTypewriter,
} = useTypewriter();

const showInputDialog = ref(false);
const questionDraft = ref('');
const clarifications = ref<ClarificationEntry[]>([]);
const pendingQuestion = ref('');
const errorMessage = ref<string | null>(null);
const isLoading = ref(false);
const CLARIFICATION_COST_TKN = 1;

let streamAbortController: AbortController | null = null;

watch(
  () => props.initialClarifications,
  (value) => {
    clarifications.value = [...value];
  },
  { immediate: true, deep: true },
);

const canSubmitQuestion = computed(() => {
  const normalized = questionDraft.value.trim();
  return normalized.length >= 5 && normalized.length <= 500 && !isLoading.value;
});

const isPaid = computed(() => {
  return props.isNextClarificationPaid;
});

const showAskButton = computed(() => !isLoading.value && !isTyping.value && !showInputDialog.value);

function clearStreamController(): void {
  if (streamAbortController) {
    streamAbortController.abort();
    streamAbortController = null;
  }
}

function appendClarification(entry: ClarificationEntry): void {
  const alreadyExists = clarifications.value.some(
    (item) => item.question === entry.question && item.answer === entry.answer,
  );
  if (alreadyExists) {
    return;
  }
  clarifications.value.push(entry);
  emit('clarification-added', entry);
}

function openInputDialog(): void {
  errorMessage.value = null;

  if (isPaid.value) {
    uiStore.requestTokenConfirm({
      amount: CLARIFICATION_COST_TKN,
      title: t('payment.token_confirm.title'),
      message: t('payment.token_confirm.message_clarification', {
        amount: CLARIFICATION_COST_TKN,
      }),
      onConfirm: () => {
        showInputDialog.value = true;
      },
    });
  } else {
    showInputDialog.value = true;
  }
}

function closeInputDialog(): void {
  showInputDialog.value = false;
}

function applyMeta(event: Extract<ClarificationStreamEvent, { type: 'meta' }>): void {
  userStore.updateBalance(event.balance_tkn);
  if (gameStore.currentGame) {
    if (gameStore.currentGame.mode === 'free') {
      gameStore.currentGame.is_next_clarification_paid = true;
    } else {
      gameStore.currentGame.clarifications_used += 1;
      gameStore.currentGame.is_next_clarification_paid =
        gameStore.currentGame.clarifications_used >= 2;
    }
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

  await executeSubmit(normalizedQuestion);
}

async function executeSubmit(normalizedQuestion: string): Promise<void> {
  if (!normalizedQuestion) return;

  showInputDialog.value = false;
  isLoading.value = true;
  errorMessage.value = null;
  pendingQuestion.value = normalizedQuestion;
  typingAnswer.value = '';
  stopTypewriter();
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
        enqueueTypewriterText(event.text);
        isLoading.value = false;
        continue;
      }
      if (event.type === 'done') {
        finalAnswer = event.answer.trim();
      }
    }

    await waitTypewriterDrain();
    const normalizedAnswer = (finalAnswer || typingAnswer.value).trim();
    if (normalizedAnswer) {
      appendClarification({ question: normalizedQuestion, answer: normalizedAnswer });
    }
    questionDraft.value = '';
    pendingQuestion.value = '';
    resetTypewriter();
  } catch (error: unknown) {
    if (streamAbortController?.signal.aborted) {
      return;
    }
    isLoading.value = false;
    pendingQuestion.value = '';
    resetTypewriter();
    errorMessage.value = resolveErrorMessage(error);
  } finally {
    streamAbortController = null;
  }
}

onBeforeUnmount(() => {
  clearStreamController();
  stopTypewriter();
});
</script>

<style lang="scss" scoped>
.l-clarification-panel__dialog {
  width: min(640px, 92vw);
}
</style>
