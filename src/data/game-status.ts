import type { GameStatus } from 'src/types/game.interface';

/**
 * Статусы, при которых игра считается активной.
 */
export const ACTIVE_GAME_STATUSES: ReadonlySet<GameStatus> = new Set([
  'waiting_for_6',
  'in_progress',
  'in_waiting_zone',
]);

/**
 * Проверяет, является ли статус активным.
 */
export function isActiveGameStatus(status: GameStatus): boolean {
  return ACTIVE_GAME_STATUSES.has(status);
}
