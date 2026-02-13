/**
 * Константы игры Лила Чакра.
 * Чистые данные без зависимостей - безопасны для тестирования.
 *
 * Данные о стрелах (ARROWS) и змеях (SNAKES) загружаются с API
 * через reference.store.ts (arrowsMap, snakesMap).
 */

// Размеры доски
export const WINNING_CELL = 68;
export const CHAKRA_ROWS = 8;
export const CELLS_PER_ROW = 9;

// Клетки зоны ожидания (69-71)
export const WAITING_ZONE = new Set([69, 70, 71]);
