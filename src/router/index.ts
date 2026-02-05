import { defineRouter } from '#q-app/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { isInTelegram } from 'src/boot/telegram';

/*
 * Если вы не собираете с режимом SSR, вы можете
 * напрямую экспортировать создание Router;
 *
 * Функция ниже также может быть асинхронной; используйте
 * async/await или верните Promise, который разрешается
 * с экземпляром Router.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Оставьте это как есть и внесите изменения в quasar.conf.js вместо этого!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach((to) => {
    if (to.name === 'telegram-required') {
      return true;
    }

    if (!isInTelegram()) {
      return { name: 'telegram-required' };
    }

    return true;
  });

  return Router;
});
