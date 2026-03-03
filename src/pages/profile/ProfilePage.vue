<template>
  <q-page
    class="lila-page-nav-offset"
    style="padding: var(--layout-gap)"
  >
    <!-- User info -->
    <div class="row items-center q-mb-md">
      <q-avatar
        size="64px"
        color="primary"
        text-color="white"
        class="q-mr-md"
      >
        <img
          v-if="user?.photo_url"
          :src="user.photo_url"
        />
        <span
          v-else
          class="text-h5"
          >{{ userInitials }}</span
        >
      </q-avatar>
      <div>
        <div class="text-h6 text-weight-medium">{{ displayName }}</div>
        <div
          v-if="user?.username"
          class="text-caption text-secondary"
        >
          @{{ user.username }}
        </div>
      </div>
    </div>

    <!-- Карточка баланса -->
    <q-card
      flat
      bordered
      class="q-mb-md bg-surface"
    >
      <q-card-section class="row items-center">
        <div class="col">
          <div class="text-overline text-secondary">{{ $t('profile.balance') }}</div>
          <div class="text-h4 text-weight-bold text-primary">
            {{ userStore.balance }} <span class="text-body1">ТКН</span>
          </div>
        </div>
        <q-btn
          :label="$t('profile.top_up')"
          color="primary"
          unelevated
          @click="$router.push('/profile/payment')"
        />
      </q-card-section>
    </q-card>

    <!-- Промокод -->
    <PromoCodeForm class="q-mb-md" />

    <!-- Статистика -->
    <div class="row q-gutter-sm q-mb-md">
      <q-card
        flat
        bordered
        class="col bg-surface"
      >
        <q-card-section class="text-center">
          <template v-if="userStore.stats?.has_active_game">
            <div class="text-h5 text-weight-bold text-primary">{{ stats.currentLevel }}</div>
            <div class="text-caption text-secondary">
              {{
                stats.currentLevel === 8
                  ? $t('profile.highest_level')
                  : $t('profile.current_chakra')
              }}
            </div>
          </template>
          <template v-else>
            <div class="text-subtitle2 text-weight-bold text-secondary q-mb-xs">
              {{ $t('profile.no_active_games') }}
            </div>
            <q-btn
              :label="$t('game.new_game')"
              color="primary"
              flat
              dense
              size="sm"
              @click="$router.push('/game/setup')"
            />
          </template>
        </q-card-section>
      </q-card>
      <q-card
        flat
        bordered
        class="col bg-surface"
      >
        <q-card-section class="text-center">
          <div class="text-h5 text-weight-bold text-positive">{{ stats.gamesCompleted }}</div>
          <div class="text-caption text-secondary">{{ $t('profile.games_completed') }}</div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Ссылки поддержки -->
    <q-list
      bordered
      separator
      class="rounded-borders bg-surface q-mb-md"
    >
      <q-item
        clickable
        @click="$router.push('/profile/referral')"
      >
        <q-item-section avatar>
          <q-icon name="mdi-share-variant" />
        </q-item-section>
        <q-item-section>{{ $t('profile.invite') }}</q-item-section>
        <q-item-section side>
          <q-icon name="mdi-chevron-right" />
        </q-item-section>
      </q-item>

      <q-item
        clickable
        @click="$router.push('/profile/transactions')"
      >
        <q-item-section avatar>
          <q-icon name="mdi-history" />
        </q-item-section>
        <q-item-section>{{ $t('profile.transactions_title') }}</q-item-section>
        <q-item-section side>
          <q-icon name="mdi-chevron-right" />
        </q-item-section>
      </q-item>

      <q-item
        clickable
        @click="$router.push('/profile/rules')"
      >
        <q-item-section avatar>
          <q-icon name="mdi-book-open-variant" />
        </q-item-section>
        <q-item-section>{{ $t('profile.rules') }}</q-item-section>
        <q-item-section side>
          <q-icon name="mdi-chevron-right" />
        </q-item-section>
      </q-item>

      <q-item
        clickable
        @click="$router.push('/profile/my-requests')"
      >
        <q-item-section avatar>
          <q-icon name="mdi-format-list-bulleted-square" />
        </q-item-section>
        <q-item-section>{{ $t('profile.my_requests') }}</q-item-section>
        <q-item-section side>
          <q-icon name="mdi-chevron-right" />
        </q-item-section>
      </q-item>

      <q-item
        clickable
        @click="$router.push('/profile/feedback')"
      >
        <q-item-section avatar>
          <q-icon name="mdi-message-outline" />
        </q-item-section>
        <q-item-section>{{ $t('profile.feedback') }}</q-item-section>
        <q-item-section side>
          <q-icon name="mdi-chevron-right" />
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Настройки -->
    <div class="text-subtitle2 text-weight-medium q-mb-sm">{{ $t('profile.settings') }}</div>
    <q-list
      bordered
      separator
      class="rounded-borders q-mb-md bg-surface"
    >
      <!-- Тема -->
      <q-item>
        <q-item-section avatar>
          <q-icon name="mdi-theme-light-dark" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Тема</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn-toggle
            v-model="settingsStore.theme"
            :options="[
              { icon: 'mdi-weather-sunny', value: 'light' },
              { icon: 'mdi-weather-night', value: 'dark' },
              { icon: 'mdi-cellphone-cog', value: 'system' },
            ]"
            toggle-color="primary"
            unelevated
            dense
            @update:model-value="settingsStore.setTheme($event)"
          />
        </q-item-section>
      </q-item>

      <!-- Звук -->
      <q-item tag="label">
        <q-item-section avatar>
          <q-icon :name="settingsStore.soundEnabled ? 'mdi-volume-high' : 'mdi-volume-off'" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Звук</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-toggle
            v-model="settingsStore.soundEnabled"
            color="primary"
            active-color="primary"
          />
        </q-item-section>
      </q-item>

      <!-- Вибрация -->
      <q-item tag="label">
        <q-item-section avatar>
          <q-icon name="mdi-vibrate" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Вибрация</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-toggle
            v-model="settingsStore.vibrationEnabled"
            color="primary"
            active-color="primary"
          />
        </q-item-section>
      </q-item>

      <!-- Режим кубика -->
      <q-item>
        <q-item-section avatar>
          <q-icon name="mdi-dice-multiple" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Режим кубика</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn-toggle
            v-model="profileDiceMode"
            :options="[
              { label: 'Авто', value: 'auto' },
              { label: 'Ручной', value: 'manual' },
            ]"
            toggle-color="primary"
            unelevated
            dense
            size="sm"
            @update:model-value="onDiceModeChange"
          />
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Настройки фишек -->
    <div class="text-subtitle2 text-weight-medium q-mb-sm">{{ $t('profile.chip_settings') }}</div>
    <q-card
      flat
      bordered
      class="q-mb-md bg-surface"
    >
      <q-card-section class="chip-settings">
        <div class="chip-settings__controls">
          <button
            type="button"
            class="chip-settings__row"
            @click="openColorPicker('chip')"
          >
            <span class="chip-settings__label">{{ $t('profile.chip_color') }}</span>
            <span class="chip-settings__value">
              <span
                class="profile-color-swatch"
                :style="{ backgroundColor: localChipColor }"
              />
            </span>
          </button>

          <button
            type="button"
            class="chip-settings__row"
            @click="openColorPicker('text')"
          >
            <span class="chip-settings__label">{{ $t('profile.chip_text_color') }}</span>
            <span class="chip-settings__value">
              <span
                class="profile-color-swatch"
                :style="{ backgroundColor: localChipTextColor }"
              />
            </span>
          </button>
        </div>

        <div class="chip-settings__preview">
          <q-avatar
            size="64px"
            :style="{ backgroundColor: localChipColor, color: localChipTextColor }"
            class="shadow-2"
          >
            36
          </q-avatar>
        </div>
      </q-card-section>
    </q-card>

    <q-dialog
      v-model="isColorPickerOpen"
      @hide="onChipColorChange"
    >
      <q-card class="profile-color-dialog">
        <q-card-section class="row items-center justify-between q-pb-sm">
          <div class="text-subtitle1 text-weight-medium">
            {{
              activeColorPicker === 'chip'
                ? $t('profile.chip_color')
                : $t('profile.chip_text_color')
            }}
          </div>
          <q-btn
            flat
            round
            dense
            icon="mdi-close"
            :aria-label="$t('actions.close')"
            @click="isColorPickerOpen = false"
          />
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-color v-model="selectedColorModel" />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useUserStore } from 'src/stores/user.store';
import { useSettingsStore } from 'src/stores/settings.store';
import { useAuthStore } from 'src/stores/auth.store';
import PromoCodeForm from 'src/components/profile/PromoCodeForm.vue';

