<template>
  <q-page class="diary-detail lila-page-nav-offset">
    <q-skeleton
      v-if="isLoading"
      type="rect"
      height="200px"
    />

    <template v-else-if="game">
      <!-- Раздел запроса -->
      <q-card
        flat
        bordered
        class="q-mb-md"
      >
        <q-card-section>
          <q-chip
            :label="$t(`query.category.${game.category}`)"
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

      <!-- Визуализация путешествия -->
      <q-card
        flat
        bordered
        class="q-mb-md"
      >
        <q-card-section>
          <div class="text-subtitle2 text-weight-medium q-mb-md">Путь игры</div>
          <l-progress-bar :current-cell="game.current_cell" />
        </q-card-section>
      </q-card>

      <!-- Временная шкала ходов -->
      <div class="row items-center q-mb-sm">
        <div class="text-subtitle2 text-weight-medium q-mr-sm">История ходов</div>
        <q-btn
          flat
          dense
          round
          size="sm"
          :icon="sortOrder === 'asc' ? 'mdi-sort-ascending' : 'mdi-sort-descending'"
          @click="toggleSort"
        >
          <q-tooltip>{{ sortOrder === 'asc' ? 'Сначала старые' : 'Сначала новые' }}</q-tooltip>
        </q-btn>
      </div>
      <q-timeline
        v-if="timelineEntries.length > 0"
        color="primary"
      >
        <q-timeline-entry
          v-for="entry in timelineEntries"
          :key="entry.key"
          :icon="getEntryIcon(entry)"
          :color="getEntryColor(entry)"
        >
          <template #title>
            <div class="row items-center">
              <span>{{ getEntryTitle(entry) }}</span>
              <q-badge
                v-if="entry.showDice && entry.move.dice_rolls.length > 0"
                class="q-ml-sm"
                fcolor="grey-7"
              >
                🎲 {{ entry.move.dice_rolls.join(', ') }}
              </q-badge>
            </div>
          </template>
          <template #subtitle>
            <div>{{ getEntrySubtitle(entry) }}</div>
            <div class="text-caption text-secondary">{{ getCellName(entry.toCell) }}</div>
          </template>

          <!-- Ответ ИИ ментора -->
          <q-card
            v-if="(entry.kind === 'transition' || (entry.kind === 'roll' && entry.move.transition_type === 'none')) && entry.move.ai_interpretation"
            flat
            bordered
            class="q-mt-sm q-mb-sm bg-surface"
          >
            <q-card-section class="q-pa-sm">
              <div class="row items-center q-mb-xs">
                <q-icon
                  name="mdi-robot"
                  color="primary"
                  size="xs"
                  class="q-mr-xs"
                />
                <span class="text-subtitle2 text-weight-medium">
                  {{ $t('diary.ai_mentor_response') }}
                </span>
              </div>
              <div class="text-body2">{{ entry.move.ai_interpretation }}</div>
            </q-card-section>
          </q-card>

          <!-- Уточняющие вопросы -->
          <div
            v-if="(entry.kind === 'transition' || (entry.kind === 'roll' && entry.move.transition_type === 'none')) && entry.move.clarifications && entry.move.clarifications.length > 0"
            class="q-mb-sm"
          >
            <q-list
              bordered
              separator
              class="rounded-borders bg-surface"
            >
              <q-expansion-item
                v-for="clarification in entry.move.clarifications"
                :key="clarification.id"
                icon="mdi-help-circle-outline"
                :label="clarification.question"
                header-class="text-caption text-secondary"
              >
                <q-card>
                  <q-card-section class="text-body2 l-clarification-answer">
                    {{ clarification.answer }}
                  </q-card-section>
                </q-card>
              </q-expansion-item>
            </q-list>
          </div>

          <!-- Инсайт игрока -->
          <q-card
            v-if="entry.kind === 'transition' || (entry.kind === 'roll' && entry.move.transition_type === 'none')"
            flat
            bordered
            class="bg-surface q-mb-md"
          >
            <q-card-section class="q-pa-sm">
              <div
                v-if="entry.move.player_insight"
                class="q-mb-sm"
              >
                <div class="row items-center q-mb-xs">
                  <q-icon
                    name="mdi-lightbulb"
                    color="warning"
                    size="xs"
                    class="q-mr-xs"
                  />
                  <span class="text-subtitle2 text-weight-medium">
                    {{ $t('diary.insight_notes') }}
                  </span>
                </div>
                <div class="text-body2">{{ entry.move.player_insight }}</div>
              </div>

              <div class="row justify-end">
                <q-btn
                  flat
                  dense
                  size="sm"
                  color="primary"
                  :icon="entry.move.player_insight ? 'mdi-pencil' : 'mdi-plus'"
                  :label="entry.move.player_insight ? $t('actions.edit_insight') : $t('actions.write_insight')"
                  @click="editInsight(entry.move)"
                />
              </div>
            </q-card-section>
          </q-card>
        </q-timeline-entry>
      </q-timeline>

      <div
        v-else
        class="text-body2 text-secondary text-center q-py-lg"
      >
        Ходов пока нет
      </div>

      <!-- Действия -->
      <div class="diary-detail__actions row q-col-gutter-sm items-center justify-center">
        <div class="col-12 col-sm-6 row items-center justify-center q-px-sm">
          <q-btn
            v-if="isCurrentGameActive"
            :label="$t('game.continue_game')"
            color="primary"
            unelevated
            class="full-width"
            @click="continueGame"
          />
        </div>
        <div
          v-if="game?.status === 'completed'"
          class="col-12 row q-gutter-sm items-center justify-center"
        >
          <div
            v-if="!game.exit_meditation_completed"
            class="col"
          >
            <q-btn
              :label="$t('diary.meditation')"
              color="secondary"
              class="full-width"
              @click="navigateToMeditation"
            />
          </div>
          <div class="col">
            <q-btn
              :label="$t('diary.report')"
              color="accent"
              class="full-width"
              @click="navigateToReport"
            />
          </div>
        </div>
        <q-btn
          v-if="!isCurrentGameActive && !hasAnyActiveGame"
          outline
          :label="$t('game.new_game')"
          color="primary"
          class="full-width"
          @click="$router.push('/game/new')"
        />
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useGameStore } from 'src/stores/game.store';
import { gamesApi, movesApi } from 'src/services/api';
import type { GameDetail, MoveOut } from 'src/types/game.interface';
import { isActiveGameStatus } from 'src/data/game-status';
import { LProgressBar } from 'src/components/base';
import { buildDiaryTimelineEntries, type DiaryTimelineEntry } from './diary-timeline';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();
const gameStore = useGameStore();

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

