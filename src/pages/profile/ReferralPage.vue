<template>
  <q-page class="referral-page lila-page-nav-offset">
    <div class="column q-gutter-y-md">
      <!-- Info header -->
      <div class="text-center q-px-md q-pt-md">
        <q-icon name="mdi-account-plus-outline" size="80px" color="primary" class="q-mb-md" />
        <h1 class="text-h4 text-weight-bold q-mt-none q-mb-sm">{{ $t('referral.title') }}</h1>
        <p class="text-body1 text-secondary">{{ $t('referral.description') }}</p>
      </div>

      <!-- Referral link card -->
      <l-card bordered class="bg-surface">
        <q-card-section>
          <div class="text-overline text-secondary q-mb-xs">{{ $t('referral.your_link') }}</div>
          <div class="row items-center no-wrap bg-dark rounded-borders q-pa-sm border-subtle">
            <div class="col ellipsis text-body2 text-primary text-weight-medium">
              {{ referralLink || '...' }}
            </div>
            <q-btn
              flat
              round
              color="primary"
              icon="mdi-content-copy"
              size="sm"
              @click="copyLink"
            >
              <q-tooltip>{{ $t('referral.copy') }}</q-tooltip>
            </q-btn>
          </div>
        </q-card-section>

        <q-separator dark />

        <q-card-actions align="center" class="q-py-md">
          <q-btn
            unelevated
            color="primary"
            icon="mdi-share-variant"
            :label="$t('actions.share')"
            class="full-width"
            @click="shareLink"
          />
        </q-card-actions>
      </l-card>

      <!-- Rules section -->
      <div class="rules-section q-px-md">
        <h2 class="text-h6 text-weight-medium q-mb-md">{{ $t('referral.rules_title') }}</h2>
        <q-list dense padding>
          <q-item v-for="(rule, index) in rules" :key="index" class="q-px-none q-mb-md">
            <q-item-section avatar side class="q-pr-md">
              <div class="rule-number bg-primary text-white row flex-center">
                {{ index + 1 }}
              </div>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-body2 text-secondary">{{ rule }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/unbound-method */
import { computed, onMounted } from 'vue';
import { useUserStore } from 'src/stores/user.store';
import { copyToClipboard, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { LCard } from 'src/components/base';
import { useTelegram } from 'src/composables/useTelegram';

const $q = useQuasar();
const { t, tm } = useI18n();
const userStore = useUserStore();
const { openTelegramLink } = useTelegram();

const referralLink = computed(() => userStore.referralData?.link);
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
const rules = computed(() => tm('referral.rules') as string[]);

async function copyLink() {
  if (!referralLink.value) return;

  try {
    await copyToClipboard(referralLink.value);
    $q.notify({
      message: t('referral.copied'),
      color: 'positive',
      icon: 'mdi-check',
      position: 'top',
      timeout: 2000,
    });
  } catch {
    $q.notify({
      message: t('error.generic'),
      color: 'negative',
      icon: 'mdi-alert',
    });
  }
}

function shareLink() {
  if (!referralLink.value) return;

  const text = t('referral.share_message', { name: userStore.displayName });
  const url = referralLink.value;

  // Use Telegram WebApp share link if available
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  
  if (openTelegramLink) {
    openTelegramLink(shareUrl);
  } else if (navigator.share) {
    void navigator.share({
      title: t('referral.title'),
      text: text,
      url: url,
    }).catch(() => {
      // Fallback to copy if share fails or cancelled
    });
  } else {
    void copyLink();
  }
}

onMounted(() => {
  if (!userStore.referralData) {
    void userStore.fetchReferralData();
  }
});
</script>

<style lang="scss" scoped>
.referral-page {
  padding: var(--lila-layout-gap);
}

.border-subtle {
  border: 1px solid var(--lila-border);
}

.rule-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
}

.rules-section {
  :deep(.q-item__section--avatar) {
    min-width: 32px;
  }
}

// Dark mode adjustments
.body--light {
  .bg-dark {
    background-color: #f0f0f0 !important;
  }
}
</style>
