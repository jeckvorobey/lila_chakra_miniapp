/**
 * Settings store for app preferences.
 * Handles theme, sound, notifications, and other user preferences.
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
  // State
  const theme = ref<ThemeMode>(DEFAULT_SETTINGS.theme);
  const soundEnabled = ref(DEFAULT_SETTINGS.soundEnabled);
  const vibrationEnabled = ref(DEFAULT_SETTINGS.vibrationEnabled);
  const diceMode = ref<DiceMode>(DEFAULT_SETTINGS.diceMode);
  const notificationsEnabled = ref(DEFAULT_SETTINGS.notificationsEnabled);
  const language = ref(DEFAULT_SETTINGS.language);

  // Private helpers

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
      if (typeof settings.vibrationEnabled === 'boolean') vibrationEnabled.value = settings.vibrationEnabled;
      if (settings.diceMode) diceMode.value = settings.diceMode;
      if (typeof settings.notificationsEnabled === 'boolean') notificationsEnabled.value = settings.notificationsEnabled;
      if (settings.language) language.value = settings.language;
    } catch (e) {
      console.error('Failed to parse settings:', e);
    }
  }

  // Actions

  /**
   * Set theme mode
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
   * Toggle between dark and light themes
   */
  function toggleTheme(): void {
    const newTheme: ThemeMode = theme.value === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }

  /**
   * Toggle sound
   */
  function toggleSound(): void {
    soundEnabled.value = !soundEnabled.value;
    saveToStorage();
  }

  /**
   * Toggle vibration
   */
  function toggleVibration(): void {
    vibrationEnabled.value = !vibrationEnabled.value;
    saveToStorage();
  }

  /**
   * Set dice mode
   */
  function setDiceMode(mode: DiceMode): void {
    diceMode.value = mode;
    saveToStorage();
  }

  /**
   * Toggle notifications
   */
  function toggleNotifications(): void {
    notificationsEnabled.value = !notificationsEnabled.value;
    saveToStorage();
  }

  /**
   * Set language
   */
  function setLanguage(lang: string): void {
    language.value = lang;
    saveToStorage();
  }

  /**
   * Play sound if enabled
   */
  function playSound(soundName: string): void {
    if (!soundEnabled.value) return;

    // Sound will be implemented with actual audio files
    console.log('Playing sound:', soundName);
  }

  /**
   * Trigger vibration if enabled
   */
  function vibrate(pattern: number | number[] = 50): void {
    if (!vibrationEnabled.value) return;
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;

    navigator.vibrate(pattern);
  }

  /**
   * Initialize settings on app start
   */
  function init(): void {
    loadFromStorage();

    // Apply initial theme
    let isDark: boolean;
    if (theme.value === 'system') {
      isDark = getSystemTheme();
    } else {
      isDark = theme.value === 'dark';
    }
    applyTheme(isDark);

    // Listen for system theme changes
    if (typeof window !== 'undefined') {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (theme.value === 'system') {
          applyTheme(e.matches);
        }
      });
    }
  }

  /**
   * Reset to defaults
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

  // Watch for changes and auto-save
  watch(
    [theme, soundEnabled, vibrationEnabled, diceMode, notificationsEnabled, language],
    () => {
      saveToStorage();
    },
    { deep: true }
  );

  return {
    // State
    theme,
    soundEnabled,
    vibrationEnabled,
    diceMode,
    notificationsEnabled,
    language,

    // Actions
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
