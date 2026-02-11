import { api } from 'src/boot/axios';
import type {
  DiceRollRequest,
  GameCreate,
  GameDetail,
  GameListResponse,
  GameOut,
  MoveOut,
  MoveResponse,
} from 'src/types/game.interface';

/**
 * API игр.
 */
export const gamesApi = {
  /**
   * Получить список игр пользователя.
   */
  async list(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<GameListResponse> {
    const response = await api.get<GameListResponse>('/games', { params });
    return response.data;
  },

  /**
   * Создать новую игру.
   */
  async create(data: GameCreate): Promise<GameOut> {
    const response = await api.post<GameOut>('/games', data);
    return response.data;
  },

  /**
   * Получить игру по ID.
   */
  async get(gameId: number): Promise<GameDetail> {
    const response = await api.get<GameDetail>(`/games/${gameId}`);
    return response.data;
  },

  /**
   * Завершить входную медитацию.
   */
  async completeEntryMeditation(gameId: number): Promise<GameOut> {
    const response = await api.post<GameOut>(`/games/${gameId}/meditation/entry`);
    return response.data;
  },

  /**
   * Завершить выходную медитацию.
   */
  async completeExitMeditation(gameId: number): Promise<GameOut> {
    const response = await api.post<GameOut>(`/games/${gameId}/meditation/exit`);
    return response.data;
  },

  /**
   * Завершить игру.
   */
  async end(gameId: number, abandon = false): Promise<GameOut> {
    const response = await api.post<GameOut>(`/games/${gameId}/end`, null, {
      params: { abandon },
    });
    return response.data;
  },

  /**
   * Получить ходы игры.
   */
  async getMoves(gameId: number): Promise<MoveOut[]> {
    const response = await api.get<MoveOut[]>(`/games/${gameId}/moves`);
    return response.data;
  },

  /**
   * Бросить кубик.
   */
  async rollDice(gameId: number, data?: DiceRollRequest): Promise<MoveResponse> {
    const response = await api.post<MoveResponse>(`/games/${gameId}/moves/roll`, data || {});
    return response.data;
  },
};
