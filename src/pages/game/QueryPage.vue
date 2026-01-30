<template>
  <q-page class="query-page" padding>
    <div class="query-page__content">
      <!-- Category selector -->
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

      <!-- Query input -->
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

      <!-- Example queries -->
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

      <!-- Mode selector -->
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
    </div>

    <!-- Start button -->
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

// Form state
const query = ref('');
const category = ref<QueryCategory>('SELF_DEVELOPMENT');
const gameMode = ref<GameMode>('FREE');
const isLoading = ref(false);

// Categories
const categories = computed(() => [
  {
    value: 'RELATIONSHIPS' as QueryCategory,
    label: t('query.category.relationships'),
    icon: 'mdi-heart',
  },
  { value: 'CAREER' as QueryCategory, label: t('query.category.career'), icon: 'mdi-briefcase' },
  { value: 'HEALTH' as QueryCategory, label: t('query.category.health'), icon: 'mdi-heart-pulse' },
  {
    value: 'FINANCE' as QueryCategory,
    label: t('query.category.finance'),
    icon: 'mdi-currency-usd',
  },
  {
    value: 'SPIRITUALITY' as QueryCategory,
    label: t('query.category.spirituality'),
    icon: 'mdi-yoga',
  },
  {
    value: 'SELF_DEVELOPMENT' as QueryCategory,
    label: t('query.category.self_development'),
    icon: 'mdi-account-arrow-up',
  },
]);

// Game mode options
const gameModeOptions = [
  { value: 'FREE', label: 'Бесплатный (5 ходов/день)' },
  { value: 'AI_INCOGNITO', label: 'AI Инкогнито (платный)' },
];

// Example queries
const examples = computed(() => {
  switch (category.value) {
    case 'RELATIONSHIPS':
      return [
        'Как улучшить отношения с партнёром?',
        'Почему мне сложно доверять людям?',
        'Как найти гармонию в семье?',
      ];
    case 'CAREER':
      return [
        'Как найти своё призвание?',
        'Стоит ли мне менять работу?',
        'Как развить лидерские качества?',
      ];
    case 'HEALTH':
      return [
        'Как восстановить энергию?',
        'Что мешает мне быть здоровым?',
        'Как найти баланс тела и духа?',
      ];
    case 'FINANCE':
      return [
        'Как привлечь изобилие в жизнь?',
        'Что блокирует мой финансовый рост?',
        'Как изменить отношение к деньгам?',
      ];
    case 'SPIRITUALITY':
      return [
        'Какой мой следующий шаг на духовном пути?',
        'Как развить интуицию?',
        'В чём мой жизненный урок?',
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
    // Go to entry meditation
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
    padding-bottom: calc(var(--space-md) + 64px); // Above bottom nav
    background: var(--lila-bg);
  }
}
</style>
