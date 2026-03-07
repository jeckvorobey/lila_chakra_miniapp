<template>
  <div :class="rootClasses">
    <template v-if="variant === 'game-home'">
      <q-skeleton
        type="text"
        class="l-page-skeleton__title"
        width="46%"
      />
      <q-card
        flat
        bordered
        class="l-page-skeleton__card"
      >
        <q-card-section>
          <div class="row items-center q-mb-md">
            <q-skeleton
              type="QAvatar"
              size="44px"
            />
            <div class="col q-ml-md">
              <q-skeleton
                type="text"
                width="58%"
                class="q-mb-sm"
              />
              <q-skeleton
                type="text"
                width="34%"
              />
            </div>
          </div>

          <q-skeleton
            type="rect"
            height="180px"
            class="l-page-skeleton__surface q-mb-md"
          />

          <div class="row q-col-gutter-sm q-mb-md">
            <div class="col-6">
              <q-skeleton
                type="rect"
                height="56px"
                class="l-page-skeleton__surface"
              />
            </div>
            <div class="col-6">
              <q-skeleton
                type="rect"
                height="56px"
                class="l-page-skeleton__surface"
              />
            </div>
          </div>

          <q-skeleton
            type="rect"
            height="48px"
            class="l-page-skeleton__surface"
          />
        </q-card-section>
      </q-card>
    </template>

    <template v-else-if="variant === 'meditation'">
      <div class="l-page-skeleton__meditation-header">
        <q-skeleton
          type="text"
          width="52%"
          class="l-page-skeleton__title centered"
        />
        <q-skeleton
          type="text"
          width="70%"
          class="centered"
        />
      </div>

      <q-card
        flat
        bordered
        class="l-page-skeleton__card l-page-skeleton__card--wide"
      >
        <q-card-section>
          <q-skeleton
            v-for="index in 5"
            :key="index"
            type="text"
            class="q-mb-md"
            :width="index === 5 ? '54%' : '100%'"
          />
        </q-card-section>
      </q-card>

      <q-card
        flat
        bordered
        class="l-page-skeleton__card l-page-skeleton__card--wide q-mt-md"
      >
        <q-card-section>
          <div class="row items-center no-wrap q-col-gutter-md">
            <div>
              <q-skeleton
                type="QAvatar"
                size="52px"
              />
            </div>
            <div class="col">
              <q-skeleton
                type="text"
                width="44%"
                class="q-mb-sm"
              />
              <q-skeleton
                type="text"
                width="24%"
                class="q-mb-md"
              />
              <q-skeleton
                type="rect"
                height="8px"
                class="l-page-skeleton__surface"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-skeleton
        type="text"
        width="22%"
        class="q-mt-xl centered"
      />
    </template>

    <template v-else>
      <q-skeleton
        type="text"
        width="38%"
        class="l-page-skeleton__title"
      />

      <q-card
        v-for="index in diaryItems"
        :key="index"
        flat
        bordered
        class="l-page-skeleton__card"
      >
        <q-card-section>
          <div class="row items-center q-mb-md">
            <q-skeleton
              type="QBadge"
              width="84px"
              class="q-mr-sm"
            />
            <q-skeleton
              type="text"
              width="26%"
            />
            <q-space />
            <q-skeleton
              type="QChip"
              width="54px"
            />
          </div>

          <q-skeleton
            type="text"
            class="q-mb-sm"
          />
          <q-skeleton
            type="text"
            width="78%"
            class="q-mb-md"
          />
          <q-skeleton
            type="QChip"
            width="110px"
          />
        </q-card-section>
      </q-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export type PageSkeletonVariant = 'game-home' | 'meditation' | 'diary-list';

interface Props {
  variant: PageSkeletonVariant;
  diaryItems?: number;
}

const props = withDefaults(defineProps<Props>(), {
  diaryItems: 3,
});

const rootClasses = computed(() => [
  'l-page-skeleton',
  `l-page-skeleton--${props.variant}`,
]);
</script>

<style scoped lang="scss">
.l-page-skeleton {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;

  &--game-home,
  &--diary-list {
    padding: var(--layout-gap);
  }

  &--meditation {
    align-items: center;
    justify-content: center;
    min-height: 100%;
    padding: var(--layout-gap);
  }

  &__title {
    opacity: 0.9;
  }

  &__card {
    width: 100%;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 16px;
  }

  &__card--wide {
    max-width: 720px;
  }

  &__surface {
    border-radius: 12px;
  }

  &__meditation-header {
    width: 100%;
    max-width: 720px;
  }
}

.centered {
  margin-left: auto;
  margin-right: auto;
}
</style>
