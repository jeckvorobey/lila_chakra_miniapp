<template>
  <div class="col column items-center justify-center q-pa-xl text-center full-width">
    <q-icon name="mdi-gamepad-variant" size="64px" color="primary" class="q-mb-md" />

    <div class="text-h5 text-weight-medium q-mb-sm">
      {{ t('game.title') }}
    </div>

    <p class="text-body2 text-secondary q-mb-lg" style="max-width: 280px">
      {{ t('onboarding.welcome_desc') }}
    </p>

    <q-btn
      :label="t('game.new_game')"
      color="primary"
      size="lg"
      unelevated
      icon="mdi-play"
      class="q-px-xl"
      @click="startNewGame"
    />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const { t } = useI18n();

function startNewGame() {
  void router.push('/game/new');
}
</script>
