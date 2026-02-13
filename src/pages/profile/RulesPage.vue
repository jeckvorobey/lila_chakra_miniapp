<template>
  <q-page padding class="rules-page">
    <div class="column q-gutter-y-md">
      <!-- Заголовок -->
      <div class="text-center q-px-md q-pt-md">
        <q-icon name="mdi-book-open-variant" size="64px" color="primary" class="q-mb-sm" />
        <h1 class="text-h5 text-weight-bold q-mt-none q-mb-none">{{ $t('rules.title') }}</h1>
      </div>

      <!-- Общие правила -->
      <l-card bordered class="bg-surface">
        <q-card-section>
          <div class="text-subtitle1 text-weight-bold q-mb-sm">
            {{ $t('rules.general_title') }}
          </div>
          <q-list dense>
            <q-item
              v-for="(item, index) in generalRules"
              :key="index"
              class="q-px-none q-mb-xs"
            >
              <q-item-section avatar side class="q-pr-sm">
                <q-icon :name="item.icon" color="primary" size="20px" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-body2">{{ item.text }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </l-card>

      <!-- Режимы игры -->
      <l-card bordered class="bg-surface">
        <q-card-section>
          <div class="text-subtitle1 text-weight-bold q-mb-sm">
            {{ $t('rules.modes_title') }}
          </div>
        </q-card-section>

        <q-separator />

        <!-- Бесплатный -->
        <q-card-section>
          <div class="row items-center q-mb-xs">
            <q-icon name="mdi-gift-outline" color="positive" size="20px" class="q-mr-sm" />
            <span class="text-subtitle2 text-weight-medium">
              {{ $t('rules.mode_free_title') }}
            </span>
          </div>
          <div class="text-body2 text-secondary">{{ $t('rules.mode_free_desc') }}</div>
        </q-card-section>

        <q-separator />

        <!-- С AI Ментором -->
        <q-card-section>
          <div class="row items-center q-mb-xs">
            <q-icon name="mdi-robot-outline" color="primary" size="20px" class="q-mr-sm" />
            <span class="text-subtitle2 text-weight-medium">
              {{ $t('rules.mode_ai_title') }}
            </span>
            <q-badge color="primary" class="q-ml-sm">15 {{ $t('rules.tkn') }}</q-badge>
          </div>
          <div class="text-body2 text-secondary">{{ $t('rules.mode_ai_desc') }}</div>
        </q-card-section>

        <q-separator />

        <!-- Инкогнито -->
        <q-card-section>
          <div class="row items-center q-mb-xs">
            <q-icon
              name="mdi-incognito"
              color="secondary"
              size="20px"
              class="q-mr-sm"
            />
            <span class="text-subtitle2 text-weight-medium">
              {{ $t('rules.mode_incognito_title') }}
            </span>
            <q-badge color="secondary" class="q-ml-sm">20 {{ $t('rules.tkn') }}</q-badge>
          </div>
          <div class="text-body2 text-secondary">{{ $t('rules.mode_incognito_desc') }}</div>
        </q-card-section>
      </l-card>

      <!-- Дополнительный вопрос -->
      <l-card bordered class="bg-surface">
        <q-card-section>
          <div class="row items-center q-mb-sm">
            <q-icon
              name="mdi-comment-question-outline"
              color="primary"
              size="24px"
              class="q-mr-sm"
            />
            <span class="text-subtitle1 text-weight-bold">
              {{ $t('rules.extra_question_title') }}
            </span>
          </div>
          <div class="text-body2 text-secondary">{{ $t('rules.extra_question_desc') }}</div>
          <q-badge color="primary" outline class="q-mt-sm">
            1 {{ $t('rules.tkn') }}
          </q-badge>
        </q-card-section>
      </l-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { LCard } from 'src/components/base';

const { t } = useI18n();

const generalRules = computed(() => [
  { icon: 'mdi-grid', text: t('rules.general_board') },
  { icon: 'mdi-dice-6', text: t('rules.general_dice_auto') },
  { icon: 'mdi-hand-back-right-outline', text: t('rules.general_dice_manual') },
  { icon: 'mdi-arrow-up-bold', text: t('rules.general_arrows') },
  { icon: 'mdi-arrow-down-bold', text: t('rules.general_snakes') },
  { icon: 'mdi-numeric-6-circle', text: t('rules.general_sixes') },
]);
</script>

<style lang="scss" scoped>
.rules-page {
  padding-bottom: 80px;
}
</style>
