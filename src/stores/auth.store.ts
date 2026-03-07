/**
 * Хранилище аутентификации для Telegram Mini App.
 * Обрабатывает валидацию initData Telegram и управление JWT токенами.
 */

import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'src/boot/axios';
import { authApi } from 'src/services/api';
import type { TelegramUser } from 'src/types/telegram.interface';

const TOKEN_KEY = 'lila-auth-token';
const TELEGRAM_USER_ID_KEY = 'lila-auth-telegram-user-id';

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

  /**
   * Получить Telegram user id из WebApp SDK.
   */
  function getCurrentTelegramUserId(): string | null {
    if (typeof window === 'undefined') return null;

    const tg = (
      window as {
        Telegram?: {
          WebApp?: {
            initDataUnsafe?: { user?: TelegramUser };
          };
        };
      }
    ).Telegram?.WebApp;

    const userId = tg?.initDataUnsafe?.user?.id;
    return userId != null ? String(userId) : null;
  }

  /**
   * Прочитать Telegram user id, для которого был выдан сохранённый токен.
   */
  function loadStoredTelegramUserId(): string | null {
    if (typeof localStorage === 'undefined') return null;
    const value = localStorage.getItem(TELEGRAM_USER_ID_KEY);
    return value && value.trim().length > 0 ? value : null;
  }

  /**
   * Сохранить Telegram user id текущей аутентифицированной сессии.
   */
  function saveTelegramUserId(userId: string | null): void {
    if (typeof localStorage === 'undefined') return;

    if (!userId) {
      localStorage.removeItem(TELEGRAM_USER_ID_KEY);
      return;
    }

    localStorage.setItem(TELEGRAM_USER_ID_KEY, userId);
  }

  /**
   * Проверить, соответствует ли сохранённый JWT текущему Telegram-контексту.
   * Если пользователь в Telegram сменился, старый JWT использовать нельзя.
   */
  function hasCompatibleTelegramContext(): boolean {
    const currentTelegramUserId = getCurrentTelegramUserId();
    if (!currentTelegramUserId) {
      return true;
    }

    const storedTelegramUserId = loadStoredTelegramUserId();
    if (!storedTelegramUserId) {
      return false;
    }

    return storedTelegramUserId === currentTelegramUserId;
  }

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
    saveTelegramUserId(getCurrentTelegramUserId());
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
    saveTelegramUserId(null);
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
      const response = await authApi.authenticate({
        init_data: initData.value,
      });

      saveToken(response.access_token);
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
   * Выйти и очистить все данные аутентификации.
   * Вызывает backend logout для инвалидации сессии в Redis,
   * затем очищает локальные данные и уведомляет другие вкладки.
   */
  async function logout(): Promise<void> {
    // 1. Вызвать backend logout для инвалидации сессии
    if (token.value) {
      try {
        await authApi.logout();
      } catch (err) {
        console.warn('[Auth] Server logout failed:', err);
      }
    }

    // 2. Очистить локальные данные
    clearToken();
    telegramUser.value = null;

    // 3. Уведомить другие вкладки
    notifyLogout();
  }

  /**
   * Уведомить другие вкладки о logout через BroadcastChannel
   */
  function notifyLogout(): void {
    if (typeof BroadcastChannel === 'undefined') return;

    try {
      const channel = new BroadcastChannel('lila-auth');
      channel.postMessage({ type: 'logout' });
      channel.close();
    } catch (err) {
      console.warn('[Auth] BroadcastChannel unavailable:', err);
    }
  }

  /**
   * Слушать logout события от других вкладок
   */
  function listenForLogout(): void {
    if (typeof BroadcastChannel === 'undefined') return;

    try {
      const channel = new BroadcastChannel('lila-auth');
      channel.onmessage = (event: MessageEvent) => {
        if (event.data?.type === 'logout') {
          clearToken();
          telegramUser.value = null;
        }
      };
    } catch (err) {
      console.warn('[Auth] Failed to setup logout listener:', err);
    }
  }

  /**
   * Инициализировать аутентификацию при запуске приложения
   */
  async function init(): Promise<void> {
    loadToken();
    initTelegramUser();
    listenForLogout();

    if (token.value && !hasCompatibleTelegramContext()) {
      clearToken();
    }

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
