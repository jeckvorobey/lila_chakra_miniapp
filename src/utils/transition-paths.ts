import type { CellPosition } from 'src/utils/board-geometry';

/**
 * Прямая линия для стрелы.
 */
export function createArrowPath(startPos: CellPosition, endPos: CellPosition): string {
  return `M ${startPos.x} ${startPos.y} L ${endPos.x} ${endPos.y}`;
}

/**
 * Треугольный наконечник стрелы.
 */
export function createArrowHead(
  endPos: CellPosition,
  startPos: CellPosition,
  size = 8,
): string {
  const angle = Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x);
  const leftX = endPos.x - size * Math.cos(angle - Math.PI / 6);
  const leftY = endPos.y - size * Math.sin(angle - Math.PI / 6);
  const rightX = endPos.x - size * Math.cos(angle + Math.PI / 6);
  const rightY = endPos.y - size * Math.sin(angle + Math.PI / 6);

  return `M ${endPos.x} ${endPos.y} L ${leftX} ${leftY} L ${rightX} ${rightY} Z`;
}

/**
 * Синусоидальная кривая змеи от хвоста к голове.
 */
export function createSnakePath(
  tailPos: CellPosition,
  headPos: CellPosition,
  segments = 0,
): string {
  const dx = headPos.x - tailPos.x;
  const dy = headPos.y - tailPos.y;
  const distance = Math.hypot(dx, dy);

  if (distance === 0) {
    return `M ${tailPos.x} ${tailPos.y}`;
  }

  const segmentCount = segments === 0 ? Math.max(3, Math.round(distance / 40)) : segments;
  const amplitude = Math.min(distance * 0.15, 30);

  let path = `M ${tailPos.x} ${tailPos.y}`;

  for (let i = 1; i <= segmentCount; i += 1) {
    const t = i / segmentCount;
    const tPrev = (i - 0.5) / segmentCount;

    const midX = tailPos.x + dx * tPrev;
    const midY = tailPos.y + dy * tPrev;
    const endX = tailPos.x + dx * t;
    const endY = tailPos.y + dy * t;

    const perpX = -dy / distance;
    const perpY = dx / distance;
    const direction = i % 2 === 0 ? 1 : -1;

    const cpX = midX + perpX * amplitude * direction;
    const cpY = midY + perpY * amplitude * direction;

    path += ` Q ${cpX} ${cpY} ${endX} ${endY}`;
  }

  return path;
}

/**
 * Координата точки на SVG пути по прогрессу 0..1.
 */
export function getPointOnPath(pathEl: SVGPathElement, progress: number): CellPosition {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const totalLength = pathEl.getTotalLength();
  const point = pathEl.getPointAtLength(totalLength * clampedProgress);

  return { x: point.x, y: point.y };
}
