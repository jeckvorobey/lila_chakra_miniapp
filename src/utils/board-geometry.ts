import { CHAKRA_ROWS, CELLS_PER_ROW } from 'src/data/game-constants';

export interface GridCoords {
  col: number;
  row: number;
}

export interface CellPosition {
  x: number;
  y: number;
}

const GRID_GAP_PX = 2;
const MIN_CELL_ID = 1;
const MAX_CELL_ID = CHAKRA_ROWS * CELLS_PER_ROW;

/**
 * Возвращает уровень чакры (1-8) для ID клетки.
 * Единственный источник этой логики — используется везде вместо inline Math.ceil.
 */
export function cellIdToChakraLevel(cellId: number): number {
  if (cellId <= 0) return 0;
  return Math.ceil(cellId / CELLS_PER_ROW);
}

/**
 * Конвертирует ID клетки в координаты сетки доски.
 */
export function cellIdToGridCoords(cellId: number): GridCoords {
  if (cellId < MIN_CELL_ID || cellId > MAX_CELL_ID) {
    throw new Error(`Некорректный cellId: ${cellId}`);
  }

  const chakraLevel = cellIdToChakraLevel(cellId);
  const posInRow = (cellId - 1) % CELLS_PER_ROW;
  const row = CHAKRA_ROWS - chakraLevel;
  const col = chakraLevel % 2 === 0
    ? CELLS_PER_ROW - 1 - posInRow
    : posInRow;

  return { col, row };
}

/**
 * Возвращает пиксельные координаты центра клетки относительно контейнера сетки.
 */
export function getCellPixelPosition(cellId: number, gridEl: HTMLElement): CellPosition {
  const { col, row } = cellIdToGridCoords(cellId);
  const rect = gridEl.getBoundingClientRect();

  const totalHGap = (CELLS_PER_ROW - 1) * GRID_GAP_PX;
  const totalVGap = (CHAKRA_ROWS - 1) * GRID_GAP_PX;

  const cellWidth = (rect.width - totalHGap) / CELLS_PER_ROW;
  const cellHeight = (rect.height - totalVGap) / CHAKRA_ROWS;

  return {
    x: col * (cellWidth + GRID_GAP_PX) + cellWidth / 2,
    y: row * (cellHeight + GRID_GAP_PX) + cellHeight / 2,
  };
}
