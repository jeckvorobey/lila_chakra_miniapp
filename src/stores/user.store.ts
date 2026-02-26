/**
 * Хранилище пользователя для управления профилем и балансом.
 */

import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import { usersApi } from 'src/services/api';
import type { ReferralProgramData, UserProfile, UserStats, UserUpdate } from 'src/types/user.interface';
import type { TransactionOut } from 'src/types/transaction.interface';

export const useUserStore = defineStore('user', () => {
  // Состояние
  const profile = ref<UserProfile | null>(null);
  const stats = ref<UserStats | null>(null);
  const referralData = ref<{ code: string; link: string } | null>(null);
  const referralProgram = ref<ReferralProgramData | null>(null);
  const transactions = ref<TransactionOut[]>([]);
  const transactionsTotal = ref(0);
  const transactionsOffset = ref(0);
  const transactionsLimit = ref(20);
  const transactionsHasMore = ref(true);
  const isTransactionsLoading = ref(false);
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
      const data = await usersApi.getReferralProgram();
      referralProgram.value = data;
      referralData.value = { code: data.code ?? '', link: data.link };
    } catch (err) {
      console.error('Ошибка загрузки реферальных данных:', err);
    }
  }

  /**
   * Загрузить расширенную реферальную программу.
   */
  async function fetchReferralProgram(): Promise<void> {
    try {
      referralProgram.value = await usersApi.getReferralProgram();
      referralData.value = {
        code: referralProgram.value.code ?? '',
        link: referralProgram.value.link,
      };
    } catch (err) {
      console.error('Ошибка загрузки расширенной реферальной программы:', err);
    }
  }

  /**
   * Загрузить историю транзакций пользователя.
   */
  async function fetchTransactions(
    options: { reset?: boolean; limit?: number } = {},
  ): Promise<void> {
    const { reset = false, limit } = options;
    if (isTransactionsLoading.value) {
      return;
    }

    if (reset) {
      transactions.value = [];
      transactionsOffset.value = 0;
      transactionsHasMore.value = true;
    }

    if (!transactionsHasMore.value) {
      return;
    }

    if (limit) {
      transactionsLimit.value = limit;
    }

    isTransactionsLoading.value = true;

    try {
      const response = await usersApi.getTransactions(
        transactionsOffset.value,
        transactionsLimit.value,
      );

      if (reset) {
        transactions.value = response.items;
      } else {
        transactions.value = [...transactions.value, ...response.items];
      }

      transactionsTotal.value = response.total;
      transactionsOffset.value = response.offset + response.items.length;
      transactionsHasMore.value = response.has_more;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Ошибка загрузки транзакций';
    } finally {
      isTransactionsLoading.value = false;
    }
  }

  /**
   * Обновить профиль пользователя
   */
  async function updateProfile(
    updates: UserUpdate,
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
    referralData.value = null;
    referralProgram.value = null;
    transactions.value = [];
    transactionsTotal.value = 0;
    transactionsOffset.value = 0;
    transactionsHasMore.value = true;
    isTransactionsLoading.value = false;
    error.value = null;
  }

  return {
    // Состояние
    profile,
    stats,
    referralData,
    referralProgram,
    transactions,
    transactionsTotal,
    transactionsHasMore,
    isTransactionsLoading,
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
    fetchReferralProgram,
    fetchTransactions,
    updateProfile,
    completeOnboarding,
    updateBalance,
    reset,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot));
}