function continueGame() {
  void router.push('/game');
}

async function navigateToMeditation() {
  if (!game.value) return;
  await gameStore.loadGame(game.value.id);
  void router.push('/game/meditation/exit');
}

async function navigateToReport() {
  if (!game.value) return;
  await gameStore.loadGame(game.value.id);
  void router.push(`/game/final/${game.value.id}`);
}

async function toggleSort() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  if (game.value) {
    const diaryData = await gamesApi.getDiary(game.value.id, sortOrder.value);
    moves.value = diaryData.moves;
    cellNames.value = { ...cellNames.value, ...diaryData.cell_names };
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
        const currentMove = moves.value[idx];
        if (currentMove) {
          moves.value[idx] = {
            ...updated,
            ...(currentMove.clarifications ? { clarifications: currentMove.clarifications } : {}),
          };
        }
      }
    })();
  });
}

async function loadGameDetails() {
  isLoading.value = true;
  route.meta.title = 'diary.title';
  const gameId = route.params.id as string;

  try {
    const [diaryData, gamesList] = await Promise.all([
      gamesApi.getDiary(Number(gameId), sortOrder.value),
      gamesApi.list({ limit: 20, offset: 0 }).catch(() => null),
    ]);
    game.value = diaryData.game;
    moves.value = diaryData.moves;
    cellNames.value = diaryData.cell_names;

    isCurrentGameActive.value = isActiveGameStatus(diaryData.game.status);
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
  padding: var(--layout-gap);

  &__actions {
    position: fixed;
    width: 100%;
    bottom: calc(64px + var(--layout-gap) * 2);
  }
}

.l-clarification-answer {
  white-space: pre-line;
}
</style>
