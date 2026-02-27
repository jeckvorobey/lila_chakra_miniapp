<template>
  <l-modal
    v-model="uiStore.isTokenConfirmOpen"
    position="bottom"
    :persistent="true"
    :show-close="false"
    :show-handle="true"
    max-width="400px"
  >
    <template #header>
      <div class="column items-center full-width q-pt-md">
        <div class="l-token-icon-large q-mb-md">
          <q-icon
            name="toll"
            color="accent"
            size="48px"
          />
        </div>
        <div class="text-h6 text-center">
          {{ options?.title || t('payment.token_confirm.title') }}
        </div>
      </div>
    </template>

    <div class="column items-center q-px-md">
      <p class="text-body1 text-center text-secondary q-mb-lg">
        {{ options?.message || t('payment.token_confirm.message', { amount: options?.amount }) }}
      </p>

      <div class="row items-center justify-center q-mb-md">
        <div class="text-h4 text-weight-bold text-accent q-mr-sm">-{{ options?.amount }}</div>
        <div class="text-h6 text-secondary">{{ t('rules.tkn') }}</div>
      </div>

      <q-banner
        v-if="hasInsufficientBalance"
        class="bg-negative-light text-negative rounded-borders full-width q-mb-md"
      >
        {{ t('clarification.insufficient_balance') }}
      </q-banner>
    </div>

    <template #actions>
      <div class="column full-width q-gutter-y-sm">
        <q-btn
          :label="t('payment.token_confirm.confirm_button')"
          color="accent"
          unelevated
          class="full-width q-py-sm"
          :disable="hasInsufficientBalance"
          @click="confirm"
        />
        <q-btn
          :label="t('payment.token_confirm.cancel_button')"
          flat
          color="grey-7"
          class="full-width"
          @click="cancel"
        />
      </div>
    </template>
  </l-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUiStore } from 'src/stores/ui.store';
import { useUserStore } from 'src/stores/user.store';
import LModal from 'src/components/base/LModal.vue';

const { t } = useI18n();
const uiStore = useUiStore();
const userStore = useUserStore();

const options = computed(() => uiStore.confirmOptions);

const hasInsufficientBalance = computed(() => {
  if (!options.value) return false;
  return userStore.balance < options.value.amount;
});

async function confirm() {
  await uiStore.resolveConfirm();
}

function cancel() {
  uiStore.resolveCancel();
}
</script>

<style lang="scss" scoped>
.l-token-icon-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: rgba(var(--q-accent-rgb), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
