/**
 * Unit tests for game logic (pure functions).
 * Tests arrows, snakes, chakras, board layout, and game rules.
 */

import { describe, it, expect } from 'vitest';
import {
  ARROWS,
  SNAKES,
  WINNING_CELL,
  MAX_CELL,
  CELLS_PER_ROW,
  WAITING_ZONE,
} from 'src/data/game-constants';

describe('Game Constants', () => {
  describe('ARROWS', () => {
    it('should have exactly 9 arrows', () => {
      expect(Object.keys(ARROWS)).toHaveLength(9);
    });

    it('all arrows should lead to higher cells', () => {
      for (const [start, end] of Object.entries(ARROWS)) {
        expect(end).toBeGreaterThan(Number(start));
      }
    });

    it('compassion arrow (17) should lead to 69', () => {
      expect(ARROWS[17]).toBe(69);
    });

    it('all arrow cells should be within 1-72', () => {
      for (const [start, end] of Object.entries(ARROWS)) {
        expect(Number(start)).toBeGreaterThanOrEqual(1);
        expect(Number(start)).toBeLessThanOrEqual(72);
        expect(end).toBeGreaterThanOrEqual(1);
        expect(end).toBeLessThanOrEqual(72);
      }
    });
  });

  describe('SNAKES', () => {
    it('should have exactly 10 snakes', () => {
      expect(Object.keys(SNAKES)).toHaveLength(10);
    });

    it('all snakes should lead to lower cells', () => {
      for (const [head, tail] of Object.entries(SNAKES)) {
        expect(tail).toBeLessThan(Number(head));
      }
    });

    it('egoism snake (55) should lead to 3', () => {
      expect(SNAKES[55]).toBe(3);
    });

    it('cell 72 trap should lead to 51', () => {
      expect(SNAKES[72]).toBe(51);
    });

    it('all snake cells should be within 1-72', () => {
      for (const [head, tail] of Object.entries(SNAKES)) {
        expect(Number(head)).toBeGreaterThanOrEqual(1);
        expect(Number(head)).toBeLessThanOrEqual(72);
        expect(tail).toBeGreaterThanOrEqual(1);
        expect(tail).toBeLessThanOrEqual(72);
      }
    });
  });

  describe('No overlap', () => {
    it('arrows and snakes should not overlap', () => {
      const arrowCells = new Set(Object.keys(ARROWS).map(Number));
      const snakeCells = new Set(Object.keys(SNAKES).map(Number));

      for (const cell of arrowCells) {
        expect(snakeCells.has(cell)).toBe(false);
      }
    });
  });

  describe('Winning cell', () => {
    it('should be 68', () => {
      expect(WINNING_CELL).toBe(68);
    });

    it('should not be an arrow start', () => {
      expect(ARROWS[WINNING_CELL]).toBeUndefined();
    });

    it('should not be a snake head', () => {
      expect(SNAKES[WINNING_CELL]).toBeUndefined();
    });
  });

  describe('Waiting zone', () => {
    it('should contain cells 69, 70, 71', () => {
      expect(WAITING_ZONE.has(69)).toBe(true);
      expect(WAITING_ZONE.has(70)).toBe(true);
      expect(WAITING_ZONE.has(71)).toBe(true);
    });

    it('should not contain winning cell 68', () => {
      expect(WAITING_ZONE.has(68)).toBe(false);
    });

    it('should not contain trap cell 72', () => {
      expect(WAITING_ZONE.has(72)).toBe(false);
    });
  });
});

describe('Chakra Level Calculation', () => {
  function getChakraLevel(cellId: number): number {
    if (cellId <= 0) return 0;
    return Math.ceil(cellId / CELLS_PER_ROW);
  }

  it('cells 1-9 should be chakra 1', () => {
    for (let cell = 1; cell <= 9; cell++) {
      expect(getChakraLevel(cell)).toBe(1);
    }
  });

  it('cells 10-18 should be chakra 2', () => {
    for (let cell = 10; cell <= 18; cell++) {
      expect(getChakraLevel(cell)).toBe(2);
    }
  });

  it('cells 64-72 should be chakra 8', () => {
    for (let cell = 64; cell <= 72; cell++) {
      expect(getChakraLevel(cell)).toBe(8);
    }
  });

  it('winning cell 68 should be in chakra 8', () => {
    expect(getChakraLevel(68)).toBe(8);
  });

  it('cell 0 (off board) should return chakra 0', () => {
    expect(getChakraLevel(0)).toBe(0);
  });
});

