/**
 * Authentication store for Telegram Mini App.
 * Handles Telegram initData validation and JWT token management.
 */

import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'src/boot/axios';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    telegram_id: number;
    username?: string;
    first_name: string;
    last_name?: string;
    balance: number;
    is_admin: boolean;
  };
}

const TOKEN_KEY = 'lila-auth-token';

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string | null>(null);
  const telegramUser = ref<TelegramUser | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const isAuthenticated = computed(() => !!token.value);
  const initData = computed(() => {
    if (typeof window === 'undefined') return null;
    const tg = (window as { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp;
    return tg?.initData || null;
  });

  // Actions

  /**
   * Load saved token from localStorage
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
   * Save token to localStorage
   */
  function saveToken(newToken: string): void {
    token.value = newToken;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, newToken);
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  }

  /**
   * Clear token
   */
  function clearToken(): void {
    token.value = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
    delete api.defaults.headers.common['Authorization'];
  }

  /**
   * Initialize Telegram user from WebApp SDK
   */
  function initTelegramUser(): void {
    if (typeof window === 'undefined') return;

    const tg = (window as {
      Telegram?: {
        WebApp?: {
          initDataUnsafe?: { user?: TelegramUser };
        };
      };
    }).Telegram?.WebApp;

    if (tg?.initDataUnsafe?.user) {
      telegramUser.value = tg.initDataUnsafe.user;
    }
  }

  /**
   * Authenticate with backend using Telegram initData
   */
  async function authenticate(): Promise<boolean> {
    if (!initData.value) {
      error.value = 'Telegram initData not available';
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
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Authentication failed';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Logout and clear all auth data
   */
  function logout(): void {
    clearToken();
    telegramUser.value = null;
  }

  /**
   * Initialize auth on app start
   */
  async function init(): Promise<void> {
    loadToken();
    initTelegramUser();

    // Auto-authenticate if we have initData but no token
    if (initData.value && !token.value) {
      await authenticate();
    }
  }

  return {
    // State
    token,
    telegramUser,
    isLoading,
    error,

    // Getters
    isAuthenticated,
    initData,

    // Actions
    loadToken,
    authenticate,
    logout,
    init,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
