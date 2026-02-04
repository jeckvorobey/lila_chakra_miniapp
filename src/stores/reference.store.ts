import { defineStore } from 'pinia';
import { api } from 'boot/axios';
import type { Cell } from 'src/types/game.interface';

interface ReferenceState {
  cells: Cell[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
}

export const useReferenceStore = defineStore('reference', {
  state: (): ReferenceState => ({
    cells: [],
    isLoading: false,
    error: null,
    lastFetched: null,
  }),

  getters: {
    getCell: (state) => (id: number) => {
      return state.cells.find((cell) => cell.id === id);
    },
    isLoaded: (state) => state.cells.length > 0,
  },

  actions: {
    async fetchCells(force = false) {
      // Если данные уже есть и не прошло много времени, не загружаем снова (кэширование)
      // Например, кэш на 24 часа (или пока сессия активна)
      if (this.isLoaded && !force) {
        return;
      }

      this.isLoading = true;
      this.error = null;

      try {
        const response = await api.get<Cell[]>('/api/reference/cells');
        this.cells = response.data;
        this.lastFetched = Date.now();
      } catch (err) {
        console.error('Failed to fetch cells reference:', err);
        this.error = 'Не удалось загрузить данные игры';
      } finally {
        this.isLoading = false;
      }
    },
  },
});
