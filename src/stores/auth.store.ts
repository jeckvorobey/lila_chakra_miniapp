/**
 * Хранилище аутентификации для Telegram Mini App.
 * Обрабатывает валидацию initData Telegram и управление JWT токенами.
 */

import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'src/boot/axios';
import type { TelegramUser } from 'src/types/telegram.interface';
import type { AuthResponse } from 'src/types/auth.interface';

const TOKEN_KEY = 'lila-auth-token';

export const useAuthStore = defineStore('auth', () => {
  // Состояние
  const token = ref<string | null>(null);
  const telegramUser = ref<TelegramUser | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Вычисляемые свойства
  const isAuthenticated = computed(() => !!token.value);
  const initData = computed(() => {
    if (typeof window === 'undefined') return null;
    const tg = (window as { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp;
    return tg?.initData || null;
  });

  // Действия

  /**
   * Загрузить сохранённый токен из localStorage
   */
  function loadToken(): void {
    if (typeof localStorage !== 'undefined') {
      token.value = localStorage.getItem(TOKEN_KEY);
      if (token.value) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
      }
    }
  }

  /**
   * Сохранить токен в localStorage
   */
  function saveToken(newToken: string): void {
    token.value = newToken;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, newToken);
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  }

  /**
   * Очистить токен
   */
  function clearToken(): void {
    token.value = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
    delete api.defaults.headers.common['Authorization'];
  }

  /**
   * Инициализировать пользователя Telegram из WebApp SDK
   */
  function initTelegramUser(): void {
    if (typeof window === 'undefined') return;

    const tg = (
      window as {
        Telegram?: {
          WebApp?: {
            initDataUnsafe?: { user?: TelegramUser };
          };
        };
      }
    ).Telegram?.WebApp;

    if (tg?.initDataUnsafe?.user) {
      telegramUser.value = tg.initDataUnsafe.user;
    }
  }

  /**
   * Аутентифицироваться на бэкенде используя Telegram initData
   */
  async function authenticate(): Promise<boolean> {
    if (!initData.value) {
      error.value = 'Telegram initData не доступен';
      return false;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.post<AuthResponse>('/api/auth/telegram', {
        init_data: initData.value,
      });

      saveToken(response.data.access_token);
      return true;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      const detail = axiosErr?.response?.data?.detail;
      error.value = detail || (err instanceof Error ? err.message : 'Ошибка аутентификации');
      console.error('[Auth] Ошибка аутентификации:', error.value);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Выйти и очистить все данные аутентификации
   */
  function logout(): void {
    clearToken();
    telegramUser.value = null;
  }

  /**
   * Инициализировать аутентификацию при запуске приложения
   */
  async function init(): Promise<void> {
    loadToken();
    initTelegramUser();

    // Автоматическая аутентификация если есть initData, но нет токена
    if (initData.value && !token.value) {
      await authenticate();
    }
  }

  return {
    // Состояние
    token,
    telegramUser,
    isLoading,
    error,

    // Вычисляемые свойства
    isAuthenticated,
    initData,

    // Действия
    loadToken,
    authenticate,
    logout,
    init,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
