/**
 * Game store for Lila Chakra game state management.
 * Contains game logic: dice rolls, moves, arrows, snakes.
 */

import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'src/boot/axios';

// Game constants
export const ARROWS: Record<number, number> = {
  10: 23, 17: 69, 20: 32, 22: 60, 27: 41,
  28: 50, 37: 66, 45: 67, 46: 62,
};

export const SNAKES: Record<number, number> = {
  12: 8, 16: 4, 24: 7, 29: 6, 44: 9,
  52: 35, 55: 3, 61: 13, 63: 2, 72: 51,
};

export const WINNING_CELL = 68;
export const MAX_CELL = 72;
export const CHAKRA_ROWS = 8;
export const CELLS_PER_ROW = 9;

export type GameMode = 'FREE' | 'AI_INCOGNITO' | 'AI_GUIDE';
export type GameStatus = 'WAITING_FOR_6' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
export type TransitionType = 'ARROW' | 'SNAKE' | null;

export type QueryCategory =
  | 'RELATIONSHIPS'
  | 'CAREER'
  | 'HEALTH'
  | 'FINANCE'
  | 'SPIRITUALITY'
  | 'SELF_DEVELOPMENT';

interface CellInfo {
  id: number;
  name_ru: string;
  name_sanskrit?: string;
  chakra_level: number;
  chakra_name: string;
  description_ru: string;
  affirmation_ru: string;
  question_ru?: string;
  keywords?: string[];
  is_arrow_start: boolean;
  arrow_end?: number;
  is_snake_head: boolean;
  snake_tail?: number;
}

interface Move {
  id: string;
  move_number: number;
  dice_rolls: number[];
  total_roll: number;
  is_triple_six: boolean;
  start_cell: number;
  end_cell: number;
  final_cell: number;
  transition_type: TransitionType;
  ai_interpretation?: string;
  insight?: string;
  created_at: string;
}

interface Game {
  id: string;
  query: string;
  category: QueryCategory;
  mode: GameMode;
  status: GameStatus;
  current_cell: number;
  entry_meditation_completed: boolean;
  exit_meditation_completed: boolean;
  created_at: string;
  completed_at?: string;
}

interface GameCreatePayload {
  query: string;
  category: QueryCategory;
  mode: GameMode;
}

interface MoveResult {
  move: Move;
  cell_info: CellInfo;
  game_completed: boolean;
}

