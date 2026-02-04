import { defineBoot } from '#q-app/wrappers';
import axios, { type AxiosInstance } from 'axios';
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

  // Глобальная обработка 401 для сброса сессии
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error?.response?.status === 401) {
        authStore.logout();
        if (router.currentRoute.value.path !== '/') {
          await router.push('/');
        }
      }
      return Promise.reject(error);
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
