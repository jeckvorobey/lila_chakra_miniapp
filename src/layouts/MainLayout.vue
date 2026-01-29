<template>
  <q-layout view="hHh lpR fFf" class="l-layout">
    <!-- Header (minimal, transparent for game) -->
    <q-header v-if="showHeader" class="l-layout__header" :class="{ 'bg-transparent': isGamePage }">
      <q-toolbar class="l-layout__toolbar">
        <!-- Back button -->
        <q-btn v-if="showBack" flat dense round icon="mdi-arrow-left" @click="goBack" />

        <!-- Title -->
        <q-toolbar-title v-if="pageTitle" class="text-weight-medium">
          {{ pageTitle }}
        </q-toolbar-title>

        <q-space />

        <!-- Theme toggle -->
        <l-theme-toggle />

        <!-- Menu button -->
        <q-btn v-if="showMenu" flat dense round icon="mdi-dots-vertical" @click="openMenu">
          <q-menu anchor="bottom right" self="top right">
            <q-list style="min-width: 180px">
              <q-item clickable v-close-popup @click="navigateTo('/profile')">
                <q-item-section avatar>
                  <q-icon name="mdi-account" />
                </q-item-section>
                <q-item-section>{{ $t('nav.profile') }}</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="openRules">
                <q-item-section avatar>
                  <q-icon name="mdi-book-open-variant" />
                </q-item-section>
                <q-item-section>{{ $t('profile.rules') }}</q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup @click="openFeedback">
                <q-item-section avatar>
                  <q-icon name="mdi-message-outline" />
                </q-item-section>
                <q-item-section>{{ $t('profile.feedback') }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- Main content -->
    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>

    <!-- Bottom Navigation -->
    <l-bottom-nav v-if="showBottomNav" />
  </q-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { LBottomNav } from 'src/components/navigation';
import { LThemeToggle } from 'src/components/base';

const route = useRoute();
const router = useRouter();

// Computed properties for layout behavior
const isGamePage = computed(() => route.path.startsWith('/game'));
const isOnboarding = computed(() => route.path.startsWith('/onboarding'));
const isSplash = computed(() => route.path === '/');

const showHeader = computed(() => !isSplash.value);
const showBottomNav = computed(() => !isOnboarding.value && !isSplash.value);
const showBack = computed(() => route.meta.showBack === true);
const showMenu = computed(() => isGamePage.value);

const pageTitle = computed(() => {
  const title = route.meta.title;
  return typeof title === 'string' ? title : '';
});

// Navigation methods
function goBack() {
  router.back();
}

function navigateTo(path: string) {
  void router.push(path);
}

function openMenu() {
  // Menu is handled by q-menu
}

function openRules() {
  void router.push('/rules');
}

function openFeedback() {
  void router.push('/feedback');
}
</script>

<style lang="scss" scoped>
.l-layout {
  background: var(--lila-bg);
  min-height: 100vh;

  &__header {
    background: var(--lila-glass-bg);
    backdrop-filter: var(--lila-glass-blur);
    -webkit-backdrop-filter: var(--lila-glass-blur);
    border-bottom: 1px solid var(--lila-border);

    &.bg-transparent {
      background: transparent;
      border-bottom: none;
      backdrop-filter: none;
    }
  }

  &__toolbar {
    min-height: 56px;
    padding: 0 var(--space-sm);
    padding-top: env(safe-area-inset-top);
  }
}

// Page transitions
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
