<template>
  <div class="full-width">
    <q-card flat bordered class="bg-surface">
      <q-card-section class="q-pa-md">
        <div class="row items-center q-mb-md">
          <q-avatar
            :class="['text-weight-bold q-mr-sm', currentCellAvatarBgClass]"
            size="40px"
            :text-color="currentCellAvatarTextColor"
          >
            {{ currentCell }}
          </q-avatar>
          <div class="col">
            <div class="text-subtitle2 text-weight-medium ellipsis">
              {{ currentCellTitle }}
            </div>
            <div class="text-caption text-secondary">
              {{ currentChakraLabel }}
            </div>
          </div>
          <q-btn
            flat
            round
            dense
            icon="mdi-information-outline"
            data-testid="current-cell-info-btn"
            @click="emit('show-current-cell-info')"
          />
        </div>

        <div v-if="isWaitingForSix" class="text-center q-mb-md">
          <q-icon name="mdi-dice-6" size="24px" color="warning" class="q-mr-sm" />
          <span class="text-body2 text-secondary">{{ t('dice.waiting_for_6') }}</span>
        </div>

        <div class="row justify-center q-gutter-sm">
          <q-btn
            :label="t('dice.roll')"
            color="primary"
            size="lg"
            unelevated
            icon="mdi-dice-multiple"
            class="q-px-xl"
            :disable="isChipAnimating"
            data-testid="open-dice-modal-btn"
            @click="showDiceModal = true"
          />
        </div>

        <div class="row justify-center q-mt-md">
          <q-btn
            :label="t('game.end_game')"
            color="negative"
            flat
            size="sm"
            :loading="isEndingGame"
            data-testid="end-game-btn"
            @click="emit('confirm-end-game')"
          />
        </div>
      </q-card-section>
    </q-card>

    <l-dice-roll-modal
      v-model="showDiceModal"
      @roll-finished="(result) => emit('roll-finished', result)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { getChakraAvatarTextColor } from 'src/data/chakra-colors';
import type { CellBrief, MoveResponse } from 'src/types/game.interface';
import LDiceRollModal from './LDiceRollModal.vue';

interface Props {
  currentCell: number;
  currentCellInfo: CellBrief | null;
  currentChakra: number;
  isWaitingForSix: boolean;
  isChipAnimating: boolean;
  isEndingGame: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'show-current-cell-info'): void;
  (e: 'roll-finished', result: MoveResponse): void;
  (e: 'confirm-end-game'): void;
}>();

const { t } = useI18n();
const $q = useQuasar();

const showDiceModal = ref(false);
const isDarkMode = computed(() => $q.dark?.isActive ?? true);

const currentCellAvatarBgClass = computed(() =>
  props.currentChakra > 0 ? `bg-chakra-${props.currentChakra}` : 'bg-grey-6',
);
const currentCellAvatarTextColor = computed(() =>
  getChakraAvatarTextColor(props.currentChakra, isDarkMode.value),
);
const currentCellTitle = computed(() => {
  if (props.currentCell === 0) return t('game.outside_board');
  return props.currentCellInfo?.name_ru ?? '';
});
const currentChakraLabel = computed(() =>
  props.currentChakra > 0 ? t(`chakra.${props.currentChakra}`) : 'chakra.0',
);
</script>
