import type { MoveOut, TransitionType } from 'src/types/game.interface';

export type DiaryTimelineEntryKind = 'roll' | 'transition';

export interface DiaryTimelineEntry {
  key: string;
  kind: DiaryTimelineEntryKind;
  move: MoveOut;
  fromCell: number;
  toCell: number;
  transitionType: TransitionType;
  showDice: boolean;
}

function isTransitionType(type: TransitionType): type is 'arrow' | 'snake' {
  return type === 'arrow' || type === 'snake';
}

export function hasTransition(move: MoveOut): boolean {
  return isTransitionType(move.transition_type);
}

export function buildDiaryTimelineEntries(
  moves: MoveOut[],
  sortOrder: 'asc' | 'desc' = 'desc',
): DiaryTimelineEntry[] {
  const entries: DiaryTimelineEntry[] = [];

  for (const move of moves) {
    const rollEntry: DiaryTimelineEntry = {
      key: `roll-${move.id}`,
      kind: 'roll',
      move,
      fromCell: move.start_cell,
      toCell: move.end_cell,
      transitionType: 'none',
      showDice: true,
    };

    if (hasTransition(move)) {
      const transitionEntry: DiaryTimelineEntry = {
        key: `transition-${move.id}`,
        kind: 'transition',
        move,
        fromCell: move.transition_from ?? move.end_cell,
        toCell: move.transition_to ?? move.final_cell,
        transitionType: move.transition_type,
        showDice: false,
      };

      if (sortOrder === 'desc') {
        entries.push(transitionEntry, rollEntry);
      } else {
        entries.push(rollEntry, transitionEntry);
      }
      continue;
    }

    entries.push(rollEntry);
  }

  return entries;
}
