/**
 * Composable управления темой для Lila Chakra.
 * Поддерживает тёмную (по умолчанию) и светлую темы с синхронизацией темы Telegram.
 */

import { ref, computed, watch, onMounted } from 'vue';
import { Dark } from 'quasar';

export type ThemeMode = 'dark' | 'light' | 'system';

const STORAGE_KEY = 'lila-theme-mode';

// Реактивное состояние
const themeMode = ref<ThemeMode>('dark');
const systemPrefersDark = ref(true);

/**
 * Инициализировать обнаружение системной темы
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
 * Сохранить тему в localStorage
 */
function saveTheme(mode: ThemeMode): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, mode);
  }
}

/**
 * Применить тему к документу и Quasar
 */
function applyTheme(isDark: boolean): void {
  // Установить режим тёмной темы Quasar
  Dark.set(isDark);

  // Применить класс body для пользовательских стилей
  if (typeof document !== 'undefined') {
    document.body.classList.toggle('body--light', !isDark);
    document.body.classList.toggle('body--dark', isDark);
  }
}

/**
 * Попытаться получить предпочтение темы Telegram
 */
function getTelegramTheme(): 'dark' | 'light' | null {
  if (typeof window === 'undefined') return null;

  // Проверить SDK Telegram WebApp
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
   * Установить режим темы
   */
  function setTheme(mode: ThemeMode): void {
    themeMode.value = mode;
    saveTheme(mode);
    applyTheme(isDark.value);
  }

  /**
   * Переключаться между тёмной и светлой темами
   */
  function toggleTheme(): void {
    const newMode: ThemeMode = isDark.value ? 'light' : 'dark';
    setTheme(newMode);
  }

  /**
   * Синхронизировать с темой Telegram
   */
  function syncWithTelegram(): void {
    const telegramTheme = getTelegramTheme();
    if (telegramTheme) {
      setTheme(telegramTheme);
    }
  }

  /**
   * Инициализировать тему при монтировании
   */
  function initTheme(): void {
    initSystemThemeDetection();

    // Приоритет: Telegram > Сохранённая > По умолчанию (тёмная)
    const telegramTheme = getTelegramTheme();
    if (telegramTheme) {
      themeMode.value = telegramTheme;
    } else {
      themeMode.value = getSavedTheme();
    }

    applyTheme(isDark.value);
  }

  // Следить за изменениями
  watch(isDark, (newIsDark) => {
    applyTheme(newIsDark);
  });

  // Авто-инициализация при монтировании, если в контексте компонента
  onMounted(() => {
    initTheme();
  });

  return {
    // Состояние
    themeMode,
    isDark,
    isLight,

    // Действия
    setTheme,
    toggleTheme,
    syncWithTelegram,
    initTheme,
  };
}

export default useTheme;
