<template>
  <q-page class="onboarding">
    <div class="onboarding__topbar q-px-md q-pt-sm">
      <q-space />
      <l-theme-toggle />
    </div>

    <q-carousel
      v-model="currentSlide"
      animated
      control-color="primary"
      class="onboarding__carousel"
    >
      <q-carousel-slide
        v-for="slide in slides"
        :key="slide.name"
        :name="slide.name"
        class="onboarding__slide"
      >
        <div class="onboarding__content q-px-sm q-px-md-sm">
          <div
            v-if="slide.name === 'transitions'"
            class="row justify-center items-center q-gutter-lg q-mb-md"
          >
            <q-icon
              name="mdi-arrow-up-bold"
              size="56px"
              color="positive"
            />
            <q-icon
              name="mdi-snake"
              size="56px"
              color="negative"
            />
          </div>
          <q-icon
            v-else
            :name="slide.icon"
            size="72px"
            :color="slide.iconColor"
            class="q-mb-md"
          />
          <h1 class="text-h5 text-weight-bold q-mb-sm">{{ $t(slide.titleKey) }}</h1>
          <p class="text-body1 text-secondary q-mb-md">{{ $t(slide.descKey) }}</p>

          <template v-if="slide.name === 'modes'">
            <q-card
              v-for="mode in modeCards"
              :key="mode.titleKey"
              flat
              bordered
              class="onboarding__mode-card q-mb-sm"
            >
              <q-card-section class="q-pa-md">
                <div class="row items-center justify-between q-gutter-sm">
                  <div class="text-subtitle2 text-weight-medium">{{ $t(mode.titleKey) }}</div>
                  <q-badge
                    color="primary"
                    text-color="white"
                    class="text-weight-medium"
                  >
                    {{ $t(mode.priceKey) }}
                  </q-badge>
                </div>
                <p class="text-caption text-secondary q-mt-sm q-mb-none">
                  {{ $t(mode.descKey) }}
                </p>
              </q-card-section>
            </q-card>
          </template>

          <q-list
            v-else
            class="q-mt-sm q-px-xs"
          >
            <q-item
              v-for="(point, pointIndex) in slide.points"
              :key="point"
              class="onboarding__list-item q-px-sm"
            >
              <q-item-section
                v-if="slide.points.length > 0"
                avatar
              >
                <q-icon
                  :name="getPointIcon(slide.name, pointIndex).name"
                  :color="getPointIcon(slide.name, pointIndex).color"
                  size="22px"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-body2">{{ $t(point) }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

          <div
            v-if="slide.name === 'accept'"
            class="q-mt-md"
          >
            <q-checkbox
              v-model="accepted"
              :label="$t('onboarding.accept_checkbox')"
            />
          </div>
        </div>
      </q-carousel-slide>
    </q-carousel>

    <div class="onboarding__footer q-px-md q-pt-sm q-pb-xl">
      <q-btn
        v-if="!isFirstSlide"
        outline
        color="grey-7"
        icon="mdi-chevron-left"
        :label="$t('onboarding.back')"
        data-testid="onboarding-back"
        @click="prevSlide"
      />
      <q-space />
      <q-btn
        v-if="isLastSlide"
        :label="$t('onboarding.accept_button')"
        color="primary"
        unelevated
        :disable="!accepted"
        data-testid="onboarding-accept"
        @click="complete"
      />
      <q-btn
        v-else
        :label="$t('onboarding.next')"
        color="primary"
        unelevated
        icon-right="mdi-chevron-right"
        data-testid="onboarding-next"
        @click="nextSlide"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { LThemeToggle } from 'src/components/base';
import { useUserStore } from 'src/stores/user.store';

interface OnboardingSlide {
  name: string;
  icon: string;
  iconColor: string;
  titleKey: string;
  descKey: string;
  points: string[];
}

interface TransitionPointIcon {
  name: string;
  color: string;
}

type SlidePointIcons = Record<string, TransitionPointIcon[]>;

const router = useRouter();
const userStore = useUserStore();

