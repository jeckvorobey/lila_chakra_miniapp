import { api } from 'src/lib/api-client';
import type { TelegramAuthRequest, TelegramAuthResponse } from 'src/types/auth.interface';

/**
 * API аутентификации.
 */
export const authApi = {
  /**
   * Аутентификация через Telegram initData.
   */
  async authenticate(data: TelegramAuthRequest): Promise<TelegramAuthResponse> {
    const response = await api.post<TelegramAuthResponse>('/auth/telegram', data);
    return response.data;
  },

  /**
   * Логаут пользователя.
   */
  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
};
