<template>
  <q-page class="diary-detail" padding>
    <q-skeleton v-if="isLoading" type="rect" height="200px" />

    <template v-else-if="game">
      <!-- Раздел запроса -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <q-chip :label="$t(`query.category.${game.category}`)" size="sm" color="primary" outline class="q-mb-sm" />
          <p class="text-body1">{{ game.query }}</p>
          <div class="text-caption text-secondary">
            {{ formatDate(game.created_at) }}
          </div>
        </q-card-section>
      </q-card>

      <!-- Визуализация путешествия -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-subtitle2 text-weight-medium q-mb-md">Путь игры</div>
          <l-progress-bar :current-cell="game.current_cell" />
        </q-card-section>
      </q-card>

      <!-- Временная шкала ходов -->
      <div class="row items-center q-mb-sm">
        <div class="text-subtitle2 text-weight-medium q-mr-sm">История ходов</div>
        <q-btn flat dense round size="sm" :icon="sortOrder === 'asc' ? 'mdi-sort-ascending' : 'mdi-sort-descending'"
          @click="toggleSort">
          <q-tooltip>{{ sortOrder === 'asc' ? 'Сначала старые' : 'Сначала новые' }}</q-tooltip>
        </q-btn>
      </div>
      <q-timeline v-if="moves.length > 0" color="primary">
        <q-timeline-entry v-for="move in moves" :key="move.id" :icon="getTransitionIcon(move.transition_type)"
          :color="getTransitionColor(move.transition_type)">
          <template #title>
            <div class="row items-center">
              <span>Ход #{{ move.move_number }}</span>
              <q-badge class="q-ml-sm" color="grey-7">
                🎲 {{ move.dice_rolls.join(', ') }}
              </q-badge>
            </div>
          </template>
          <template #subtitle>
            Клетка {{ move.start_cell }} → {{ move.final_cell }}
            <span v-if="move.transition_type && move.transition_type !== 'none'"
              :class="move.transition_type === 'arrow' ? 'text-positive' : 'text-negative'">
              ({{ move.transition_type === 'arrow' ? 'Стрела' : 'Змея' }})
            </span>
          </template>
          <div v-if="move.player_insight" class="text-body2 q-mt-sm">
            <q-icon name="mdi-lightbulb" color="warning" class="q-mr-xs" />
            {{ move.player_insight }}
          </div>
          <div v-if="move.ai_interpretation" class="text-body2 q-mt-sm">
            <q-icon name="mdi-robot" color="primary" class="q-mr-xs" />
            {{ move.ai_interpretation }}
          </div>
          <div class="q-mt-sm">
            <q-btn flat dense size="sm" icon="mdi-pencil" :label="$t('actions.write_insight')"
              @click="editInsight(move)" />
          </div>
        </q-timeline-entry>
      </q-timeline>

      <div v-else class="text-body2 text-secondary text-center q-py-lg">Ходов пока нет</div>

      <!-- Действия -->
      <div class="diary-detail__actions">
        <q-btn v-if="isCurrentGameActive" :label="$t('game.continue_game')" color="primary" unelevated
          class="full-width q-mb-sm" @click="continueGame" />
        <q-btn v-if="!isCurrentGameActive && !hasAnyActiveGame" :label="$t('game.new_game')" color="primary" outline
          class="full-width" @click="$router.push('/game/new')" />
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { gamesApi, movesApi } from 'src/services/api';
import type { GameDetail, MoveOut } from 'src/types/game.interface';
import { isActiveGameStatus } from 'src/data/game-status';
import { LProgressBar } from 'src/components/base';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();

const game = ref<GameDetail | null>(null);
const moves = ref<MoveOut[]>([]);
const isLoading = ref(true);
const isCurrentGameActive = ref(false);
const hasAnyActiveGame = ref(false);
const sortOrder = ref<'asc' | 'desc'>('desc');

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getTransitionIcon(type: string | null): string {
  if (type === 'arrow') return 'mdi-arrow-up-bold';
  if (type === 'snake') return 'mdi-snake';
  return 'mdi-circle';
}

function getTransitionColor(type: string | null): string {
  if (type === 'arrow') return 'positive';
  if (type === 'snake') return 'negative';
  return 'primary';
}

function continueGame() {
  void router.push('/game');
}

async function toggleSort() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  if (game.value) {
    moves.value = await gamesApi.getMoves(game.value.id, sortOrder.value);
  }
}

function editInsight(move: MoveOut) {
  $q.dialog({
    title: t('actions.write_insight'),
    prompt: {
      model: move.player_insight || '',
      type: 'textarea',
      isValid: (val) => val.trim().length >= 3,
      autogrow: true,
    },
    persistent: true,
    ok: t('actions.save'),
    cancel: t('actions.cancel'),
  }).onOk((insight: string) => {
    void (async () => {
      const updated = await movesApi.saveInsight(move.id, { insight: insight.trim() });
      const idx = moves.value.findIndex((m) => m.id === move.id);
      if (idx >= 0) {
        moves.value[idx] = updated;
      }
    })();
  });
}

async function loadGameDetails() {
  isLoading.value = true;
  route.meta.title = 'diary.title';
  const gameId = route.params.id as string;

  try {
    const [gameData, movesData, gamesList] = await Promise.all([
      gamesApi.get(Number(gameId)),
      gamesApi.getMoves(Number(gameId), sortOrder.value),
      gamesApi.list({ limit: 20, offset: 0 }).catch(() => null),
    ]);
    game.value = gameData;
    moves.value = movesData;
    isCurrentGameActive.value = isActiveGameStatus(gameData.status);
    route.meta.title = isCurrentGameActive.value ? 'diary.active' : 'diary.completed';
    hasAnyActiveGame.value = gamesList
      ? gamesList.items.some((item) => isActiveGameStatus(item.status))
      : isCurrentGameActive.value;
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  void loadGameDetails();
});
</script>

<style lang="scss" scoped>
.diary-detail {
  min-height: 100%;
  padding-bottom: 120px;

  &__actions {
    position: fixed;
    bottom: 64px; // Над нижней навигацией
    left: 0;
    right: 0;
    padding: var(--space-md);
    background: var(--lila-bg);
    border-top: 1px solid var(--lila-border);
  }
}
</style>
