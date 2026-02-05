/**
 * Composable управления темой для Lila Chakra.
 * Использует глобальные настройки и Telegram/system при режиме system.
 */

import { storeToRefs } from 'pinia';
import { useSettingsStore } from 'src/stores/settings.store';

export function useTheme() {
  const settingsStore = useSettingsStore();
  const { theme, isDark, isLight } = storeToRefs(settingsStore);

  return {
    themeMode: theme,
    isDark,
    isLight,
    setTheme: settingsStore.setTheme,
    toggleTheme: settingsStore.toggleTheme,
  };
}

export default useTheme;
