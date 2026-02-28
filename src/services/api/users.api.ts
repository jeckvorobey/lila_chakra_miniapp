import { api } from 'src/boot/axios';
import type { ReferralProgramData, UserOut, UserStats, UserUpdate } from 'src/types/user.interface';
import type { TransactionListResponse } from 'src/types/transaction.interface';

/**
 * API пользователей.
 */
export const usersApi = {
  /**
   * Получить профиль текущего пользователя.
   */
  async getProfile(): Promise<UserOut> {
    const response = await api.get<UserOut>('/users/me');
    return response.data;
  },

  /**
   * Получить статистику текущего пользователя.
   */
  async getStats(): Promise<UserStats> {
    const response = await api.get<UserStats>('/users/me/stats');
    return response.data;
  },

  /**
   * Обновить настройки пользователя.
   */
  async updateSettings(data: UserUpdate): Promise<UserOut> {
    const response = await api.patch<UserOut>('/users/me', data);
    return response.data;
  },

  /**
   * Завершить онбординг пользователя.
   */
  async completeOnboarding(): Promise<UserOut> {
    const response = await api.post<UserOut>('/users/me/onboarding');
    return response.data;
  },

  /**
   * Получить реферальные данные пользователя.
   */
  async getReferralData(): Promise<{ code: string; link: string }> {
    const response = await api.get<{ code: string; link: string }>('/users/me/referral-code');
    return response.data;
  },

  /**
   * Получить расширенные данные реферальной программы.
   */
  async getReferralProgram(): Promise<ReferralProgramData> {
    const response = await api.get<ReferralProgramData>('/users/me/referral-program');
    return response.data;
  },

  /**
   * Получить историю транзакций текущего пользователя.
   */
  async getTransactions(offset = 0, limit = 20): Promise<TransactionListResponse> {
    const response = await api.get<TransactionListResponse>('/users/me/transactions', {
      params: { offset, limit },
    });
    return response.data;
  },
};
