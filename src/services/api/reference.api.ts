import { api } from 'src/boot/axios';
import type { Cell } from 'src/types/game.interface';

/**
 * API справочных данных.
 */
export const referenceApi = {
  /**
   * Получить клетку по ID.
   */
  async getCellById(cellId: number): Promise<Cell> {
    const response = await api.get<Cell>(`/reference/cells/${cellId}`);
    return response.data;
  },
};
