/**
 * Theme boot file for Lila Chakra.
 * Initializes theme based on Telegram/saved preference.
 */

import { boot } from 'quasar/wrappers';
import { Dark } from 'quasar';

type ThemeMode = 'dark' | 'light' | 'system';

const STORAGE_KEY = 'lila-theme-mode';

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
 * Check system preference
 */
function getSystemPreference(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
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

/**
 * Determine if dark mode should be active
 */
function shouldBeDark(): boolean {
  // Priority 1: Telegram theme
  const telegramTheme = getTelegramTheme();
  if (telegramTheme) {
    return telegramTheme === 'dark';
  }

  // Priority 2: Saved preference
  const savedTheme = getSavedTheme();
  if (savedTheme === 'system') {
    return getSystemPreference();
  }

  return savedTheme === 'dark';
}

export default boot(() => {
  const isDark = shouldBeDark();

  // Set Quasar dark mode
  Dark.set(isDark);

  // Apply body classes
  if (typeof document !== 'undefined') {
    document.body.classList.add(isDark ? 'body--dark' : 'body--light');
    document.body.classList.remove(isDark ? 'body--light' : 'body--dark');
  }
});