const userStore = useUserStore();
const settingsStore = useSettingsStore();
const authStore = useAuthStore();

const user = computed(() => authStore.telegramUser);
const displayName = computed(() => userStore.displayName || user.value?.first_name || 'User');
const userInitials = computed(() => {
  const name = displayName.value;
  return name.charAt(0).toUpperCase();
});

const stats = computed(() => ({
  gamesPlayed: userStore.stats?.total_games ?? 0,
  gamesCompleted: userStore.stats?.completed_games ?? 0,
  highestLevel: userStore.stats?.highest_chakra_reached ?? 1,
  currentLevel: userStore.stats?.current_chakra ?? 0,
}));

const profileDiceMode = computed({
  get: () => userStore.profile?.dice_mode || 'auto',
  set: () => {
    // handled by update:model-value
  },
});

async function onDiceModeChange(newMode: string) {
  await userStore.updateProfile({ dice_mode: newMode as 'auto' | 'manual' });
}

const localChipColor = ref(userStore.profile?.settings?.chip_color || '#6B46C1');
const localChipTextColor = ref(userStore.profile?.settings?.chip_text_color || '#FFFFFF');
const isColorPickerOpen = ref(false);
const activeColorPicker = ref<'chip' | 'text'>('chip');

const selectedColorModel = computed({
  get: () => (activeColorPicker.value === 'chip' ? localChipColor.value : localChipTextColor.value),
  set: (value: string) => {
    if (activeColorPicker.value === 'chip') {
      localChipColor.value = value;
      return;
    }
    localChipTextColor.value = value;
  },
});

