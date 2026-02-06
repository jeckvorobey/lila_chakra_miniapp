import { defineStore } from 'pinia';
import { api } from 'boot/axios';
import type { Cell } from 'src/types/game.interface';

interface ReferenceState {
  cellCache: Record<number, Cell>;
  isLoading: boolean;
  error: string | null;
}

export const useReferenceStore = defineStore('reference', {
  state: (): ReferenceState => ({
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
        const response = await api.get<Cell>(`/api/reference/cells/${cellId}`);
        this.cellCache[cellId] = response.data;
        return response.data;
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
