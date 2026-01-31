import { defineBoot } from '#q-app/wrappers';
import axios, { type AxiosInstance } from 'axios';

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
const api = axios.create({ baseURL: 'https://api.example.com' });

export default defineBoot(({ app }) => {
  // для использования в Vue файлах (Options API) через this.$axios и this.$api

  app.config.globalProperties.$axios = axios;
  // ^ ^ ^ это позволит вам использовать this.$axios (для Vue Options API)
  //       поэтому вам не обязательно нужно импортировать axios в каждый vue файл

  app.config.globalProperties.$api = api;
  // ^ ^ ^ это позволит вам использовать this.$api (для Vue Options API)
  //       так что вы легко сможете выполнять запросы к API вашего приложения
});

export { api };
