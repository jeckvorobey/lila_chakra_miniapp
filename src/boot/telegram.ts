/**
 * Telegram WebApp SDK boot file for Lila Chakra.
 * Initializes Telegram Mini App SDK and configures app behavior.
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

  // Methods
  ready(): void;
  expand(): void;
  close(): void;
  enableClosingConfirmation(): void;
  disableClosingConfirmation(): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;

  // Main Button
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

  // Back Button
  BackButton: {
    isVisible: boolean;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
    show(): void;
    hide(): void;
  };

  // Haptic Feedback
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };

  // Popup
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
    callback?: (buttonId: string) => void
  ): void;

  showAlert(message: string, callback?: () => void): void;
  showConfirm(message: string, callback?: (ok: boolean) => void): void;

  // QR Scanner
  showScanQrPopup(
    params: { text?: string },
    callback?: (text: string) => void
  ): void;
  closeScanQrPopup(): void;

  // Clipboard
  readTextFromClipboard(callback?: (text: string) => void): void;

  // Share
  switchInlineQuery(query: string, chooseChatTypes?: string[]): void;

  // Open links
  openLink(url: string, options?: { try_instant_view?: boolean }): void;
  openTelegramLink(url: string): void;
  openInvoice(url: string, callback?: (status: string) => void): void;

  // Events
  onEvent(eventType: string, callback: () => void): void;
  offEvent(eventType: string, callback: () => void): void;

  sendData(data: string): void;
}

// Export for use in composables
export type { TelegramWebApp, TelegramUser };

/**
 * Get Telegram WebApp instance
 */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp || null;
}

/**
 * Check if running inside Telegram
 */
export function isInTelegram(): boolean {
  const tg = getTelegramWebApp();
  return !!tg?.initData;
}

export default boot(({ app }) => {
  const tg = getTelegramWebApp();

  if (!tg) {
    console.warn('Telegram WebApp SDK not available. Running in development mode.');
    return;
  }

  // Notify Telegram that app is ready
  tg.ready();

  // Expand the app to full height
  tg.expand();

  // Enable closing confirmation for active games
  // (will be managed dynamically by game store)
  // tg.enableClosingConfirmation();

  // Set theme colors based on our design
  const isDark = tg.colorScheme === 'dark';
  if (isDark) {
    tg.setHeaderColor('#0F0D1A');
    tg.setBackgroundColor('#0F0D1A');
  } else {
    tg.setHeaderColor('#FAFAF9');
    tg.setBackgroundColor('#FAFAF9');
  }

  // Make TG available globally via provide/inject
  app.provide('telegram', tg);

  // Log initialization info
  console.log('Telegram WebApp initialized:', {
    version: tg.version,
    platform: tg.platform,
    colorScheme: tg.colorScheme,
    isExpanded: tg.isExpanded,
    user: tg.initDataUnsafe.user?.username || 'unknown',
  });
});
