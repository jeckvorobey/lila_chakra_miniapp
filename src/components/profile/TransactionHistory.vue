<template>
  <div>
    <div class="text-subtitle2 text-weight-medium q-mb-sm">
      {{ t('profile.transactions_title') }}
    </div>

    <q-card flat bordered class="bg-surface">
      <q-card-section class="q-pa-none">
        <q-infinite-scroll
          :offset="120"
          :disable="!userStore.transactionsHasMore || userStore.isTransactionsLoading"
          @load="onLoadMore"
        >
          <q-list separator>
            <q-item
              v-for="transaction in userStore.transactions"
              :key="transaction.id"
              dense
            >
              <q-item-section avatar>
                <q-avatar
                  size="32px"
                  :color="transaction.type === 'accrual' ? 'positive' : 'negative'"
                  text-color="white"
                >
                  <q-icon :name="transaction.type === 'accrual' ? 'mdi-arrow-down' : 'mdi-arrow-up'" />
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label lines="1">{{ transaction.description }}</q-item-label>
                <q-item-label caption>{{ formatDate(transaction.created_at) }}</q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-item-label
                  class="text-weight-medium"
                  :class="transaction.type === 'accrual' ? 'text-positive' : 'text-negative'"
                >
                  {{ formatAmount(transaction.type, transaction.amount) }}
                </q-item-label>
                <q-item-label caption>{{ sourceLabel(transaction.source) }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

          <template #loading>
            <div class="row justify-center q-py-md">
              <q-spinner-dots color="primary" size="24px" />
            </div>
          </template>
        </q-infinite-scroll>

        <div
          v-if="!userStore.transactions.length && !userStore.isTransactionsLoading"
          class="text-body2 text-secondary q-pa-md"
        >
          {{ t('profile.transactions_empty') }}
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from 'src/stores/user.store';
import type { BalanceTransactionSource, BalanceTransactionType } from 'src/types/transaction.interface';

const userStore = useUserStore();
const { t, locale } = useI18n();

const sourceLabels: Record<BalanceTransactionSource, string> = {
  USER_PURCHASE: 'profile.transaction_sources.user_purchase',
  ADMIN_GRANT: 'profile.transaction_sources.admin_grant',
  PROMO_CODE: 'profile.transaction_sources.promo_code',
  REFERRAL_REWARD: 'profile.transaction_sources.referral_reward',
  GAME_FEE: 'profile.transaction_sources.game_fee',
  AI_SERVICE_FEE: 'profile.transaction_sources.ai_service_fee',
  REFUND: 'profile.transaction_sources.refund',
};

function sourceLabel(source: BalanceTransactionSource): string {
  return t(sourceLabels[source] || source);
}

function formatAmount(type: BalanceTransactionType, amount: number): string {
  const sign = type === 'accrual' ? '+' : '-';
  return `${sign}${amount} ТКН`;
}

function formatDate(value: string): string {
  const dt = new Date(value);
  return new Intl.DateTimeFormat(locale.value || 'ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dt);
}

async function onLoadMore(_index: number, done: (stop?: boolean) => void): Promise<void> {
  await userStore.fetchTransactions();
  done(!userStore.transactionsHasMore);
}

onMounted(() => {
  void userStore.fetchTransactions({ reset: true, limit: 20 });
});
</script>
