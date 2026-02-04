/**
 * Инициализация настроек, аутентификации и базовых редиректов.
 */

import { boot } from 'quasar/wrappers';
import { useAuthStore } from 'src/stores/auth.store';
import { useSettingsStore } from 'src/stores/settings.store';
import { useUserStore } from 'src/stores/user.store';

export default boot(async ({ router }) => {
  const settingsStore = useSettingsStore();
  const authStore = useAuthStore();
  const userStore = useUserStore();

  settingsStore.init();
  await authStore.init();

  if (authStore.isAuthenticated) {
    await userStore.fetchProfile();
  }

  router.beforeEach(async (to) => {
    if (!authStore.isAuthenticated) {
      return true;
    }

    if (!userStore.profile && !userStore.isLoading) {
      await userStore.fetchProfile();
    }

    const hasSeen = userStore.profile?.has_seen_onboarding;
    if (hasSeen === false && to.path !== '/onboarding') {
      return { path: '/onboarding' };
    }
    if (hasSeen === true && to.path === '/onboarding') {
      return { path: '/game' };
    }

    return true;
  });
});
