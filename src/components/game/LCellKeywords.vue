<template>
  <div
    v-if="keywords?.length"
    class="l-cell-keywords q-mb-md"
  >
    <div class="text-overline text-secondary q-mb-xs">
      {{ t('cell.keywords') }}
    </div>
    <div class="row q-gutter-xs">
      <q-chip
        v-for="keyword in keywords"
        :key="keyword"
        color="primary"
        text-color="white"
        dense
      >
        {{ keyword }}
      </q-chip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

interface Props {
  keywords?: string[] | null | undefined;
}

defineProps<Props>();

const { t } = useI18n();
</script>
