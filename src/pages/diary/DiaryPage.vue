<template>
  <q-page class="diary-page" padding>
    <!-- Filter tabs -->
    <q-tabs
      v-model="filter"
      class="q-mb-md"
      align="justify"
      indicator-color="primary"
      active-color="primary"
      narrow-indicator
    >
      <q-tab name="all" :label="$t('diary.filter.all')" />
      <q-tab name="active" :label="$t('diary.filter.active')" />
      <q-tab name="completed" :label="$t('diary.filter.completed')" />
    </q-tabs>

    <!-- Games list -->
    <q-list v-if="filteredGames.length > 0" class="q-gutter-sm">
      <q-card
        v-for="game in filteredGames"
        :key="game.id"
        class="diary-page__card"
        flat
        bordered
        @click="openGame(game.id)"
      >
        <q-card-section>
          <div class="row items-center q-mb-sm">
            <!-- Status badge -->
            <q-badge
              :color="getStatusColor(game.status)"
              :label="getStatusLabel(game.status)"
              class="q-mr-sm"
            />
            <!-- Date -->
            <span class="text-caption text-secondary">
              {{ formatDate(game.created_at) }}
            </span>
            <q-space />
            <!-- Progress -->
            <q-chip size="sm" color="primary" text-color="white">
              {{ game.current_cell }}/72
            </q-chip>
          </div>

          <!-- Query preview -->
          <div class="text-body2 ellipsis-2-lines q-mb-sm">
            {{ game.query }}
          </div>

          <!-- Category -->
          <q-chip size="sm" outline color="grey">
            {{ $t(`query.category.${game.category.toLowerCase()}`) }}
          </q-chip>

          <!-- Magic time (for completed games) -->
          <div v-if="game.status === 'COMPLETED' && game.magic_time_remaining" class="q-mt-sm">
            <q-icon name="mdi-clock-outline" size="14px" color="warning" class="q-mr-xs" />
            <span class="text-caption text-warning">
              {{ $t('diary.magic_time') }}: {{ game.magic_time_remaining }}
            </span>
          </div>
        </q-card-section>
      </q-card>
    </q-list>

    <!-- Empty state -->
    <div v-else class="diary-page__empty column items-center justify-center">
      <q-icon name="mdi-book-open-variant" size="64px" color="grey-5" class="q-mb-md" />
      <p class="text-body1 text-secondary text-center">
        {{ $t('diary.empty') }}
      </p>
      <q-btn
        :label="$t('game.new_game')"
        color="primary"
        unelevated
        class="q-mt-md"
        @click="$router.push('/game/new')"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const { t } = useI18n();

type GameStatus = 'WAITING_FOR_6' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

interface Game {
  id: string;
  query: string;
  category: string;
  status: GameStatus;
  current_cell: number;
  created_at: string;
  magic_time_remaining?: string;
}

const filter = ref<'all' | 'active' | 'completed'>('all');
const games = ref<Game[]>([]);
const isLoading = ref(false);

const filteredGames = computed(() => {
  if (filter.value === 'all') return games.value;
  if (filter.value === 'active') {
    return games.value.filter((g) => g.status === 'WAITING_FOR_6' || g.status === 'IN_PROGRESS');
  }
  return games.value.filter((g) => g.status === 'COMPLETED');
});

function getStatusColor(status: GameStatus): string {
  switch (status) {
    case 'IN_PROGRESS':
    case 'WAITING_FOR_6':
      return 'primary';
    case 'COMPLETED':
      return 'positive';
    case 'ABANDONED':
      return 'grey';
    default:
      return 'grey';
  }
}

function getStatusLabel(status: GameStatus): string {
  switch (status) {
    case 'IN_PROGRESS':
    case 'WAITING_FOR_6':
      return t('diary.active');
    case 'COMPLETED':
      return t('diary.completed');
    case 'ABANDONED':
      return t('diary.abandoned');
    default:
      return status;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function openGame(gameId: string) {
  void router.push(`/diary/${gameId}`);
}

function loadGames() {
  isLoading.value = true;
  // TODO: Load games from API
  // games.value = await api.get('/api/games');
  isLoading.value = false;
}

onMounted(() => {
  loadGames();
});
</script>

<style lang="scss" scoped>
.diary-page {
  min-height: 100%;
  padding-bottom: 80px; // Bottom nav

  &__card {
    background: var(--lila-surface);
    border-color: var(--lila-border);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--lila-primary);
      transform: translateY(-2px);
    }
  }

  &__empty {
    min-height: 50vh;
    padding: var(--space-xl);
  }
}

.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
