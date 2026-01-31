/**
 * Файл инициализации Telegram WebApp SDK для Lila Chakra.
 * Инициализирует SDK Telegram Mini App и настраивает поведение приложения.
 */

import { boot } from 'quasar/wrappers';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: TelegramUser;
    auth_date?: number;
    hash?: string;
    start_param?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;

  // Методы
  ready(): void;
  expand(): void;
  close(): void;
  enableClosingConfirmation(): void;
  disableClosingConfirmation(): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;

  // Главная кнопка
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText(text: string): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    showProgress(leaveActive?: boolean): void;
    hideProgress(): void;
  };

  // Кнопка "Назад"
  BackButton: {
    isVisible: boolean;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
    show(): void;
    hide(): void;
  };

  // Обратная связь (вибрация)
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };

  // Всплывающее окно
  showPopup(
    params: {
      title?: string;
      message: string;
      buttons?: Array<{
        id?: string;
        type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
        text?: string;
      }>;
    },
    callback?: (buttonId: string) => void,
  ): void;

  showAlert(message: string, callback?: () => void): void;
  showConfirm(message: string, callback?: (ok: boolean) => void): void;

  // Сканер QR-кода
  showScanQrPopup(params: { text?: string }, callback?: (text: string) => void): void;
  closeScanQrPopup(): void;

  // Буфер обмена
  readTextFromClipboard(callback?: (text: string) => void): void;

  // Поделиться
  switchInlineQuery(query: string, chooseChatTypes?: string[]): void;

  // Открыть ссылки
  openLink(url: string, options?: { try_instant_view?: boolean }): void;
  openTelegramLink(url: string): void;
  openInvoice(url: string, callback?: (status: string) => void): void;

  // События
  onEvent(eventType: string, callback: () => void): void;
  offEvent(eventType: string, callback: () => void): void;

  sendData(data: string): void;
}

// Экспортировать для использования в composables
export type { TelegramWebApp, TelegramUser };

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
