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
        meta: { title: 'game.home_title' },
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
      {
        path: 'game/final/:gameId',
        name: 'game-final',
        component: () => import('pages/game/GameFinalePage.vue'),
        meta: { title: 'finale.title', showBack: true },
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
        meta: { title: 'diary.title', showBack: true },
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
      {
        path: 'profile/referral',
        name: 'referral',
        component: () => import('pages/profile/ReferralPage.vue'),
        meta: { title: 'referral.title', showBack: true },
      },
      {
        path: 'profile/feedback',
        name: 'feedback',
        component: () => import('pages/profile/FeedbackPage.vue'),
        meta: { title: 'feedback.title', showBack: true },
      },
      {
        path: 'profile/my-requests',
        name: 'my-requests',
        component: () => import('pages/profile/MyRequestsPage.vue'),
        meta: { title: 'feedback.my_requests_title', showBack: true },
      },
      {
        path: 'profile/rules',
        name: 'rules',
        component: () => import('pages/profile/RulesPage.vue'),
        meta: { title: 'rules.title', showBack: true },
      },
      {
        path: 'profile/transactions',
        name: 'transactions',
        component: () => import('pages/profile/TransactionsPage.vue'),
        meta: { title: 'profile.transactions_title', showBack: true },
      },

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
