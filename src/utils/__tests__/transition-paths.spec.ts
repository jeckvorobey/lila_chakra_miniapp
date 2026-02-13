import { describe, expect, it } from 'vitest';
import {
  createArrowHead,
  createArrowPath,
  createSnakePath,
  getPointOnPath,
} from 'src/utils/transition-paths';

describe('transition-paths', () => {
  it('createArrowPath строит путь прямой линии', () => {
    const path = createArrowPath({ x: 10, y: 20 }, { x: 30, y: 40 });
    expect(path).toBe('M 10 20 L 30 40');
  });

  it('createArrowHead строит замкнутый треугольник', () => {
    const head = createArrowHead({ x: 100, y: 100 }, { x: 80, y: 80 }, 8);
    expect(head.startsWith('M 100 100 L')).toBe(true);
    expect(head.endsWith('Z')).toBe(true);
  });

  it('createSnakePath строит синусоидальный путь через Q-кривые', () => {
    const snakePath = createSnakePath({ x: 10, y: 120 }, { x: 210, y: 20 }, 4);
    expect(snakePath.startsWith('M 10 120')).toBe(true);
    expect(snakePath.match(/Q/g)?.length).toBe(4);
  });

  it('createSnakePath возвращает точку при нулевой дистанции', () => {
    const snakePath = createSnakePath({ x: 10, y: 20 }, { x: 10, y: 20 });
    expect(snakePath).toBe('M 10 20');
  });

  it('getPointOnPath ограничивает прогресс диапазоном 0..1', () => {
    const pathEl = {
      getTotalLength: () => 100,
      getPointAtLength: (length: number) => ({ x: length, y: length * 2 }),
    } as unknown as SVGPathElement;

    expect(getPointOnPath(pathEl, -1)).toEqual({ x: 0, y: 0 });
    expect(getPointOnPath(pathEl, 0.25)).toEqual({ x: 25, y: 50 });
    expect(getPointOnPath(pathEl, 2)).toEqual({ x: 100, y: 200 });
  });
});
