<template>
  <q-page class="query-page">
    <div class="query-page__content">
      <!-- Выбор режима -->
      <div class="q-mb-md">
        <div class="text-overline text-secondary q-mb-sm">Режим игры</div>
        <q-card flat bordered class="q-pa-sm query-page__mode-card">
          <div class="row q-col-gutter-sm">
            <div v-for="option in gameModeOptions" :key="option.value" class="col-12 col-sm-4">
              <q-btn
                :label="option.label"
                no-caps
                class="full-width query-page__mode-btn"
                :outline="gameMode !== option.value"
                :color="gameMode === option.value ? 'accent' : inactiveModeColor"
                :text-color="gameMode === option.value ? 'white' : inactiveModeTextColor"
                @click="gameMode = option.value"
              />
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
          <q-chip
            v-for="cat in categories"
            :key="cat.value"
            :selected="category === cat.value"
            :color="category === cat.value ? 'primary' : undefined"
            :text-color="category === cat.value ? 'white' : undefined"
            :outline="category !== cat.value"
            clickable
            @click="category = cat.value"
          >
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
        <q-input
          v-model="query"
          type="textarea"
          :placeholder="$t('query.placeholder')"
          outlined
          autogrow
          :maxlength="500"
          counter
          class="query-page__input"
        >
          <template #append>
            <q-icon v-if="query" name="close" class="cursor-pointer" @click="query = ''" />
          </template>
        </q-input>
      </div>

      <!-- Примеры запросов -->
      <div class="q-mb-md">
        <div class="text-overline text-secondary q-mb-sm">
          {{ $t('query.examples') }}
        </div>
        <q-list class="rounded-borders" bordered separator>
          <q-item
            v-for="(example, index) in examples"
            :key="index"
            clickable
            @click="query = example"
          >
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
      <q-btn
        :label="$t('query.start_game')"
        color="primary"
        size="lg"
        unelevated
        class="full-width"
        :loading="isLoading"
        :disable="!canStart"
        @click="startGame"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useGameStore, type QueryCategory, type GameMode } from 'src/stores/game.store';

const $q = useQuasar();
const i18n = useI18n();
const router = useRouter();
const gameStore = useGameStore();

// Состояние формы
const query = ref('');
const category = ref<QueryCategory>('personality');
const gameMode = ref<GameMode>('free');
const isLoading = ref(false);

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

const canStart = computed(() => query.value.trim().length >= 10);

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
      border-radius: var(--radius-md);
    }

    :deep(textarea) {
      min-height: 100px;
    }
  }

  &__mode-card {
    border-radius: 10px;
  }

  &__mode-btn {
    border-radius: 8px;
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
