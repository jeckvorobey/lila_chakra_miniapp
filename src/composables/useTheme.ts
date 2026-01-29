/**
 * Theme management composable for Lila Chakra.
 * Supports dark (default) and light themes with Telegram theme sync.
 */

import { ref, computed, watch, onMounted } from 'vue';
import { Dark } from 'quasar';

export type ThemeMode = 'dark' | 'light' | 'system';

const STORAGE_KEY = 'lila-theme-mode';

// Reactive state
const themeMode = ref<ThemeMode>('dark');
const systemPrefersDark = ref(true);

/**
 * Initialize system theme detection
 */
function initSystemThemeDetection(): void {
  if (typeof window === 'undefined') return;

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  systemPrefersDark.value = mediaQuery.matches;

  mediaQuery.addEventListener('change', (e) => {
    systemPrefersDark.value = e.matches;
  });
}

/**
 * Get saved theme from localStorage
 */
function getSavedTheme(): ThemeMode {
  if (typeof localStorage === 'undefined') return 'dark';

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'dark' || saved === 'light' || saved === 'system') {
    return saved;
  }
  return 'dark';
}

/**
 * Save theme to localStorage
 */
function saveTheme(mode: ThemeMode): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, mode);
  }
}

/**
 * Apply theme to document and Quasar
 */
function applyTheme(isDark: boolean): void {
  // Set Quasar dark mode
  Dark.set(isDark);

  // Apply body class for custom styles
  if (typeof document !== 'undefined') {
    document.body.classList.toggle('body--light', !isDark);
    document.body.classList.toggle('body--dark', isDark);
  }
}

/**
 * Try to get Telegram theme preference
 */
function getTelegramTheme(): 'dark' | 'light' | null {
  if (typeof window === 'undefined') return null;

  // Check Telegram WebApp SDK
  const tg = (window as { Telegram?: { WebApp?: { colorScheme?: string } } }).Telegram?.WebApp;
  if (tg?.colorScheme) {
    return tg.colorScheme === 'dark' ? 'dark' : 'light';
  }

  return null;
}

export function useTheme() {
  const isDark = computed(() => {
    if (themeMode.value === 'system') {
      return systemPrefersDark.value;
    }
    return themeMode.value === 'dark';
  });

  const isLight = computed(() => !isDark.value);

  /**
   * Set theme mode
   */
  function setTheme(mode: ThemeMode): void {
    themeMode.value = mode;
    saveTheme(mode);
    applyTheme(isDark.value);
  }

  /**
   * Toggle between dark and light themes
   */
  function toggleTheme(): void {
    const newMode: ThemeMode = isDark.value ? 'light' : 'dark';
    setTheme(newMode);
  }

  /**
   * Sync with Telegram theme
   */
  function syncWithTelegram(): void {
    const telegramTheme = getTelegramTheme();
    if (telegramTheme) {
      setTheme(telegramTheme);
    }
  }

  /**
   * Initialize theme on mount
   */
  function initTheme(): void {
    initSystemThemeDetection();

    // Priority: Telegram > Saved > Default (dark)
    const telegramTheme = getTelegramTheme();
    if (telegramTheme) {
      themeMode.value = telegramTheme;
    } else {
      themeMode.value = getSavedTheme();
    }

    applyTheme(isDark.value);
  }

  // Watch for changes
  watch(isDark, (newIsDark) => {
    applyTheme(newIsDark);
  });

  // Auto-init on mount if in component context
  onMounted(() => {
    initTheme();
  });

  return {
    // State
    themeMode,
    isDark,
    isLight,

    // Actions
    setTheme,
    toggleTheme,
    syncWithTelegram,
    initTheme,
  };
}

export default useTheme;
