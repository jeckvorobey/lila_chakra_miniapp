import { defineStore } from 'pinia';
import { referenceApi } from 'src/services/api';
import type { Cell } from 'src/types/game.interface';

interface ReferenceState {
  boardCellIds: number[];
  cellCache: Record<number, Cell>;
  isLoading: boolean;
  error: string | null;
}

export const useReferenceStore = defineStore('reference', {
  state: (): ReferenceState => ({
    boardCellIds: [],
    cellCache: {},
    isLoading: false,
    error: null,
  }),

  getters: {
    /**
     * Получить клетку из кэша (синхронный)
     */
    getCell: (state) => (id: number): Cell | undefined => {
      return state.cellCache[id];
    },
  },

  actions: {
    /**
     * Загрузить список ID клеток для рендера игрового поля.
     */
    async fetchBoardCellIds(): Promise<number[]> {
      if (this.boardCellIds.length > 0) {
        return this.boardCellIds;
      }

      this.isLoading = true;
      this.error = null;

      try {
        const ids = await referenceApi.getCellIds();
        this.boardCellIds = [...ids].sort((a, b) => a - b);
        return this.boardCellIds;
      } catch (err) {
        console.error('Не удалось загрузить список клеток:', err);
        this.error = 'Не удалось загрузить список клеток';
        return [];
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Lazy-загрузка одной клетки по ID
     */
    async fetchCellById(cellId: number): Promise<Cell | null> {
      // Если уже в кэше — вернуть сразу
      if (this.cellCache[cellId]) {
        return this.cellCache[cellId];
      }

      this.isLoading = true;
      this.error = null;

      try {
        const cell = await referenceApi.getCellById(cellId);
        this.cellCache[cellId] = cell;
        return cell;
      } catch (err) {
        console.error(`Не удалось загрузить клетку ${cellId}:`, err);
        this.error = `Не удалось загрузить данные клетки ${cellId}`;
        return null;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
