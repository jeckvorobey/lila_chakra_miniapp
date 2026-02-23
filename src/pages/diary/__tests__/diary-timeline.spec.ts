import { describe, expect, it } from 'vitest';
import type { MoveOut } from 'src/types/game.interface';
import { buildDiaryTimelineEntries, hasTransition } from 'src/pages/diary/diary-timeline';

function buildMove(overrides: Partial<MoveOut> = {}): MoveOut {
  return {
    id: 1,
    game_id: 100,
    move_number: 64,
    dice_rolls: [3],
    is_triple_six: false,
    is_pending: false,
    start_cell: 41,
    end_cell: 44,
    final_cell: 9,
    transition_type: 'snake',
    transition_from: 44,
    transition_to: 9,
    ai_interpretation: null,
    player_insight: null,
    created_at: '2026-02-23T10:00:00Z',
    ...overrides,
  };
}

describe('diary-timeline', () => {
  it('создаёт только запись броска, если перехода нет', () => {
    const move = buildMove({
      transition_type: 'none',
      transition_from: null,
      transition_to: null,
      final_cell: 44,
    });

    expect(hasTransition(move)).toBe(false);

    const entries = buildDiaryTimelineEntries([move], 'asc');
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      key: 'roll-1',
      kind: 'roll',
      fromCell: 41,
      toCell: 44,
      transitionType: 'none',
      showDice: true,
    });
  });

  it('для змеи добавляет отдельную запись перехода без кубика', () => {
    const move = buildMove();
    expect(hasTransition(move)).toBe(true);

    const entries = buildDiaryTimelineEntries([move], 'asc');
    expect(entries).toHaveLength(2);

    expect(entries[0]).toMatchObject({
      key: 'roll-1',
      kind: 'roll',
      fromCell: 41,
      toCell: 44,
      transitionType: 'none',
      showDice: true,
    });

    expect(entries[1]).toMatchObject({
      key: 'transition-1',
      kind: 'transition',
      fromCell: 44,
      toCell: 9,
      transitionType: 'snake',
      showDice: false,
    });
  });

  it('для перехода использует fallback end_cell/final_cell, если from/to не пришли', () => {
    const move = buildMove({
      transition_type: 'arrow',
      transition_from: null,
      transition_to: null,
      end_cell: 22,
      final_cell: 60,
    });

    const entries = buildDiaryTimelineEntries([move], 'asc');
    expect(entries[1]).toMatchObject({
      kind: 'transition',
      fromCell: 22,
      toCell: 60,
      transitionType: 'arrow',
      showDice: false,
    });
  });

  it('для desc показывает сначала переход, затем ход', () => {
    const move = buildMove({
      transition_type: 'snake',
      transition_from: 44,
      transition_to: 9,
    });

    const entries = buildDiaryTimelineEntries([move], 'desc');
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      kind: 'transition',
      fromCell: 44,
      toCell: 9,
      transitionType: 'snake',
      showDice: false,
    });
    expect(entries[1]).toMatchObject({
      kind: 'roll',
      fromCell: 41,
      toCell: 44,
      transitionType: 'none',
      showDice: true,
    });
  });
});
