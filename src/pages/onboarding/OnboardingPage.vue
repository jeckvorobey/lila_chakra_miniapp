<template>
  <q-page class="onboarding">
    <q-carousel
      v-model="currentSlide"
      animated
      swipeable
      navigation
      control-color="primary"
      class="onboarding__carousel"
    >
      <!-- Slide 1: Welcome -->
      <q-carousel-slide name="welcome" class="onboarding__slide">
        <div class="onboarding__content">
          <q-icon name="mdi-gamepad-variant" size="80px" color="primary" class="q-mb-lg" />
          <h1 class="text-h4 text-weight-bold q-mb-sm">{{ $t('onboarding.welcome_title') }}</h1>
          <p class="text-body1 text-secondary">{{ $t('onboarding.welcome_desc') }}</p>
        </div>
      </q-carousel-slide>

      <!-- Slide 2: How to play -->
      <q-carousel-slide name="concept" class="onboarding__slide">
        <div class="onboarding__content">
          <div class="onboarding__demo q-mb-lg">
            <q-icon name="mdi-dice-multiple" size="60px" color="primary" />
            <q-icon name="mdi-arrow-right" size="32px" color="grey" class="q-mx-md" />
            <div class="onboarding__board-preview">
              <div v-for="i in 9" :key="i" class="onboarding__cell" />
            </div>
          </div>
          <h2 class="text-h5 text-weight-bold q-mb-sm">{{ $t('onboarding.concept_title') }}</h2>
          <p class="text-body1 text-secondary">{{ $t('onboarding.concept_desc') }}</p>

          <q-list class="q-mt-md">
            <q-item>
              <q-item-section avatar>
                <q-icon name="mdi-numeric-6-circle" color="warning" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Вход в игру — выбросите 6</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-icon name="mdi-dice-multiple" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Выпала 6 — бросайте ещё раз</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-icon name="mdi-star" color="warning" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Цель — клетка 68 (Космическое Сознание)</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-carousel-slide>

      <!-- Slide 3: Arrows & Snakes -->
      <q-carousel-slide name="portals" class="onboarding__slide">
        <div class="onboarding__content">
          <div class="row q-gutter-lg q-mb-lg justify-center">
            <div class="text-center">
              <q-icon name="mdi-arrow-up-bold" size="60px" color="positive" />
              <div class="text-subtitle2 q-mt-sm">Стрелы</div>
              <div class="text-caption text-secondary">Добродетели</div>
            </div>
            <div class="text-center">
              <q-icon name="mdi-snake" size="60px" color="negative" />
              <div class="text-subtitle2 q-mt-sm">Змеи</div>
              <div class="text-caption text-secondary">Пороки</div>
            </div>
          </div>
          <h2 class="text-h5 text-weight-bold q-mb-sm">{{ $t('onboarding.portals_title') }}</h2>
          <p class="text-body1 text-secondary">{{ $t('onboarding.portals_desc') }}</p>

          <q-card flat bordered class="q-mt-md">
            <q-card-section class="row items-center">
              <q-icon name="mdi-arrow-up-bold" color="positive" size="24px" class="q-mr-sm" />
              <div class="col">
                <div class="text-body2">Сострадание (17 → 69)</div>
                <div class="text-caption text-secondary">Самый мощный подъём</div>
              </div>
            </q-card-section>
            <q-separator />
            <q-card-section class="row items-center">
              <q-icon name="mdi-snake" color="negative" size="24px" class="q-mr-sm" />
              <div class="col">
                <div class="text-body2">Эгоизм (55 → 3)</div>
                <div class="text-caption text-secondary">Самое большое падение</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </q-carousel-slide>

      <!-- Slide 4: Safety -->
      <q-carousel-slide name="safety" class="onboarding__slide">
        <div class="onboarding__content">
          <q-icon name="mdi-shield-check" size="80px" color="warning" class="q-mb-lg" />
          <h2 class="text-h5 text-weight-bold q-mb-sm">{{ $t('onboarding.safety_title') }}</h2>
          <p class="text-body1 text-secondary q-mb-md">{{ $t('onboarding.safety_desc') }}</p>

          <q-banner class="bg-warning-light rounded-borders">
            <template #avatar>
              <q-icon name="mdi-alert" color="warning" />
            </template>
            <div class="text-body2">
              <strong>Важно:</strong> Эта игра работает с подсознанием. Входная и выходная медитации
              обязательны для вашей безопасности.
            </div>
          </q-banner>

          <div class="q-mt-lg">
            <q-checkbox v-model="accepted" label="Я понимаю и принимаю правила безопасности" />
          </div>
        </div>
      </q-carousel-slide>
    </q-carousel>

    <!-- Navigation buttons -->
    <div class="onboarding__footer">
      <q-btn
        v-if="currentSlide !== 'welcome'"
        flat
        color="grey"
        icon="mdi-chevron-left"
        @click="prevSlide"
      />
      <q-space />
      <q-btn
        v-if="currentSlide === 'safety'"
        :label="$t('onboarding.understand')"
        color="primary"
        unelevated
        :disable="!accepted"
        @click="complete"
      />
      <q-btn
        v-else
        :label="$t('onboarding.next')"
        color="primary"
        unelevated
        icon-right="mdi-chevron-right"
        @click="nextSlide"
      />
    </div>

    <!-- Skip button -->
    <q-btn
      :label="$t('onboarding.skip')"
      flat
      color="grey"
      class="onboarding__skip"
      @click="skip"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from 'src/stores/user.store';

const router = useRouter();
const userStore = useUserStore();

const slides = ['welcome', 'concept', 'portals', 'safety'];
const currentSlide = ref('welcome');
const accepted = ref(false);

function nextSlide() {
  const currentIndex = slides.indexOf(currentSlide.value);
  if (currentIndex < slides.length - 1) {
    currentSlide.value = slides[currentIndex + 1]!;
  }
}

function prevSlide() {
  const currentIndex = slides.indexOf(currentSlide.value);
  if (currentIndex > 0) {
    currentSlide.value = slides[currentIndex - 1]!;
  }
}

async function complete() {
  await userStore.completeOnboarding();
  void router.push('/game');
}

function skip() {
  void complete();
}
</script>

<style lang="scss" scoped>
.onboarding {
  position: relative;
  min-height: 100vh;
  background: var(--lila-bg);

  &__carousel {
    height: calc(100vh - 120px);
    background: transparent;
  }

  &__slide {
    padding: var(--space-xl);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__content {
    max-width: 400px;
    text-align: center;
  }

  &__demo {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__board-preview {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }

  &__cell {
    width: 24px;
    height: 24px;
    background: var(--lila-surface);
    border: 1px solid var(--lila-border);
    border-radius: 4px;
  }

  &__footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    padding: var(--space-lg);
    padding-bottom: calc(var(--space-lg) + env(safe-area-inset-bottom));
    background: var(--lila-bg);
  }

  &__skip {
    position: fixed;
    top: var(--space-md);
    right: var(--space-md);
    top: calc(var(--space-md) + env(safe-area-inset-top));
  }
}

.bg-warning-light {
  background: rgba(245, 158, 11, 0.15) !important;
}
</style>
