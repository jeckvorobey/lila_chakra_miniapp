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
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-h6">{{ $t('referral.program_table_title') }}</div>
            <div class="text-caption text-secondary">
              {{ $t('referral.total_referrals') }}: {{ totalReferrals }}
            </div>
          </div>

          <q-markup-table
            flat
            bordered
            class="referral-program-table"
          >
            <thead>
              <tr>
                <th class="text-left">Tier</th>
                <th class="text-left">{{ $t('referral.program_condition_header') }}</th>
                <th class="text-left">{{ $t('referral.program_status_header') }}</th>
                <th class="text-left">{{ $t('referral.program_code_header') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="program in programs"
                :key="program.key"
              >
                <td class="text-weight-bold">{{ program.key.toUpperCase() }}</td>
                <td>
                  {{
                    $t('referral.program_condition', {
                      ownerReward: program.owner_reward_tkn,
                      referrals: program.required_referrals,
                      uses: program.required_uses,
                    })
                  }}
                </td>
                <td>
                  <div>{{ getProgramStatusLabel(program) }}</div>
                  <div
                    v-if="program.owner_bonus_pending_tkn > 0"
                    class="text-caption text-secondary"
                  >
                    {{
                      $t('referral.owner_bonus_pending', {
                        amount: program.owner_bonus_pending_tkn,
                      })
                    }}
                  </div>
                </td>
                <td>
                  <div class="row items-center no-wrap q-gutter-xs">
                    <q-input
                      v-if="program.promo_code"
                      :model-value="program.promo_code"
                      dense
                      outlined
                      readonly
                      class="col"
                    />
                    <q-btn
                      v-if="program.promo_code"
                      flat
                      round
                      color="primary"
                      icon="mdi-content-copy"
                      @click="copyPromoCode(program.promo_code)"
                    />
                    <q-btn
                      v-else
                      color="primary"
                      unelevated
                      size="sm"
                      :label="$t('referral.generate_code')"
                      :disable="!program.can_generate || generatingTier === program.key"
                      :loading="generatingTier === program.key"
                      @click="generateTierCode(program.key)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </q-markup-table>
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
import { computed, onMounted, ref } from 'vue';
import { useUserStore } from 'src/stores/user.store';
import { copyToClipboard, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { LCard } from 'src/components/base';
import { useTelegram } from 'src/composables/useTelegram';
import { usersApi } from 'src/services/api';
import type { ReferralProgramTier } from 'src/types/user.interface';

const $q = useQuasar();
const i18n = useI18n();
const t = i18n.t;
const userStore = useUserStore();
const { openTelegramLink } = useTelegram();
const generatingTier = ref<string | null>(null);

const referralProgram = computed(() => userStore.referralProgram);
const referralLink = computed(() => referralProgram.value?.link || userStore.referralData?.link);
const totalReferrals = computed(() => referralProgram.value?.total_referrals ?? 0);
const programs = computed(() => referralProgram.value?.programs ?? []);
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

function getProgramStatusLabel(program: ReferralProgramTier): string {
  if (program.promo_status === 'not_generated') {
    return t('referral.status_not_generated');
  }

  return t('referral.status_progress', {
    uses: program.promo_uses,
    max: program.promo_max_uses,
  });
}

async function copyPromoCode(code: string): Promise<void> {
  try {
    await copyToClipboard(code);
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

async function generateTierCode(tier: string): Promise<void> {
  generatingTier.value = tier;
  try {
    const response = await usersApi.generateReferralTierCode(tier as 'x2' | 'x5');
    await userStore.fetchReferralProgram();
    await copyPromoCode(response.promo_code);
    $q.notify({
      message: t('referral.code_generated'),
      color: 'positive',
      icon: 'mdi-check-circle-outline',
      position: 'top',
      timeout: 2500,
    });
  } catch (error) {
    const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
    $q.notify({
      message: detail || t('error.generic'),
      color: 'negative',
      icon: 'mdi-alert',
    });
  } finally {
    generatingTier.value = null;
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

.referral-program-table {
  :deep(th),
  :deep(td) {
    white-space: normal;
    vertical-align: middle;
  }
}

.body--light {
  .bg-dark {
    background-color: #f0f0f0 !important;
  }
}
</style>
