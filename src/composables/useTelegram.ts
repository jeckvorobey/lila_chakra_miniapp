/**
 * Composable SDK Telegram WebApp для Lila Chakra.
 * Обеспечивает реактивный доступ к функциям Telegram.
 */

import { ref, computed, inject, onMounted, onUnmounted } from 'vue';
import type { TelegramWebApp, TelegramUser } from 'src/types/telegram.interface';
import { getTelegramWebApp, isInTelegram } from 'src/boot/telegram';

export function useTelegram() {
  // Попытаться получить внедрённый экземпляр или получить напрямую
  const injectedTg = inject<TelegramWebApp | null>('telegram', null);
  const tg = injectedTg || getTelegramWebApp();

  // Реактивное состояние
  const user = ref<TelegramUser | null>(tg?.initDataUnsafe.user || null);
  const colorScheme = ref<'light' | 'dark'>(tg?.colorScheme || 'dark');
  const viewportHeight = ref(tg?.viewportHeight || window?.innerHeight || 0);
  const isExpanded = ref(tg?.isExpanded || false);
  const platform = ref(tg?.platform || 'unknown');
  const version = ref(tg?.version || '0.0');

  // Геттеры
  const initData = computed(() => tg?.initData || '');
  const startParam = computed(() => tg?.initDataUnsafe.start_param || null);
  const isAvailable = computed(() => !!tg && isInTelegram());
  const isDark = computed(() => colorScheme.value === 'dark');

  // Помощники главной кнопки
  const mainButton = {
    show(text: string, onClick: () => void) {
      if (!tg?.MainButton) return;
      tg.MainButton.setText(text);
      tg.MainButton.onClick(onClick);
      tg.MainButton.show();
    },
    hide() {
      tg?.MainButton?.hide();
    },
    showProgress() {
      tg?.MainButton?.showProgress(true);
    },
    hideProgress() {
      tg?.MainButton?.hideProgress();
    },
    enable() {
      tg?.MainButton?.enable();
    },
    disable() {
      tg?.MainButton?.disable();
    },
  };

  // Помощники кнопки вернуться
  const backButton = {
    show(onClick: () => void) {
      if (!tg?.BackButton) return;
      tg.BackButton.onClick(onClick);
      tg.BackButton.show();
    },
    hide() {
      tg?.BackButton?.hide();
    },
  };

  // Тактильная обратная связь
  const haptic = {
    impact(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') {
      tg?.HapticFeedback?.impactOccurred(style);
    },
    notification(type: 'error' | 'success' | 'warning') {
      tg?.HapticFeedback?.notificationOccurred(type);
    },
    selection() {
      tg?.HapticFeedback?.selectionChanged();
    },
  };

  // Диалоги
  function showAlert(message: string): Promise<void> {
    return new Promise((resolve) => {
      if (tg?.showAlert) {
        tg.showAlert(message, resolve);
      } else {
        window.alert(message);
        resolve();
      }
    });
  }

  function showConfirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (tg?.showConfirm) {
        tg.showConfirm(message, resolve);
      } else {
        resolve(window.confirm(message));
      }
    });
  }

  function showPopup(params: {
    title?: string;
    message: string;
    buttons?: Array<{
      id?: string;
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
      text?: string;
    }>;
  }): Promise<string> {
    return new Promise((resolve) => {
      if (tg?.showPopup) {
        tg.showPopup(params, resolve);
      } else {
        window.alert(params.message);
        resolve('ok');
      }
    });
  }

  // Ссылки
  function openLink(url: string, tryInstantView = false) {
    if (tg?.openLink) {
      tg.openLink(url, { try_instant_view: tryInstantView });
    } else {
      window.open(url, '_blank');
    }
  }

  function openTelegramLink(url: string) {
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  }

  // Подтверждение закрытия (для активных игр)
  function enableClosingConfirmation() {
    tg?.enableClosingConfirmation?.();
  }

  function disableClosingConfirmation() {
    tg?.disableClosingConfirmation?.();
  }

  // Цвета темы
  function setHeaderColor(color: string) {
    tg?.setHeaderColor?.(color);
  }

  function setBackgroundColor(color: string) {
    tg?.setBackgroundColor?.(color);
  }

  // Развернуть приложение
  function expand() {
    tg?.expand?.();
    isExpanded.value = true;
  }

  // Закрыть приложение
  function close() {
    tg?.close?.();
  }

  // Обработчики событий
  let themeChangedHandler: (() => void) | null = null;
  let viewportChangedHandler: (() => void) | null = null;

  onMounted(() => {
    if (!tg) return;

    // Слушать изменения темы
    themeChangedHandler = () => {
      colorScheme.value = tg.colorScheme;
    };
    tg.onEvent('themeChanged', themeChangedHandler);

    // Слушать изменения viewport
    viewportChangedHandler = () => {
      viewportHeight.value = tg.viewportHeight;
      isExpanded.value = tg.isExpanded;
    };
    tg.onEvent('viewportChanged', viewportChangedHandler);
  });

  onUnmounted(() => {
    if (!tg) return;

    if (themeChangedHandler) {
      tg.offEvent('themeChanged', themeChangedHandler);
    }
    if (viewportChangedHandler) {
      tg.offEvent('viewportChanged', viewportChangedHandler);
    }
  });

  return {
    // Исходный SDK
    tg,

    // Состояние
    user,
    colorScheme,
    viewportHeight,
    isExpanded,
    platform,
    version,

    // Геттеры
    initData,
    startParam,
    isAvailable,
    isDark,

    // Элементы UI
    mainButton,
    backButton,

    // Тактильная обратная связь
    haptic,

    // Диалоги
    showAlert,
    showConfirm,
    showPopup,

    // Ссылки
    openLink,
    openTelegramLink,

    // Закрытие
    enableClosingConfirmation,
    disableClosingConfirmation,

    // Тема
    setHeaderColor,
    setBackgroundColor,

    // Окно
    expand,
    close,
  };
}

export default useTelegram;
