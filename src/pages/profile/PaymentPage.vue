<template>
  <q-page class="payment-page" padding>
    <!-- Package grid -->
    <div class="text-subtitle2 text-weight-medium q-mb-md">Выберите пакет</div>
    <div class="row q-gutter-sm q-mb-lg">
      <q-card
        v-for="pkg in packages"
        :key="pkg.id"
        flat
        bordered
        class="col-5 payment-page__package"
        :class="{ 'payment-page__package--selected': selectedPackage === pkg.id }"
        @click="selectedPackage = pkg.id"
      >
        <q-card-section class="text-center">
          <q-badge v-if="pkg.bonus" color="positive" floating>
            {{ pkg.bonus }}
          </q-badge>
          <div class="text-h5 text-weight-bold text-primary">{{ pkg.ve }} ВЕ</div>
          <div class="text-body2">{{ pkg.price }} ₽</div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Promo code -->
    <div class="q-mb-lg">
      <div class="text-subtitle2 text-weight-medium q-mb-sm">{{ $t('payment.promo_code') }}</div>
      <div class="row q-gutter-sm">
        <q-input
          v-model="promoCode"
          outlined
          dense
          :placeholder="$t('payment.promo_code')"
          class="col"
        />
        <q-btn
          :label="$t('payment.apply')"
          color="primary"
          outline
          :loading="isApplyingPromo"
          @click="applyPromo"
        />
      </div>
      <div v-if="promoApplied" class="text-positive text-caption q-mt-xs">
        Промокод применён! Скидка {{ promoDiscount }}%
      </div>
    </div>

    <!-- Summary -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="row justify-between q-mb-sm">
          <span>Пакет</span>
          <span class="text-weight-medium">{{ selectedPackageData?.ve }} ВЕ</span>
        </div>
        <div v-if="promoApplied" class="row justify-between q-mb-sm text-positive">
          <span>Скидка</span>
          <span>-{{ discountAmount }} ₽</span>
        </div>
        <q-separator class="q-my-sm" />
        <div class="row justify-between">
          <span class="text-weight-bold">Итого</span>
          <span class="text-h6 text-weight-bold text-primary">{{ totalPrice }} ₽</span>
        </div>
      </q-card-section>
    </q-card>

    <!-- Payment button -->
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

    <!-- Payment methods info -->
    <div class="text-center q-mt-lg">
      <div class="text-caption text-secondary q-mb-sm">Безопасная оплата через</div>
      <q-img src="/icons/yookassa-logo.svg" width="120px" class="q-mx-auto" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const router = useRouter();

interface Package {
  id: string;
  ve: number;
  price: number;
  bonus?: string;
}

const packages: Package[] = [
  { id: 'small', ve: 5, price: 500 },
  { id: 'medium', ve: 10, price: 1000 },
  { id: 'large', ve: 20, price: 1900, bonus: '+5%' },
  { id: 'xl', ve: 50, price: 4500, bonus: '+10%' },
];

const selectedPackage = ref<string>('medium');
const promoCode = ref('');
const promoApplied = ref(false);
const promoDiscount = ref(0);
const isApplyingPromo = ref(false);
const isProcessing = ref(false);

const selectedPackageData = computed(() =>
  packages.find(p => p.id === selectedPackage.value)
);

const discountAmount = computed(() => {
  if (!selectedPackageData.value || !promoApplied.value) return 0;
  return Math.round(selectedPackageData.value.price * (promoDiscount.value / 100));
});

const totalPrice = computed(() => {
  if (!selectedPackageData.value) return 0;
  return selectedPackageData.value.price - discountAmount.value;
});

async function applyPromo() {
  if (!promoCode.value.trim()) return;

  isApplyingPromo.value = true;

  // TODO: Validate promo code via API
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock response
  if (promoCode.value.toLowerCase() === 'lila10') {
    promoApplied.value = true;
    promoDiscount.value = 10;
    $q.notify({
      type: 'positive',
      message: 'Промокод применён!',
    });
  } else {
    $q.notify({
      type: 'negative',
      message: 'Промокод не найден',
    });
  }

  isApplyingPromo.value = false;
}

function processPayment() {
  if (!selectedPackage.value) return;

  isProcessing.value = true;

  try {
    // TODO: Create payment via API
    // const { payment_url } = await api.post('/api/payments/create', {
    //   package_id: selectedPackage.value,
    //   promo_code: promoApplied.value ? promoCode.value : undefined,
    // });

    // Redirect to YooKassa
    // window.location.href = payment_url;

    $q.notify({
      type: 'info',
      message: 'Переход к оплате...',
    });

    // Mock: go back after "payment"
    setTimeout(() => {
      void router.push('/profile');
    }, 2000);
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Ошибка создания платежа',
    });
  } finally {
    isProcessing.value = false;
  }
}
</script>

<style lang="scss" scoped>
.payment-page {
  min-height: 100%;

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
