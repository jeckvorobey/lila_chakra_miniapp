<template>
  <q-page class="lila-page-nav-offset" style="padding: var(--lila-layout-gap)">
    <!-- Описание приложения -->
    <q-card flat bordered class="q-mb-md bg-surface">
      <q-card-section>
        <div class="row items-center q-mb-sm">
          <q-icon name="mdi-star-four-points" size="24px" color="primary" class="q-mr-sm" />
          <div class="text-h6 text-weight-medium">{{ $t('about.description_title') }}</div>
        </div>
        <p class="text-body2 text-secondary q-mb-none">
          {{ $t('about.description_text') }}
        </p>
      </q-card-section>
    </q-card>

    <!-- Разработчик -->
    <q-card flat bordered class="q-mb-md bg-surface">
      <q-card-section>
        <div class="row items-center q-mb-sm">
          <q-icon name="mdi-account-outline" size="24px" color="primary" class="q-mr-sm" />
          <div class="text-h6 text-weight-medium">{{ $t('about.developer_title') }}</div>
        </div>
        <div class="text-body2">{{ $t('about.developer_name') }}</div>
        <div class="text-caption text-secondary">{{ $t('about.developer_inn') }}</div>
      </q-card-section>
    </q-card>

    <!-- Контактная информация -->
    <q-card flat bordered class="q-mb-md bg-surface">
      <q-card-section>
        <div class="row items-center q-mb-sm">
          <q-icon name="mdi-email-outline" size="24px" color="primary" class="q-mr-sm" />
          <div class="text-h6 text-weight-medium">{{ $t('about.contacts_title') }}</div>
        </div>
        <div class="text-body2 q-mb-xs">
          Email: {{ $t('about.contacts_email') }}
        </div>
        <div class="text-body2">
          Telegram: {{ $t('about.contacts_telegram') }}
        </div>
      </q-card-section>
    </q-card>

    <!-- Правовая информация -->
    <q-card flat bordered class="q-mb-md bg-surface">
      <q-card-section>
        <div class="row items-center q-mb-sm">
          <q-icon name="mdi-shield-check-outline" size="24px" color="primary" class="q-mr-sm" />
          <div class="text-h6 text-weight-medium">{{ $t('about.legal_title') }}</div>
        </div>
        <div class="text-body2 q-mb-xs">{{ $t('about.legal_personal_data') }}</div>
        <div class="text-body2 q-mb-xs">{{ $t('about.legal_age_restriction') }}</div>
        <div class="text-body2">{{ $t('about.legal_ai_disclaimer') }}</div>
      </q-card-section>
    </q-card>

    <!-- Версия -->
    <div class="text-center text-caption text-secondary q-mt-lg">
      {{ $t('about.version') }}: {{ appVersion }}
    </div>
  </q-page>
</template>

<script setup lang="ts">
const appVersion = process.env.APP_VERSION ?? '0.0.0';
</script>
