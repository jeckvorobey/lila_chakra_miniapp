<template>
  <div class="q-mt-md">
    <div
      v-for="(entry, index) in items"
      :key="`${index}-${entry.question}`"
      class="q-mb-sm"
    >
      <q-card
        flat
        bordered
        class="bg-surface"
      >
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

    <q-card
      v-if="isTyping && pendingQuestion"
      flat
      bordered
      class="bg-surface q-mb-sm"
    >
      <q-card-section class="q-pa-sm">
        <div class="text-caption text-secondary q-mb-xs">
          {{ pendingQuestion }}
        </div>
        <div class="text-body2">
          {{ typingAnswer }}
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { QCard, QCardSection } from 'quasar';

interface ClarificationEntry {
  question: string;
  answer: string;
}

interface Props {
  items: ClarificationEntry[];
  isTyping?: boolean;
  pendingQuestion?: string;
  typingAnswer?: string;
}

withDefaults(defineProps<Props>(), {
  items: () => [],
  isTyping: false,
  pendingQuestion: '',
  typingAnswer: '',
});
</script>

<style lang="scss" scoped>
/* No specific styles here, will be inherited or provided by Quasar */
</style>
