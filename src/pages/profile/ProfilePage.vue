<template>
  <q-page class="lila-page-nav-offset" style="padding: var(--lila-layout-gap)">
    <!-- User info -->
    <div class="row items-center q-mb-md">
      <q-avatar size="64px" color="primary" text-color="white" class="q-mr-md">
        <img v-if="user?.photo_url" :src="user.photo_url" />
        <span v-else class="text-h5">{{ userInitials }}</span>
      </q-avatar>
      <div>
        <div class="text-h6 text-weight-medium">{{ displayName }}</div>
        <div v-if="user?.username" class="text-caption text-secondary">@{{ user.username }}</div>
      </div>
    </div>

    <!-- Balance card -->
    <q-card flat bordered class="q-mb-md bg-surface">
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

    <!-- Stats -->
    <div class="row q-gutter-sm q-mb-md">
      <q-card flat bordered class="col bg-surface">
        <q-card-section class="text-center">
          <template v-if="userStore.stats?.has_active_game">
            <div class="text-h5 text-weight-bold text-primary">{{ stats.currentLevel }}</div>
            <div class="text-caption text-secondary">
              {{ stats.currentLevel === 8 ? $t('profile.highest_level') : $t('profile.current_chakra') }}
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
      <q-card flat bordered class="col bg-surface">
        <q-card-section class="text-center">
          <div class="text-h5 text-weight-bold text-positive">{{ stats.gamesCompleted }}</div>
          <div class="text-caption text-secondary">{{ $t('profile.games_completed') }}</div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Settings -->
    <div class="text-subtitle2 text-weight-medium q-mb-sm">{{ $t('profile.settings') }}</div>
    <q-list bordered separator class="rounded-borders q-mb-md bg-surface">
      <!-- Theme -->
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
            flat
            dense
            @update:model-value="settingsStore.setTheme($event)"
          />
        </q-item-section>
      </q-item>

      <!-- Sound -->
      <q-item tag="label">
        <q-item-section avatar>
          <q-icon :name="settingsStore.soundEnabled ? 'mdi-volume-high' : 'mdi-volume-off'" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Звук</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-toggle v-model="settingsStore.soundEnabled" color="primary" />
        </q-item-section>
      </q-item>

      <!-- Vibration -->
      <q-item tag="label">
        <q-item-section avatar>
          <q-icon name="mdi-vibrate" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Вибрация</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-toggle v-model="settingsStore.vibrationEnabled" color="primary" />
        </q-item-section>
      </q-item>

      <!-- Dice mode -->
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
            flat
            dense
            size="sm"
            @update:model-value="onDiceModeChange"
          />
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Support links -->
    <q-list bordered separator class="rounded-borders bg-surface">
      <q-item clickable @click="$router.push('/profile/rules')">
        <q-item-section avatar>
          <q-icon name="mdi-book-open-variant" />
        </q-item-section>
        <q-item-section>{{ $t('profile.rules') }}</q-item-section>
        <q-item-section side>
          <q-icon name="mdi-chevron-right" />
        </q-item-section>
      </q-item>

      <q-item clickable @click="$router.push('/profile/feedback')">
        <q-item-section avatar>
          <q-icon name="mdi-message-outline" />
        </q-item-section>
        <q-item-section>{{ $t('profile.feedback') }}</q-item-section>
        <q-item-section side>
          <q-icon name="mdi-chevron-right" />
        </q-item-section>
      </q-item>

      <q-item clickable @click="$router.push('/profile/my-requests')">
        <q-item-section avatar>
          <q-icon name="mdi-format-list-bulleted-square" />
        </q-item-section>
        <q-item-section>{{ $t('profile.my_requests') }}</q-item-section>
        <q-item-section side>
          <q-icon name="mdi-chevron-right" />
        </q-item-section>
      </q-item>

      <q-item clickable @click="$router.push('/profile/referral')">
        <q-item-section avatar>
          <q-icon name="mdi-share-variant" />
        </q-item-section>
        <q-item-section>{{ $t('profile.invite') }}</q-item-section>
        <q-item-section side>
          <q-icon name="mdi-chevron-right" />
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useUserStore } from 'src/stores/user.store';
import { useSettingsStore } from 'src/stores/settings.store';
import { useAuthStore } from 'src/stores/auth.store';

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
  set: (val) => {
    // handled by update:model-value
  },
});

async function onDiceModeChange(newMode: string) {
  await userStore.updateProfile({ dice_mode: newMode as 'auto' | 'manual' });
}

onMounted(() => {
  void userStore.fetchProfile();
  void userStore.fetchStats();
});
</script>
