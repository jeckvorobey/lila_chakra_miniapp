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
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { gamesApi } from 'src/services/api';
import { useGameStore } from 'src/stores/game.store';
import { useUserStore } from 'src/stores/user.store';
import type { ClarificationStreamEvent, GameMode } from 'src/types/game.interface';

interface Props {
  gameId: number;
  gameMode: GameMode;
  freeLeft: number;
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

const showInputDialog = ref(false);
const questionDraft = ref('');
const clarifications = ref<ClarificationEntry[]>([]);
const pendingQuestion = ref('');
const typingAnswer = ref('');
const errorMessage = ref<string | null>(null);
const isLoading = ref(false);
const isTyping = ref(false);
const pendingTypewriterText = ref('');

let streamAbortController: AbortController | null = null;
let typewriterInterval: ReturnType<typeof setInterval> | null = null;

const TYPEWRITER_CHAR_INTERVAL_MS = 16;
const TYPEWRITER_CHARS_PER_TICK = 2;

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

function stopTypewriter(): void {
  if (typewriterInterval !== null) {
    clearInterval(typewriterInterval);
    typewriterInterval = null;
  }
}

function startTypewriter(): void {
  if (typewriterInterval !== null) {
    return;
  }
  typewriterInterval = setInterval(() => {
    if (!pendingTypewriterText.value.length) {
      stopTypewriter();
      return;
    }
    typingAnswer.value += pendingTypewriterText.value.slice(0, TYPEWRITER_CHARS_PER_TICK);
    pendingTypewriterText.value = pendingTypewriterText.value.slice(TYPEWRITER_CHARS_PER_TICK);
  }, TYPEWRITER_CHAR_INTERVAL_MS);
}

function enqueueTypewriterText(text: string): void {
  if (!text) {
    return;
  }
  pendingTypewriterText.value += text;
  startTypewriter();
}

async function waitTypewriterDrain(timeoutMs = 5000): Promise<void> {
  const startAt = Date.now();
  while (pendingTypewriterText.value.length && Date.now() - startAt < timeoutMs) {
    await new Promise((resolve) => {
      setTimeout(resolve, TYPEWRITER_CHAR_INTERVAL_MS);
    });
  }
  stopTypewriter();
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
  pendingTypewriterText.value = '';
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
    typingAnswer.value = '';
    pendingTypewriterText.value = '';
    stopTypewriter();
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
    pendingTypewriterText.value = '';
    stopTypewriter();
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
