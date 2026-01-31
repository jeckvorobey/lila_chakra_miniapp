/**
 * Хранилище настроек приложения.
 * Управляет темой, звуком, уведомлениями и другими предпочтениями пользователя.
 */

import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, watch } from 'vue';
import { Dark } from 'quasar';

export type ThemeMode = 'dark' | 'light' | 'system';
export type DiceMode = 'auto' | 'manual';

interface Settings {
  theme: ThemeMode;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  diceMode: DiceMode;
  notificationsEnabled: boolean;
  language: string;
}

const STORAGE_KEY = 'lila-settings';

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
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

  // Приватные вспомогательные функции

  function getSystemTheme(): boolean {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function applyTheme(isDark: boolean): void {
    Dark.set(isDark);
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('body--light', !isDark);
      document.body.classList.toggle('body--dark', isDark);
    }
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

    let isDark: boolean;
    if (mode === 'system') {
      isDark = getSystemTheme();
    } else {
      isDark = mode === 'dark';
    }

    applyTheme(isDark);
    saveToStorage();
  }

  /**
   * Переключаться между тёмной и светлой темами
   */
  function toggleTheme(): void {
    const newTheme: ThemeMode = theme.value === 'dark' ? 'light' : 'dark';
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
    loadFromStorage();

    // Применить начальную тему
    let isDark: boolean;
    if (theme.value === 'system') {
      isDark = getSystemTheme();
    } else {
      isDark = theme.value === 'dark';
    }
    applyTheme(isDark);

    // Слушать изменения системной темы
    if (typeof window !== 'undefined') {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (theme.value === 'system') {
          applyTheme(e.matches);
        }
      });
    }
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
    applyTheme(theme.value === 'dark');
  }

  // Наблюдать за изменениями и автоматически сохранять
  watch(
    [theme, soundEnabled, vibrationEnabled, diceMode, notificationsEnabled, language],
    () => {
      saveToStorage();
    },
    { deep: true },
  );

  return {
    // Состояние
    theme,
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
