import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useTransitionAnimation } from 'src/composables/useTransitionAnimation';

function createMockAnimation(autoFinish = true) {
  let resolveFinished!: () => void;
  const finished = new Promise<void>((resolve) => {
    resolveFinished = resolve;
  });

  const animation = {
    finished,
    cancel: vi.fn(),
    finish: () => resolveFinished(),
  };

  if (autoFinish) {
    resolveFinished();
  }

  return animation;
}

function createSvgPath() {
  const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pathEl.getTotalLength = vi.fn(() => 100);
  pathEl.getPointAtLength = vi.fn((length: number) => new DOMPoint(length, 200 - length));
  return pathEl;
}

function setupElements(autoFinish = true) {
  const pathEl = createSvgPath();
  const overlayEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const chipEl = document.createElement('div');

  const pathAnimation = createMockAnimation(autoFinish);
  const chipAnimation = createMockAnimation(autoFinish);
  const fadeAnimation = createMockAnimation(autoFinish);

  (pathEl as unknown as { animate: unknown }).animate = vi.fn(() => pathAnimation);
  (chipEl as unknown as { animate: unknown }).animate = vi.fn(() => chipAnimation);
  (overlayEl as unknown as { animate: unknown }).animate = vi.fn(() => fadeAnimation);

  return {
    pathEl,
    overlayEl,
    chipEl,
    pathAnimation,
    chipAnimation,
    fadeAnimation,
  };
}

describe('useTransitionAnimation', () => {
  it('возвращает начальную фазу idle', () => {
    const { phase, progress } = useTransitionAnimation();
    expect(phase.value).toBe('idle');
    expect(progress.value).toBe(0);
  });

  it('для стрелы запускает 3 фазы с корректными таймингами', async () => {
    const { phase, progress, animate } = useTransitionAnimation();
    const els = setupElements(true);

    await animate({
      type: 'arrow',
      startPos: { x: 10, y: 10 },
      endPos: { x: 90, y: 90 },
      pathEl: ref(els.pathEl),
      overlayEl: ref(els.overlayEl),
      chipEl: ref(els.chipEl),
    });

    expect(phase.value).toBe('idle');
    expect(progress.value).toBe(1);

    const [, pathOptions] = (els.pathEl.animate as ReturnType<typeof vi.fn>).mock.calls[0]!;
    const [, chipOptions] = (els.chipEl.animate as ReturnType<typeof vi.fn>).mock.calls[0]!;
    const [, fadeOptions] = (els.overlayEl.animate as ReturnType<typeof vi.fn>).mock.calls[0]!;

    expect((pathOptions as KeyframeAnimationOptions).duration).toBe(600);
    expect((chipOptions as KeyframeAnimationOptions).duration).toBe(800);
    expect((fadeOptions as KeyframeAnimationOptions).duration).toBe(400);
  });

  it('для змеи двигает фишку по пути от стартовой клетки к целевой', async () => {
    const { animate } = useTransitionAnimation();
    const els = setupElements(true);

    await animate({
      type: 'snake',
      startPos: { x: 80, y: 20 },
      endPos: { x: 10, y: 120 },
      pathEl: ref(els.pathEl),
      overlayEl: ref(els.overlayEl),
      chipEl: ref(els.chipEl),
    });

    const [chipKeyframes, chipOptions] = (els.chipEl.animate as ReturnType<typeof vi.fn>).mock
      .calls[0]!;
    const frames = chipKeyframes as Keyframe[];

    expect((chipOptions as KeyframeAnimationOptions).duration).toBe(1000);
    expect((frames[0]?.transform as string).includes('0px')).toBe(true);
    expect((frames[frames.length - 1]?.transform as string).includes('100px')).toBe(true);
  });

  it('stop отменяет активные анимации', async () => {
    const { animate, stop, phase, progress } = useTransitionAnimation();
    const els = setupElements(false);

    const promise = animate({
      type: 'arrow',
      startPos: { x: 10, y: 10 },
      endPos: { x: 90, y: 90 },
      pathEl: ref(els.pathEl),
      overlayEl: ref(els.overlayEl),
      chipEl: ref(els.chipEl),
    });

    stop();
    els.pathAnimation.finish();
    await promise;

    expect(els.pathAnimation.cancel).toHaveBeenCalled();
    expect(phase.value).toBe('idle');
    expect(progress.value).toBe(0);
  });
});
