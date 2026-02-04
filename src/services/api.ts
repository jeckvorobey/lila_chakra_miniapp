/**
 * Слой сервиса API для взаимодействия с бэкенд.
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
} from 'src/types/game.interface';
import type { TelegramAuthRequest, TelegramAuthResponse } from 'src/types/auth.interface';
import type { UserOut, UserStats } from 'src/types/user.interface';
import type {
  PaymentCreate,
  PaymentInitResponse,
  PaymentPackage,
} from 'src/types/payment.interface';

// API аутентификации
export const authApi = {
  /**
   * Аутентификация с помощью Telegram initData
   */
  async authenticate(data: TelegramAuthRequest): Promise<TelegramAuthResponse> {
    const response = await api.post<TelegramAuthResponse>('/api/auth/telegram', data);
    return response.data;
  },

  /**
   * Получить информацию о текущем пользователе
   */
  async getCurrentUser(): Promise<UserOut> {
    const response = await api.get<UserOut>('/api/auth/me');
    return response.data;
  },
};

// API пользователей
export const usersApi = {
  /**
   * Получить профиль пользователя
   */
  async getProfile(): Promise<UserOut> {
    const response = await api.get<UserOut>('/api/users/me');
    return response.data;
  },

  /**
   * Получить статистику пользователя
   */
  async getStats(): Promise<UserStats> {
    const response = await api.get<UserStats>('/api/users/me/stats');
    return response.data;
  },

  /**
   * Обновить настройки пользователя
   */
  async updateSettings(data: {
    language_code_app?: string;
    has_seen_onboarding?: boolean;
  }): Promise<UserOut> {
    const response = await api.patch<UserOut>('/api/users/me', data);
    return response.data;
  },

  /**
   * Завершить онбординг
   */
  async completeOnboarding(): Promise<UserOut> {
    const response = await api.post<UserOut>('/api/users/me/onboarding');
    return response.data;
  },
};

// API игр
export const gamesApi = {
  /**
   * Получить список игр пользователя
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
   * Создать новую игру
   */
  async create(data: GameCreate): Promise<GameOut> {
    const response = await api.post<GameOut>('/api/games', data);
    return response.data;
  },

  /**
   * Получить игру по ID
   */
  async get(gameId: number): Promise<GameDetail> {
    const response = await api.get<GameDetail>(`/api/games/${gameId}`);
    return response.data;
  },

  /**
   * Завершить входную медитацию
   */
  async completeEntryMeditation(gameId: number): Promise<GameOut> {
    const response = await api.post<GameOut>(`/api/games/${gameId}/meditation/entry`);
    return response.data;
  },

  /**
   * Завершить выходную медитацию
   */
  async completeExitMeditation(gameId: number): Promise<GameOut> {
    const response = await api.post<GameOut>(`/api/games/${gameId}/meditation/exit`);
    return response.data;
  },

  /**
   * Завершить игру
   */
  async end(gameId: number, abandon = false): Promise<GameOut> {
    const response = await api.post<GameOut>(`/api/games/${gameId}/end`, null, {
      params: { abandon },
    });
    return response.data;
  },

  /**
   * Получить ходы игры
   */
  async getMoves(gameId: number): Promise<MoveOut[]> {
    const response = await api.get<MoveOut[]>(`/api/games/${gameId}/moves`);
    return response.data;
  },

  /**
   * Бросить кубик
   */
  async rollDice(gameId: number, data?: DiceRollRequest): Promise<MoveResponse> {
    const response = await api.post<MoveResponse>(`/api/games/${gameId}/moves/roll`, data || {});
    return response.data;
  },
};

// API ходов
export const movesApi = {
  /**
   * Получить ход по ID
   */
  async get(moveId: number): Promise<MoveOut> {
    const response = await api.get<MoveOut>(`/api/moves/${moveId}`);
    return response.data;
  },

  /**
   * Сохранить озарение для хода
   */
  async saveInsight(moveId: number, data: InsightCreate): Promise<MoveOut> {
    const response = await api.post<MoveOut>(`/api/moves/${moveId}/insight`, data);
    return response.data;
  },
};

// API платежей
export const paymentsApi = {
  /**
   * Получить пакеты пополнения
   */
  async listPackages(): Promise<PaymentPackage[]> {
    const response = await api.get<PaymentPackage[]>('/api/payments/packages');
    return response.data;
  },

  /**
   * Создать платёж
   */
  async createPayment(data: PaymentCreate): Promise<PaymentInitResponse> {
    const response = await api.post<PaymentInitResponse>('/api/payments/create', data);
    return response.data;
  },
};
