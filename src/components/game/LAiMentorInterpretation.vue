<template>
  <div class="l-ai-mentor-interpretation">
    <div v-if="isLoading">
      <l-ai-loader :text="t('cell.ai_mentor_loading', 'Ментор размышляет над вашим ходом...')" />
    </div>

    <div
      v-else-if="error"
      class="text-negative text-body2 q-mb-md"
    >
      {{ error }}
    </div>

    <div v-else-if="interpretation">
      <div class="text-overline text-secondary q-mb-xs">
        {{ t('cell.ai_mentor_interpretation', 'Интерпретация хода') }}
      </div>
      <p
        class="text-body1 q-mb-md"
        style="white-space: pre-wrap"
      >
        {{ interpretation }}
      </p>

      <div
        v-if="reflectionPoints && reflectionPoints.length > 0"
        class="q-mt-md"
      >
        <div class="text-overline text-secondary q-mb-xs">
          {{ t('cell.reflection_questions', 'Вопросы для размышления') }}
        </div>
        <ol class="q-pl-lg q-mb-none">
          <li
            v-for="(question, index) in reflectionPoints"
            :key="index"
            class="q-mb-xs"
          >
            <div class="text-body2">
              {{ question }}
            </div>
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import LAiLoader from 'src/components/common/LAiLoader.vue';

interface Props {
  interpretation: string;
  reflectionPoints?: string[];
  isLoading?: boolean;
  error?: string;
}

defineProps<Props>();

const { t } = useI18n();
</script>

<style scoped>
.l-ai-mentor-interpretation {
  width: 100%;
}
</style>
