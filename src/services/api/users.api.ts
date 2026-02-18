import { api } from 'src/boot/axios';
import type { ReferralProgramData, UserOut, UserStats } from 'src/types/user.interface';

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
  async updateSettings(
    data: Partial<Pick<UserOut, 'language_code_app' | 'has_seen_onboarding'>>,
  ): Promise<UserOut> {
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
   * Сгенерировать промокод по тарифу x2/x5.
   */
  async generateReferralTierCode(
    tierKey: 'x2' | 'x5',
  ): Promise<{ key: string; promo_code: string }> {
    const response = await api.post<{ key: string; promo_code: string }>(
      `/users/me/referral-program/${tierKey}/generate`,
    );
    return response.data;
  },
};
