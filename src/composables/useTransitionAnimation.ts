import { ref, type Ref } from 'vue';
import type { CellPosition } from 'src/utils/board-geometry';
import { getPointOnPath } from 'src/utils/transition-paths';

export type TransitionPhase = 'idle' | 'path-growing' | 'chip-moving' | 'fading';

export interface TransitionAnimationConfig {
  type: 'arrow' | 'snake';
  startPos: CellPosition;
  endPos: CellPosition;
  pathEl: Ref<SVGPathElement | null>;
  overlayEl: Ref<SVGSVGElement | null>;
  chipEl: Ref<HTMLElement | null>;
}

const PATH_GROWING_DURATION_MS: Record<'arrow' | 'snake', number> = {
  arrow: 600,
  snake: 1200,
};

const CHIP_MOVING_DURATION_MS: Record<'arrow' | 'snake', number> = {
  arrow: 800,
  snake: 1000,
};

const PATH_EASING: Record<'arrow' | 'snake', string> = {
  arrow: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
  snake: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
};

const CHIP_KEYFRAMES = 60;
const FADE_DURATION_MS = 400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function useTransitionAnimation() {
  const phase = ref<TransitionPhase>('idle');
  const progress = ref(0);

  let activeAnimations: Animation[] = [];
  let runToken = 0;

  async function animate(config: TransitionAnimationConfig): Promise<void> {
    const pathEl = config.pathEl.value;
    const overlayEl = config.overlayEl.value;
    const chipEl = config.chipEl.value;

    if (!pathEl || !overlayEl || !chipEl) {
      phase.value = 'idle';
      progress.value = 0;
      return;
    }

    stop();
    const token = runToken;

    phase.value = 'path-growing';
    progress.value = 0;

    const pathLength = pathEl.getTotalLength();
    pathEl.style.strokeDasharray = `${pathLength}`;
    pathEl.style.strokeDashoffset = `${pathLength}`;
    pathEl.style.opacity = '1';
    overlayEl.style.opacity = '1';

    try {
      await playAnimation(pathEl, [{ strokeDashoffset: pathLength }, { strokeDashoffset: 0 }], {
        duration: PATH_GROWING_DURATION_MS[config.type],
        easing: PATH_EASING[config.type],
        fill: 'forwards',
      });

      ensureToken(token);
      progress.value = 1;
      phase.value = 'chip-moving';

      const chipKeyframes = createChipKeyframes(pathEl, 0, 1);

      await playAnimation(chipEl, chipKeyframes, {
        duration: CHIP_MOVING_DURATION_MS[config.type],
        easing: 'ease-in-out',
        fill: 'forwards',
      });

      ensureToken(token);
      progress.value = 1;
      phase.value = 'fading';

      await playAnimation(overlayEl, [{ opacity: 1 }, { opacity: 0 }], {
        duration: FADE_DURATION_MS,
        easing: 'ease-out',
        fill: 'forwards',
      });

      ensureToken(token);
      progress.value = 1;
    } catch {
      // Игнорируем отмену анимаций при stop()
    } finally {
      if (token === runToken) {
        phase.value = 'idle';
      }
    }
  }

  function stop(): void {
    runToken += 1;
    for (const animation of activeAnimations) {
      animation.cancel();
    }
    activeAnimations = [];
    phase.value = 'idle';
    progress.value = 0;
  }

  function ensureToken(token: number): void {
    if (token !== runToken) {
      throw new Error('Анимация прервана');
    }
  }

  function createChipKeyframes(
    pathEl: SVGPathElement,
    startProgress: number,
    endProgress: number,
  ): Keyframe[] {
    const keyframes: Keyframe[] = [];

    for (let frame = 0; frame <= CHIP_KEYFRAMES; frame += 1) {
      const t = frame / CHIP_KEYFRAMES;
      const pathProgress = startProgress + (endProgress - startProgress) * t;
      const point = getPointOnPath(pathEl, pathProgress);

      keyframes.push({
        offset: t,
        transform: `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`,
      });
    }

    return keyframes;
  }

  async function playAnimation(
    el: Element,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions,
  ): Promise<void> {
    const duration = Number(options.duration ?? 0);
    if (typeof el.animate !== 'function') {
      if (duration > 0) {
        await sleep(duration);
      }
      return;
    }

    const animation = el.animate(keyframes, options);
    activeAnimations.push(animation);

    try {
      await animation.finished;
    } finally {
      activeAnimations = activeAnimations.filter((item) => item !== animation);
    }
  }

  return {
    phase,
    progress,
    animate,
    stop,
  };
}
