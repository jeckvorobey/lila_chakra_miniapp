import { api } from 'src/boot/axios';
import type { UserOut, UserStats } from 'src/types/user.interface';

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
};
