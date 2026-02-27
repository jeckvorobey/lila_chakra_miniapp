<template>
  <q-layout view="hHh lpR fFf">
    <!-- Header -->
    <q-header
      v-if="showHeader"
      class="bg-surface-translucent text-primary bordered q-mx-sm q-mb-md"
    >
      <q-toolbar class="safe-area-top row items-center no-wrap">
        <!-- Левая секция -->
        <div class="col row items-center no-wrap text-h3">
          <q-btn
            v-if="showBack"
            flat
            dense
            round
            icon="mdi-arrow-left"
            @click="goBack"
          />
          <span
            v-if="pageTitle"
            class="text-h3 q-ml-sm"
          >
            {{ pageTitle }}
          </span>
        </div>

        <!-- Центральная секция — баланс (только на главной) -->
        <div class="col row items-center justify-center no-wrap">
          <template v-if="isGamePage">
            <q-icon
              name="mdi-wallet-outline"
              size="20px"
              class="q-mr-xs"
            />
            <span>{{ userStore.balance }} {{ $t('rules.tkn') }}</span>
            <q-btn
              flat
              dense
              round
              size="sm"
              icon="mdi-plus-circle-outline"
              class="q-ml-xs"
              @click="navigateTo('/profile/payment')"
            >
              <q-tooltip>{{ $t('profile.top_up') }}</q-tooltip>
            </q-btn>
          </template>
        </div>

        <!-- Правая секция -->
        <div class="col row items-center justify-end no-wrap">
          <l-theme-toggle />

          <q-btn
            v-if="showMenu"
            flat
            dense
            round
            icon="mdi-dots-vertical"
          >
            <q-menu
              anchor="bottom right"
              self="top right"
              class="bg-surface-translucent bordered"
            >
              <q-list style="min-width: 180px">
                <q-item
                  v-close-popup
                  clickable
                  @click="navigateTo('/profile')"
                >
                  <q-item-section avatar>
                    <q-icon name="mdi-account" />
                  </q-item-section>
                  <q-item-section>{{ $t('nav.profile') }}</q-item-section>
                </q-item>
                <q-item
                  v-close-popup
                  clickable
                  @click="openRules"
                >
                  <q-item-section avatar>
                    <q-icon name="mdi-book-open-variant" />
                  </q-item-section>
                  <q-item-section>{{ $t('profile.rules') }}</q-item-section>
                </q-item>
                <q-item
                  v-close-popup
                  clickable
                  @click="openTransactions"
                >
                  <q-item-section avatar>
                    <q-icon name="mdi-history" />
                  </q-item-section>
                  <q-item-section>{{ $t('profile.transactions_title') }}</q-item-section>
                </q-item>
                <q-separator />
                <q-item
                  v-close-popup
                  clickable
                  @click="openFeedback"
                >
                  <q-item-section avatar>
                    <q-icon name="mdi-message-outline" />
                  </q-item-section>
                  <q-item-section>{{ $t('profile.feedback') }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <!-- Main content -->
    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition
          name="fade"
          mode="out-in"
        >
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>

    <!-- Bottom Navigation -->
    <l-bottom-nav
      v-if="showBottomNav"
      class="q-mx-sm q-mt-md"
    />

    <!-- Global Modals -->
    <l-token-confirm-modal />
  </q-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { LBottomNav } from 'src/components/navigation';
import { LThemeToggle } from 'src/components/base';
import LTokenConfirmModal from 'src/components/common/LTokenConfirmModal.vue';
import { useUserStore } from 'src/stores/user.store';

const route = useRoute();
const router = useRouter();
const i18n = useI18n();
const userStore = useUserStore();

const isGamePage = computed(() => route.path.startsWith('/game'));
const isOnboarding = computed(() => route.path.startsWith('/onboarding'));
const isSplash = computed(() => route.path === '/');
const hideHeader = computed(() => route.meta.hideHeader === true);
const hideBottomNav = computed(() => route.meta.hideBottomNav === true);

const showHeader = computed(() => !isSplash.value && !hideHeader.value);
const showBottomNav = computed(
  () => !isOnboarding.value && !isSplash.value && !hideBottomNav.value,
);
const showBack = computed(() => route.meta.showBack === true);
const showMenu = computed(() => isGamePage.value);

const pageTitle = computed(() => {
  const title = route.meta.title;
  if (typeof title !== 'string' || title.length === 0) {
    return '';
  }

  return i18n.te(title) ? i18n.t(title) : title;
});

function goBack() {
  router.back();
}

function navigateTo(path: string) {
  void router.push(path);
}

function openRules() {
  void router.push('/profile/rules');
}

function openTransactions() {
  void router.push('/profile/transactions');
}

function openFeedback() {
  void router.push('/profile/feedback');
}
</script>

<style lang="scss" scoped>
.q-toolbar {
  min-height: 56px;
}
</style>
