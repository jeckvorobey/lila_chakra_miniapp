/**
 * Хранилище настроек приложения.
 * Управляет темой, звуком, уведомлениями и другими предпочтениями пользователя.
 */

import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, watch, computed } from 'vue';
import { Dark } from 'quasar';
import type { ThemeMode, DiceMode, Settings } from 'src/types/settings.interface';

const STORAGE_KEY = 'lila-settings';

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  soundEnabled: true,
  vibrationEnabled: true,
  diceMode: 'auto',
  notificationsEnabled: true,
  language: 'ru',
};

export const useSettingsStore = defineStore('settings', () => {
  // Состояние
  const theme = ref<ThemeMode>(DEFAULT_SETTINGS.theme);
  const soundEnabled = ref(DEFAULT_SETTINGS.soundEnabled);
  const vibrationEnabled = ref(DEFAULT_SETTINGS.vibrationEnabled);
  const diceMode = ref<DiceMode>(DEFAULT_SETTINGS.diceMode);
  const notificationsEnabled = ref(DEFAULT_SETTINGS.notificationsEnabled);
  const language = ref(DEFAULT_SETTINGS.language);
  const systemPrefersDark = ref(true);
  const telegramTheme = ref<'dark' | 'light' | null>(null);

  let isInitialized = false;

  // Приватные вспомогательные функции

  function getTelegramTheme(): 'dark' | 'light' | null {
    if (typeof window === 'undefined') return null;

    const tg = (window as { Telegram?: { WebApp?: { colorScheme?: string } } }).Telegram?.WebApp;
    if (tg?.colorScheme) {
      return tg.colorScheme === 'dark' ? 'dark' : 'light';
    }

    return null;
  }

  function resolveIsDark(mode: ThemeMode): boolean {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;

    if (telegramTheme.value) {
      return telegramTheme.value === 'dark';
    }

    return systemPrefersDark.value;
  }

  function applyTheme(isDark: boolean): void {
    Dark.set(isDark);
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('body--light', !isDark);
      document.body.classList.toggle('body--dark', isDark);
    }
  }

  function initSystemThemeDetection(): void {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    systemPrefersDark.value = mediaQuery.matches;

    mediaQuery.addEventListener('change', (e) => {
      systemPrefersDark.value = e.matches;
    });
  }

  function initTelegramThemeDetection(): void {
    if (typeof window === 'undefined') return;

    telegramTheme.value = getTelegramTheme();

    const tg = (
      window as {
        Telegram?: { WebApp?: { onEvent?: (event: string, cb: () => void) => void } };
      }
    ).Telegram?.WebApp;
    if (!tg?.onEvent) return;

    const themeChangedHandler = () => {
      telegramTheme.value = getTelegramTheme();
    };

    tg.onEvent('themeChanged', themeChangedHandler);
  }

  function saveToStorage(): void {
    if (typeof localStorage === 'undefined') return;

    const settings: Settings = {
      theme: theme.value,
      soundEnabled: soundEnabled.value,
      vibrationEnabled: vibrationEnabled.value,
      diceMode: diceMode.value,
      notificationsEnabled: notificationsEnabled.value,
      language: language.value,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  function loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const settings: Partial<Settings> = JSON.parse(saved);

      if (settings.theme) theme.value = settings.theme;
      if (typeof settings.soundEnabled === 'boolean') soundEnabled.value = settings.soundEnabled;
      if (typeof settings.vibrationEnabled === 'boolean')
        vibrationEnabled.value = settings.vibrationEnabled;
      if (settings.diceMode) diceMode.value = settings.diceMode;
      if (typeof settings.notificationsEnabled === 'boolean')
        notificationsEnabled.value = settings.notificationsEnabled;
      if (settings.language) language.value = settings.language;
    } catch (e) {
      console.error('Ошибка разбора настроек:', e);
    }
  }

  // Действия

  /**
   * Установить режим темы
   */
  function setTheme(mode: ThemeMode): void {
    theme.value = mode;
    saveToStorage();
  }

  /**
   * Переключаться между тёмной и светлой темами
   */
  function toggleTheme(): void {
    const newTheme: ThemeMode = isDark.value ? 'light' : 'dark';
    setTheme(newTheme);
  }

  /**
   * Переключить звук
   */
  function toggleSound(): void {
    soundEnabled.value = !soundEnabled.value;
    saveToStorage();
  }

  /**
   * Переключить вибрацию
   */
  function toggleVibration(): void {
    vibrationEnabled.value = !vibrationEnabled.value;
    saveToStorage();
  }

  /**
   * Установить режим кубика
   */
  function setDiceMode(mode: DiceMode): void {
    diceMode.value = mode;
    saveToStorage();
  }

  /**
   * Переключить уведомления
   */
  function toggleNotifications(): void {
    notificationsEnabled.value = !notificationsEnabled.value;
    saveToStorage();
  }

  /**
   * Установить язык
   */
  function setLanguage(lang: string): void {
    language.value = lang;
    saveToStorage();
  }

  /**
   * Воспроизвести звук если включен
   */
  function playSound(soundName: string): void {
    if (!soundEnabled.value) return;

    // Звук будет реализован с реальными аудиофайлами
    console.log('Воспроизведение звука:', soundName);
  }

  /**
   * Вызвать вибрацию если включена
   */
  function vibrate(pattern: number | number[] = 50): void {
    if (!vibrationEnabled.value) return;
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;

    navigator.vibrate(pattern);
  }

  /**
   * Инициализировать настройки при запуске приложения
   */
  function init(): void {
    if (isInitialized) return;
    isInitialized = true;

    loadFromStorage();
    initSystemThemeDetection();
    initTelegramThemeDetection();

    applyTheme(isDark.value);
  }

  /**
   * Сбросить на значения по умолчанию
   */
  function resetToDefaults(): void {
    theme.value = DEFAULT_SETTINGS.theme;
    soundEnabled.value = DEFAULT_SETTINGS.soundEnabled;
    vibrationEnabled.value = DEFAULT_SETTINGS.vibrationEnabled;
    diceMode.value = DEFAULT_SETTINGS.diceMode;
    notificationsEnabled.value = DEFAULT_SETTINGS.notificationsEnabled;
    language.value = DEFAULT_SETTINGS.language;

    saveToStorage();
    applyTheme(isDark.value);
  }

  // Наблюдать за изменениями и автоматически сохранять
  watch(
    [theme, soundEnabled, vibrationEnabled, diceMode, notificationsEnabled, language],
    () => {
      saveToStorage();
    },
    { deep: true },
  );

  const isDark = computed(() => resolveIsDark(theme.value));
  const isLight = computed(() => !isDark.value);

  watch(isDark, (newIsDark) => {
    applyTheme(newIsDark);
  });

  return {
    // Состояние
    theme,
    isDark,
    isLight,
    soundEnabled,
    vibrationEnabled,
    diceMode,
    notificationsEnabled,
    language,

    // Действия
    setTheme,
    toggleTheme,
    toggleSound,
    toggleVibration,
    setDiceMode,
    toggleNotifications,
    setLanguage,
    playSound,
    vibrate,
    init,
    resetToDefaults,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSettingsStore, import.meta.hot));
}
