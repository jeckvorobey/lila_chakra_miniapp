/**
 * Файл инициализации Telegram WebApp SDK для Lila Chakra.
 * Инициализирует SDK Telegram Mini App и настраивает поведение приложения.
 */

import { boot } from 'quasar/wrappers';
import type { TelegramWebApp, TelegramUser } from 'src/types/telegram.interface';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

/**
 * Получить экземпляр Telegram WebApp
 */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp || null;
}

/**
 * Проверить, запущено ли приложение внутри Telegram
 */
export function isInTelegram(): boolean {
  const tg = getTelegramWebApp();
  return !!tg?.initData;
}

export default boot(({ app }) => {
  const tg = getTelegramWebApp();

  if (!tg) {
    console.warn('Telegram WebApp SDK не доступен. Работа в режиме разработки.');
    return;
  }

  // Сообщить Telegram, что приложение готово
  tg.ready();

  // Развернуть приложение на полную высоту
  tg.expand();

  // Включить подтверждение закрытия для активных игр
  // (будет управляться динамически хранилищем игры)
  // tg.enableClosingConfirmation();

  // Установить цвета темы на основе нашего дизайна
  const isDark = tg.colorScheme === 'dark';
  if (isDark) {
    tg.setHeaderColor('#0F0D1A');
    tg.setBackgroundColor('#0F0D1A');
  } else {
    tg.setHeaderColor('#FAFAF9');
    tg.setBackgroundColor('#FAFAF9');
  }

  // Сделать TG доступным глобально через provide/inject
  app.provide('telegram', tg);

  // Логирование информации инициализации
  console.log('Telegram WebApp инициализирован:', {
    version: tg.version,
    platform: tg.platform,
    colorScheme: tg.colorScheme,
    isExpanded: tg.isExpanded,
    user: tg.initDataUnsafe.user?.username || 'unknown',
  });
});
