<template>
  <div class="row items-center q-gutter-sm q-mb-sm">
    <q-spinner-dots color="primary" size="24px" />
    <span class="text-body2 text-secondary">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  text: string;
}

defineProps<Props>();
</script>
