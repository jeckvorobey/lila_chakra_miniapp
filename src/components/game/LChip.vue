<template>
  <div
    class="l-chip"
    :class="{
      'l-chip--moving': isMoving,
      'l-chip--arrow': transitionType === 'arrow',
      'l-chip--snake': transitionType === 'snake',
    }"
  >
    <!-- Crystal SVG -->
    <svg class="l-chip__crystal" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="crystalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" :stop-color="gradientStart" />
          <stop offset="100%" :stop-color="gradientEnd" />
        </linearGradient>
        <filter id="crystalGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <!-- Crystal shape -->
      <polygon
        class="l-chip__shape"
        points="16,0 32,12 28,40 4,40 0,12"
        fill="url(#crystalGradient)"
        filter="url(#crystalGlow)"
      />

      <!-- Inner highlight -->
      <polygon
        class="l-chip__highlight"
        points="16,4 26,12 24,32 8,32 6,12"
        fill="rgba(255,255,255,0.2)"
      />

      <!-- Sparkle points -->
      <circle class="l-chip__sparkle l-chip__sparkle--1" cx="10" cy="15" r="1" fill="white" />
      <circle class="l-chip__sparkle l-chip__sparkle--2" cx="22" cy="20" r="1.2" fill="white" />
      <circle class="l-chip__sparkle l-chip__sparkle--3" cx="14" cy="28" r="0.8" fill="white" />
      <circle class="l-chip__sparkle l-chip__sparkle--4" cx="20" cy="10" r="1" fill="white" />
    </svg>

    <!-- Particle effects during transitions -->
    <div v-if="isMoving" class="l-chip__particles">
      <span v-for="i in 6" :key="i" class="l-chip__particle" :style="particleStyle(i)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type TransitionType = 'arrow' | 'snake' | null;

interface Props {
  position: number;
  color?: string;
  isMoving?: boolean;
  transitionType?: TransitionType;
}

const props = withDefaults(defineProps<Props>(), {
  color: '#6B46C1',
  isMoving: false,
  transitionType: null,
});

// Calculate chakra level from position for color
const chakraLevel = computed(() => {
  if (props.position <= 0) return 1;
  return Math.ceil(props.position / 9);
});

// Chakra colors
const chakraColors: Record<number, { start: string; end: string }> = {
  1: { start: '#DC2626', end: '#991B1B' },
  2: { start: '#EA580C', end: '#C2410C' },
  3: { start: '#FBBF24', end: '#D97706' },
  4: { start: '#22C55E', end: '#16A34A' },
  5: { start: '#0EA5E9', end: '#0284C7' },
  6: { start: '#4F46E5', end: '#4338CA' },
  7: { start: '#9333EA', end: '#7C3AED' },
  8: { start: '#F5F5F4', end: '#E7E5E4' },
};

const gradientStart = computed(() => {
  if (props.transitionType === 'arrow') return '#22C55E';
  if (props.transitionType === 'snake') return '#EF4444';
  return chakraColors[chakraLevel.value]?.start || props.color;
});

const gradientEnd = computed(() => {
  if (props.transitionType === 'arrow') return '#16A34A';
  if (props.transitionType === 'snake') return '#DC2626';
  return chakraColors[chakraLevel.value]?.end || props.color;
});

function particleStyle(index: number) {
  const angle = (index / 6) * 360;
  const delay = index * 0.1;

  return {
    '--particle-angle': `${angle}deg`,
    '--particle-delay': `${delay}s`,
  };
}
</script>

<style lang="scss" scoped>
.l-chip {
  position: relative;
  width: 32px;
  height: 40px;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));

  // Idle floating animation
  animation: chip-float 3s ease-in-out infinite;

  &__crystal {
    width: 100%;
    height: 100%;
  }

  &__shape {
    transition: all 0.3s ease;
  }

  &__highlight {
    opacity: 0.6;
  }

  // Sparkle animations
  &__sparkle {
    opacity: 0;
    animation: sparkle-twinkle 2s ease-in-out infinite;

    &--1 {
      animation-delay: 0s;
    }
    &--2 {
      animation-delay: 0.5s;
    }
    &--3 {
      animation-delay: 1s;
    }
    &--4 {
      animation-delay: 1.5s;
    }
  }

  // Moving state
  &--moving {
    animation: chip-move 0.8s ease-out;

    .l-chip__shape {
      filter: url(#crystalGlow);
    }
  }

  // Arrow transition (ascending)
  &--arrow {
    animation: chip-arrow 1.2s ease-out;

    .l-chip__shape {
      filter: brightness(1.2);
    }
  }

  // Snake transition (descending)
  &--snake {
    animation: chip-snake 1.5s ease-out;

    .l-chip__shape {
      filter: saturate(0.8);
    }
  }

  // Particles
  &__particles {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &__particle {
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: currentColor;
    top: 50%;
    left: 50%;
    opacity: 0;
    animation: particle-burst 0.6s ease-out var(--particle-delay) forwards;
  }
}

@keyframes chip-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@keyframes sparkle-twinkle {
  0%,
  100% {
    opacity: 0;
    transform: scale(0.5);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

@keyframes chip-move {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1) translateY(-5px);
  }
  100% {
    transform: scale(1) translateY(0);
  }
}

@keyframes chip-arrow {
  0% {
    transform: scale(1);
    filter: brightness(1);
  }
  30% {
    transform: scale(1.3) translateY(-20px);
    filter: brightness(1.5);
  }
  100% {
    transform: scale(1) translateY(0);
    filter: brightness(1);
  }
}

@keyframes chip-snake {
  0% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-15deg) translateY(5px);
  }
  50% {
    transform: rotate(15deg) translateY(10px);
  }
  75% {
    transform: rotate(-10deg) translateY(5px);
  }
  100% {
    transform: rotate(0deg) translateY(0);
  }
}

@keyframes particle-burst {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(var(--particle-angle)) translateX(0);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(var(--particle-angle)) translateX(30px);
  }
}
</style>
