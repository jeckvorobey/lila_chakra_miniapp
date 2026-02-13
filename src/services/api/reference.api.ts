import { api } from 'src/boot/axios';
import type { Cell, CellReference } from 'src/types/game.interface';

/**
 * API справочных данных.
 */
export const referenceApi = {
  /**
   * Получить список клеток с данными о переходах (стрелы/змеи).
   */
  async getCells(): Promise<CellReference[]> {
    const response = await api.get<CellReference[]>('/reference/cells');
    return response.data;
  },

  /**
   * Получить клетку по ID.
   */
  async getCellById(cellId: number): Promise<Cell> {
    const response = await api.get<Cell>(`/reference/cells/${cellId}`);
    return response.data;
  },
};
