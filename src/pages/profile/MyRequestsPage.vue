<template>
  <q-page class="my-requests-page lila-page-nav-offset">
    <div
      v-if="isLoading"
      class="q-gutter-y-sm"
    >
      <q-skeleton
        type="rect"
        height="88px"
      />
      <q-skeleton
        type="rect"
        height="88px"
      />
      <q-skeleton
        type="rect"
        height="88px"
      />
    </div>

    <div
      v-else-if="requests.length === 0"
      class="column items-center q-mt-xl text-center q-gutter-y-sm"
    >
      <q-icon
        name="mdi-message-badge-outline"
        size="48px"
        color="grey-6"
      />
      <div class="text-subtitle1 text-weight-medium">{{ $t('feedback.empty_title') }}</div>
      <div class="text-body2 text-secondary">{{ $t('feedback.empty_text') }}</div>
    </div>

    <div
      v-else
      class="column q-gutter-y-md"
    >
      <q-card
        v-for="requestItem in requests"
        :key="requestItem.id"
        flat
        bordered
        class="bg-surface"
      >
        <q-card-section>
          <div class="row items-center justify-between q-mb-sm q-gutter-x-sm">
            <q-chip
              dense
              :color="statusColor(requestItem.status)"
              text-color="white"
            >
              {{ $t(`feedback.status.${requestItem.status}`) }}
            </q-chip>
            <span class="text-caption text-secondary">
              {{ $t('feedback.created_at') }}: {{ formatDate(requestItem.created_at) }}
            </span>
          </div>

          <div class="text-body2 request-text q-mb-md">{{ requestItem.message }}</div>

          <div
            v-if="requestItem.admin_comment"
            class="text-caption q-mb-xs"
          >
            <span class="text-weight-medium">{{ $t('feedback.admin_comment') }}:</span>
            {{ requestItem.admin_comment }}
          </div>

          <div
            v-if="requestItem.eta_at"
            class="text-caption text-secondary"
          >
            {{ $t('feedback.eta_at') }}: {{ formatDate(requestItem.eta_at) }}
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

import { feedbackApi } from 'src/services/api/feedback.api';
import type { FeedbackRequestOut, FeedbackStatus } from 'src/types/feedback.interface';

const $q = useQuasar();
const { t } = useI18n();

const requests = ref<FeedbackRequestOut[]>([]);
const isLoading = ref(false);

function statusColor(status: FeedbackStatus): string {
  switch (status) {
    case 'new':
      return 'blue-8';
    case 'processed':
      return 'indigo-7';
    case 'in_progress':
      return 'orange-8';
    case 'completed':
      return 'positive';
    case 'rejected':
      return 'negative';
    default:
      return 'grey-7';
  }
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

async function loadRequests() {
  isLoading.value = true;
  try {
    const response = await feedbackApi.getMyRequests({ limit: 100 });
    requests.value = response.items;
  } catch {
    $q.notify({
      type: 'negative',
      message: t('feedback.error_load'),
      position: 'top',
    });
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  void loadRequests();
});
</script>

<style scoped lang="scss">
.my-requests-page {
  padding: var(--layout-gap);
}

.request-text {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
