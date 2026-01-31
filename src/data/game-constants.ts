/**
 * Константы игры Лила Чакра.
 * Чистые данные без зависимостей - безопасны для тестирования.
 */

// Стрелы (добродетели) - поднимают игрока вверх
export const ARROWS: Record<number, number> = {
  10: 23,
  17: 69,
  20: 32,
  22: 60,
  27: 41,
  28: 50,
  37: 66,
  45: 67,
  46: 62,
};

// Змеи (пороки) - опускают игрока вниз
export const SNAKES: Record<number, number> = {
  12: 8,
  16: 4,
  24: 7,
  29: 6,
  44: 9,
  52: 35,
  55: 3,
  61: 13,
  63: 2,
  72: 51,
};

// Размеры доски
export const WINNING_CELL = 68;
export const MAX_CELL = 72;
export const CHAKRA_ROWS = 8;
export const CELLS_PER_ROW = 9;

// Клетки зоны ожидания (69-71)
export const WAITING_ZONE = new Set([69, 70, 71]);