const slides: OnboardingSlide[] = [
  {
    name: 'intro',
    icon: 'mdi-gamepad-variant',
    iconColor: 'primary',
    titleKey: 'onboarding.intro.title',
    descKey: 'onboarding.intro.description',
    points: ['onboarding.intro.point1', 'onboarding.intro.point2', 'onboarding.intro.point3'],
  },
  {
    name: 'modes',
    icon: 'mdi-account-switch',
    iconColor: 'secondary',
    titleKey: 'onboarding.modes.title',
    descKey: 'onboarding.modes.description',
    points: [],
  },
  {
    name: 'how-to-play',
    icon: 'mdi-dice-multiple',
    iconColor: 'primary',
    titleKey: 'onboarding.how_to_play.title',
    descKey: 'onboarding.how_to_play.description',
    points: [
      'onboarding.how_to_play.point1',
      'onboarding.how_to_play.point2',
      'onboarding.how_to_play.point3',
    ],
  },
  {
    name: 'transitions',
    icon: 'mdi-source-branch',
    iconColor: 'accent',
    titleKey: 'onboarding.transitions.title',
    descKey: 'onboarding.transitions.description',
    points: [
      'onboarding.transitions.point1',
      'onboarding.transitions.point2',
      'onboarding.transitions.point3',
    ],
  },
  {
    name: 'diary',
    icon: 'mdi-notebook-outline',
    iconColor: 'positive',
    titleKey: 'onboarding.diary.title',
    descKey: 'onboarding.diary.description',
    points: ['onboarding.diary.point1', 'onboarding.diary.point2', 'onboarding.diary.point3'],
  },
  {
    name: 'profile',
    icon: 'mdi-cog-outline',
    iconColor: 'warning',
    titleKey: 'onboarding.profile.title',
    descKey: 'onboarding.profile.description',
    points: ['onboarding.profile.point1', 'onboarding.profile.point2', 'onboarding.profile.point3'],
  },
  {
    name: 'accept',
    icon: 'mdi-shield-check',
    iconColor: 'warning',
    titleKey: 'onboarding.accept.title',
    descKey: 'onboarding.accept.description',
    points: ['onboarding.accept.point1', 'onboarding.accept.point2', 'onboarding.accept.point3'],
  },
];

const modeCards = [
  {
    titleKey: 'onboarding.modes.free.title',
    descKey: 'onboarding.modes.free.description',
    priceKey: 'onboarding.modes.free.price',
  },
  {
    titleKey: 'onboarding.modes.ai.title',
    descKey: 'onboarding.modes.ai.description',
    priceKey: 'onboarding.modes.ai.price',
  },
  {
    titleKey: 'onboarding.modes.incognito.title',
    descKey: 'onboarding.modes.incognito.description',
    priceKey: 'onboarding.modes.incognito.price',
  },
];

const transitionPointIcons: TransitionPointIcon[] = [
  { name: 'mdi-arrow-up-bold', color: 'positive' },
  { name: 'mdi-snake', color: 'negative' },
  { name: 'mdi-head-cog-outline', color: 'primary' },
];

const slidePointIcons: SlidePointIcons = {
  intro: [
    { name: 'mdi-star-four-points-outline', color: 'secondary' },
    { name: 'mdi-compass-outline', color: 'primary' },
    { name: 'mdi-rocket-launch-outline', color: 'accent' },
  ],
  'how-to-play': [
    { name: 'mdi-dice-multiple', color: 'primary' },
    { name: 'mdi-hand-back-right-outline', color: 'secondary' },
    { name: 'mdi-numeric-6-circle', color: 'warning' },
  ],
  transitions: transitionPointIcons,
  diary: [
    { name: 'mdi-timeline-clock-outline', color: 'primary' },
    { name: 'mdi-lightbulb-on-outline', color: 'warning' },
    { name: 'mdi-chart-line', color: 'positive' },
  ],
  profile: [
    { name: 'mdi-volume-high', color: 'primary' },
    { name: 'mdi-dice-6', color: 'secondary' },
    { name: 'mdi-palette-outline', color: 'accent' },
  ],
  accept: [
    { name: 'mdi-shield-check-outline', color: 'warning' },
    { name: 'mdi-timer-sand', color: 'secondary' },
    { name: 'mdi-play-circle-outline', color: 'primary' },
  ],
};

function getPointIcon(slideName: string, pointIndex: number): TransitionPointIcon {
  const icon = slidePointIcons[slideName]?.[pointIndex];
  return icon ?? { name: 'mdi-circle-medium', color: 'grey-6' };
}

const currentSlide = ref(slides[0]!.name);
const accepted = ref(false);

const currentIndex = computed(() => slides.findIndex((item) => item.name === currentSlide.value));
const isFirstSlide = computed(() => currentIndex.value === 0);
const isLastSlide = computed(() => currentIndex.value === slides.length - 1);

function nextSlide() {
  const nextIndex = currentIndex.value + 1;
  if (nextIndex < slides.length) {
    currentSlide.value = slides[nextIndex]!.name;
  }
}

function prevSlide() {
  const prevIndex = currentIndex.value - 1;
  if (prevIndex >= 0) {
    currentSlide.value = slides[prevIndex]!.name;
  }
}

async function complete() {
  if (!accepted.value) {
    return;
  }
  await userStore.completeOnboarding();
  void router.push('/game');
}
</script>

<style lang="scss" scoped>
.onboarding {
  min-height: 100vh;
  background: var(--lila-bg);

  &__topbar {
    position: fixed;
    top: calc(env(safe-area-inset-top) + 4px);
    left: 0;
    right: 0;
    z-index: 10;
    display: flex;
    justify-content: flex-end;
    pointer-events: none;

    :deep(.q-btn) {
      pointer-events: auto;
    }
  }

  &__carousel {
    height: calc(100vh - 112px);
    background: transparent;
  }

  &__slide {
    padding: var(--space-xl);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__content {
    max-width: 440px;
    width: 100%;
    text-align: center;
  }

  &__list-item {
    padding-left: 0;
    padding-right: 0;
    text-align: left;
  }

  &__mode-card {
    text-align: left;
  }

  &__footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    background: var(--lila-bg);
  }
}
</style>
