<template>
  <q-page class="diary-detail" padding>
    <q-skeleton v-if="isLoading" type="rect" height="200px" />

    <template v-else-if="game">
      <!-- Query section -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <q-chip
            :label="$t(`query.category.${game.category.toLowerCase()}`)"
            size="sm"
            color="primary"
            outline
            class="q-mb-sm"
          />
          <p class="text-body1">{{ game.query }}</p>
          <div class="text-caption text-secondary">
            {{ formatDate(game.created_at) }}
          </div>
        </q-card-section>
      </q-card>

      <!-- Journey visualization -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-subtitle2 text-weight-medium q-mb-md">Путь игры</div>
          <l-progress-bar :current-cell="game.current_cell" :show-chakra-indicator="true" />
        </q-card-section>
      </q-card>

      <!-- Moves timeline -->
      <div class="text-subtitle2 text-weight-medium q-mb-sm">История ходов</div>
      <q-timeline v-if="moves.length > 0" color="primary">
        <q-timeline-entry
          v-for="move in moves"
          :key="move.id"
          :icon="getTransitionIcon(move.transition_type)"
          :color="getTransitionColor(move.transition_type)"
        >
          <template #title>
            <div class="row items-center">
              <span>Ход #{{ move.move_number }}</span>
              <q-badge class="q-ml-sm" color="grey-7">
                🎲 {{ move.dice_rolls.join(' + ') }} = {{ move.total_roll }}
              </q-badge>
            </div>
          </template>
          <template #subtitle>
            Клетка {{ move.start_cell }} → {{ move.final_cell }}
            <span
              v-if="move.transition_type"
              :class="move.transition_type === 'ARROW' ? 'text-positive' : 'text-negative'"
            >
              ({{ move.transition_type === 'ARROW' ? 'Стрела' : 'Змея' }})
            </span>
          </template>
          <div v-if="move.insight" class="text-body2 q-mt-sm">
            <q-icon name="mdi-lightbulb" color="warning" class="q-mr-xs" />
            {{ move.insight }}
          </div>
        </q-timeline-entry>
      </q-timeline>

      <div v-else class="text-body2 text-secondary text-center q-py-lg">Ходов пока нет</div>

      <!-- Actions -->
      <div class="diary-detail__actions">
        <q-btn
          v-if="game.status === 'IN_PROGRESS' || game.status === 'WAITING_FOR_6'"
          :label="$t('game.continue_game')"
          color="primary"
          unelevated
          class="full-width q-mb-sm"
          @click="continueGame"
        />
        <q-btn
          :label="$t('game.new_game')"
          color="primary"
          outline
          class="full-width"
          @click="$router.push('/game/new')"
        />
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { LProgressBar } from 'src/components/base';

const route = useRoute();
const router = useRouter();

interface Move {
  id: string;
  move_number: number;
  dice_rolls: number[];
  total_roll: number;
  start_cell: number;
  final_cell: number;
  transition_type: 'ARROW' | 'SNAKE' | null;
  insight?: string;
}

interface Game {
  id: string;
  query: string;
  category: string;
  status: string;
  current_cell: number;
  created_at: string;
}

const game = ref<Game | null>(null);
const moves = ref<Move[]>([]);
const isLoading = ref(true);

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getTransitionIcon(type: string | null): string {
  if (type === 'ARROW') return 'mdi-arrow-up-bold';
  if (type === 'SNAKE') return 'mdi-snake';
  return 'mdi-circle';
}

function getTransitionColor(type: string | null): string {
  if (type === 'ARROW') return 'positive';
  if (type === 'SNAKE') return 'negative';
  return 'primary';
}

function continueGame() {
  void router.push('/game');
}

function loadGameDetails() {
  isLoading.value = true;
  const gameId = route.params.id as string;

  // TODO: Load from API
  // game.value = await api.get(`/api/games/${gameId}`);
  // moves.value = await api.get(`/api/games/${gameId}/moves`);

  // Mock data for now
  game.value = {
    id: gameId,
    query: 'Как найти свой путь в жизни?',
    category: 'SELF_DEVELOPMENT',
    status: 'IN_PROGRESS',
    current_cell: 17,
    created_at: new Date().toISOString(),
  };

  moves.value = [
    {
      id: '1',
      move_number: 1,
      dice_rolls: [6],
      total_roll: 6,
      start_cell: 0,
      final_cell: 1,
      transition_type: null,
    },
    {
      id: '2',
      move_number: 2,
      dice_rolls: [4],
      total_roll: 4,
      start_cell: 1,
      final_cell: 5,
      transition_type: null,
    },
    {
      id: '3',
      move_number: 3,
      dice_rolls: [6, 6],
      total_roll: 12,
      start_cell: 5,
      final_cell: 17,
      transition_type: 'ARROW',
    },
  ];

  isLoading.value = false;
}

onMounted(() => {
  loadGameDetails();
});
</script>

<style lang="scss" scoped>
.diary-detail {
  min-height: 100%;
  padding-bottom: 120px;

  &__actions {
    position: fixed;
    bottom: 64px; // Above bottom nav
    left: 0;
    right: 0;
    padding: var(--space-md);
    background: var(--lila-bg);
    border-top: 1px solid var(--lila-border);
  }
}
</style>
