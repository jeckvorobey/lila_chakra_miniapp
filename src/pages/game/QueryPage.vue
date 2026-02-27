<template>
  <q-page class="query-page">
    <div class="query-page__content">
      <!-- Выбор режима -->
      <div class="q-mb-md">
        <div class="text-overline text-secondary q-mb-sm">Режим игры</div>
        <q-card flat bordered class="q-pa-sm query-page__mode-card">
          <div class="row q-col-gutter-sm">
            <div v-for="option in gameModeOptions" :key="option.value" class="col-12 col-sm-4">
              <q-btn :label="option.label" no-caps class="full-width query-page__mode-btn"
                :outline="gameMode !== option.value" :color="gameMode === option.value ? 'accent' : inactiveModeColor"
                :text-color="gameMode === option.value ? 'white' : inactiveModeTextColor"
                @click="gameMode = option.value" />
            </div>
          </div>
        </q-card>
      </div>

      <!-- Выбор категории -->
      <div class="q-mb-md">
        <div class="text-overline text-secondary q-mb-sm">
          {{ $t('query.category_title') }}
        </div>
        <div class="row q-gutter-sm">
          <q-chip v-for="cat in categories" :key="cat.value" :selected="category === cat.value"
            :color="category === cat.value ? 'primary' : undefined"
            :text-color="category === cat.value ? 'white' : undefined" :outline="category !== cat.value" clickable
            @click="category = cat.value">
            <q-icon :name="cat.icon" class="q-mr-xs" />
            {{ cat.label }}
          </q-chip>
        </div>
      </div>

      <!-- Ввод запроса -->
      <div class="q-mb-md">
        <div class="text-overline text-secondary q-mb-sm">
          {{ $t('query.your_question') }}
        </div>
        <q-input v-model="query" type="textarea" :placeholder="$t('query.placeholder')" outlined autogrow
          :maxlength="500" counter class="query-page__input">
          <template #append>
            <q-icon v-if="query" name="close" class="cursor-pointer" @click="clearQuery" />
          </template>
        </q-input>
      </div>

      <!-- ИИ-помощник формулировки -->
      <div class="q-mb-md">
        <q-card flat bordered class="query-page__assistant-card">
          <div class="text-subtitle2 text-weight-medium">
            {{ $t('query.assistant.title') }}
          </div>
          <div class="text-caption text-secondary q-mt-xs q-mb-md">
            {{ $t('query.assistant.subtitle') }}
          </div>

          <q-btn v-if="!isAssistantComposerOpen" :label="$t('query.assistant.describe')" color="accent" outline no-caps
            class="full-width q-mb-sm query-page__assistant-action-btn" @click="openAssistantComposer" />

          <div v-else class="q-mb-sm">
            <q-input v-model="assistantDraft" type="textarea" :placeholder="$t('query.assistant.situation_placeholder')"
              outlined autogrow :maxlength="500" counter class="query-page__assistant-input q-mb-sm" />
            <q-btn :label="$t('query.assistant.send')" color="accent" outline no-caps
              class="full-width query-page__assistant-action-btn" :loading="isSuggestionsLoading" :disable="!canSuggest"
              @click="requestSuggestions" />
          </div>

          <div v-if="showMinCharsHint" class="text-caption text-secondary q-mb-sm">
            {{ $t('query.assistant.min_chars_hint') }}
          </div>

          <div v-if="suggestionState === 'loading'" class="query-page__assistant-loading">
            <q-spinner-dots color="accent" size="20px" />
            <span class="text-caption">{{ $t('query.assistant.loading') }}</span>
          </div>

          <q-banner v-else-if="suggestionState === 'error'" dense rounded class="bg-negative text-white q-mt-sm">
            {{ suggestionError || $t('query.assistant.error') }}
            <template #action>
              <q-btn flat dense no-caps text-color="white" :label="$t('query.assistant.retry')"
                @click="requestSuggestions" />
            </template>
          </q-banner>

          <q-list v-else-if="suggestionState === 'success'" bordered separator class="rounded-borders">
            <q-item v-for="item in suggestions" :key="item.id" clickable :active="selectedSuggestionId === item.id"
              active-class="query-page__assistant-item--selected" @click="applySuggestion(item)">
              <q-item-section>
                <q-item-label class="text-body2">{{ item.text }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon :name="selectedSuggestionId === item.id ? 'mdi-check-circle' : 'mdi-chevron-right'"
                  :color="selectedSuggestionId === item.id ? 'accent' : 'grey'" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- Примеры запросов -->
      <div class="q-mb-md">
        <div class="text-overline text-secondary q-mb-sm">
          {{ $t('query.examples') }}
        </div>
        <q-list class="rounded-borders" bordered separator>
          <q-item v-for="(example, index) in examples" :key="index" clickable @click="query = example">
            <q-item-section>
              <q-item-label class="text-body2">{{ example }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="mdi-chevron-right" color="grey" />
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </div>

    <!-- Кнопка начать -->
    <div class="query-page__footer">
      <q-btn :label="$t('query.start_game')" color="primary" size="lg" unelevated class="full-width"
        :loading="isLoading" :disable="!canStart" @click="startGame" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuerySuggestions } from 'src/composables/useQuerySuggestions';
import { useGameStore, type QueryCategory, type GameMode } from 'src/stores/game.store';

const $q = useQuasar();
const i18n = useI18n();
const router = useRouter();
const gameStore = useGameStore();
const { generateSuggestions } = useQuerySuggestions();

type SuggestionState = 'idle' | 'loading' | 'success' | 'error';

interface QuerySuggestion {
  id: string;
  text: string;
}

// Состояние формы
const query = ref('');
const assistantDraft = ref('');
const category = ref<QueryCategory>('personality');
const gameMode = ref<GameMode>('free');
const isLoading = ref(false);
const isAssistantComposerOpen = ref(false);
const suggestionState = ref<SuggestionState>('idle');
const suggestions = ref<QuerySuggestion[]>([]);
const selectedSuggestionId = ref<string | null>(null);
const suggestionError = ref('');

// Категории
const categories = computed(() => [
  {
    value: 'relationships' as QueryCategory,
    label: i18n.t('query.category.relationships'),
    icon: 'mdi-heart',
  },
  {
    value: 'career' as QueryCategory,
    label: i18n.t('query.category.career'),
    icon: 'mdi-briefcase',
  },
  {
    value: 'health' as QueryCategory,
    label: i18n.t('query.category.health'),
    icon: 'mdi-heart-pulse',
  },
  {
    value: 'finance' as QueryCategory,
    label: i18n.t('query.category.finance'),
    icon: 'mdi-currency-usd',
  },
  {
    value: 'freedom' as QueryCategory,
    label: i18n.t('query.category.freedom'),
    icon: 'mdi-map',
  },
  {
    value: 'personality' as QueryCategory,
    label: i18n.t('query.category.personality'),
    icon: 'mdi-account-circle',
  },
]);

// Опции режима игры
const gameModeOptions: ReadonlyArray<{ value: GameMode; label: string }> = [
  { value: 'free', label: 'Бесплатный' },
  { value: 'ai_guide', label: 'ИИ Наставник (15 ТКН)' },
  { value: 'ai_incognito', label: 'ИИ Наставник [Инкогнито] (20 ТКН)' },
];

const inactiveModeColor = computed(() => ($q.dark.isActive ? 'grey-9' : 'grey-2'));
const inactiveModeTextColor = computed(() => ($q.dark.isActive ? 'grey-3' : 'dark'));

type QueryExamplesByCategory = Partial<Record<QueryCategory, string[]>>;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isQueryExamplesByCategory(value: unknown): value is QueryExamplesByCategory {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every(isStringArray);
}

const examplesByCategory = computed<QueryExamplesByCategory>(() => {
  const localizedExamples = i18n.tm('query.examples_by_category');
  return isQueryExamplesByCategory(localizedExamples) ? localizedExamples : {};
});

// Примеры запросов
const examples = computed(
  () => examplesByCategory.value[category.value] ?? examplesByCategory.value.personality ?? [],
);

const canSuggest = computed(() => assistantDraft.value.trim().length >= 5);
const showMinCharsHint = computed(
  () => isAssistantComposerOpen.value && assistantDraft.value.trim().length > 0 && !canSuggest.value,
);
const isSuggestionsLoading = computed(() => suggestionState.value === 'loading');
const canStart = computed(() => query.value.trim().length >= 10);

function clearQuery() {
  query.value = '';
  resetSuggestions();
}

function resetSuggestions() {
  suggestionState.value = 'idle';
  suggestions.value = [];
  selectedSuggestionId.value = null;
  suggestionError.value = '';
}

function openAssistantComposer() {
  isAssistantComposerOpen.value = true;
  if (!assistantDraft.value.trim() && query.value.trim()) {
    assistantDraft.value = query.value.trim();
  }
}

function applySuggestion(item: QuerySuggestion) {
  query.value = item.text;
  selectedSuggestionId.value = item.id;
}

async function requestSuggestions() {
  if (!canSuggest.value || suggestionState.value === 'loading') return;

  suggestionState.value = 'loading';
  suggestions.value = [];
  selectedSuggestionId.value = null;
  suggestionError.value = '';

  try {
    const result = await generateSuggestions({
      draft: assistantDraft.value.trim(),
      category: category.value,
      count: 10,
    });

    suggestions.value = result.map((text, index) => ({
      id: `suggestion-${index + 1}`,
      text,
    }));

    suggestionState.value = suggestions.value.length > 0 ? 'success' : 'error';
    if (suggestions.value.length === 0) {
      suggestionError.value = i18n.t('query.assistant.error');
    }
  } catch (error) {
    suggestionState.value = 'error';
    if (error instanceof Error && error.message.startsWith('errors.')) {
      suggestionError.value = i18n.t(error.message);
      return;
    }
    suggestionError.value = error instanceof Error ? error.message : i18n.t('query.assistant.error');
  }
}

async function startGame() {
  if (!canStart.value) return;

  isLoading.value = true;

  const success = await gameStore.createGame({
    query: query.value.trim(),
    category: category.value,
    mode: gameMode.value,
  });

  isLoading.value = false;

  if (success) {
    // Перейти на входную медитацию
    void router.push('/game/meditation/entry');
  }
}
</script>

<style lang="scss" scoped>
.query-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: var(--lila-layout-gap);

  &__content {
    flex: 1;
  }

  &__input {
    :deep(.q-field__control) {
      background: var(--lila-surface);
    }

    :deep(textarea) {
      min-height: 100px;
    }
  }

  &__assistant-card {
    background: var(--lila-surface);
    padding: 16px;
    overflow: hidden;
  }

  &__assistant-card :deep(.q-list) {
    overflow: hidden;
  }

  &__assistant-loading {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
  }

  &__assistant-item--selected {
    background: color-mix(in srgb, var(--q-accent) 16%, transparent);
  }

  &__footer {
    position: sticky;
    bottom: 0;
    padding: var(--lila-layout-gap) 0;
    padding-bottom: calc(64px + var(--lila-layout-gap) * 3);
    background: var(--lila-bg);
  }
}
</style>
