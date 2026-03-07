import { api } from 'src/lib/api-client';
import type { InsightCreate, MoveOut } from 'src/types/game.interface';

/**
 * API ходов.
 */
export const movesApi = {
  /**
   * Получить ход по ID.
   */
  async get(moveId: number): Promise<MoveOut> {
    const response = await api.get<MoveOut>(`/moves/${moveId}`);
    return response.data;
  },

  /**
   * Сохранить озарение для хода.
   */
  async saveInsight(moveId: number, data: InsightCreate): Promise<MoveOut> {
    const response = await api.post<MoveOut>(`/moves/${moveId}/insight`, data);
    return response.data;
  },
};
