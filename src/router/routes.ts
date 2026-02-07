import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        redirect: '/game',
      },
      // Маршруты игры
      {
        path: 'game',
        name: 'game',
        component: () => import('pages/game/GamePage.vue'),
        meta: { title: '' }, // Без заголовка для страницы игры
      },
      {
        path: 'game/new',
        name: 'game-new',
        component: () => import('pages/game/QueryPage.vue'),
        meta: { title: 'query.title', showBack: true },
      },
      {
        path: 'game/meditation/:type',
        name: 'meditation',
        component: () => import('pages/game/MeditationPage.vue'),
        meta: { showBack: true },
      },
      // Маршруты дневника
      {
        path: 'diary',
        name: 'diary',
        component: () => import('pages/diary/DiaryPage.vue'),
        meta: { title: 'diary.title' },
      },
      {
        path: 'diary/:id',
        name: 'diary-detail',
        component: () => import('pages/diary/DiaryDetailPage.vue'),
        meta: { showBack: true },
      },
      // Маршруты профиля
      {
        path: 'profile',
        name: 'profile',
        component: () => import('pages/profile/ProfilePage.vue'),
        meta: { title: 'profile.title' },
      },
      {
        path: 'profile/payment',
        name: 'payment',
        component: () => import('pages/profile/PaymentPage.vue'),
        meta: { title: 'payment.title', showBack: true },
      },
      // Временно отключено для разработки (страница требования Telegram).
      // {
      //   path: 'telegram-required',
      //   name: 'telegram-required',
      //   component: () => import('pages/TelegramRequiredPage.vue'),
      //   meta: { hideHeader: true, hideBottomNav: true },
      // },
      // Онбординг (внутри MainLayout для корректной работы QPage)
      {
        path: 'onboarding',
        name: 'onboarding',
        component: () => import('pages/onboarding/OnboardingPage.vue'),
        meta: { hideHeader: true, hideBottomNav: true },
      },
    ],
  },
  // 404 - Страница не найдена
  {
    path: '/:catchAll(.*)*',
    name: 'not-found',
    component: () => import('pages/ErrorNotFound.vue'),
    meta: { public: true },
  },
];

export default routes;
