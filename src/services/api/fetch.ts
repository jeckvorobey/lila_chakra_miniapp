import { buildApiFetchHeaders, buildApiResourceUrl } from 'src/boot/axios';

/**
 * Выполнить авторизованный fetch к backend с теми же auth/Telegram заголовками,
 * что и у axios-клиента miniapp.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { headers, ...rest } = init;
  return fetch(buildApiResourceUrl(path), {
    ...rest,
    headers: buildApiFetchHeaders(headers),
  });
}