watch(
  () => userStore.profile?.settings?.chip_color,
  (newVal) => {
    if (newVal) localChipColor.value = newVal;
  },
);
watch(
  () => userStore.profile?.settings?.chip_text_color,
  (newVal) => {
    if (newVal) localChipTextColor.value = newVal;
  },
);

async function onChipColorChange() {
  if (
    localChipColor.value !== userStore.profile?.settings?.chip_color ||
    localChipTextColor.value !== userStore.profile?.settings?.chip_text_color
  ) {
    await userStore.updateProfile({
      settings: {
        chip_color: localChipColor.value,
        chip_text_color: localChipTextColor.value,
      },
    });
  }
}

function openColorPicker(target: 'chip' | 'text') {
  activeColorPicker.value = target;
  isColorPickerOpen.value = true;
}

onMounted(() => {
  void userStore.fetchProfile();
  void userStore.fetchStats();
});
</script>

<style scoped lang="scss">
.chip-settings {
  display: flex;
  align-items: center;
  gap: 16px;
}

.chip-settings__controls {
  flex: 1 1 auto;
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
}

.chip-settings__row {
  display: grid;
  grid-template-columns: 1fr 72px;
  align-items: center;
  width: 100%;
  min-height: 52px;
  padding: 0 14px;
  border: 0;
  border-bottom: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-primary);
  text-align: left;
  cursor: pointer;
}

.chip-settings__row:last-child {
  border-bottom: 0;
}

.chip-settings__label {
  font-size: 14px;
  line-height: 1.2;
}

.chip-settings__value {
  display: flex;
  justify-content: center;
}

.chip-settings__preview {
  flex: 0 0 88px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.profile-color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  border: 1px solid rgba(255, 255, 255, 0.28);
}

.body--light .profile-color-swatch {
  border-color: rgba(0, 0, 0, 0.18);
}

.profile-color-dialog {
  width: min(360px, 92vw);
}

@media (max-width: 599px) {
  .chip-settings {
    flex-direction: column;
    align-items: stretch;
  }

  .chip-settings__preview {
    flex: 0 0 auto;
    justify-content: center;
  }
}
</style>
