import type { TelegramWebApp } from 'src/types/telegram.interface';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

/**
 * Получить экземпляр Telegram WebApp.
 */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp || null;
}

/**
 * Проверить, что приложение открыто внутри Telegram Mini App.
 */
export function isInTelegram(): boolean {
  const tg = getTelegramWebApp();
  return !!tg?.initData && tg.initData.length > 0;
}
