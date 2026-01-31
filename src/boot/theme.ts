/**
 * Файл инициализации темы для Lila Chakra.
 * Инициализирует тему на основе предпочтения Telegram/сохранённых данных.
 */

import { boot } from 'quasar/wrappers';
import { Dark } from 'quasar';

type ThemeMode = 'dark' | 'light' | 'system';

const STORAGE_KEY = 'lila-theme-mode';

/**
 * Получить сохранённую тему из localStorage
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
 * Проверить предпочтение системы
 */
function getSystemPreference(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Попытаться получить предпочтение темы Telegram
 */
function getTelegramTheme(): 'dark' | 'light' | null {
  if (typeof window === 'undefined') return null;

  // Проверить Telegram WebApp SDK
  const tg = (window as { Telegram?: { WebApp?: { colorScheme?: string } } }).Telegram?.WebApp;
  if (tg?.colorScheme) {
    return tg.colorScheme === 'dark' ? 'dark' : 'light';
  }

  return null;
}

/**
 * Определить, должен ли быть активен тёмный режим
 */
function shouldBeDark(): boolean {
  // Приоритет 1: Тема Telegram
  const telegramTheme = getTelegramTheme();
  if (telegramTheme) {
    return telegramTheme === 'dark';
  }

  // Приоритет 2: Сохранённое предпочтение
  const savedTheme = getSavedTheme();
  if (savedTheme === 'system') {
    return getSystemPreference();
  }

  return savedTheme === 'dark';
}

export default boot(() => {
  const isDark = shouldBeDark();

  // Установить тёмный режим Quasar
  Dark.set(isDark);

  // Применить классы body
  if (typeof document !== 'undefined') {
    document.body.classList.add(isDark ? 'body--dark' : 'body--light');
    document.body.classList.remove(isDark ? 'body--light' : 'body--dark');
  }
});
