<template>
  <l-modal v-model="isOpen" :title="cellName" position="bottom" max-width="100%">
    <template #header>
      <div class="l-cell-card__header">
        <!-- Cell number badge -->
        <q-avatar
          :style="{ background: chakraColor }"
          size="48px"
          text-color="white"
          class="text-weight-bold"
        >
          {{ cellId }}
        </q-avatar>

        <div class="l-cell-card__header-text">
          <div class="text-h6 text-weight-bold">{{ cellName }}</div>
          <div class="text-caption text-secondary">
            <q-icon name="mdi-yoga" size="14px" class="q-mr-xs" />
            {{ chakraName }} ({{ $t(`chakra.${chakraLevel}`) }})
          </div>
        </div>

        <q-btn flat round dense icon="close" @click="close" />
      </div>
    </template>

    <q-scroll-area style="height: 60vh">
      <div class="l-cell-card__content">
        <!-- Cell illustration -->
        <div class="l-cell-card__image q-mb-md">
          <q-img v-if="imageUrl" :src="imageUrl" :ratio="16 / 10" class="rounded-borders">
            <template #loading>
              <q-skeleton type="rect" class="full-width full-height" />
            </template>
          </q-img>
          <div v-else class="l-cell-card__image-placeholder">
            <q-icon name="mdi-image-outline" size="48px" color="grey-6" />
          </div>
        </div>

        <!-- Description -->
        <div class="l-cell-card__section">
          <div class="text-overline text-secondary q-mb-xs">
            {{ $t('cell.description') }}
          </div>
          <p class="text-body1">{{ description }}</p>
        </div>

        <!-- Affirmation -->
        <q-card flat bordered class="l-cell-card__affirmation q-my-md">
          <q-card-section>
            <div class="text-overline text-secondary q-mb-xs">
              {{ $t('cell.affirmation') }}
            </div>
            <p class="text-body1 text-italic text-primary">"{{ affirmation }}"</p>
          </q-card-section>
        </q-card>

        <!-- Reflection question -->
        <div v-if="question" class="l-cell-card__section">
          <div class="text-overline text-secondary q-mb-xs">
            {{ $t('cell.question') }}
          </div>
          <p class="text-body1">{{ question }}</p>
        </div>

        <!-- Transition info -->
        <q-banner
          v-if="isArrow || isSnake"
          :class="isArrow ? 'bg-positive-light' : 'bg-negative-light'"
          class="rounded-borders q-my-md"
        >
          <template #avatar>
            <q-icon
              :name="isArrow ? 'mdi-arrow-up-bold' : 'mdi-snake'"
              :color="isArrow ? 'positive' : 'negative'"
              size="32px"
            />
          </template>

          <div class="text-weight-medium">
            {{ isArrow ? $t('transition.arrow') : $t('transition.snake') }}
          </div>
          <div class="text-caption">
            {{ isArrow ? $t('transition.arrow_to') : $t('transition.snake_to') }}
            <strong>{{ transitionTarget }}</strong>
          </div>
        </q-banner>

        <!-- AI Interpretation (if available) -->
        <q-expansion-item
          v-if="aiInterpretation"
          icon="mdi-robot"
          :label="$t('cell.ai_interpretation')"
          class="l-cell-card__ai q-mt-md"
          header-class="text-primary"
        >
          <q-card>
            <q-card-section>
              <p class="text-body2">{{ aiInterpretation }}</p>
            </q-card-section>
          </q-card>
        </q-expansion-item>

        <!-- Audio player (compact) -->
        <div v-if="audioUrl" class="l-cell-card__audio q-mt-md">
          <q-btn
            round
            color="primary"
            :icon="isPlaying ? 'mdi-pause' : 'mdi-play'"
            @click="toggleAudio"
          />
          <div class="l-cell-card__audio-info q-ml-md">
            <div class="text-caption text-secondary">Audio description</div>
            <q-linear-progress :value="audioProgress" color="primary" class="q-mt-xs" rounded />
          </div>
        </div>
      </div>
    </q-scroll-area>

    <template #actions>
      <q-btn
        :label="$t('actions.write_insight')"
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
import { ref, computed } from 'vue';
import LModal from '../base/LModal.vue';
import { ARROWS, SNAKES } from 'src/stores/game.store';

interface Props {
  modelValue: boolean;
  cellId: number;
  cellName?: string;
  chakraLevel?: number;
  chakraName?: string;
  description?: string;
  affirmation?: string;
  question?: string;
  imageUrl?: string;
  audioUrl?: string;
  aiInterpretation?: string;
}

const props = withDefaults(defineProps<Props>(), {
  cellName: '',
  chakraLevel: 1,
  chakraName: '',
  description: '',
  affirmation: '',
  question: '',
  imageUrl: '',
  audioUrl: '',
  aiInterpretation: '',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'write-insight'): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

// Chakra colors
const chakraColors: Record<number, string> = {
  1: '#DC2626',
  2: '#EA580C',
  3: '#FBBF24',
  4: '#22C55E',
  5: '#0EA5E9',
  6: '#4F46E5',
  7: '#9333EA',
  8: '#F5F5F4',
};

const chakraColor = computed(() => chakraColors[props.chakraLevel] || chakraColors[1]);

// Transition checks
const isArrow = computed(() => props.cellId in ARROWS);
const isSnake = computed(() => props.cellId in SNAKES);
const transitionTarget = computed(() => ARROWS[props.cellId] || SNAKES[props.cellId]);

// Audio player state
const isPlaying = ref(false);
const audioProgress = ref(0);

function close() {
  isOpen.value = false;
}

function toggleAudio() {
  isPlaying.value = !isPlaying.value;
  // Audio logic would go here
}

function openInsightModal() {
  emit('write-insight');
}
</script>

<style lang="scss" scoped>
.l-cell-card {
  &__header {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-md);
    border-bottom: 1px solid var(--lila-border);
  }

  &__header-text {
    flex: 1;
    min-width: 0;
  }

  &__content {
    padding: var(--space-md);
  }

  &__image {
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  &__image-placeholder {
    aspect-ratio: 16 / 10;
    background: var(--lila-surface);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
  }

  &__section {
    margin-bottom: var(--space-md);
  }

  &__affirmation {
    background: var(--lila-surface);
    border-color: var(--lila-primary) !important;
  }

  &__ai {
    background: var(--lila-surface);
    border-radius: var(--radius-md);
  }

  &__audio {
    display: flex;
    align-items: center;
    padding: var(--space-md);
    background: var(--lila-surface);
    border-radius: var(--radius-md);
  }

  &__audio-info {
    flex: 1;
  }
}

// Banner colors for light backgrounds
.bg-positive-light {
  background: rgba(34, 197, 94, 0.1) !important;
}

.bg-negative-light {
  background: rgba(239, 68, 68, 0.1) !important;
}
</style>
