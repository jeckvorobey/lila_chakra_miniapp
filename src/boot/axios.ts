import { defineBoot } from '#q-app/wrappers';
import axios, { AxiosHeaders, type AxiosInstance } from 'axios';
import { Notify } from 'quasar';
import { useAuthStore } from 'src/stores/auth.store';

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

// Будьте осторожны при использовании SSR из-за риска загрязнения состояния между запросами
// из-за создания Singleton экземпляра здесь;
// Если какой-либо клиент изменит этот (глобальный) экземпляр, может быть
// хорошей идеей переместить создание этого экземпляра внутрь
// функции "export default () => {}" ниже (которая запускается отдельно
// для каждого клиента)
function ensureLeadingSlash(value: string): string {
  if (!value) return '/';
  return value.startsWith('/') ? value : `/${value}`;
}

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

function normalizeApiPrefix(prefix?: string): string {
  const normalizedPrefix = ensureLeadingSlash((prefix || '/api').trim());
  return normalizedPrefix === '/' ? '' : trimTrailingSlashes(normalizedPrefix);
}

function buildBaseUrl(apiUrl: string, apiPrefix: string): string {
  const normalizedApiUrl = trimTrailingSlashes(apiUrl.trim());
  return `${normalizedApiUrl}${apiPrefix}`;
}

function resolveApiBaseUrl(): string {
  const apiPrefix = normalizeApiPrefix(import.meta.env.VITE_API_PREFIX);
  const apiUrl = import.meta.env.VITE_API_URL;
  return apiUrl ? buildBaseUrl(apiUrl, apiPrefix) : apiPrefix || '/api';
}

const apiBaseUrl = resolveApiBaseUrl();
const api = axios.create({ baseURL: apiBaseUrl });

function getTelegramInitData(): string | null {
  if (typeof window === 'undefined') return null;

  const tg = (
    window as {
      Telegram?: {
        WebApp?: { initData?: string };
      };
    }
  ).Telegram?.WebApp;

  const initData = tg?.initData;
  if (!initData) return null;

  const trimmed = initData.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getAuthorizationHeader(): string | null {
  const authorizationHeader = api.defaults.headers.common['Authorization'];
  return typeof authorizationHeader === 'string' && authorizationHeader.trim().length > 0
    ? authorizationHeader
    : null;
}

export function buildApiFetchHeaders(headers?: HeadersInit): Headers {
  const result = new Headers(headers);
  const authorizationHeader = getAuthorizationHeader();
  if (authorizationHeader && !result.has('Authorization')) {
    result.set('Authorization', authorizationHeader);
  }

  const telegramInitData = getTelegramInitData();
  if (telegramInitData && !result.has('X-Telegram-Init-Data')) {
    result.set('X-Telegram-Init-Data', telegramInitData);
  }

  return result;
}

export function buildApiResourceUrl(path: string): string {
  const trimmedPath = path.trim();
  if (/^https?:\/\//.test(trimmedPath)) {
    return trimmedPath;
  }

  const normalizedPath = ensureLeadingSlash(trimmedPath);
  const baseURL = api.defaults.baseURL || apiBaseUrl;

  if (/^https?:\/\//.test(baseURL)) {
    return `${trimTrailingSlashes(baseURL)}${normalizedPath}`;
  }

  const normalizedBase = ensureLeadingSlash(baseURL);
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${trimTrailingSlashes(normalizedBase)}${normalizedPath}`;
  }

  return `${trimTrailingSlashes(normalizedBase)}${normalizedPath}`;
}

export default defineBoot(({ app, router }) => {
  const authStore = useAuthStore();

  api.interceptors.request.use((config) => {
    const headers = AxiosHeaders.from(config.headers);
    
    const telegramInitData = getTelegramInitData();
    if (telegramInitData) {
      headers.set('X-Telegram-Init-Data', telegramInitData);
    }

    // Предотвращение агрессивного кэширования GET-запросов (особенно в Telegram Web App на мобильных)
    if (config.method?.toLowerCase() === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
      
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
    }

    config.headers = headers;
    return config;
  });

  // Глобальная обработка 401/403 для сброса сессии (кроме auth endpoints)
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error?.response?.status;
      const url = error?.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/');

      if ((status === 401 || status === 403) && !isAuthEndpoint) {
        await authStore.logout();

        // Показать уведомление при 403 (заблокированный пользователь)
        if (status === 403) {
          const detail = (error?.response?.data?.detail as string) || 'Доступ запрещён';
          Notify.create({
            type: 'negative',
            message: detail,
            position: 'top',
            timeout: 5000,
          });
        }

        if (router.currentRoute.value.name !== 'not-found') {
          await router.push({ name: 'not-found' });
        }
      }
      return Promise.reject(error instanceof Error ? error : new Error('Request failed'));
    },
  );

  // для использования в Vue файлах (Options API) через this.$axios и this.$api

  app.config.globalProperties.$axios = axios;
  // ^ ^ ^ это позволит вам использовать this.$axios (для Vue Options API)
  //       поэтому вам не обязательно нужно импортировать axios в каждый vue файл

  app.config.globalProperties.$api = api;
  // ^ ^ ^ это позволит вам использовать this.$api (для Vue Options API)
  //       так что вы легко сможете выполнять запросы к API вашего приложения
});

export { api };
