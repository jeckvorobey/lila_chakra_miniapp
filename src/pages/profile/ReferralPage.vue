<template>
  <q-page class="referral-page lila-page-nav-offset">
    <div class="column q-gutter-y-md">
      <div class="text-center q-px-md q-pt-md">
        <q-icon
          name="mdi-account-plus-outline"
          size="80px"
          color="primary"
          class="q-mb-md"
        />
        <h1 class="text-h4 text-weight-bold q-mt-none q-mb-sm">{{ $t('referral.title') }}</h1>
        <p class="text-body1 text-secondary">{{ $t('referral.description') }}</p>
      </div>

      <l-card
        bordered
        class="bg-surface"
      >
        <q-card-section>
          <div class="text-overline text-secondary q-mb-xs">{{ $t('referral.your_link') }}</div>
          <q-input
            :model-value="referralLink || '...'"
            dense
            outlined
            readonly
          >
            <template #append>
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
            </template>
          </q-input>
        </q-card-section>

        <q-separator dark />

        <q-card-actions
          align="center"
          class="q-py-md"
        >
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

      <l-card
        bordered
        class="bg-surface"
      >
        <q-card-section>
          <div class="row items-center justify-between">
            <div class="text-h6">{{ $t('referral.total_referrals') }}</div>
            <div class="text-h6 text-primary">
              {{ totalReferrals }}
            </div>
          </div>
        </q-card-section>
      </l-card>

      <div class="rules-section q-px-md">
        <h2 class="text-h6 text-weight-medium q-mb-md">{{ $t('referral.rules_title') }}</h2>
        <q-list
          dense
          padding
        >
          <q-item
            v-for="(rule, index) in rules"
            :key="index"
            class="q-px-none q-mb-md"
          >
            <q-item-section
              avatar
              side
              class="q-pr-md"
            >
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
import { computed, onMounted } from 'vue';
import { useUserStore } from 'src/stores/user.store';
import { copyToClipboard, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { LCard } from 'src/components/base';
import { useTelegram } from 'src/composables/useTelegram';

const $q = useQuasar();
const i18n = useI18n();
const t = i18n.t;
const userStore = useUserStore();
const { openTelegramLink } = useTelegram();

const referralProgram = computed(() => userStore.referralProgram);
const referralLink = computed(() => referralProgram.value?.link || userStore.referralData?.link);
const totalReferrals = computed(() => referralProgram.value?.total_referrals ?? 0);
const rules = computed<string[]>(() => {
  const list = i18n.tm('referral.rules');
  if (!Array.isArray(list)) {
    return [];
  }
  return list.map((item) => String(item));
});

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

  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;

  if (openTelegramLink) {
    openTelegramLink(shareUrl);
  } else if (navigator.share) {
    void navigator
      .share({
        title: t('referral.title'),
        text: text,
        url: url,
      })
      .catch(() => {});
  } else {
    void copyLink();
  }
}

onMounted(() => {
  if (!userStore.referralProgram) {
    void userStore.fetchReferralProgram();
  }
});
</script>

<style lang="scss" scoped>
.referral-page {
  padding: var(--layout-gap);
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
</style>
