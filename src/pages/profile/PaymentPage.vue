<template>
  <q-page class="payment-page lila-page-nav-offset">
    <!-- Сетка пакетов -->
    <div class="text-subtitle2 text-weight-medium q-mb-md">Выберите пакет</div>
    <div v-if="isLoading" class="q-mb-md">
      <q-skeleton type="rect" height="120px" class="q-mb-sm" />
      <q-skeleton type="rect" height="120px" />
    </div>
    <div v-else class="row q-gutter-sm q-mb-md">
      <q-card
        v-for="pkg in packages"
        :key="pkg.amount_rub"
        flat
        bordered
        class="col-5 payment-page__package"
        :class="{ 'payment-page__package--selected': selectedPackage === pkg.amount_rub }"
        @click="selectedPackage = pkg.amount_rub"
      >
        <q-card-section class="text-center">
          <q-badge v-if="pkg.bonus_tkn > 0" color="positive" floating>
            +{{ pkg.bonus_tkn }} ТКН
          </q-badge>
          <div class="text-h5 text-weight-bold text-primary">{{ pkg.amount_tkn }} ТКН</div>
          <div class="text-body2">{{ pkg.amount_rub }} ₽</div>
        </q-card-section>
      </q-card>
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

    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <q-input
          v-model="promoCode"
          dense
          outlined
          :label="$t('payment.promo_code')"
          :disable="isApplyingPromo"
        >
          <template #append>
            <q-btn
              flat
              color="primary"
              :label="$t('payment.apply')"
              :loading="isApplyingPromo"
              :disable="!promoCode.trim()"
              @click="applyPromoCode"
            />
          </template>
        </q-input>
      </q-card-section>
    </q-card>

    <!-- Кнопка оплаты -->
    <q-btn
      :label="$t('payment.proceed')"
      color="primary"
      size="lg"
      unelevated
      class="full-width"
      :loading="isProcessing"
      :disable="!selectedPackage"
      @click="processPayment"
    />

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

async function loadPackages() {
  isLoading.value = true;
  try {
    packages.value = await paymentsApi.listPackages();
    if (packages.value.length > 0) {
      selectedPackage.value = packages.value[0]?.amount_rub ?? null;
    }
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  void loadPackages();
});
</script>

<style lang="scss" scoped>
.payment-page {
  min-height: 100%;
  padding: var(--lila-layout-gap);

  &__package {
    background: var(--lila-surface);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--lila-primary);
    }

    &--selected {
      border-color: var(--lila-primary);
      background: rgba(107, 70, 193, 0.1);
      box-shadow: var(--lila-glow-primary);
    }
  }
}
</style>
