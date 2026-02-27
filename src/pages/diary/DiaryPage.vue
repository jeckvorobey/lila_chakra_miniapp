<template>
  <q-page class="diary-page lila-page-nav-offset">
    <!-- Список игр -->
    <q-list
      v-if="orderedGames.length > 0"
      class="q-gutter-sm"
    >
      <q-card
        v-for="game in orderedGames"
        :key="game.id"
        class="diary-page__card"
        flat
        bordered
        @click="openGame(game.id)"
      >
        <q-card-section>
          <div class="row items-center q-mb-sm">
            <!-- Значок статуса -->
            <q-badge
              :color="getStatusColor(game.status)"
              :label="getStatusLabel(game.status)"
              class="q-mr-sm"
            />
            <!-- Дата -->
            <span class="text-caption text-secondary">
              {{ formatDate(game.created_at) }}
            </span>
            <q-space />
            <q-btn
              v-if="game.status === 'completed'"
              flat
              dense
              round
              color="accent"
              icon="mdi-text-box-search-outline"
              @click.stop="openReport(game.id)"
            >
              <q-tooltip>{{ $t('diary.report') }}</q-tooltip>
            </q-btn>
            <!-- Прогресс -->
            <q-chip
              size="sm"
              color="primary"
              text-color="white"
            >
              {{ game.current_cell }}/72
            </q-chip>
          </div>

          <!-- Предпросмотр запроса -->
          <div class="text-body2 ellipsis-2-lines q-mb-sm">
            {{ game.query }}
          </div>

          <!-- Категория -->
          <q-chip
            size="sm"
            outline
            color="grey"
          >
            {{ $t(`query.category.${game.category}`) }}
          </q-chip>

          <!-- Магическое время (для завершённых игр) -->
          <div
            v-if="game.status === 'completed' && game.magic_time_remaining"
            class="q-mt-sm"
          >
            <q-icon
              name="mdi-clock-outline"
              size="14px"
              color="warning"
              class="q-mr-xs"
            />
            <span class="text-caption text-warning">
              {{ $t('diary.magic_time') }}: {{ game.magic_time_remaining }}
            </span>
          </div>
        </q-card-section>
      </q-card>
    </q-list>

    <!-- Пустое состояние -->
    <div
      v-else
      class="diary-page__empty column items-center justify-center"
    >
      <q-icon
        name="mdi-book-open-variant"
        size="64px"
        color="grey-5"
        class="q-mb-md"
      />
      <p class="text-body1 text-secondary text-center">
        {{ $t('diary.empty') }}
      </p>
      <q-btn
        v-if="!hasActiveGame"
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
import { gamesApi } from 'src/services/api';
import type { GameBrief, GameStatus } from 'src/types/game.interface';
import { isActiveGameStatus } from 'src/data/game-status';

const router = useRouter();
const { t } = useI18n();

interface DiaryGame extends GameBrief {
  magic_time_remaining?: string;
}

const games = ref<DiaryGame[]>([]);
const isLoading = ref(false);
const hasActiveGame = computed(() => games.value.some((game) => isActiveGameStatus(game.status)));

const orderedGames = computed(() => {
  const ranked = games.value.map((game, index) => ({
    game,
    index,
    rank: isActiveGameStatus(game.status) ? 0 : 1,
  }));
  ranked.sort((a, b) => (a.rank !== b.rank ? a.rank - b.rank : a.index - b.index));
  return ranked.map((item) => item.game);
});

function getStatusColor(status: GameStatus): string {
  switch (status) {
    case 'in_progress':
    case 'waiting_for_6':
    case 'in_waiting_zone':
      return 'primary';
    case 'completed':
      return 'positive';
    case 'abandoned':
      return 'grey';
    default:
      return 'grey';
  }
}

function getStatusLabel(status: GameStatus): string {
  switch (status) {
    case 'in_progress':
    case 'waiting_for_6':
    case 'in_waiting_zone':
      return t('diary.active');
    case 'completed':
      return t('diary.completed');
    case 'abandoned':
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

function openGame(gameId: number) {
  void router.push(`/diary/${gameId}`);
}

function openReport(gameId: number) {
  void router.push(`/game/final/${gameId}`);
}

function formatRemainingTime(isoDate?: string | null): string | undefined {
  if (!isoDate) return undefined;
  const target = new Date(isoDate).getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return undefined;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  const remMinutes = minutes % 60;

  if (days > 0) return `${days}д ${remHours}ч`;
  if (hours > 0) return `${hours}ч ${remMinutes}м`;
  return `${remMinutes}м`;
}

async function loadGames() {
  isLoading.value = true;
  try {
    const response = await gamesApi.list();
    games.value = response.items.map((g) => {
      const remaining = formatRemainingTime(g.magic_time_ends_at);
      return remaining ? { ...g, magic_time_remaining: remaining } : g;
    });
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  void loadGames();
});
</script>

<style lang="scss" scoped>
.diary-page {
  min-height: 100%;
  padding: var(--lila-layout-gap);

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

// Обрезка в две строки
.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
