/**
 * Тесты для auth store (Miniapp).
 *
 * Модуль тестирует:
 * - logout() вызывает API и очищает токен
 * - logout() отправляет BroadcastChannel сообщение
 * - init() настраивает listener для logout от других вкладок
 * - BroadcastChannel graceful degradation если недоступен
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

// Mock axios — используем vi.hoisted() чтобы переменная была доступна при hoisting
const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    post: vi.fn(),
    get: vi.fn(),
    defaults: {
      headers: {
        common: {} as Record<string, string>,
      },
    },
  },
}));

vi.mock('src/boot/axios', () => ({
  api: mockApi,
}));

// Теперь импортируем store (после моков)
import { useAuthStore } from '../auth.store';

const TOKEN_KEY = 'lila-auth-token';

// Mock BroadcastChannel
class MockBroadcastChannel {
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  private static instances: MockBroadcastChannel[] = [];

  constructor(name: string) {
    this.name = name;
    MockBroadcastChannel.instances.push(this);
  }

  postMessage(data: unknown) {
    // Эмулируем отправку сообщения всем другим экземплярам
    MockBroadcastChannel.instances.forEach((instance) => {
      if (instance !== this && instance.onmessage) {
        instance.onmessage(new MessageEvent('message', { data }));
      }
    });
  }

  close() {
    const index = MockBroadcastChannel.instances.indexOf(this);
    if (index > -1) {
      MockBroadcastChannel.instances.splice(index, 1);
    }
  }

  static reset() {
    MockBroadcastChannel.instances = [];
  }
}

describe('Auth Store - Logout & BroadcastChannel', () => {
  beforeEach(() => {
    setActivePinia(createPinia());

    // Устанавливаем mock BroadcastChannel
    global.BroadcastChannel = MockBroadcastChannel as unknown as typeof BroadcastChannel;

    // Устанавливаем mock localStorage если он не работает в окружении
    const storageMock: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        storageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete storageMock[key];
      }),
      clear: vi.fn(() => {
        Object.keys(storageMock).forEach((key) => delete storageMock[key]);
      }),
    });

    // Сбрасываем api headers
    mockApi.defaults.headers.common = {};

    // Сбрасываем mocks
    vi.clearAllMocks();
    MockBroadcastChannel.reset();
  });

  afterEach(() => {
    MockBroadcastChannel.reset();
  });

  describe('logout()', () => {
    it('should call backend logout API', async () => {
      const store = useAuthStore();

      // Устанавливаем токен
      store.token = 'test-jwt-token';

      // Mock успешный ответ от API
      vi.mocked(mockApi.post).mockResolvedValueOnce({
        data: { success: true },
      });

      await store.logout();

      // Проверяем, что API был вызван
      expect(mockApi.post).toHaveBeenCalledWith('/auth/logout');
    });

    it('should clear token from store and localStorage', async () => {
      const store = useAuthStore();

      // Устанавливаем токен
      store.token = 'test-jwt-token';
      localStorage.setItem(TOKEN_KEY, 'test-jwt-token');

      // Mock API
      vi.mocked(mockApi.post).mockResolvedValueOnce({
        data: { success: true },
      });

      await store.logout();

      // Проверяем, что токен очищен
      expect(store.token).toBeNull();
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });

    it('should clear telegramUser', async () => {
      const store = useAuthStore();

      store.token = 'test-jwt-token';
      store.telegramUser = {
        id: 123456,
        first_name: 'Test',
        username: 'test_user',
      };

      vi.mocked(mockApi.post).mockResolvedValueOnce({
        data: { success: true },
      });

      await store.logout();

      expect(store.telegramUser).toBeNull();
    });

    it('should send BroadcastChannel message', async () => {
      const store = useAuthStore();
      store.token = 'test-jwt-token';

      // Создаём второй экземпляр канала (эмулируем другую вкладку)
      const otherTabChannel = new BroadcastChannel('lila-auth');
      const messageHandler = vi.fn();
      otherTabChannel.onmessage = messageHandler;

      vi.mocked(mockApi.post).mockResolvedValueOnce({
        data: { success: true },
      });

      await store.logout();

      // Проверяем, что другая вкладка получила сообщение
      expect(messageHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { type: 'logout' },
        }),
      );

      otherTabChannel.close();
    });

    it('should continue if backend logout fails', async () => {
      const store = useAuthStore();
      store.token = 'test-jwt-token';

      // Mock: API возвращает ошибку
      vi.mocked(mockApi.post).mockRejectedValueOnce(new Error('Network error'));

      // Не должно выбросить исключение
      await expect(store.logout()).resolves.not.toThrow();

      // Токен всё равно должен быть очищен
      expect(store.token).toBeNull();
    });

    it('should handle missing BroadcastChannel gracefully', async () => {
      // Удаляем BroadcastChannel (старый браузер)
      global.BroadcastChannel = undefined as unknown as typeof BroadcastChannel;

      const store = useAuthStore();
      store.token = 'test-jwt-token';

      vi.mocked(mockApi.post).mockResolvedValueOnce({
        data: { success: true },
      });

      // Не должно выбросить исключение
      await expect(store.logout()).resolves.not.toThrow();

      expect(store.token).toBeNull();
    });

    it('should not call API if no token', async () => {
      const store = useAuthStore();
      store.token = null;

      await store.logout();

      // API не должен быть вызван без токена
      expect(mockApi.post).not.toHaveBeenCalled();
    });
  });

  describe('BroadcastChannel listener via init()', () => {
    it('should clear token when receiving logout message from another tab', async () => {
      const store = useAuthStore();

      // Устанавливаем токен в localStorage для loadToken()
      localStorage.setItem(TOKEN_KEY, 'test-jwt-token');

      // init() вызывает loadToken() и listenForLogout()
      await store.init();

      // К этому моменту listener должен быть настроен
      // Эмулируем сообщение от другой вкладки
      const senderChannel = new BroadcastChannel('lila-auth');
      senderChannel.postMessage({ type: 'logout' });

      // Проверяем, что токен очищен
      expect(store.token).toBeNull();
      expect(store.telegramUser).toBeNull();

      senderChannel.close();
    });

    it('should not crash if BroadcastChannel is unavailable during init', async () => {
      // Удаляем BroadcastChannel
      global.BroadcastChannel = undefined as unknown as typeof BroadcastChannel;

      const store = useAuthStore();

      // init() не должна бросать исключение
      await expect(store.init()).resolves.not.toThrow();
    });

    it('should ignore non-logout messages', async () => {
      const store = useAuthStore();
      localStorage.setItem(TOKEN_KEY, 'test-jwt-token');

      await store.init();

      const senderChannel = new BroadcastChannel('lila-auth');
      senderChannel.postMessage({ type: 'other_event' });

      // Токен не должен быть очищен
      expect(store.token).toBe('test-jwt-token');

      senderChannel.close();
    });
  });

  describe('Multi-tab synchronization', () => {
    it('should synchronize logout across multiple tabs', async () => {
      // Tab 1 — настраиваем listener через init()
      const pinia1 = createPinia();
      setActivePinia(pinia1);
      const store1 = useAuthStore();
      localStorage.setItem(TOKEN_KEY, 'tab1-token');
      await store1.init();

      // Tab 2
      const pinia2 = createPinia();
      setActivePinia(pinia2);
      const store2 = useAuthStore();
      store2.token = 'tab2-token';

      // Mock API для tab 2
      vi.mocked(mockApi.post).mockResolvedValueOnce({
        data: { success: true },
      });

      // Tab 2 выполняет logout
      await store2.logout();

      // Проверяем, что оба store очищены
      expect(store2.token).toBeNull();
      expect(store1.token).toBeNull();
    });
  });
});