describe('Board Layout (Serpentine)', () => {
  function getRowCol(cell: number): { row: number; col: number } {
    const row = Math.ceil(cell / CELLS_PER_ROW);
    const posInRow = (cell - 1) % CELLS_PER_ROW;

    // Odd rows: left to right, Even rows: right to left
    const col = row % 2 === 1 ? posInRow + 1 : CELLS_PER_ROW - posInRow;

    return { row, col };
  }

  it('cell 1 should be at row 1, col 1', () => {
    const { row, col } = getRowCol(1);
    expect(row).toBe(1);
    expect(col).toBe(1);
  });

  it('cell 9 should be at row 1, col 9', () => {
    const { row, col } = getRowCol(9);
    expect(row).toBe(1);
    expect(col).toBe(9);
  });

  it('cell 10 should be at row 2, col 9 (serpentine turn)', () => {
    const { row, col } = getRowCol(10);
    expect(row).toBe(2);
    expect(col).toBe(9);
  });

  it('cell 18 should be at row 2, col 1', () => {
    const { row, col } = getRowCol(18);
    expect(row).toBe(2);
    expect(col).toBe(1);
  });

  it('cell 68 (victory) should be in row 8', () => {
    const { row } = getRowCol(68);
    expect(row).toBe(8);
  });

  it('cell 72 (trap) should be at row 8, col 1', () => {
    const { row, col } = getRowCol(72);
    expect(row).toBe(8);
    expect(col).toBe(1);
  });
});

describe('Dice Logic', () => {
  describe('Normal rolls', () => {
    it('sum of [3, 4] should be 7', () => {
      const rolls = [3, 4];
      expect(rolls.reduce((a, b) => a + b, 0)).toBe(7);
    });

    it('sum of [6, 3] should be 9', () => {
      const rolls = [6, 3];
      expect(rolls.reduce((a, b) => a + b, 0)).toBe(9);
    });
  });

  describe('Triple six rule', () => {
    it('should detect triple six', () => {
      const rolls = [6, 6, 6, 2];
      const isTripleSix = rolls.length >= 3 && rolls.slice(0, 3).every((r) => r === 6);
      expect(isTripleSix).toBe(true);
    });

    it('should not detect triple six for [6, 6, 3]', () => {
      const rolls = [6, 6, 3];
      const isTripleSix = rolls.length >= 3 && rolls.slice(0, 3).every((r) => r === 6);
      expect(isTripleSix).toBe(false);
    });

    it('triple six total should be only the 4th roll', () => {
      const rolls = [6, 6, 6, 2];
      const isTripleSix = rolls.length >= 3 && rolls.slice(0, 3).every((r) => r === 6);
      const total = isTripleSix ? rolls[3] : rolls.reduce((a, b) => a + b, 0);
      expect(total).toBe(2);
    });
  });
});

describe('Movement Calculation', () => {
  function calculateEndCell(current: number, total: number, hasSix: boolean): number {
    if (current === 0) {
      // Entry logic
      if (!hasSix) return 0;
      return 1 + (total - 6);
    }

    let endCell = current + total;

    // Bounce from 72
    if (endCell > MAX_CELL) {
      endCell = MAX_CELL - (endCell - MAX_CELL);
    }

    return endCell;
  }

  describe('Entry rules', () => {
    it('cannot enter without rolling 6', () => {
      expect(calculateEndCell(0, 4, false)).toBe(0);
    });

    it('rolling 6 enters on cell 1', () => {
      expect(calculateEndCell(0, 6, true)).toBe(1);
    });

    it('rolling 6+3=9 enters on cell 4', () => {
      expect(calculateEndCell(0, 9, true)).toBe(4);
    });
  });

  describe('Normal movement', () => {
    it('cell 5 + roll 4 = cell 9', () => {
      expect(calculateEndCell(5, 4, false)).toBe(9);
    });

    it('cell 30 + roll 10 = cell 40', () => {
      expect(calculateEndCell(30, 10, false)).toBe(40);
    });
  });

  describe('Bounce from 72', () => {
    it('cell 70 + roll 5 bounces to 69', () => {
      // 70 + 5 = 75, 72 - (75 - 72) = 72 - 3 = 69
      expect(calculateEndCell(70, 5, false)).toBe(69);
    });

    it('cell 66 + roll 6 lands exactly on 72', () => {
      expect(calculateEndCell(66, 6, false)).toBe(72);
    });
  });
});

