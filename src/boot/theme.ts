/**
 * Файл инициализации темы для Lila Chakra.
 * Инициализирует тему на основе предпочтения Telegram/сохранённых данных.
 */

import { boot } from 'quasar/wrappers';
import { Dark, setCssVar } from 'quasar';

type ThemeMode = 'dark' | 'light' | 'system';

const THEME_COLORS = {
  dark: {
    primary: '#6B46C1',
    secondary: '#F6AD55',
    accent: '#38B2AC',
  },
  light: {
    primary: '#7C3AED',
    secondary: '#D97706',
    accent: '#0D9488',
  },
};

const STORAGE_KEY = 'lila-settings';

/**
 * Получить сохранённую тему из localStorage
 */
function getSavedTheme(): ThemeMode {
  if (typeof localStorage === 'undefined') return 'system';

  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return 'system';

  try {
    const settings = JSON.parse(saved) as { theme?: ThemeMode };
    if (settings.theme === 'dark' || settings.theme === 'light' || settings.theme === 'system') {
      return settings.theme;
    }
  } catch (e) {
    console.error('Ошибка разбора настроек темы:', e);
  }

  return 'system';
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
  // Приоритет 1: Сохранённое предпочтение
  const savedTheme = getSavedTheme();
  if (savedTheme === 'dark') return true;
  if (savedTheme === 'light') return false;

  // Приоритет 2: Тема Telegram
  const telegramTheme = getTelegramTheme();
  if (telegramTheme) {
    return telegramTheme === 'dark';
  }

  // Приоритет 3: Системная тема
  if (savedTheme === 'system') {
    return getSystemPreference();
  }
  return true;
}

export default boot(() => {
  const isDark = shouldBeDark();

  // Установить тёмный режим Quasar
  Dark.set(isDark);

  // Применить цвета бренда
  const colors = isDark ? THEME_COLORS.dark : THEME_COLORS.light;
  setCssVar('primary', colors.primary);
  setCssVar('secondary', colors.secondary);
  setCssVar('accent', colors.accent);

  // Применить классы body
  if (typeof document !== 'undefined') {
    document.body.classList.add(isDark ? 'body--dark' : 'body--light');
    document.body.classList.remove(isDark ? 'body--light' : 'body--dark');
  }
});