export const useGameStore = defineStore('game', () => {
  // State
  const currentGame = ref<Game | null>(null);
  const moves = ref<Move[]>([]);
  const currentCellInfo = ref<CellInfo | null>(null);
  const allCells = ref<Map<number, CellInfo>>(new Map());
  const isLoading = ref(false);
  const isRolling = ref(false);
  const error = ref<string | null>(null);

  // Dice state
  const currentDiceRolls = ref<number[]>([]);
  const lastTransition = ref<TransitionType>(null);

  // Getters
  const isGameActive = computed(() =>
    currentGame.value &&
    (currentGame.value.status === 'WAITING_FOR_6' || currentGame.value.status === 'IN_PROGRESS')
  );

  const isWaitingFor6 = computed(() =>
    currentGame.value?.status === 'WAITING_FOR_6'
  );

  const isGameCompleted = computed(() =>
    currentGame.value?.status === 'COMPLETED'
  );

  const currentCell = computed(() =>
    currentGame.value?.current_cell ?? 0
  );

  const needsEntryMeditation = computed(() =>
    currentGame.value && !currentGame.value.entry_meditation_completed
  );

  const needsExitMeditation = computed(() =>
    currentGame.value?.status === 'COMPLETED' &&
    !currentGame.value.exit_meditation_completed
  );

  const moveHistory = computed(() =>
    [...moves.value].sort((a, b) => b.move_number - a.move_number)
  );

  const totalMoves = computed(() => moves.value.length);

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
   * Get cell info from cache or fetch
   */
  async function getCellInfo(cellId: number): Promise<CellInfo | null> {
    if (allCells.value.has(cellId)) {
      return allCells.value.get(cellId)!;
    }

    try {
      const response = await api.get<CellInfo>(`/api/cells/${cellId}`);
      allCells.value.set(cellId, response.data);
      return response.data;
    } catch {
      return null;
    }
  }

  // Actions

  /**
   * Fetch all cells data (for board rendering)
   */
  async function fetchAllCells(): Promise<void> {
    try {
      const response = await api.get<CellInfo[]>('/api/cells');
      allCells.value = new Map(response.data.map(cell => [cell.id, cell]));
    } catch (err) {
      console.error('Failed to fetch cells:', err);
    }
  }

  /**
   * Create a new game
   */
  async function createGame(payload: GameCreatePayload): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.post<Game>('/api/games', payload);
      currentGame.value = response.data;
      moves.value = [];
      currentDiceRolls.value = [];
      lastTransition.value = null;
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create game';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Load existing game
   */
  async function loadGame(gameId: string): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      const [gameResponse, movesResponse] = await Promise.all([
        api.get<Game>(`/api/games/${gameId}`),
        api.get<Move[]>(`/api/games/${gameId}/moves`),
      ]);

      currentGame.value = gameResponse.data;
      moves.value = movesResponse.data;

      if (currentGame.value.current_cell > 0) {
        currentCellInfo.value = await getCellInfo(currentGame.value.current_cell);
      }

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load game';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Roll dice (automatic)
   */
  async function rollDice(): Promise<MoveResult | null> {
    if (!currentGame.value || !isGameActive.value) {
      error.value = 'No active game';
      return null;
    }

    isRolling.value = true;
    error.value = null;

    try {
      const response = await api.post<MoveResult>(
        `/api/games/${currentGame.value.id}/moves/roll`
      );

      const result = response.data;

      // Update state
      moves.value.push(result.move);
      currentDiceRolls.value = result.move.dice_rolls;
      lastTransition.value = result.move.transition_type;
      currentCellInfo.value = result.cell_info;

      // Update game state
      if (result.game_completed) {
        currentGame.value.status = 'COMPLETED';
        currentGame.value.current_cell = WINNING_CELL;
      } else {
        currentGame.value.current_cell = result.move.final_cell;
        if (currentGame.value.status === 'WAITING_FOR_6' && result.move.final_cell > 0) {
          currentGame.value.status = 'IN_PROGRESS';
        }
      }

      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to roll dice';
      return null;
    } finally {
      isRolling.value = false;
    }
  }

  /**
   * Manual dice input (1-6)
   */
  async function manualMove(diceValue: number): Promise<MoveResult | null> {
    if (!currentGame.value || !isGameActive.value) {
      error.value = 'No active game';
      return null;
    }

    if (diceValue < 1 || diceValue > 6) {
      error.value = 'Invalid dice value';
      return null;
    }

    isRolling.value = true;
    error.value = null;

    try {
      const response = await api.post<MoveResult>(
        `/api/games/${currentGame.value.id}/moves/manual`,
        { dice_value: diceValue }
      );

      const result = response.data;

      // Update state (same as rollDice)
      moves.value.push(result.move);
      currentDiceRolls.value = result.move.dice_rolls;
      lastTransition.value = result.move.transition_type;
      currentCellInfo.value = result.cell_info;

      if (result.game_completed) {
        currentGame.value.status = 'COMPLETED';
        currentGame.value.current_cell = WINNING_CELL;
      } else {
        currentGame.value.current_cell = result.move.final_cell;
        if (currentGame.value.status === 'WAITING_FOR_6' && result.move.final_cell > 0) {
          currentGame.value.status = 'IN_PROGRESS';
        }
      }

      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to make move';
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
      await api.post(`/api/games/${currentGame.value.id}/meditation/entry`);
      currentGame.value.entry_meditation_completed = true;
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to complete meditation';
      return false;
    }
  }

  /**
   * Complete exit meditation
   */
  async function completeExitMeditation(): Promise<boolean> {
    if (!currentGame.value) return false;

    try {
      await api.post(`/api/games/${currentGame.value.id}/meditation/exit`);
      currentGame.value.exit_meditation_completed = true;
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to complete meditation';
      return false;
    }
  }

  /**
   * End current game
   */
  async function endGame(): Promise<boolean> {
    if (!currentGame.value) return false;

    try {
      await api.post(`/api/games/${currentGame.value.id}/end`);
      currentGame.value.status = 'ABANDONED';
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to end game';
      return false;
    }
  }

  /**
   * Save insight for a move
   */
  async function saveInsight(moveId: string, insight: string): Promise<boolean> {
    try {
      await api.post(`/api/moves/${moveId}/insight`, { insight });

      const move = moves.value.find(m => m.id === moveId);
      if (move) {
        move.insight = insight;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reset store on logout
   */
  function reset(): void {
    currentGame.value = null;
    moves.value = [];
    currentCellInfo.value = null;
    currentDiceRolls.value = [];
    lastTransition.value = null;
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

    // State
    currentGame,
    moves,
    currentCellInfo,
    allCells,
    isLoading,
    isRolling,
    error,
    currentDiceRolls,
    lastTransition,

    // Getters
    isGameActive,
    isWaitingFor6,
    isGameCompleted,
    currentCell,
    needsEntryMeditation,
    needsExitMeditation,
    moveHistory,
    totalMoves,

    // Helpers
    getChakraLevel,
    isArrowStart,
    isSnakeHead,
    getCellInfo,

    // Actions
    fetchAllCells,
    createGame,
    loadGame,
    rollDice,
    manualMove,
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
