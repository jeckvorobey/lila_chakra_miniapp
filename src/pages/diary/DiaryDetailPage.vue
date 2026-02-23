<template>
  <q-page class="diary-detail lila-page-nav-offset">
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
      <q-timeline v-if="timelineEntries.length > 0" color="primary">
        <q-timeline-entry
          v-for="entry in timelineEntries"
          :key="entry.key"
          :icon="getEntryIcon(entry)"
          :color="getEntryColor(entry)"
        >
          <template #title>
            <div class="row items-center">
              <span>{{ getEntryTitle(entry) }}</span>
              <q-badge v-if="entry.showDice && entry.move.dice_rolls.length > 0" class="q-ml-sm" color="grey-7">
                🎲 {{ entry.move.dice_rolls.join(', ') }}
              </q-badge>
            </div>
          </template>
          <template #subtitle>
            <div>{{ getEntrySubtitle(entry) }}</div>
            <div class="text-caption text-secondary">{{ getCellName(entry.toCell) }}</div>
          </template>
          <div v-if="entry.kind === 'roll' && entry.move.player_insight" class="text-body2 q-mt-sm">
            <q-icon name="mdi-lightbulb" color="warning" class="q-mr-xs" />
            {{ entry.move.player_insight }}
          </div>
          <div v-if="entry.kind === 'roll' && entry.move.ai_interpretation" class="text-body2 q-mt-sm">
            <q-icon name="mdi-robot" color="primary" class="q-mr-xs" />
            {{ entry.move.ai_interpretation }}
          </div>
          <div v-if="entry.kind === 'roll'" class="q-mt-sm">
            <q-btn flat dense size="sm" icon="mdi-pencil" :label="$t('actions.write_insight')"
              @click="editInsight(entry.move)" />
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
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { gamesApi, movesApi } from 'src/services/api';
import type { GameDetail, MoveOut } from 'src/types/game.interface';
import { isActiveGameStatus } from 'src/data/game-status';
import { LProgressBar } from 'src/components/base';
import { useReferenceStore } from 'src/stores/reference.store';
import {
  buildDiaryTimelineEntries,
  type DiaryTimelineEntry,
} from './diary-timeline';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();
const referenceStore = useReferenceStore();

const game = ref<GameDetail | null>(null);
const moves = ref<MoveOut[]>([]);
const timelineEntries = computed(() => buildDiaryTimelineEntries(moves.value, sortOrder.value));
const cellNames = ref<Record<number, string>>({});
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

function getEntryIcon(entry: DiaryTimelineEntry): string {
  if (entry.kind === 'transition' && entry.transitionType === 'arrow') return 'mdi-arrow-up-bold';
  if (entry.kind === 'transition' && entry.transitionType === 'snake') return 'mdi-snake';
  return 'mdi-circle';
}

function getEntryColor(entry: DiaryTimelineEntry): string {
  if (entry.kind === 'transition' && entry.transitionType === 'arrow') return 'positive';
  if (entry.kind === 'transition' && entry.transitionType === 'snake') return 'negative';
  return 'primary';
}

function getEntryTitle(entry: DiaryTimelineEntry): string {
  if (entry.kind === 'transition') {
    const action = entry.transitionType === 'arrow' ? 'Подъём' : 'Спуск';
    return `Ход #${entry.move.move_number} • ${action}`;
  }
  return `Ход #${entry.move.move_number}`;
}

function getEntrySubtitle(entry: DiaryTimelineEntry): string {
  if (entry.kind === 'transition') {
    const transitionLabel = entry.transitionType === 'arrow' ? 'Стрела' : 'Змея';
    return `${transitionLabel}: клетка ${entry.fromCell} → ${entry.toCell}`;
  }

  return `Клетка ${entry.fromCell} → ${entry.toCell}`;
}

function getCellName(cellId: number): string {
  if (cellId <= 0) {
    return 'Вне поля';
  }
  return cellNames.value[cellId] || `Клетка ${cellId}`;
}

async function ensureCellNamesLoaded(entries: DiaryTimelineEntry[]): Promise<void> {
  const targetIds = [...new Set(entries.map((entry) => entry.toCell).filter((cellId) => cellId > 0))];
  const missingIds = targetIds.filter((cellId) => !cellNames.value[cellId]);
  if (missingIds.length === 0) {
    return;
  }

  const loadedCells = await Promise.all(
    missingIds.map(async (cellId) => {
      const cachedCell = referenceStore.getCell(cellId);
      if (cachedCell?.name) {
        return [cellId, cachedCell.name] as const;
      }

      const cell = await referenceStore.fetchCellById(cellId);
      return [cellId, cell?.name || ''] as const;
    }),
  );

  const updatedMap = { ...cellNames.value };
  for (const [cellId, name] of loadedCells) {
    if (name) {
      updatedMap[cellId] = name;
    }
  }
  cellNames.value = updatedMap;
}

function continueGame() {
  void router.push('/game');
}

async function toggleSort() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  if (game.value) {
    const movesData = await gamesApi.getMoves(game.value.id, sortOrder.value);
    moves.value = movesData;
    void ensureCellNamesLoaded(buildDiaryTimelineEntries(movesData, sortOrder.value));
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
    void ensureCellNamesLoaded(buildDiaryTimelineEntries(movesData, sortOrder.value));
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
  padding: var(--lila-layout-gap);

  &__actions {
    position: fixed;
    bottom: calc(64px + var(--lila-layout-gap) * 2);
    left: var(--lila-layout-gap);
    right: var(--lila-layout-gap);
    padding: var(--lila-layout-gap) 0;
    background: var(--lila-bg);
    border-top: 1px solid var(--lila-border);
  }
}
</style>
