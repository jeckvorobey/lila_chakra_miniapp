<template>
  <q-footer class="l-bottom-nav">
    <q-tabs
      v-model="currentTab"
      class="l-bottom-nav__tabs"
      indicator-color="primary"
      active-color="primary"
      narrow-indicator
      switch-indicator
    >
      <q-route-tab
        name="game"
        icon="mdi-gamepad-variant"
        :label="$t('nav.game')"
        to="/game"
        class="l-bottom-nav__tab"
        :ripple="false"
        @click="onTabClick('game')"
      />
      <q-route-tab
        name="diary"
        icon="mdi-book-open-variant"
        :label="$t('nav.diary')"
        to="/diary"
        class="l-bottom-nav__tab"
        :ripple="false"
        @click="onTabClick('diary')"
      />
      <q-route-tab
        name="profile"
        icon="mdi-account-circle"
        :label="$t('nav.profile')"
        to="/profile"
        class="l-bottom-nav__tab"
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

// Sync tab with route
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
  { immediate: true }
);

function onTabClick(tab: string) {
  settingsStore.vibrate(25);
  currentTab.value = tab;
}
</script>

<style lang="scss" scoped>
.l-bottom-nav {
  background: var(--lila-glass-bg);
  backdrop-filter: var(--lila-glass-blur);
  -webkit-backdrop-filter: var(--lila-glass-blur);
  border-top: 1px solid var(--lila-border);
  padding-bottom: env(safe-area-inset-bottom);

  .body--light & {
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  }

  &__tabs {
    height: 64px;
  }

  &__tab {
    flex: 1;
    font-size: 11px;
    font-weight: 500;
    text-transform: none;
    color: var(--lila-text-secondary);
    transition: all 0.3s ease;

    &:deep(.q-tab__icon) {
      font-size: 24px;
      margin-bottom: 2px;
    }

    &:deep(.q-tab__label) {
      line-height: 1.2;
    }

    // Active state
    &:deep(.q-tab__indicator) {
      height: 3px;
      border-radius: var(--radius-full);
      background: var(--lila-primary);
    }

    &.q-tab--active {
      color: var(--lila-primary);

      :deep(.q-tab__icon) {
        transform: scale(1.1);
      }

      .body--dark & {
        text-shadow: 0 0 10px var(--lila-primary);
      }
    }

    // Hover state
    &:hover:not(.q-tab--active) {
      color: var(--lila-text-primary);
    }
  }
}
</style>