describe('Transition Application', () => {
  function applyTransition(cell: number): { finalCell: number; type: string } {
    if (cell in ARROWS) {
      return { finalCell: ARROWS[cell] as number, type: 'arrow' };
    }
    if (cell in SNAKES) {
      return { finalCell: SNAKES[cell] as number, type: 'snake' };
    }
    return { finalCell: cell, type: 'none' };
  }

  it('landing on 17 triggers arrow to 69', () => {
    const { finalCell, type } = applyTransition(17);
    expect(finalCell).toBe(69);
    expect(type).toBe('arrow');
  });

  it('landing on 55 triggers snake to 3', () => {
    const { finalCell, type } = applyTransition(55);
    expect(finalCell).toBe(3);
    expect(type).toBe('snake');
  });

  it('landing on 72 triggers snake to 51', () => {
    const { finalCell, type } = applyTransition(72);
    expect(finalCell).toBe(51);
    expect(type).toBe('snake');
  });

  it('landing on 5 has no transition', () => {
    const { finalCell, type } = applyTransition(5);
    expect(finalCell).toBe(5);
    expect(type).toBe('none');
  });

  it('landing on 68 (victory) has no transition', () => {
    const { finalCell, type } = applyTransition(68);
    expect(finalCell).toBe(68);
    expect(type).toBe('none');
  });
});

describe('Full Move Scenarios', () => {
  function simulateMove(
    current: number,
    rolls: number[],
  ): {
    endCell: number;
    finalCell: number;
    transitionType: string;
    isVictory: boolean;
  } {
    const isTripleSix = rolls.length >= 3 && rolls.slice(0, 3).every((r) => r === 6);
    const total = (isTripleSix
      ? (rolls[3] ?? rolls[rolls.length - 1])
      : rolls.reduce((a, b) => a + b, 0)) || 0;
    const hasSix = rolls.includes(6);

    let endCell: number;
    if (current === 0) {
      endCell = hasSix ? 1 + (total - 6) : 0;
    } else {
      endCell = current + total;
      if (endCell > MAX_CELL) {
        endCell = MAX_CELL - (endCell - MAX_CELL);
      }
    }

    let finalCell = endCell;
    let transitionType = 'none';

    if (endCell in ARROWS) {
      finalCell = ARROWS[endCell] as number;
      transitionType = 'arrow';
    } else if (endCell in SNAKES) {
      finalCell = SNAKES[endCell] as number;
      transitionType = 'snake';
    }

    return {
      endCell,
      finalCell,
      transitionType,
      isVictory: finalCell === WINNING_CELL,
    };
  }

  it('scenario: fail to enter (roll 4 off board)', () => {
    const result = simulateMove(0, [4]);
    expect(result.finalCell).toBe(0);
    expect(result.isVictory).toBe(false);
  });

  it('scenario: enter board (roll 6+3)', () => {
    const result = simulateMove(0, [6, 3]);
    expect(result.endCell).toBe(4);
    expect(result.finalCell).toBe(4);
  });

  it('scenario: hit compassion arrow', () => {
    const result = simulateMove(12, [5]); // 12+5=17
    expect(result.endCell).toBe(17);
    expect(result.finalCell).toBe(69);
    expect(result.transitionType).toBe('arrow');
  });

  it('scenario: hit egoism snake', () => {
    const result = simulateMove(50, [5]); // 50+5=55
    expect(result.endCell).toBe(55);
    expect(result.finalCell).toBe(3);
    expect(result.transitionType).toBe('snake');
  });

  it('scenario: victory (land on 68)', () => {
    const result = simulateMove(65, [3]); // 65+3=68
    expect(result.finalCell).toBe(68);
    expect(result.isVictory).toBe(true);
  });

  it('scenario: overshoot and bounce', () => {
    const result = simulateMove(65, [6, 4]); // 65+10=75, bounce to 69
    expect(result.endCell).toBe(69);
    expect(result.isVictory).toBe(false);
  });

  it('scenario: land on trap 72', () => {
    const result = simulateMove(66, [6]); // 66+6=72
    expect(result.endCell).toBe(72);
    expect(result.finalCell).toBe(51);
    expect(result.transitionType).toBe('snake');
  });
});
