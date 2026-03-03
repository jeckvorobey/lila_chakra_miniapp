<template>
  <q-card
    flat
    bordered
    class="promo-code-form"
  >
    <q-card-section>
      <q-input
        v-model="promoCode"
        dense
        outlined
        :label="t('payment.promo_code')"
        :disable="isApplyingPromo"
        @keyup.enter="applyPromoCode"
      >
        <template #append>
          <q-btn
            flat
            color="primary"
            :label="t('payment.apply')"
            :loading="isApplyingPromo"
            :disable="!promoCode.trim()"
            @click="applyPromoCode"
          />
        </template>
      </q-input>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { paymentsApi } from 'src/services/api';
import { useUserStore } from 'src/stores/user.store';

const $q = useQuasar();
const { t } = useI18n();
const userStore = useUserStore();

const promoCode = ref('');
const isApplyingPromo = ref(false);

async function applyPromoCode() {
  const code = promoCode.value.trim();
  if (!code) return;

  isApplyingPromo.value = true;
  try {
    const response = await paymentsApi.applyPromoCode(code);
    userStore.updateBalance(response.new_balance);
    void userStore.fetchTransactions({ reset: true });
    promoCode.value = '';

    // Бэкенд возвращает ключ i18n в response.message
    const successMsg = response.message.includes('.') ? t(response.message) : response.message;

    $q.notify({
      type: 'positive',
      message: `${successMsg}: +${response.balance_added} ТКН`,
    });
  } catch (error) {
    const detail = (error as { response?: { data?: { detail?: string | { message?: string } } } })?.response?.data?.detail;
    let errorMsg = '';

    if (typeof detail === 'string') {
      errorMsg = detail.includes('.') ? t(detail) : detail;
    } else if (detail && typeof detail === 'object' && 'message' in detail && detail.message) {
      errorMsg = detail.message.includes('.') ? t(detail.message) : detail.message;
    }

    $q.notify({
      type: 'negative',
      message: errorMsg || t('error.generic'),
    });
  } finally {
    isApplyingPromo.value = false;
  }
}
</script>

<style lang="scss" scoped>
.promo-code-form {
  background: var(--color-surface);
}
</style>
