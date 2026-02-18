<template>
  <q-page class="rules-page lila-page-nav-offset">
    <div class="column q-gutter-y-md">
      <div class="text-center q-px-md q-pt-md">
        <q-icon name="mdi-book-open-variant" size="64px" color="primary" class="q-mb-sm" />
        <h1 class="text-h5 text-weight-bold q-mt-none q-mb-none">{{ $t('rules.title') }}</h1>
      </div>

      <l-card bordered class="bg-surface">
        <q-card-section>
          <div class="row items-center q-mb-sm">
            <q-icon name="mdi-meditation" color="primary" size="22px" class="q-mr-sm" />
            <span class="text-subtitle1 text-weight-bold">
              {{ $t('rules.prep_title') }}
            </span>
          </div>
          <div class="text-body2 text-secondary">{{ $t('rules.prep_text') }}</div>
        </q-card-section>
      </l-card>

      <l-card bordered class="bg-surface">
        <q-card-section>
          <div class="row items-center q-mb-sm">
            <q-icon name="mdi-compass-outline" color="primary" size="22px" class="q-mr-sm" />
            <span class="text-subtitle1 text-weight-bold">
              {{ $t('rules.intention_title') }}
            </span>
          </div>
          <div class="text-body2 text-secondary q-mb-sm">{{ $t('rules.intention_text') }}</div>
          <div class="text-body2 text-secondary">{{ $t('rules.intention_six') }}</div>
        </q-card-section>
      </l-card>

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
          <div class="text-body2 text-secondary q-mt-sm q-mb-sm">{{ $t('rules.general_move') }}</div>
          <div class="text-body2 text-secondary q-mb-sm">{{ $t('rules.general_arrow_rule') }}</div>
          <div class="text-body2 text-secondary q-mb-sm">{{ $t('rules.general_snake_rule') }}</div>
          <div class="text-body2 text-secondary">{{ $t('rules.general_six_bonus') }}</div>
        </q-card-section>
      </l-card>

      <l-card bordered class="bg-surface">
        <q-card-section>
          <div class="row items-center q-mb-sm">
            <q-icon name="mdi-trophy-outline" color="primary" size="22px" class="q-mr-sm" />
            <span class="text-subtitle1 text-weight-bold">
              {{ $t('rules.goal_title') }}
            </span>
          </div>
          <div class="text-body2 text-secondary">{{ $t('rules.goal_text') }}</div>
        </q-card-section>
      </l-card>

      <l-card bordered class="bg-surface">
        <q-card-section>
          <div class="row items-center q-mb-sm">
            <q-icon name="mdi-chart-timeline-variant" color="primary" size="22px" class="q-mr-sm" />
            <span class="text-subtitle1 text-weight-bold">
              {{ $t('rules.analysis_title') }}
            </span>
          </div>
          <div class="text-body2 text-secondary q-mb-sm">{{ $t('rules.analysis_text') }}</div>
          <q-list dense>
            <q-item
              v-for="(item, index) in analysisHighlights"
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
          <div class="text-body2 text-secondary q-mt-sm">{{ $t('rules.analysis_note') }}</div>
        </q-card-section>
      </l-card>

      <l-card bordered class="bg-surface">
        <q-card-section>
          <div class="row items-center q-mb-sm">
            <q-icon name="mdi-run-fast" color="primary" size="22px" class="q-mr-sm" />
            <span class="text-subtitle1 text-weight-bold">
              {{ $t('rules.after_title') }}
            </span>
          </div>
          <div class="text-body2 text-secondary">{{ $t('rules.after_text') }}</div>
        </q-card-section>
      </l-card>

      <l-card bordered class="bg-surface">
        <q-card-section>
          <div class="text-subtitle1 text-weight-bold q-mb-sm">
            {{ $t('rules.modes_title') }}
          </div>
        </q-card-section>

        <template
          v-for="(mode, index) in gameModes"
          :key="mode.icon + index"
        >
          <q-separator />
          <q-card-section>
            <div class="row items-center q-mb-xs">
              <q-icon :name="mode.icon" :color="mode.iconColor" size="20px" class="q-mr-sm" />
              <span class="text-subtitle2 text-weight-medium">
                {{ mode.title }}
              </span>
              <q-badge
                v-if="mode.price"
                :color="mode.badgeColor"
                class="q-ml-sm"
              >
                {{ mode.price }} {{ $t('rules.tkn') }}
              </q-badge>
            </div>
            <div class="text-body2 text-secondary">{{ mode.description }}</div>
          </q-card-section>
        </template>
      </l-card>

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

interface RuleListItem {
  icon: string;
  text: string;
}

interface ModeItem {
  icon: string;
  iconColor: string;
  title: string;
  description: string;
  price?: number;
  badgeColor?: string;
}

const generalRules = computed<RuleListItem[]>(() => [
  { icon: 'mdi-grid', text: t('rules.general_board') },
  { icon: 'mdi-dice-6', text: t('rules.general_dice_auto') },
  { icon: 'mdi-hand-back-right-outline', text: t('rules.general_dice_manual') },
  { icon: 'mdi-arrow-up-bold', text: t('rules.general_arrows') },
  { icon: 'mdi-arrow-down-bold', text: t('rules.general_snakes') },
  { icon: 'mdi-numeric-6-circle', text: t('rules.general_sixes') },
]);

const analysisHighlights = computed<RuleListItem[]>(() => [
  { icon: 'mdi-arrow-down-bold-circle-outline', text: t('rules.analysis_snakes') },
  { icon: 'mdi-repeat', text: t('rules.analysis_repeat') },
  { icon: 'mdi-heart-pulse', text: t('rules.analysis_emotion') },
]);

const gameModes = computed<ModeItem[]>(() => [
  {
    icon: 'mdi-gift-outline',
    iconColor: 'positive',
    title: t('rules.mode_free_title'),
    description: t('rules.mode_free_desc'),
  },
  {
    icon: 'mdi-robot-outline',
    iconColor: 'primary',
    title: t('rules.mode_ai_title'),
    description: t('rules.mode_ai_desc'),
    price: 15,
    badgeColor: 'primary',
  },
  {
    icon: 'mdi-incognito',
    iconColor: 'secondary',
    title: t('rules.mode_incognito_title'),
    description: t('rules.mode_incognito_desc'),
    price: 20,
    badgeColor: 'secondary',
  },
]);
</script>

<style lang="scss" scoped>
.rules-page {
  padding: var(--lila-layout-gap);
}
</style>
