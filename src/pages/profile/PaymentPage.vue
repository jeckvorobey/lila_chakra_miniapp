<template>
  <q-page class="payment-page lila-page-nav-offset">
    <q-card flat bordered class="q-mb-md text-center">
      <q-card-section>
        <div class="text-subtitle2 text-secondary">{{ $t('profile.balance') }}</div>
        <div class="text-h5 text-weight-bold text-primary">{{ userStore.balance }} ТКН</div>
      </q-card-section>
    </q-card>

    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <q-input v-model="promoCode" dense outlined :label="$t('payment.promo_code')" :disable="isApplyingPromo">
          <template #append>
            <q-btn flat color="primary" :label="$t('payment.apply')" :loading="isApplyingPromo"
              :disable="!promoCode.trim()" @click="applyPromoCode" />
          </template>
        </q-input>
      </q-card-section>
    </q-card>

    <!-- Сетка пакетов -->
    <div class="text-subtitle2 text-weight-medium q-mb-md">Выберите пакет</div>
    <div v-if="isLoading" class="q-mb-md">
      <q-skeleton type="rect" height="120px" class="q-mb-sm" />
      <q-skeleton type="rect" height="120px" />
    </div>
    <div v-else class="row q-col-gutter-sm q-mb-md">
      <div v-for="pkg in packages" :key="pkg.amount_rub" class="col-4">
        <q-card flat bordered class="payment-page__package full-height"
          :class="{ 'payment-page__package--selected': selectedPackage === pkg.amount_rub }"
          @click="selectedPackage = pkg.amount_rub">
          <q-card-section class="text-center q-pa-sm relative-position">
            <q-badge v-if="pkg.discount" color="secondary" floating class="payment-page__discount-badge">
              {{ pkg.discount }}
            </q-badge>
            <q-badge v-else-if="pkg.bonus_tkn > 0" color="positive" floating>
              +{{ pkg.bonus_tkn }}
            </q-badge>
            <div class="text-h6 text-weight-bold text-primary">{{ pkg.amount_tkn }}</div>
            <div class="text-caption text-secondary">ТКН</div>
            <q-separator class="q-my-xs" />
            <div class="text-body2 text-weight-medium">{{ pkg.amount_rub }} ₽</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Итоговая информация -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row justify-between q-mb-sm">
          <span>Пакет</span>
          <span class="text-weight-medium">{{ selectedPackageData?.amount_tkn }} ТКН</span>
        </div>
        <q-separator class="q-my-sm" />
        <div class="row justify-between">
          <span class="text-weight-bold">Итого</span>
          <span class="text-h6 text-weight-bold text-primary">{{ totalPrice }} ₽</span>
        </div>
      </q-card-section>
    </q-card>

    <!-- Кнопка оплаты -->
    <q-btn :label="$t('payment.proceed')" color="primary" size="lg" unelevated class="full-width"
      :loading="isProcessing" :disable="!selectedPackage" @click="processPayment" />

    <!-- Информация о способах оплаты -->
    <div class="text-center q-mt-lg">
      <div class="text-caption text-secondary q-mb-sm">Безопасная оплата через</div>
      <q-img src="/icons/yookassa-logo.svg" width="120px" class="q-mx-auto" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { paymentsApi } from 'src/services/api';
import type { PaymentPackage } from 'src/types/payment.interface';
import { getTelegramWebApp } from 'src/boot/telegram';
import { useUserStore } from 'src/stores/user.store';

const $q = useQuasar();
const userStore = useUserStore();
const packages = ref<PaymentPackage[]>([]);
const selectedPackage = ref<number | null>(null);
const promoCode = ref('');
const isLoading = ref(false);
const isProcessing = ref(false);
const isApplyingPromo = ref(false);

const selectedPackageData = computed(() =>
  packages.value.find((p) => p.amount_rub === selectedPackage.value),
);

const totalPrice = computed(() => {
  if (!selectedPackageData.value) return 0;
  return selectedPackageData.value.amount_rub;
});

function processPayment() {
  if (!selectedPackage.value) return;

  isProcessing.value = true;

  paymentsApi
    .createPayment({ amount_rub: selectedPackage.value })
    .then((response) => {
      $q.notify({
        type: 'info',
        message: 'Переход к оплате...',
      });

      const tg = getTelegramWebApp();
      if (tg?.openLink) {
        tg.openLink(response.confirmation_url);
      } else {
        window.location.href = response.confirmation_url;
      }
    })
    .catch(() => {
      $q.notify({
        type: 'negative',
        message: 'Ошибка создания платежа',
      });
    })
    .finally(() => {
      isProcessing.value = false;
    });
}

async function applyPromoCode() {
  const code = promoCode.value.trim();
  if (!code) return;

  isApplyingPromo.value = true;
  try {
    const response = await paymentsApi.applyPromoCode(code);
    userStore.updateBalance(response.new_balance);
    void userStore.fetchTransactions({ reset: true });
    promoCode.value = '';
    $q.notify({
      type: 'positive',
      message: `${response.message}: +${response.balance_added} ТКН`,
    });
  } catch (error) {
    const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
    $q.notify({
      type: 'negative',
      message: detail || 'Ошибка применения промокода',
    });
  } finally {
    isApplyingPromo.value = false;
  }
}

function loadPackages() {
  isLoading.value = true;
  try {
    // Временно хардкодим пакеты согласно новым требованиям
    packages.value = [
      { amount_tkn: 5, amount_rub: 500, bonus_tkn: 0, label: '5 ТКН' },
      { amount_tkn: 10, amount_rub: 1000, bonus_tkn: 0, label: '10 ТКН' },
      { amount_tkn: 15, amount_rub: 1500, bonus_tkn: 0, label: '15 ТКН' },
      { amount_tkn: 20, amount_rub: 1900, bonus_tkn: 0, label: '20 ТКН', discount: 'выгода 5%' },
      { amount_tkn: 30, amount_rub: 2700, bonus_tkn: 0, label: '30 ТКН', discount: 'выгода 10%' },
      { amount_tkn: 50, amount_rub: 4250, bonus_tkn: 0, label: '50 ТКН', discount: 'выгода 15%' },
    ];
    // packages.value = await paymentsApi.listPackages();
    if (packages.value.length > 0) {
      selectedPackage.value = packages.value[0]?.amount_rub ?? null;
    }
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadPackages();
});
</script>

<style lang="scss" scoped>
.payment-page {
  min-height: 100%;
  padding: var(--lila-layout-gap);

  .bg-surface-elevated {
    background: var(--lila-surface-elevated);
  }

  &__package {
    background: var(--lila-surface);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    justify-content: center;

    &:hover {
      border-color: var(--lila-primary);
    }

    &--selected {
      border-color: var(--lila-primary);
      background: rgba(107, 70, 193, 0.1);
      box-shadow: var(--lila-glow-primary);
    }
  }

  &__discount-badge {
    top: -8px;
    right: -8px;
    font-size: 10px;
    padding: 2px 6px;
  }
}
</style>
