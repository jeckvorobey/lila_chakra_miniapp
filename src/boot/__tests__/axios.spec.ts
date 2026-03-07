import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TelegramWebApp } from 'src/types/telegram.interface';

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    defaults: {
      baseURL: '/api',
      headers: {
        common: {} as Record<string, string>,
      },
    },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

vi.mock('#q-app/wrappers', () => ({
  defineBoot: (callback: unknown) => callback,
}));

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockApi),
  },
  AxiosHeaders: {
    from: vi.fn((headers?: HeadersInit) => new Headers(headers)),
  },
}));

vi.mock('quasar', () => ({
  Notify: {
    create: vi.fn(),
  },
}));

vi.mock('src/stores/auth.store', () => ({
  useAuthStore: () => ({
    logout: vi.fn(),
  }),
}));

import { api, buildApiFetchHeaders } from '../axios';

describe('buildApiFetchHeaders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.defaults.headers.common = {};
    vi.stubGlobal('window', {
      location: { origin: 'https://miniapp.test' },
      Telegram: {
        WebApp: {
          initData: '',
          initDataUnsafe: {},
          version: '1.0.0',
          platform: 'web',
          colorScheme: 'light',
          themeParams: {},
          isExpanded: false,
          viewportHeight: 800,
          viewportStableHeight: 700,
          headerColor: '#ffffff',
          backgroundColor: '#ffffff',
          isClosingConfirmationEnabled: false,
          ready: vi.fn(),
          expand: vi.fn(),
          close: vi.fn(),
          enableClosingConfirmation: vi.fn(),
          disableClosingConfirmation: vi.fn(),
          setHeaderColor: vi.fn(),
          setBackgroundColor: vi.fn(),
          MainButton: {
            text: '',
            color: '',
            textColor: '',
            isVisible: false,
            isActive: false,
            isProgressVisible: false,
            setText: vi.fn(),
            onClick: vi.fn(),
            offClick: vi.fn(),
            show: vi.fn(),
            hide: vi.fn(),
            enable: vi.fn(),
            disable: vi.fn(),
            showProgress: vi.fn(),
            hideProgress: vi.fn(),
          },
          BackButton: {
            isVisible: false,
            onClick: vi.fn(),
            offClick: vi.fn(),
            show: vi.fn(),
            hide: vi.fn(),
          },
          HapticFeedback: {
            impactOccurred: vi.fn(),
            notificationOccurred: vi.fn(),
            selectionChanged: vi.fn(),
          },
          showPopup: vi.fn(),
          showAlert: vi.fn(),
          showConfirm: vi.fn(),
          showScanQrPopup: vi.fn(),
          closeScanQrPopup: vi.fn(),
          readTextFromClipboard: vi.fn(),
          switchInlineQuery: vi.fn(),
          openLink: vi.fn(),
          openTelegramLink: vi.fn(),
          openInvoice: vi.fn(),
          onEvent: vi.fn(),
          offEvent: vi.fn(),
          sendData: vi.fn(),
        } as TelegramWebApp,
      },
    });
  });

  it('добавляет Authorization и X-Telegram-Init-Data', () => {
    api.defaults.headers.common['Authorization'] = 'Bearer test-token';
    (window as typeof window & { Telegram: { WebApp: TelegramWebApp } }).Telegram.WebApp.initData = 'hash=abc123';

    const headers = buildApiFetchHeaders({
      Accept: 'text/event-stream',
    });

    expect(headers.get('Accept')).toBe('text/event-stream');
    expect(headers.get('Authorization')).toBe('Bearer test-token');
    expect(headers.get('X-Telegram-Init-Data')).toBe('hash=abc123');
  });

  it('не добавляет пустые заголовки и не перезаписывает уже переданные', () => {
    api.defaults.headers.common['Authorization'] = 'Bearer default-token';
    (window as typeof window & { Telegram: { WebApp: TelegramWebApp } }).Telegram.WebApp.initData = 'hash=default';

    const headers = buildApiFetchHeaders({
      Authorization: 'Bearer request-token',
      'X-Telegram-Init-Data': 'hash=request',
    });

    expect(headers.get('Authorization')).toBe('Bearer request-token');
    expect(headers.get('X-Telegram-Init-Data')).toBe('hash=request');
  });
});
