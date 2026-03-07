import axios, { type AxiosInstance } from 'axios';

/**
 * Добавить ведущий слэш к пути при необходимости.
 */
function ensureLeadingSlash(value: string): string {
  if (!value) return '/';
  return value.startsWith('/') ? value : `/${value}`;
}

/**
 * Удалить завершающие слэши.
 */
function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

/**
 * Нормализовать API prefix из env.
 */
function normalizeApiPrefix(prefix?: string): string {
  const normalizedPrefix = ensureLeadingSlash((prefix || '/api').trim());
  return normalizedPrefix === '/' ? '' : trimTrailingSlashes(normalizedPrefix);
}

/**
 * Собрать абсолютный baseURL из env-переменных.
 */
function buildBaseUrl(apiUrl: string, apiPrefix: string): string {
  const normalizedApiUrl = trimTrailingSlashes(apiUrl.trim());
  return `${normalizedApiUrl}${apiPrefix}`;
}

/**
 * Определить базовый URL backend API.
 */
function resolveApiBaseUrl(): string {
  const apiPrefix = normalizeApiPrefix(import.meta.env.VITE_API_PREFIX);
  const apiUrl = import.meta.env.VITE_API_URL;
  return apiUrl ? buildBaseUrl(apiUrl, apiPrefix) : apiPrefix || '/api';
}

/**
 * Прочитать initData из Telegram WebApp.
 */
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

const apiBaseUrl = resolveApiBaseUrl();

/**
 * Единый axios-клиент miniapp для backend API.
 */
export const api: AxiosInstance = axios.create({ baseURL: apiBaseUrl });

/**
 * Построить заголовки для fetch в том же формате, что и axios-интерсептор.
 */
export function buildApiFetchHeaders(headers?: HeadersInit): Headers {
  const result = new Headers(headers);
  const authorizationHeader = api.defaults.headers.common['Authorization'];

  if (
    typeof authorizationHeader === 'string' &&
    authorizationHeader.trim().length > 0 &&
    !result.has('Authorization')
  ) {
    result.set('Authorization', authorizationHeader);
  }

  const telegramInitData = getTelegramInitData();
  if (telegramInitData && !result.has('X-Telegram-Init-Data')) {
    result.set('X-Telegram-Init-Data', telegramInitData);
  }

  return result;
}

/**
 * Построить URL ресурса backend для blob/fetch запросов.
 */
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

/**
 * Получить initData Telegram для интерсепторов и fetch.
 */
export function getTelegramInitDataHeader(): string | null {
  return getTelegramInitData();
}
