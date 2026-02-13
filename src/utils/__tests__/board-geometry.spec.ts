import { describe, expect, it } from 'vitest';
import { cellIdToGridCoords, getCellPixelPosition } from 'src/utils/board-geometry';

describe('board-geometry', () => {
  describe('cellIdToGridCoords', () => {
    it.each([
      { cellId: 1, expected: { col: 0, row: 7 } },
      { cellId: 9, expected: { col: 8, row: 7 } },
      { cellId: 10, expected: { col: 8, row: 6 } },
      { cellId: 18, expected: { col: 0, row: 6 } },
      { cellId: 63, expected: { col: 8, row: 1 } },
      { cellId: 72, expected: { col: 0, row: 0 } },
    ])('возвращает корректные координаты для клетки $cellId', ({ cellId, expected }) => {
      expect(cellIdToGridCoords(cellId)).toEqual(expected);
    });

    it('бросает ошибку для невалидного cellId', () => {
      expect(() => cellIdToGridCoords(0)).toThrow('Некорректный cellId');
      expect(() => cellIdToGridCoords(73)).toThrow('Некорректный cellId');
    });
  });

  describe('getCellPixelPosition', () => {
    it('возвращает центр клетки в пикселях с учетом gap', () => {
      const gridEl = document.createElement('div');
      gridEl.getBoundingClientRect = () =>
        ({
          width: 898,
          height: 798,
        }) as DOMRect;

      expect(getCellPixelPosition(1, gridEl)).toEqual({ x: 49, y: 749 });
      expect(getCellPixelPosition(10, gridEl)).toEqual({ x: 849, y: 649 });
      expect(getCellPixelPosition(72, gridEl)).toEqual({ x: 49, y: 49 });
    });
  });
});
