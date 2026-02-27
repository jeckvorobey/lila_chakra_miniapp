<template>
  <q-page class="feedback-page lila-page-nav-offset">
    <q-card
      flat
      bordered
      class="bg-surface"
    >
      <q-card-section>
        <div class="text-h6 text-weight-medium q-mb-sm">{{ $t('feedback.title') }}</div>
        <p class="text-body2 text-secondary q-mb-md">{{ $t('feedback.subtitle') }}</p>

        <q-form @submit.prevent="submitFeedback">
          <q-input
            v-model="message"
            type="textarea"
            :rows="5"
            :maxlength="4000"
            counter
            outlined
            :label="$t('feedback.input_label')"
            :placeholder="$t('feedback.placeholder')"
          />

          <div class="text-caption text-secondary q-mt-sm q-mb-lg">
            {{ $t('feedback.hint') }}
          </div>

          <q-btn
            type="submit"
            color="primary"
            unelevated
            class="full-width"
            :label="$t('feedback.submit')"
            :loading="isSending"
            :disable="!canSubmit"
          />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

import { feedbackApi } from 'src/services/api/feedback.api';

const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();

const message = ref('');
const isSending = ref(false);

const trimmedMessage = computed(() => message.value.trim());
const canSubmit = computed(() => trimmedMessage.value.length >= 10 && !isSending.value);

async function submitFeedback() {
  if (!canSubmit.value) {
    $q.notify({
      type: 'warning',
      message: t('feedback.validation_min'),
      position: 'top',
    });
    return;
  }

  try {
    isSending.value = true;

    await feedbackApi.createRequest({
      message: trimmedMessage.value,
    });

    $q.notify({
      type: 'positive',
      message: t('feedback.success'),
      position: 'top',
      timeout: 2500,
    });

    message.value = '';
    await router.push('/profile/my-requests');
  } catch {
    $q.notify({
      type: 'negative',
      message: t('feedback.error_submit'),
      position: 'top',
    });
  } finally {
    isSending.value = false;
  }
}
</script>

<style scoped lang="scss">
.feedback-page {
  padding: var(--lila-layout-gap);
}
</style>
