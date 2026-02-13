import { ref, type Ref } from 'vue';

export type DicePhase = 'idle' | 'looping' | 'landing';

interface UseDiceAnimationOptions {
  diceEl: Ref<HTMLElement | null>;
}

/** Углы вращения для отображения каждой грани кубика */
const FACE_ANGLES: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: 90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
  5: { x: 0, y: -90 },
  6: { x: 180, y: 0 },
};

const LOOP_DURATION_MS = 900;
const LANDING_DURATION_MS = 860;

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

interface TransformConfig {
  x: number;
  y: number;
  z: number;
  tx?: number;
  ty?: number;
  scaleX?: number;
  scaleY?: number;
}

function createTransform(config: TransformConfig): string {
  const tx = config.tx ?? 0;
  const ty = config.ty ?? 0;
  const chunks = [
    `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0px)`,
    `rotateX(${config.x.toFixed(2)}deg)`,
    `rotateY(${config.y.toFixed(2)}deg)`,
    `rotateZ(${config.z.toFixed(2)}deg)`,
  ];

  if (config.scaleX !== undefined || config.scaleY !== undefined) {
    chunks.push(`scaleX(${(config.scaleX ?? 1).toFixed(2)})`);
    chunks.push(`scaleY(${(config.scaleY ?? 1).toFixed(2)})`);
  }

  return chunks.join(' ');
}

export function useDiceAnimation({ diceEl }: UseDiceAnimationOptions) {
  const phase = ref<DicePhase>('idle');
  let loopAnimation: Animation | null = null;
  let landingAnimation: Animation | null = null;

  /**
   * Бесконечная loop-анимация — органичное кувыркание,
   * пока ждём ответ API.
   */
  function startLoop(): void {
    const el = diceEl.value;
    if (!el) return;

    cancelAll();

    // Плавный цикл: подъём вверх в первой половине и мягкий спуск во второй.
    // Последний кадр замкнут (кратен 360), поэтому на повторе нет рывка.
    const keyframes: Keyframe[] = [
      { transform: createTransform({ x: 0, y: 0, z: 0, ty: 0 }), offset: 0 },
      { transform: createTransform({ x: 180, y: 270, z: 90, ty: -12 }), offset: 0.25 },
      { transform: createTransform({ x: 360, y: 540, z: 180, ty: -22 }), offset: 0.5 },
      { transform: createTransform({ x: 540, y: 810, z: 270, ty: -12 }), offset: 0.75 },
      { transform: createTransform({ x: 720, y: 1080, z: 360, ty: 0 }), offset: 1 },
    ];

    loopAnimation = el.animate(keyframes, {
      duration: LOOP_DURATION_MS,
      iterations: Infinity,
      easing: 'linear',
    });

    phase.value = 'looping';
  }

  /**
   * Финальная анимация приземления на конкретную грань.
   * Физика без подпрыгиваний:
   * небольшой подъём -> спуск -> финальное падение на целевую грань.
   * Конец анимации всегда фиксируется в точный угол целевой грани.
   */
  async function landOnFace(face: number): Promise<void> {
    const el = diceEl.value;
    if (!el) return;

    const currentTransform = getComputedStyle(el).transform;
    const startTransform =
      currentTransform !== 'none'
        ? currentTransform
        : createTransform({ x: 0, y: 0, z: 0, tx: 0, ty: 0, scaleX: 1, scaleY: 1 });

    if (loopAnimation) {
      loopAnimation.cancel();
      loopAnimation = null;
    }

    phase.value = 'landing';

    const target = FACE_ANGLES[face] ?? { x: 0, y: 0 };

    const extraSpinsX = randInt(1, 2);
    const extraSpinsY = randInt(2, 3);
    const zTwist = rand(10, 18);
    const driftX = rand(-10, 10);

    // Накопленные углы: target + полные обороты (визуально та же грань).
    const finalX = target.x + 360 * extraSpinsX;
    const finalY = target.y + 360 * extraSpinsY;

    const keyframes: Keyframe[] = [
      {
        offset: 0,
        transform: startTransform,
        easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
      {
        // Доснимаем оставшийся подъём и продолжаем вращение
        offset: 0.3,
        transform: createTransform({
          x: finalX * 0.45,
          y: finalY * 0.45,
          z: zTwist,
          tx: driftX,
          ty: -18,
        }),
        easing: 'cubic-bezier(0.4, 0, 1, 1)',
      },
      {
        // Плавный спуск без bounce
        offset: 0.72,
        transform: createTransform({
          x: finalX * 0.88,
          y: finalY * 0.88,
          z: zTwist * 0.25,
          tx: driftX * 0.35,
          ty: 8,
        }),
        easing: 'cubic-bezier(0.2, 0.9, 0.2, 1)',
      },
      {
        // Финальное "падение" и фиксация нужной грани
        offset: 1,
        transform: createTransform({
          x: finalX,
          y: finalY,
          z: 0,
          tx: 0,
          ty: 0,
        }),
      },
    ];

    landingAnimation = el.animate(keyframes, {
      duration: LANDING_DURATION_MS,
      easing: 'linear',
      fill: 'forwards',
    });

    try {
      await landingAnimation.finished;
    } catch {
      // Анимация была отменена — не ошибка
      return;
    }

    // Зафиксировать финальную позицию inline и освободить compositor
    el.style.transform = `rotateX(${target.x}deg) rotateY(${target.y}deg) rotateZ(0deg)`;
    landingAnimation.cancel();
    landingAnimation = null;
    phase.value = 'idle';
  }

  /** Отменить все активные анимации */
  function stop(): void {
    cancelAll();
    phase.value = 'idle';
  }

  function cancelAll(): void {
    if (loopAnimation) {
      loopAnimation.cancel();
      loopAnimation = null;
    }
    if (landingAnimation) {
      landingAnimation.cancel();
      landingAnimation = null;
    }
  }

  return { phase, startLoop, landOnFace, stop };
}
