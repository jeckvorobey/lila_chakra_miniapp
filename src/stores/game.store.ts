/**
 * Game store for Lila Chakra game state management.
 * Contains game logic: dice rolls, moves, arrows, snakes.
 */

import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import { gamesApi, movesApi, cellsApi } from 'src/services/api';
import type {
  GameDetail,
  MoveOut,
  MoveResponse,
  CellBrief,
  CellOut,
  GameCreate,
  TransitionType,
  GameMode,
  QueryCategory,
  DiceRollRequest,
} from 'src/types/api';

import {
  ARROWS,
  SNAKES,
  WINNING_CELL,
  MAX_CELL,
  CHAKRA_ROWS,
  CELLS_PER_ROW,
  WAITING_ZONE,
} from 'src/data/game-constants';

// Re-export game constants for convenience
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
  // State
  const currentGame = ref<GameDetail | null>(null);
  const moves = ref<MoveOut[]>([]);
  const currentCellInfo = ref<CellBrief | null>(null);
  const cells = ref<CellOut[]>([]);
  const isLoading = ref(false);
  const isRolling = ref(false);
  const error = ref<string | null>(null);

  // Dice state
  const currentDiceRolls = ref<number[]>([]);
  const lastTransition = ref<TransitionType>('none');
  const requiresAnotherRoll = ref(false);

  // Getters
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

  // Helper functions

  /**
   * Get chakra level for a cell (1-8)
   */
  function getChakraLevel(cellId: number): number {
    if (cellId <= 0) return 0;
    return Math.ceil(cellId / CELLS_PER_ROW);
  }

  /**
   * Check if cell is an arrow start
   */
  function isArrowStart(cellId: number): boolean {
    return cellId in ARROWS;
  }

  /**
   * Check if cell is a snake head
   */
  function isSnakeHead(cellId: number): boolean {
    return cellId in SNAKES;
  }

  /**
   * Get transition info for a cell
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
   * Check if cell is in waiting zone (69-71)
   */
  function isInWaitingZoneCell(cellId: number): boolean {
    return WAITING_ZONE.has(cellId);
  }

  // Actions

  /**
   * Create a new game
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
   * Load existing game
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
   * Roll dice (automatic or manual)
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

      // Update state
      moves.value.push(response.move);
      currentDiceRolls.value = response.move.dice_rolls;
      lastTransition.value = response.move.transition_type;
      currentCellInfo.value = response.cell_info;
      requiresAnotherRoll.value = response.requires_another_roll;

      // Update game state
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
   * Complete entry meditation
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
   * Complete exit meditation
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
   * End current game
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
   * Save insight for a move
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
   * Fetch all cells data
   */
  async function fetchAllCells(): Promise<void> {
    try {
      cells.value = await cellsApi.list();
    } catch (err) {
      console.error('Failed to fetch cells:', err);
    }
  }

  /**
   * Get full cell info by ID
   */
  async function getCellInfo(cellId: number): Promise<CellOut | null> {
    // Try from local cache first
    const cached = cells.value.find((c) => c.id === cellId);
    if (cached) return cached;

    try {
      return await cellsApi.get(cellId);
    } catch (err) {
      console.error(`Failed to fetch cell info for ${cellId}:`, err);
      return null;
    }
  }

  /**
   * Manual move (alias for rollDice)
   */
  async function manualMove(value: number): Promise<MoveResponse | null> {
    return rollDice(value);
  }

  /**
   * Reset store on logout
   */
  function reset(): void {
    currentGame.value = null;
    moves.value = [];
    currentCellInfo.value = null;
    cells.value = [];
    currentDiceRolls.value = [];
    lastTransition.value = 'none';
    requiresAnotherRoll.value = false;
    error.value = null;
  }

  return {
    // Constants
    ARROWS,
    SNAKES,
    WINNING_CELL,
    MAX_CELL,
    CHAKRA_ROWS,
    CELLS_PER_ROW,
    WAITING_ZONE,

    // State
    currentGame,
    moves,
    currentCellInfo,
    cells,
    isLoading,
    isRolling,
    error,
    currentDiceRolls,
    lastTransition,
    requiresAnotherRoll,

    // Getters
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

    // Helpers
    getChakraLevel,
    isArrowStart,
    isSnakeHead,
    getTransition,
    isInWaitingZoneCell,

    // Actions
    createGame,
    loadGame,
    rollDice,
    manualMove,
    fetchAllCells,
    getCellInfo,
    completeEntryMeditation,
    completeExitMeditation,
    endGame,
    saveInsight,
    reset,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGameStore, import.meta.hot));
}
