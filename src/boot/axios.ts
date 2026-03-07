import { defineBoot } from '#q-app/wrappers';
import axios, { AxiosHeaders, type AxiosInstance } from 'axios';
import { Notify } from 'quasar';
import { api, getTelegramInitDataHeader } from 'src/lib/api-client';
import { useAuthStore } from 'src/stores/auth.store';
export { api, buildApiFetchHeaders, buildApiResourceUrl } from 'src/lib/api-client';

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

export default defineBoot(({ app, router }) => {
  const authStore = useAuthStore();

  api.interceptors.request.use((config) => {
    const headers = AxiosHeaders.from(config.headers);
    
    const telegramInitData = getTelegramInitDataHeader();
    if (telegramInitData) {
      headers.set('X-Telegram-Init-Data', telegramInitData);
    }

    // Обязательный заголовок для localtunnel, чтобы избежать страницы-заглушки ("Bypass this screen")
    headers.set('bypass-tunnel-reminder', 'true');

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
