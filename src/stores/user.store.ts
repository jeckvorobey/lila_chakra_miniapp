/**
 * Хранилище пользователя для управления профилем и балансом.
 */

import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'src/boot/axios';

interface UserProfile {
  id: string;
  telegram_id: number;
  username?: string;
  first_name: string;
  last_name?: string;
  balance: number;
  is_admin: boolean;
  daily_moves_used: number;
  daily_moves_limit: number;
  created_at: string;
}

interface UserStats {
  total_games: number;
  completed_games: number;
  total_moves: number;
  arrows_taken: number;
  snakes_encountered: number;
  highest_cell: number;
  wins: number;
}

export const useUserStore = defineStore('user', () => {
  // Состояние
  const profile = ref<UserProfile | null>(null);
  const stats = ref<UserStats | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Вычисляемые свойства
  const balance = computed(() => profile.value?.balance ?? 0);
  const displayName = computed(() => {
    if (!profile.value) return '';
    const { first_name, last_name, username } = profile.value;
    if (first_name && last_name) return `${first_name} ${last_name}`;
    if (first_name) return first_name;
    return username || '';
  });
  const isAdmin = computed(() => profile.value?.is_admin ?? false);
  const canMakeMove = computed(() => {
    if (!profile.value) return false;
    return profile.value.daily_moves_used < profile.value.daily_moves_limit;
  });
  const movesRemaining = computed(() => {
    if (!profile.value) return 0;
    return Math.max(0, profile.value.daily_moves_limit - profile.value.daily_moves_used);
  });

  // Действия

  /**
   * Загрузить профиль пользователя с бэкенда
   */
  async function fetchProfile(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.get<UserProfile>('/api/users/me');
      profile.value = response.data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Ошибка загрузки профиля';
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Загрузить статистику пользователя
   */
  async function fetchStats(): Promise<void> {
    try {
      const response = await api.get<UserStats>('/api/users/me/stats');
      stats.value = response.data;
    } catch (err) {
      console.error('Ошибка загрузки статистики:', err);
    }
  }

  /**
   * Обновить профиль пользователя
   */
  async function updateProfile(updates: Partial<Pick<UserProfile, 'username'>>): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.patch<UserProfile>('/api/users/me', updates);
      profile.value = response.data;
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Ошибка обновления профиля';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Обновить баланс локально (после платежа или промокода)
   */
  function updateBalance(newBalance: number): void {
    if (profile.value) {
      profile.value.balance = newBalance;
    }
  }

  /**
   * Увеличить счётчик использованных дневных ходов
   */
  function incrementMovesUsed(): void {
    if (profile.value) {
      profile.value.daily_moves_used += 1;
    }
  }

  /**
   * Очистить хранилище при выходе
   */
  function reset(): void {
    profile.value = null;
    stats.value = null;
    error.value = null;
  }

  return {
    // Состояние
    profile,
    stats,
    isLoading,
    error,

    // Вычисляемые свойства
    balance,
    displayName,
    isAdmin,
    canMakeMove,
    movesRemaining,

    // Действия
    fetchProfile,
    fetchStats,
    updateProfile,
    updateBalance,
    incrementMovesUsed,
    reset,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot));
}
