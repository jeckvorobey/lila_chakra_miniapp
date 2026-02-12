import { ref, type Ref } from 'vue';

export type DicePhase = 'idle' | 'looping' | 'landing';

interface UseDiceAnimationOptions {
  diceEl: Ref<HTMLElement | null>;
}

/** Углы вращения для отображения каждой грани кубика */
const FACE_ANGLES: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
  5: { x: 0, y: 90 },
  6: { x: 180, y: 0 },
};

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

export function useDiceAnimation({ diceEl }: UseDiceAnimationOptions) {
  const phase = ref<DicePhase>('idle');
  let loopAnimation: Animation | null = null;
  let landingAnimation: Animation | null = null;

  /** Бесконечная loop-анимация — хаотичное вращение пока ждём ответ API */
  function startLoop(): void {
    const el = diceEl.value;
    if (!el) return;

    cancelAll();

    const keyframes: Keyframe[] = [
      { transform: 'rotateX(0deg) rotateY(0deg) rotateZ(0deg)', offset: 0 },
      { transform: 'rotateX(120deg) rotateY(240deg) rotateZ(60deg)', offset: 0.25 },
      { transform: 'rotateX(240deg) rotateY(120deg) rotateZ(180deg)', offset: 0.5 },
      { transform: 'rotateX(360deg) rotateY(360deg) rotateZ(360deg)', offset: 1 },
    ];

    loopAnimation = el.animate(keyframes, {
      duration: 800,
      iterations: Infinity,
      easing: 'linear',
    });

    phase.value = 'looping';
  }

  /**
   * Финальная анимация приземления на конкретную грань.
   * Отменяет loop, проигрывает подброс→падение→bounce→settle.
   */
  async function landOnFace(face: number): Promise<void> {
    const el = diceEl.value;
    if (!el) return;

    // Отменить loop
    if (loopAnimation) {
      loopAnimation.cancel();
      loopAnimation = null;
    }

    phase.value = 'landing';

    const target = FACE_ANGLES[face] ?? { x: 0, y: 0 };

    // Рандомизация для уникальности каждого броска
    const extraSpins = randInt(2, 3); // 2-3 полных оборота перед финалом
    const launchHeight = rand(100, 140); // высота подброса
    const wobbleDeg = rand(2, 5); // wobble при settle

    const finalX = target.x + 360 * extraSpins;
    const finalY = target.y + 360 * extraSpins;

    const keyframes: Keyframe[] = [
      // Start — текущая позиция (начинаем с нуля)
      {
        transform: 'translateY(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
        offset: 0,
      },
      // Launch (0–30%): подброс вверх + быстрое вращение
      {
        transform: `translateY(-${launchHeight}px) rotateX(${finalX * 0.4}deg) rotateY(${finalY * 0.4}deg) rotateZ(45deg)`,
        offset: 0.3,
        easing: 'cubic-bezier(0.33, 1, 0.68, 1)',
      },
      // Descent (30–60%): падение + замедление
      {
        transform: `translateY(-${launchHeight * 0.3}px) rotateX(${finalX * 0.75}deg) rotateY(${finalY * 0.75}deg) rotateZ(20deg)`,
        offset: 0.6,
        easing: 'cubic-bezier(0.33, 0, 0.67, 1)',
      },
      // First bounce (60–72%): отскок ~15px
      {
        transform: `translateY(0px) rotateX(${finalX * 0.9}deg) rotateY(${finalY * 0.9}deg) rotateZ(10deg)`,
        offset: 0.68,
      },
      {
        transform: `translateY(-15px) rotateX(${finalX * 0.93}deg) rotateY(${finalY * 0.93}deg) rotateZ(5deg)`,
        offset: 0.72,
      },
      // Second bounce (72–85%): мелкий отскок ~4px
      {
        transform: `translateY(0px) rotateX(${finalX * 0.97}deg) rotateY(${finalY * 0.97}deg) rotateZ(2deg)`,
        offset: 0.8,
      },
      {
        transform: `translateY(-4px) rotateX(${finalX * 0.98}deg) rotateY(${finalY * 0.98}deg) rotateZ(1deg)`,
        offset: 0.85,
      },
      // Settle (85–100%): wobble → финальная позиция
      {
        transform: `translateY(0px) rotateX(${finalX + wobbleDeg}deg) rotateY(${finalY - wobbleDeg}deg) rotateZ(-${wobbleDeg * 0.5}deg)`,
        offset: 0.92,
      },
      {
        transform: `translateY(0px) rotateX(${target.x}deg) rotateY(${target.y}deg) rotateZ(0deg)`,
        offset: 1,
      },
    ];

    landingAnimation = el.animate(keyframes, {
      duration: 1400,
      easing: 'linear', // easing задан на отдельных keyframe'ах
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
