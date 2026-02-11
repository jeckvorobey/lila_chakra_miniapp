/**
 * Хранилище игры для управления состоянием игры Лила Чакра.
 * Содержит логику игры: броски кубика, ходы, стрелы, змеи.
 */

import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import { audioApi, gamesApi, movesApi } from 'src/services/api';
import { useReferenceStore } from 'src/stores/reference.store';
import type {
  GameDetail,
  MoveOut,
  MoveResponse,
  CellBrief,
  GameCreate,
  TransitionType,
  GameMode,
  QueryCategory,
  DiceRollRequest,
  Cell,
} from 'src/types/game.interface';
import type { MeditationAudioType } from 'src/types/audio.interface';

import {
  ARROWS,
  SNAKES,
  WINNING_CELL,
  MAX_CELL,
  CHAKRA_ROWS,
  CELLS_PER_ROW,
  WAITING_ZONE,
} from 'src/data/game-constants';

// Повторный экспорт игровых констант для удобства
export {
  ARROWS,
  SNAKES,
  WINNING_CELL,
  MAX_CELL,
  CHAKRA_ROWS,
  CELLS_PER_ROW,
  WAITING_ZONE,
};

export type { GameMode, QueryCategory };

export const useGameStore = defineStore('game', () => {
  // Состояние
  const currentGame = ref<GameDetail | null>(null);
  const moves = ref<MoveOut[]>([]);
  const currentCellInfo = ref<CellBrief | null>(null);
  const isLoading = ref(false);
  const isRolling = ref(false);
  const error = ref<string | null>(null);
  const meditationAudioUrl = ref('');
  const isMeditationAudioLoading = ref(false);
  const meditationAudioError = ref<string | null>(null);

  // Состояние кубика
  const currentDiceRolls = ref<number[]>([]);
  const lastTransition = ref<TransitionType>('none');
  const requiresAnotherRoll = ref(false);

  // Вычисляемые значения
  const isGameActive = computed(
    () =>
      currentGame.value &&
      ['waiting_for_6', 'in_progress', 'in_waiting_zone'].includes(currentGame.value.status),
  );


  const isWaitingFor6 = computed(() => currentGame.value?.status === 'waiting_for_6');

  const isInProgress = computed(() => currentGame.value?.status === 'in_progress');

  const isInWaitingZone = computed(() => currentGame.value?.status === 'in_waiting_zone');

  const isGameCompleted = computed(() => currentGame.value?.status === 'completed');

  const isGameAbandoned = computed(() => currentGame.value?.status === 'abandoned');

  const currentCell = computed(() => currentGame.value?.current_cell ?? 0);

  const needsEntryMeditation = computed(
    () => currentGame.value && !currentGame.value.entry_meditation_completed,
  );

  const needsExitMeditation = computed(
    () => currentGame.value?.status === 'completed' && !currentGame.value.exit_meditation_completed,
  );

  const moveHistory = computed(() =>
    [...moves.value].sort((a, b) => b.move_number - a.move_number),
  );

  const totalMoves = computed(() => currentGame.value?.total_moves ?? 0);

  const arrowsHit = computed(() => currentGame.value?.arrows_hit ?? 0);

  const snakesHit = computed(() => currentGame.value?.snakes_hit ?? 0);

  const highestCell = computed(() => currentGame.value?.highest_cell ?? 0);

  // Вспомогательные функции

  /**
   * Получить уровень чакры для клетки (1-8)
   */
  function getChakraLevel(cellId: number): number {
    if (cellId <= 0) return 0;
    return Math.ceil(cellId / CELLS_PER_ROW);
  }

  /**
   * Проверить, является ли клетка началом стрелы
   */
  function isArrowStart(cellId: number): boolean {
    return cellId in ARROWS;
  }

  /**
   * Проверить, является ли клетка головой змеи
   */
  function isSnakeHead(cellId: number): boolean {
    return cellId in SNAKES;
  }

  /**
   * Получить информацию о переходе для клетки
   */
  function getTransition(cellId: number): { type: TransitionType; to: number | null } {
    if (cellId in ARROWS) {
      return { type: 'arrow', to: ARROWS[cellId] ?? null };
    }
    if (cellId in SNAKES) {
      return { type: 'snake', to: SNAKES[cellId] ?? null };
    }
    return { type: 'none', to: null };
  }

  /**
   * Проверить, находится ли клетка в зоне ожидания (69-71)
   */
  function isInWaitingZoneCell(cellId: number): boolean {
    return WAITING_ZONE.has(cellId);
  }

  // Действия

  /**
   * Создать новую игру
   */
  async function createGame(payload: GameCreate): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      const game = await gamesApi.create(payload);
      currentGame.value = game as GameDetail;
      moves.value = [];
      currentDiceRolls.value = [];
      lastTransition.value = 'none';
      requiresAnotherRoll.value = false;
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Не удалось создать игру';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Загрузить существующую игру
   */
  async function loadGame(gameId: number): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      const [game, gameMoves] = await Promise.all([
        gamesApi.get(gameId),
        gamesApi.getMoves(gameId),
      ]);

      currentGame.value = game;
      moves.value = gameMoves;

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Не удалось загрузить игру';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Бросить кубик (автоматический или ручной)
   */
  async function rollDice(manualValue?: number): Promise<MoveResponse | null> {
    if (!currentGame.value || !isGameActive.value) {
      error.value = 'Нет активной игры';
      return null;
    }

    if (needsEntryMeditation.value) {
      error.value = 'Сначала необходимо выполнить входную медитацию';
      return null;
    }

    isRolling.value = true;
    error.value = null;

    try {
      const request: DiceRollRequest = {
        is_manual: manualValue !== undefined,
      };
      if (manualValue !== undefined) {
        request.manual_value = manualValue;
      }

      const response = await gamesApi.rollDice(currentGame.value.id, request);

      // Обновить состояние
      moves.value.push(response.move);
      currentDiceRolls.value = response.move.dice_rolls;
      lastTransition.value = response.move.transition_type;
      currentCellInfo.value = response.cell_info;
      requiresAnotherRoll.value = response.requires_another_roll;

      // Обновить состояние игры
      currentGame.value.status = response.game_status;
      currentGame.value.current_cell = response.move.final_cell;
      currentGame.value.total_moves += 1;

      if (response.move.transition_type === 'arrow') {
        currentGame.value.arrows_hit += 1;
      } else if (response.move.transition_type === 'snake') {
        currentGame.value.snakes_hit += 1;
      }

      if (response.move.final_cell > currentGame.value.highest_cell) {
        currentGame.value.highest_cell = response.move.final_cell;
      }

      return response;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Не удалось сделать ход';
      return null;
    } finally {
      isRolling.value = false;
    }
  }

  /**
   * Завершить входную медитацию
   */
  async function completeEntryMeditation(): Promise<boolean> {
    if (!currentGame.value) return false;

    try {
      const game = await gamesApi.completeEntryMeditation(currentGame.value.id);
      currentGame.value.entry_meditation_completed = game.entry_meditation_completed;
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Не удалось завершить медитацию';
      return false;
    }
  }

  /**
   * Завершить выходную медитацию
   */
  async function completeExitMeditation(): Promise<boolean> {
    if (!currentGame.value) return false;

    try {
      const game = await gamesApi.completeExitMeditation(currentGame.value.id);
      currentGame.value.exit_meditation_completed = game.exit_meditation_completed;
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Не удалось завершить медитацию';
      return false;
    }
  }

  /**
   * Завершить текущую игру
   */
  async function endGame(abandon = false): Promise<boolean> {
    if (!currentGame.value) return false;

    try {
      const game = await gamesApi.end(currentGame.value.id, abandon);
      currentGame.value.status = game.status;
      currentGame.value.completed_at = game.completed_at;
      currentGame.value.magic_time_ends_at = game.magic_time_ends_at;
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Не удалось завершить игру';
      return false;
    }
  }

  /**
   * Сохранить озарение для хода
   */
  async function saveInsight(moveId: number, insight: string): Promise<boolean> {
    try {
      const updatedMove = await movesApi.saveInsight(moveId, { insight });

      const move = moves.value.find((m) => m.id === moveId);
      if (move) {
        move.player_insight = updatedMove.player_insight;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Загрузить аудио медитации по типу.
   */
  async function loadMeditationAudio(type: MeditationAudioType): Promise<void> {
    isMeditationAudioLoading.value = true;
    meditationAudioError.value = null;

    try {
      const response = await audioApi.getByType(type);
      const firstAudio = response.items[0];
      meditationAudioUrl.value = firstAudio ? audioApi.getStreamUrl(firstAudio.id) : '';
    } catch (err: unknown) {
      meditationAudioUrl.value = '';
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      const detail = axiosErr?.response?.data?.detail;
      meditationAudioError.value = detail || 'Не удалось загрузить аудио медитации';
    } finally {
      isMeditationAudioLoading.value = false;
    }
  }

  /**
   * Получить полную информацию о клетке по ID (lazy-loading)
   */
  async function getCellInfo(cellId: number): Promise<Cell | null> {
    const referenceStore = useReferenceStore();
    return referenceStore.fetchCellById(cellId);
  }

  /**
   * Ручной ход (псевдоним для rollDice)
   */
  async function manualMove(value: number): Promise<MoveResponse | null> {
    return rollDice(value);
  }

  /**
   * Сбросить хранилище при выходе
   */
  function reset(): void {
    currentGame.value = null;
    moves.value = [];
    currentCellInfo.value = null;
    currentDiceRolls.value = [];
    lastTransition.value = 'none';
    requiresAnotherRoll.value = false;
    meditationAudioUrl.value = '';
    isMeditationAudioLoading.value = false;
    meditationAudioError.value = null;
    error.value = null;
  }

  return {
    // Константы
    ARROWS,
    SNAKES,
    WINNING_CELL,
    MAX_CELL,
    CHAKRA_ROWS,
    CELLS_PER_ROW,
    WAITING_ZONE,

    // Состояние
    currentGame,
    moves,
    currentCellInfo,
    isLoading,
    isRolling,
    error,
    meditationAudioUrl,
    isMeditationAudioLoading,
    meditationAudioError,
    currentDiceRolls,
    lastTransition,
    requiresAnotherRoll,

    // Вычисляемые значения
    isGameActive,
    isWaitingFor6,
    isInProgress,
    isInWaitingZone,
    isGameCompleted,
    isGameAbandoned,
    currentCell,
    needsEntryMeditation,
    needsExitMeditation,
    moveHistory,
    totalMoves,
    arrowsHit,
    snakesHit,
    highestCell,

    // Вспомогательные функции
    getChakraLevel,
    isArrowStart,
    isSnakeHead,
    getTransition,
    isInWaitingZoneCell,

    // Действия
    createGame,
    loadGame,
    rollDice,
    manualMove,
    getCellInfo,
    completeEntryMeditation,
    completeExitMeditation,
    endGame,
    saveInsight,
    loadMeditationAudio,
    reset,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGameStore, import.meta.hot));
}
