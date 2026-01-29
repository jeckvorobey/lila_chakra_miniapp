/**
 * User store for profile and balance management.
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
  // State
  const profile = ref<UserProfile | null>(null);
  const stats = ref<UserStats | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
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

  // Actions

  /**
   * Fetch user profile from backend
   */
  async function fetchProfile(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.get<UserProfile>('/api/users/me');
      profile.value = response.data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load profile';
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Fetch user statistics
   */
  async function fetchStats(): Promise<void> {
    try {
      const response = await api.get<UserStats>('/api/users/me/stats');
      stats.value = response.data;
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }

  /**
   * Update user profile
   */
  async function updateProfile(updates: Partial<Pick<UserProfile, 'username'>>): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.patch<UserProfile>('/api/users/me', updates);
      profile.value = response.data;
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update profile';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Update balance locally (after payment or promo code)
   */
  function updateBalance(newBalance: number): void {
    if (profile.value) {
      profile.value.balance = newBalance;
    }
  }

  /**
   * Increment daily moves used
   */
  function incrementMovesUsed(): void {
    if (profile.value) {
      profile.value.daily_moves_used += 1;
    }
  }

  /**
   * Reset store on logout
   */
  function reset(): void {
    profile.value = null;
    stats.value = null;
    error.value = null;
  }

  return {
    // State
    profile,
    stats,
    isLoading,
    error,

    // Getters
    balance,
    displayName,
    isAdmin,
    canMakeMove,
    movesRemaining,

    // Actions
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
