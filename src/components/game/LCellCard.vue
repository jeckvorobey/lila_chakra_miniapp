<template>
  <l-modal v-model="isOpen" :title="cell.name" position="bottom" max-width="100%" :show-handle="false">
    <template #header>
      <l-cell-header
        :id="cell.id"
        :name="cell.name"
        :name-sanskrit="cell.name_sanskrit"
      >
        <template #action>
          <q-btn flat round dense icon="close" @click="close" />
        </template>
      </l-cell-header>
    </template>

    <q-scroll-area style="height: 60vh">
      <div class="l-cell-card q-pa-sm">
        <l-transition-banner :cell-id="cell.id" />

        <l-cell-keywords :keywords="cell.keywords" />

        <div v-if="baseDescription" class="q-mb-md">
          <div class="text-overline text-secondary q-mb-xs">
            {{ t('cell.description') }}
          </div>
          <p class="text-body1">{{ baseDescription }}</p>
        </div>

        <div v-if="revisitDescription" class="q-mb-md">
          <div class="text-overline text-secondary q-mb-xs">
            {{ t('cell.description_revisit') }}
          </div>
          <p class="text-body1">{{ revisitDescription }}</p>
        </div>

        <div v-if="latestAiInterpretation" class="q-mb-md">
          <div class="text-overline text-secondary q-mb-xs">
            {{ t('cell.ai_interpretation') }}
          </div>
          <p class="text-body1 q-mb-none">
            {{ typingAiInterpretation }}
          </p>
        </div>


      </div>
    </q-scroll-area>


  </l-modal>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Cell } from 'src/types/game.interface';
import { useGameStore } from 'src/stores/game.store';
import LModal from '../base/LModal.vue';
import LCellHeader from './LCellHeader.vue';
import LCellKeywords from './LCellKeywords.vue';
import LTransitionBanner from './LTransitionBanner.vue';

interface Props {
  modelValue: boolean;
  cell: Cell;
}

const TYPING_DELAY_MS = 30;

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const { t } = useI18n();
const gameStore = useGameStore();
const typingAiInterpretation = ref('');
let typingTimer: ReturnType<typeof setInterval> | null = null;

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

function normalizeLocalizedText(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed || /^cells\./.test(trimmed)) {
    return '';
  }

  return trimmed;
}

const baseDescription = computed(() => normalizeLocalizedText(props.cell.description));
const revisitDescription = computed(() => normalizeLocalizedText(props.cell.description_revisit));



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
</style>
