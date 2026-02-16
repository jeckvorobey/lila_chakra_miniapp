<template>
  <l-modal v-model="isOpen" :title="cell.name" position="bottom" max-width="100%">
    <template #header>
      <div class="l-cell-card row items-center q-gutter-md q-pa-md">
        <q-avatar
          :class="`bg-chakra-${rowChakraLevel}`"
          size="48px"
          :text-color="avatarTextColor"
          class="text-weight-bold"
        >
          {{ cell.id }}
        </q-avatar>

        <div class="col">
          <div class="text-h6 text-weight-bold">{{ cell.name }}</div>
          <div class="text-caption text-secondary">
            <q-icon name="mdi-yoga" size="14px" class="q-mr-xs" />
            {{ t(`chakra.${rowChakraLevel}`) }}
          </div>
        </div>

        <q-btn flat round dense icon="close" @click="close" />
      </div>
    </template>

    <q-scroll-area style="height: 60vh">
      <div class="l-cell-card q-pa-md">
        <div v-if="cell.name_sanskrit" class="q-mb-md">
          <div class="text-overline text-secondary q-mb-xs">
            {{ t('cell.sanskrit_name') }}
          </div>
          <p class="text-body1">{{ cell.name_sanskrit }}</p>
        </div>

        <div class="q-mb-md">
          <div class="text-overline text-secondary q-mb-xs">
            {{ t('cell.description') }}
          </div>
          <p class="text-body1">{{ cell.description }}</p>
        </div>


        <div v-if="cell.question" class="q-mb-md">
          <div class="text-overline text-secondary q-mb-xs">
            {{ t('cell.question') }}
          </div>
          <p class="text-body1">{{ cell.question }}</p>
        </div>

        <div v-if="cell.keywords?.length" class="q-mb-md">
          <div class="text-overline text-secondary q-mb-xs">
            {{ t('cell.keywords') }}
          </div>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="keyword in cell.keywords"
              :key="keyword"
              color="primary"
              text-color="white"
              dense
            >
              {{ keyword }}
            </q-chip>
          </div>
        </div>

        <q-banner
          v-if="isArrow || isSnake"
          :class="isArrow ? 'bg-positive-light' : 'bg-negative-light'"
          class="rounded-borders q-my-md"
        >
          <template #avatar>
            <q-icon
              :name="isArrow ? 'mdi-arrow-up-bold' : 'mdi-snake'"
              :color="isArrow ? 'positive' : 'negative'"
              size="32px"
            />
          </template>

          <div class="text-weight-medium">
            {{ isArrow ? t('transition.arrow') : t('transition.snake') }}
          </div>
          <div class="text-caption">
            {{ isArrow ? t('transition.arrow_to') : t('transition.snake_to') }}
            <strong>{{ transitionTarget }}</strong>
          </div>
        </q-banner>
      </div>
    </q-scroll-area>

    <template #actions>
      <q-btn
        :label="t('actions.write_insight')"
        color="primary"
        icon="mdi-pencil"
        unelevated
        class="full-width"
        @click="openInsightModal"
      />
    </template>
  </l-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { Cell } from 'src/types/game.interface';
import { getChakraAvatarTextColor } from 'src/data/chakra-colors';
import LModal from '../base/LModal.vue';

interface Props {
  modelValue: boolean;
  cell: Cell;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'write-insight'): void;
}>();

const { t } = useI18n();
const $q = useQuasar();
const isDarkMode = computed(() => $q.dark?.isActive ?? true);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const rowChakraLevel = computed(() => Math.ceil(props.cell.id / 9));
const avatarTextColor = computed(() =>
  getChakraAvatarTextColor(rowChakraLevel.value, isDarkMode.value),
);

const isArrow = computed(() => props.cell.is_arrow_start ?? false);

const isSnake = computed(() => props.cell.is_snake_head ?? false);

const transitionTarget = computed(() => {
  if (isArrow.value) {
    return props.cell.arrow_end ?? '';
  }

  if (isSnake.value) {
    return props.cell.snake_tail ?? '';
  }

  return '';
});

function close(): void {
  isOpen.value = false;
}

function openInsightModal(): void {
  emit('write-insight');
}
</script>

<style lang="scss" scoped>
.l-cell-card {
  color: var(--lila-text-primary);
}
</style>
