<template>
  <div class="l-cell-header" :style="headerGradientStyle">
    <div class="row items-center q-gutter-md q-px-md q-py-sm">
      <q-avatar
        :class="`bg-chakra-${rowChakraLevel}`"
        size="48px"
        :text-color="avatarTextColor"
        class="text-weight-bold"
      >
        {{ id }}
      </q-avatar>

      <div class="col">
        <div class="text-h4 text-weight-bold">{{ name }}</div>
        <div v-if="nameSanskrit" class="text-caption text-secondary">
          {{ nameSanskrit }}
        </div>
      </div>

      <slot name="action"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { getChakraColor, getChakraAvatarTextColor } from 'src/data/chakra-colors';
import { cellIdToChakraLevel } from 'src/utils/board-geometry';

interface Props {
  id: number;
  name: string;
  nameSanskrit?: string | null | undefined;
}

const props = defineProps<Props>();

const $q = useQuasar();
const isDarkMode = computed(() => $q.dark?.isActive ?? true);

const rowChakraLevel = computed(() => cellIdToChakraLevel(props.id));
const avatarTextColor = computed(() =>
  getChakraAvatarTextColor(rowChakraLevel.value, isDarkMode.value),
);

const headerGradientStyle = computed(() => {
  const chakraColor = getChakraColor(rowChakraLevel.value, isDarkMode.value);
  return {
    background: `linear-gradient(180deg, ${chakraColor}33 0%, transparent 100%)`,
  };
});
</script>

<style scoped>
.l-cell-header {
  border-radius: 24px 24px 0 0;
  margin-top: -1px;
}
</style>
