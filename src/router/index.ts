import { defineRouter } from '#q-app/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { useGameStore } from 'src/stores/game.store';
// import { isInTelegram } from 'src/boot/telegram';

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

  // Приложение должно открываться внутри Telegram
  // Временно отключено для разработки (нужна проверка и редирект).
  // Router.beforeEach((to) => {
  //   if (!isInTelegram() && to.name !== 'telegram-required') {
  //     return { name: 'telegram-required' };
  //   }
  //
  //   return true;
  // });

  // Защита маршрутов: финал и медитация выхода доступны только при завершённой игре.
  Router.beforeEach((to) => {
    const isFinale = to.name === 'game-final';
    const isExitMeditation = to.name === 'meditation' && to.params['type'] === 'exit';

    if (isFinale || isExitMeditation) {
      const gameStore = useGameStore();
      if (!gameStore.isGameCompleted) {
        return { name: 'game' };
      }
    }

    return true;
  });

  return Router;
});
