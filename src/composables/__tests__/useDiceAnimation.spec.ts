import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { useDiceAnimation } from '../useDiceAnimation';

// Маппинг граней → финальные углы (из LDice.vue)
const FACE_ANGLES: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: 90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
  5: { x: 0, y: -90 },
  6: { x: 180, y: 0 },
};

function createMockAnimation(autoFinish = true) {
  let resolveFinished: () => void;
  const finishedPromise = new Promise<void>((resolve) => {
    resolveFinished = resolve;
  });

  const mockAnim = {
    finished: finishedPromise,
    cancel: vi.fn(),
    commitStyles: vi.fn(),
    finish: () => {
      resolveFinished();
    },
  };

  if (autoFinish) {
    // Завершить анимацию автоматически
    resolveFinished!();
  }

  return mockAnim;
}

describe('useDiceAnimation', () => {
  let animateMock: ReturnType<typeof vi.fn>;
  let diceEl: HTMLDivElement;

  beforeEach(() => {
    diceEl = document.createElement('div');
    animateMock = vi.fn(() => createMockAnimation(true));
    diceEl.animate = animateMock as unknown as typeof diceEl.animate;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function setup() {
    const elRef = ref<HTMLElement | null>(diceEl);
    return useDiceAnimation({ diceEl: elRef });
  }

  describe('начальное состояние', () => {
    it('phase начинается с idle', () => {
      const { phase } = setup();
      expect(phase.value).toBe('idle');
    });
  });

  describe('startLoop', () => {
    it('вызывает element.animate с iterations: Infinity', () => {
      const { startLoop } = setup();
      startLoop();

      expect(animateMock).toHaveBeenCalledOnce();
      const [, options] = animateMock.mock.calls[0]!;
      expect((options as KeyframeAnimationOptions).iterations).toBe(Infinity);
    });

    it('устанавливает phase в looping', () => {
      const { startLoop, phase } = setup();
      startLoop();
      expect(phase.value).toBe('looping');
    });

    it('не падает если элемент не задан', () => {
      const elRef = ref<HTMLElement | null>(null);
      const { startLoop } = useDiceAnimation({ diceEl: elRef });
      expect(() => startLoop()).not.toThrow();
    });
  });

  describe('landOnFace', () => {
    it('отменяет loop-анимацию и запускает landing', async () => {
      const loopAnim = createMockAnimation(false);
      const landAnim = createMockAnimation(true);
      let callCount = 0;
      animateMock.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? loopAnim : landAnim;
      });

      const { startLoop, landOnFace } = setup();
      startLoop();

      expect(loopAnim.cancel).not.toHaveBeenCalled();

      await landOnFace(3);

      expect(loopAnim.cancel).toHaveBeenCalled();
    });

    it.each([1, 2, 3, 4, 5, 6])(
      'грань %i — финальный keyframe содержит правильные углы',
      async (face) => {
        const { landOnFace } = setup();
        await landOnFace(face);

        expect(animateMock).toHaveBeenCalled();

        // Последний вызов animate — это landing
        const lastCall = animateMock.mock.calls[animateMock.mock.calls.length - 1]!;
        const keyframes = lastCall[0] as Keyframe[];
        const lastKeyframe = keyframes[keyframes.length - 1]!;
        const transform = lastKeyframe.transform as string;

        // Финальные углы содержат extraSpins (полные обороты),
        // поэтому проверяем конгруэнтность mod 360
        const expected = FACE_ANGLES[face]!;
        const normalize = (deg: number) => ((deg % 360) + 360) % 360;

        const xMatch = transform.match(/rotateX\((-?[\d.]+)deg\)/);
        const yMatch = transform.match(/rotateY\((-?[\d.]+)deg\)/);
        expect(xMatch).not.toBeNull();
        expect(yMatch).not.toBeNull();

        expect(normalize(Number(xMatch![1]))).toBeCloseTo(normalize(expected.x), 0);
        expect(normalize(Number(yMatch![1]))).toBeCloseTo(normalize(expected.y), 0);
      },
    );

    it('устанавливает phase в landing, затем idle после завершения', async () => {
      const landAnim = createMockAnimation(false);
      animateMock.mockReturnValue(landAnim);

      const { landOnFace, phase } = setup();
      const promise = landOnFace(4);

      expect(phase.value).toBe('landing');

      landAnim.finish();
      await promise;

      expect(phase.value).toBe('idle');
    });

    it('resolve Promise после завершения анимации', async () => {
      const landAnim = createMockAnimation(false);
      animateMock.mockReturnValue(landAnim);

      const { landOnFace } = setup();

      let resolved = false;
      const promise = landOnFace(2).then(() => {
        resolved = true;
      });

      // Promise ещё не разрешён
      await nextTick();
      expect(resolved).toBe(false);

      // Завершаем анимацию
      landAnim.finish();
      await promise;
      expect(resolved).toBe(true);
    });

    it('устанавливает inline transform после завершения', async () => {
      const { landOnFace } = setup();
      await landOnFace(5);

      // Проверяем что transform установлен на элементе
      expect(diceEl.style.transform).toContain('rotateX(0deg)');
      expect(diceEl.style.transform).toContain('rotateY(-90deg)');
    });
  });

  describe('stop', () => {
    it('отменяет все активные анимации', () => {
      const anim = createMockAnimation(false);
      animateMock.mockReturnValue(anim);

      const { startLoop, stop } = setup();
      startLoop();
      stop();

      expect(anim.cancel).toHaveBeenCalled();
    });

    it('устанавливает phase в idle', () => {
      const anim = createMockAnimation(false);
      animateMock.mockReturnValue(anim);

      const { startLoop, stop, phase } = setup();
      startLoop();
      expect(phase.value).toBe('looping');

      stop();
      expect(phase.value).toBe('idle');
    });
  });

  describe('lifecycle фаз', () => {
    it('idle → looping → landing → idle', async () => {
      const loopAnim = createMockAnimation(false);
      const landAnim = createMockAnimation(false);
      let callCount = 0;
      animateMock.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? loopAnim : landAnim;
      });

      const { startLoop, landOnFace, phase } = setup();

      expect(phase.value).toBe('idle');

      startLoop();
      expect(phase.value).toBe('looping');

      const promise = landOnFace(6);
      expect(phase.value).toBe('landing');

      landAnim.finish();
      await promise;
      expect(phase.value).toBe('idle');
    });
  });
});
