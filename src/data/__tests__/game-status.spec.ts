import { describe, expect, it } from 'vitest';
import { isActiveGameStatus } from 'src/data/game-status';
import type { GameStatus } from 'src/types/game.interface';

describe('isActiveGameStatus', () => {
  it.each<GameStatus>(['waiting_for_6', 'in_progress', 'in_waiting_zone'])(
    'возвращает true для активного статуса %s',
    (status) => {
      expect(isActiveGameStatus(status)).toBe(true);
    },
  );

  it.each<GameStatus>(['completed', 'abandoned'])(
    'возвращает false для неактивного статуса %s',
    (status) => {
      expect(isActiveGameStatus(status)).toBe(false);
    },
  );
});
