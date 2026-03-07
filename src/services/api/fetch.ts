import { buildApiFetchHeaders, buildApiResourceUrl } from 'src/boot/axios';

/**
 * Выполнить авторизованный fetch к backend с теми же auth/Telegram заголовками,
 * что и у axios-клиента miniapp.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { headers, cache = 'no-store', ...rest } = init;

  let finalPath = path;
  const isGet = !init.method || init.method.toUpperCase() === 'GET';
  if (isGet) {
    const separator = finalPath.includes('?') ? '&' : '?';
    finalPath = `${finalPath}${separator}_t=${Date.now()}`;
  }

  const finalHeaders = buildApiFetchHeaders(headers);
  if (isGet && !finalHeaders.has('Cache-Control')) {
    finalHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    finalHeaders.set('Pragma', 'no-cache');
    finalHeaders.set('Expires', '0');
  }

  return fetch(buildApiResourceUrl(finalPath), {
    cache,
    ...rest,
    headers: finalHeaders,
  });
}
