<template>
  <q-footer class="l-bottom-nav bg-glass">
    <q-tabs
      v-model="currentTab"
      indicator-color="primary"
      active-color="primary"
      narrow-indicator
      switch-indicator
      class="l-bottom-nav__tabs"
    >
      <q-route-tab
        name="game"
        icon="mdi-gamepad-variant"
        :label="$t('nav.game')"
        to="/game"
        :ripple="false"
        @click="onTabClick('game')"
      />
      <q-route-tab
        name="diary"
        icon="mdi-book-open-variant"
        :label="$t('nav.diary')"
        to="/diary"
        :ripple="false"
        @click="onTabClick('diary')"
      />
      <q-route-tab
        name="profile"
        icon="mdi-account-circle"
        :label="$t('nav.profile')"
        to="/profile"
        :ripple="false"
        @click="onTabClick('profile')"
      />
    </q-tabs>
  </q-footer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useSettingsStore } from 'src/stores/settings.store';

const route = useRoute();
const settingsStore = useSettingsStore();
const currentTab = ref('game');

watch(
  () => route.path,
  (path) => {
    if (path.startsWith('/game')) {
      currentTab.value = 'game';
    } else if (path.startsWith('/diary')) {
      currentTab.value = 'diary';
    } else if (path.startsWith('/profile')) {
      currentTab.value = 'profile';
    }
  },
  { immediate: true },
);

function onTabClick(tab: string) {
  settingsStore.vibrate(25);
  currentTab.value = tab;
}
</script>

<style lang="scss" scoped>
.l-bottom-nav {
  margin: var(--lila-layout-gap);
  border: 1px solid var(--lila-border);
  border-bottom: none;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom);

  .body--light & {
    background: rgba(255, 255, 255, 0.95) !important;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  }

  &__tabs {
    height: 64px;

    :deep(.q-tab) {
      flex: 1;
      font-size: 11px;
      font-weight: 500;
      text-transform: none;
      color: var(--lila-text-secondary);
      transition: all 0.3s ease;
    }

    :deep(.q-tab__icon) {
      font-size: 24px;
      margin-bottom: 2px;
    }

    :deep(.q-tab__indicator) {
      height: 3px;
      border-radius: 9999px;
      background: $primary;
    }

    :deep(.q-tab--active) {
      color: $primary;

      .q-tab__icon {
        transform: scale(1.1);
      }

      .body--dark & {
        text-shadow: 0 0 10px $primary;
      }
    }

    :deep(.q-tab:hover:not(.q-tab--active)) {
      color: var(--lila-text-primary);
    }
  }
}
</style>
