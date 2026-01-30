/**
 * API service layer for backend communication.
 */

import { api } from 'src/boot/axios';
import type {
  GameCreate,
  GameOut,
  GameDetail,
  GameListResponse,
  MoveOut,
  MoveResponse,
  DiceRollRequest,
  InsightCreate,
  TelegramAuthRequest,
  TelegramAuthResponse,
  UserOut,
  UserStats,
  CellOut,
} from 'src/types/api';

// Auth API
export const authApi = {
  /**
   * Authenticate with Telegram initData
   */
  async authenticate(data: TelegramAuthRequest): Promise<TelegramAuthResponse> {
    const response = await api.post<TelegramAuthResponse>('/api/auth/telegram', data);
    return response.data;
  },

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<UserOut> {
    const response = await api.get<UserOut>('/api/auth/me');
    return response.data;
  },
};

// Users API
export const usersApi = {
  /**
   * Get user profile
   */
  async getProfile(): Promise<UserOut> {
    const response = await api.get<UserOut>('/api/users/me');
    return response.data;
  },

  /**
   * Get user stats
   */
  async getStats(): Promise<UserStats> {
    const response = await api.get<UserStats>('/api/users/me/stats');
    return response.data;
  },

  /**
   * Update user settings
   */
  async updateSettings(data: {
    language_code?: string;
    has_seen_onboarding?: boolean;
  }): Promise<UserOut> {
    const response = await api.patch<UserOut>('/api/users/me', data);
    return response.data;
  },
};

// Games API
export const gamesApi = {
  /**
   * Get user's games list
   */
  async list(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<GameListResponse> {
    const response = await api.get<GameListResponse>('/api/games', { params });
    return response.data;
  },

  /**
   * Create a new game
   */
  async create(data: GameCreate): Promise<GameOut> {
    const response = await api.post<GameOut>('/api/games', data);
    return response.data;
  },

  /**
   * Get game by ID
   */
  async get(gameId: number): Promise<GameDetail> {
    const response = await api.get<GameDetail>(`/api/games/${gameId}`);
    return response.data;
  },

  /**
   * Complete entry meditation
   */
  async completeEntryMeditation(gameId: number): Promise<GameOut> {
    const response = await api.post<GameOut>(`/api/games/${gameId}/meditation/entry`);
    return response.data;
  },

  /**
   * Complete exit meditation
   */
  async completeExitMeditation(gameId: number): Promise<GameOut> {
    const response = await api.post<GameOut>(`/api/games/${gameId}/meditation/exit`);
    return response.data;
  },

  /**
   * End game
   */
  async end(gameId: number, abandon = false): Promise<GameOut> {
    const response = await api.post<GameOut>(`/api/games/${gameId}/end`, null, {
      params: { abandon },
    });
    return response.data;
  },

  /**
   * Get game moves
   */
  async getMoves(gameId: number): Promise<MoveOut[]> {
    const response = await api.get<MoveOut[]>(`/api/games/${gameId}/moves`);
    return response.data;
  },

  /**
   * Roll dice
   */
  async rollDice(gameId: number, data?: DiceRollRequest): Promise<MoveResponse> {
    const response = await api.post<MoveResponse>(`/api/games/${gameId}/moves/roll`, data || {});
    return response.data;
  },
};

// Moves API
export const movesApi = {
  /**
   * Get move by ID
   */
  async get(moveId: number): Promise<MoveOut> {
    const response = await api.get<MoveOut>(`/api/moves/${moveId}`);
    return response.data;
  },

  /**
   * Save insight for a move
   */
  async saveInsight(moveId: number, data: InsightCreate): Promise<MoveOut> {
    const response = await api.post<MoveOut>(`/api/moves/${moveId}/insight`, data);
    return response.data;
  },
};

// Cells API (if implemented)
export const cellsApi = {
  /**
   * Get all cells
   */
  async list(): Promise<CellOut[]> {
    const response = await api.get<CellOut[]>('/api/cells');
    return response.data;
  },

  /**
   * Get cell by ID
   */
  async get(cellId: number): Promise<CellOut> {
    const response = await api.get<CellOut>(`/api/cells/${cellId}`);
    return response.data;
  },
};
