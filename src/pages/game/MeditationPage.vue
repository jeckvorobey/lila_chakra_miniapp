<template>
  <q-page
    class="column"
    style="background: var(--lila-bg)"
  >
    <div
      class="col column flex-center"
      style="padding: var(--lila-layout-gap)"
    >
      <h1 class="text-h4 text-weight-medium text-center q-mb-sm">
        {{ $t('meditation.instructions_title') }}
      </h1>

      <q-card
        flat
        bordered
        class="bg-surface meditation-page__steps q-mb-lg"
      >
        <q-card-section>
          <div
            v-for="step in meditationSteps"
            :key="step.textKey"
            class="meditation-page__step-item q-mb-md"
          >
            <div class="text-body2 text-secondary">
              <span class="q-mr-sm">{{ step.emoji }}</span>{{ $t(step.textKey) }}
            </div>
          </div>
        </q-card-section>
      </q-card>

      <l-audio-player
        :audio-url="meditationAudioUrl"
        :title="$t(isEntry ? 'meditation.entry_title' : 'meditation.exit_title')"
        class="q-mt-md"
        @error="handleAudioError"
        @ended="handleMeditationEnded"
      />

      <q-btn
        :label="$t('meditation.skip')"
        flat
        color="grey"
        class="q-mt-xl"
        :loading="isSkipping"
        @click="skipMeditation"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import LAudioPlayer from 'src/components/base/LAudioPlayer.vue';
import { useGameStore } from 'src/stores/game.store';
import type { MeditationAudioType } from 'src/types/audio.interface';

interface MeditationStep {
  emoji: string;
  textKey: string;
}

const entryMeditationSteps: MeditationStep[] = [
  {
    emoji: '🪷',
    textKey: 'meditation.entry_steps.settle.text',
  },
  {
    emoji: '👁️',
    textKey: 'meditation.entry_steps.close_eyes.text',
  },
  {
    emoji: '❓',
    textKey: 'meditation.entry_steps.formulate_question.text',
  },
  {
    emoji: '🧠',
    textKey: 'meditation.entry_steps.let_question_sound.text',
  },
  {
    emoji: '✨',
    textKey: 'meditation.entry_steps.readiness.text',
  },
];

const exitMeditationSteps: MeditationStep[] = [
  {
    emoji: '🪷',
    textKey: 'meditation.exit_steps.settle.text',
  },
  {
    emoji: '🌬️',
    textKey: 'meditation.exit_steps.close_eyes.text',
  },
  {
    emoji: '🛤️',
    textKey: 'meditation.exit_steps.recall_path.text',
  },
  {
    emoji: '💡',
    textKey: 'meditation.exit_steps.highlight_core.text',
  },
  {
    emoji: '🎯',
    textKey: 'meditation.exit_steps.define_step.text',
  },
  {
    emoji: '🙏',
    textKey: 'meditation.exit_steps.gratitude.text',
  },
];

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const gameStore = useGameStore();
const { meditationAudioUrl, meditationAudioError } = storeToRefs(gameStore);

const isEntry = computed(() => route.params.type === 'entry');
const meditationSteps = computed<MeditationStep[]>(() =>
  isEntry.value ? entryMeditationSteps : exitMeditationSteps,
);
const meditationAudioType = computed<MeditationAudioType>(() =>
  isEntry.value ? 'meditation_entry' : 'meditation_exit',
);

const isSkipping = ref(false);

async function completeMeditationAndGoGame(): Promise<void> {
  if (isSkipping.value) {
    return;
  }

  // Если игра не загружена, просто вернуть пользователя на экран игры.
  if (!gameStore.currentGame) {
    await router.push('/game');
    return;
  }

  isSkipping.value = true;

  const isCompleted = isEntry.value
    ? await gameStore.completeEntryMeditation()
    : await gameStore.completeExitMeditation();

  isSkipping.value = false;

  if (!isCompleted) {
    $q.notify({
      type: 'negative',
      message: gameStore.error || 'Не удалось пропустить медитацию',
    });
    return;
  }

  if (!isEntry.value && gameStore.currentGame?.id) {
    await router.push(`/game/final/${gameStore.currentGame.id}`);
    return;
  }

  await router.push('/game');
}

async function skipMeditation(): Promise<void> {
  await completeMeditationAndGoGame();
}

async function handleMeditationEnded(): Promise<void> {
  await completeMeditationAndGoGame();
}

function handleAudioError(error: Error): void {
  $q.notify({
    type: 'negative',
    message: error.message || 'Ошибка воспроизведения аудио',
  });
}

async function loadMeditationAudio(): Promise<void> {
  await gameStore.loadMeditationAudio(meditationAudioType.value);
  if (meditationAudioError.value) {
    $q.notify({
      type: 'negative',
      message: meditationAudioError.value,
    });
  }
}

onMounted(() => {
  void loadMeditationAudio();
});

onUnmounted(() => {
  gameStore.clearMeditationAudio();
});

watch(
  () => meditationAudioType.value,
  () => {
    void loadMeditationAudio();
  },
);
</script>

<style scoped lang="scss">
.meditation-page__steps {
  width: 100%;
  max-width: 720px;
}

.meditation-page__step-item {
  align-items: flex-start;
}
</style>
