import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface TokenConfirmOptions {
  amount: number;
  title?: string;
  message?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

export const useUiStore = defineStore('ui', () => {
  const isTokenConfirmOpen = ref(false);
  const confirmOptions = ref<TokenConfirmOptions | null>(null);

  function requestTokenConfirm(options: TokenConfirmOptions) {
    confirmOptions.value = options;
    isTokenConfirmOpen.value = true;
  }

  async function resolveConfirm() {
    if (confirmOptions.value?.onConfirm) {
      await confirmOptions.value.onConfirm();
    }
    isTokenConfirmOpen.value = false;
    confirmOptions.value = null;
  }

  function resolveCancel() {
    if (confirmOptions.value?.onCancel) {
      confirmOptions.value.onCancel();
    }
    isTokenConfirmOpen.value = false;
    confirmOptions.value = null;
  }

  return {
    isTokenConfirmOpen,
    confirmOptions,
    requestTokenConfirm,
    resolveConfirm,
    resolveCancel,
  };
});
