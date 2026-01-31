export type ThemeMode = 'dark' | 'light' | 'system';
export type DiceMode = 'auto' | 'manual';

export interface Settings {
  theme: ThemeMode;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  diceMode: DiceMode;
  notificationsEnabled: boolean;
  language: string;
}
