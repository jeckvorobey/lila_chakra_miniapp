import { defineBoot } from '#q-app/wrappers';
import axios, { type AxiosInstance } from 'axios';
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
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
const api = axios.create({ baseURL: apiBaseUrl });

export default defineBoot(({ app, router }) => {
  const authStore = useAuthStore();

  // Глобальная обработка 401/403 для сброса сессии (кроме auth endpoints)
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error?.response?.status;
      const url = error?.config?.url || '';
      const isAuthEndpoint = url.includes('/api/auth/');

      if ((status === 401 || status === 403) && !isAuthEndpoint) {
        await authStore.logout();

        // Показать уведомление при 403 (заблокированный пользователь)
        if (status === 403) {
          const detail =
            (error?.response?.data?.detail as string) || 'Доступ запрещён';
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
      return Promise.reject(
        error instanceof Error ? error : new Error('Request failed'),
      );
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
