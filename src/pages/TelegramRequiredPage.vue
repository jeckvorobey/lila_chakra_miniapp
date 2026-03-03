<template>
  <q-page class="telegram-required-page flex flex-center">
    <div class="telegram-required-page__card bg-glass column items-center q-pa-xl">
      <q-icon
        name="fa-brands fa-telegram"
        size="48px"
        color="primary"
        class="q-mb-md"
      />
      <a
        class="telegram-required-page__link text-h5 text-weight-medium text-center q-mb-xs"
        :href="botUrl"
        rel="noopener"
        target="_blank"
      >
        {{ $t('telegram.required_message') }}
      </a>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useTheme } from 'src/composables/useTheme';

const botUsername = import.meta.env.VITE_TG_BOT_USERNAME as string | undefined;
const botUrl = botUsername ? `https://t.me/${botUsername}` : 'https://t.me';

const { setTheme } = useTheme();

onMounted(() => {
  // На этой странице всегда ориентируемся на системную тему
  setTheme('system');
});
</script>

<style lang="scss" scoped>
.telegram-required-page {
  min-height: 100vh;
  padding: 24px;

  &__card {
    max-width: 420px;
    border-radius: 16px;
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-card), var(--glow-primary);
  }

  &__link {
    color: inherit;
    text-decoration: none;
  }

  &__link:hover,
  &__link:focus-visible {
    text-decoration: underline;
  }
}
</style>
