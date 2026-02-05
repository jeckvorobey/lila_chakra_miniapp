<template>
  <q-page class="query-page" padding>
    <div class="query-page__content">
      <!-- Выбор режима -->
      <div class="q-mb-lg">
        <div class="text-overline text-secondary q-mb-sm">Режим игры</div>
        <q-option-group
          v-model="gameMode"
          :options="gameModeOptions"
          type="radio"
          color="primary"
          inline
        />
      </div>

      <!-- Выбор категории -->
      <div class="q-mb-lg">
        <div class="text-overline text-secondary q-mb-sm">
          {{ $t('query.category.relationships').split(' ')[0] }}
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
      <div class="q-mb-lg">
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
      <div class="q-mb-lg">
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
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useGameStore, type QueryCategory, type GameMode } from 'src/stores/game.store';

const { t } = useI18n();
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
    label: t('query.category.relationships'),
    icon: 'mdi-heart',
  },
  { value: 'career' as QueryCategory, label: t('query.category.career'), icon: 'mdi-briefcase' },
  { value: 'health' as QueryCategory, label: t('query.category.health'), icon: 'mdi-heart-pulse' },
  {
    value: 'finance' as QueryCategory,
    label: t('query.category.finance'),
    icon: 'mdi-currency-usd',
  },
  {
    value: 'freedom' as QueryCategory,
    label: t('query.category.freedom'),
    icon: 'mdi-map',
  },
  {
    value: 'personality' as QueryCategory,
    label: t('query.category.personality'),
    icon: 'mdi-account-circle',
  },
]);

// Опции режима игры
const gameModeOptions = [
  { value: 'free', label: 'Бесплатный (5 ходов/день)' },
  { value: 'ai_guide', label: 'ИИ Наставник (15 BE)' },
  { value: 'ai_incognito', label: 'ИИ Наставник [Инкогнито] (20 BE)' },
];

// Примеры запросов
const examples = computed(() => {
  switch (category.value) {
    case 'relationships':
      return [
        'Как улучшить отношения с партнёром?',
        'Почему мне сложно доверять людям?',
        'Как найти гармонию в семье?',
      ];
    case 'career':
      return [
        'Как найти своё призвание?',
        'Стоит ли мне менять работу?',
        'Как развить лидерские качества?',
      ];
    case 'health':
      return [
        'Как восстановить энергию?',
        'Что мешает мне быть здоровым?',
        'Как найти баланс тела и духа?',
      ];
    case 'finance':
      return [
        'Как привлечь изобилие в жизнь?',
        'Что блокирует мой финансовый рост?',
        'Как изменить отношение к деньгам?',
      ];
    case 'freedom':
      return [
        'Куда мне стоит поехать?',
        'Как обрести внутреннюю свободу?',
        'Что мешает мне путешествовать?',
      ];
    default:
      return [
        'Над чем мне стоит поработать сейчас?',
        'Что мешает мне двигаться вперёд?',
        'Какое качество мне развить?',
      ];
  }
});

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

  &__footer {
    position: sticky;
    bottom: 0;
    padding: var(--space-md) 0;
    padding-bottom: calc(var(--space-md) + 64px); // Над нижней навигацией
    background: var(--lila-bg);
  }
}
</style>
