import { beforeEach, describe, expect, it, vi } from 'vitest';

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
        },
      },
    });
  });

  it('добавляет Authorization и X-Telegram-Init-Data', () => {
    api.defaults.headers.common['Authorization'] = 'Bearer test-token';
    window.Telegram.WebApp.initData = 'hash=abc123';

    const headers = buildApiFetchHeaders({
      Accept: 'text/event-stream',
    });

    expect(headers.get('Accept')).toBe('text/event-stream');
    expect(headers.get('Authorization')).toBe('Bearer test-token');
    expect(headers.get('X-Telegram-Init-Data')).toBe('hash=abc123');
  });

  it('не добавляет пустые заголовки и не перезаписывает уже переданные', () => {
    api.defaults.headers.common['Authorization'] = 'Bearer default-token';
    window.Telegram.WebApp.initData = 'hash=default';

    const headers = buildApiFetchHeaders({
      Authorization: 'Bearer request-token',
      'X-Telegram-Init-Data': 'hash=request',
    });

    expect(headers.get('Authorization')).toBe('Bearer request-token');
    expect(headers.get('X-Telegram-Init-Data')).toBe('hash=request');
  });
});
