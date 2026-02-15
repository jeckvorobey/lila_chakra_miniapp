/**
 * Хранилище пользователя для управления профилем и балансом.
 */

import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import { usersApi } from 'src/services/api';
import type { UserProfile, UserStats } from 'src/types/user.interface';

export const useUserStore = defineStore('user', () => {
  // Состояние
  const profile = ref<UserProfile | null>(null);
  const stats = ref<UserStats | null>(null);
  const referralData = ref<{ code: string; link: string } | null>(null);
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

  // Действия

  /**
   * Загрузить профиль пользователя с бэкенда
   */
  async function fetchProfile(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      profile.value = await usersApi.getProfile();
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
      stats.value = await usersApi.getStats();
    } catch (err) {
      console.error('Ошибка загрузки статистики:', err);
    }
  }

  /**
   * Загрузить реферальные данные
   */
  async function fetchReferralData(): Promise<void> {
    try {
      referralData.value = await usersApi.getReferralData();
    } catch (err) {
      console.error('Ошибка загрузки реферальных данных:', err);
    }
  }

  /**
   * Обновить профиль пользователя
   */
  async function updateProfile(
    updates: Partial<Pick<UserProfile, 'language_code_app' | 'has_seen_onboarding'>>,
  ): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      profile.value = await usersApi.updateSettings(updates);
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Ошибка обновления профиля';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Завершить онбординг
   */
  async function completeOnboarding(): Promise<boolean> {
    try {
      profile.value = await usersApi.completeOnboarding();
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Ошибка завершения онбординга';
      return false;
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
    referralData,
    isLoading,
    error,

    // Вычисляемые свойства
    balance,
    displayName,
    isAdmin,

    // Действия
    fetchProfile,
    fetchStats,
    fetchReferralData,
    updateProfile,
    completeOnboarding,
    updateBalance,
    reset,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot));
}
