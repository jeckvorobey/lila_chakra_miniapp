import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { referenceApi } from 'src/services/api';
import type { Cell, CellReference } from 'src/types/game.interface';

export const useReferenceStore = defineStore('reference', () => {
  // Состояние
  const cellsRef = ref<CellReference[]>([]);
  const cellCache: Record<number, Cell> = {};
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Вычисляемые маппы стрел и змей
  const arrowsMap = computed<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    for (const cell of cellsRef.value) {
      if (cell.is_arrow_start && cell.arrow_end != null) {
        map[cell.id] = cell.arrow_end;
      }
    }
    return map;
  });

  const snakesMap = computed<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    for (const cell of cellsRef.value) {
      if (cell.is_snake_head && cell.snake_tail != null) {
        map[cell.id] = cell.snake_tail;
      }
    }
    return map;
  });

  const maxCell = computed(() => cellsRef.value.length);

  const boardCellIds = computed(() =>
    cellsRef.value.map((c) => c.id).sort((a, b) => a - b),
  );

  /**
   * Загрузить список клеток с данными о переходах.
   */
  async function fetchBoardCells(): Promise<CellReference[]> {
    if (cellsRef.value.length > 0) {
      return cellsRef.value;
    }

    isLoading.value = true;
    error.value = null;

    try {
      cellsRef.value = await referenceApi.getCells();
      return cellsRef.value;
    } catch (err) {
      console.error('Не удалось загрузить список клеток:', err);
      error.value = 'Не удалось загрузить список клеток';
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Получить клетку из кэша (синхронный).
   */
  function getCell(id: number): Cell | undefined {
    return cellCache[id];
  }

  /**
   * Lazy-загрузка одной клетки по ID.
   */
  async function fetchCellById(cellId: number, forceRefresh = false): Promise<Cell | null> {
    if (!forceRefresh && cellCache[cellId]) {
      return cellCache[cellId];
    }

    isLoading.value = true;
    error.value = null;

    try {
      const cell = await referenceApi.getCellById(cellId);
      cellCache[cellId] = cell;
      return cell;
    } catch (err) {
      console.error(`Не удалось загрузить клетку ${cellId}:`, err);
      error.value = `Не удалось загрузить данные клетки ${cellId}`;
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    cellsRef,
    boardCellIds,
    arrowsMap,
    snakesMap,
    maxCell,
    isLoading,
    error,

    getCell,
    fetchBoardCells,
    fetchCellById,
  };
});
