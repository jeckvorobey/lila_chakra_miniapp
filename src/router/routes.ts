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
      // Game routes
      {
        path: 'game',
        name: 'game',
        component: () => import('pages/game/GamePage.vue'),
        meta: { title: '' }, // No title for game page
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
      // Diary routes
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
      // Profile routes
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
    ],
  },
  // Onboarding (separate layout)
  {
    path: '/onboarding',
    name: 'onboarding',
    component: () => import('pages/onboarding/OnboardingPage.vue'),
  },
  // 404
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
