export interface MeasurementGap {
  start: number;
  end: number;
  distance: number;
}

export function computeGap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): MeasurementGap | null {
  if (aEnd <= bStart) {
    return { start: aEnd, end: bStart, distance: Math.round(bStart - aEnd) };
  }
  if (bEnd <= aStart) {
    return { start: bEnd, end: aStart, distance: Math.round(aStart - bEnd) };
  }
  return null;
}

export function computeSharedMidY(a: DOMRect, b: DOMRect): number {
  const overlapTop = Math.max(a.top, b.top);
  const overlapBottom = Math.min(a.bottom, b.bottom);
  if (overlapTop < overlapBottom) {
    return (overlapTop + overlapBottom) / 2;
  }
  return (a.top + a.bottom + b.top + b.bottom) / 4;
}

export function computeSharedMidX(a: DOMRect, b: DOMRect): number {
  const overlapLeft = Math.max(a.left, b.left);
  const overlapRight = Math.min(a.right, b.right);
  if (overlapLeft < overlapRight) {
    return (overlapLeft + overlapRight) / 2;
  }
  return (a.left + a.right + b.left + b.right) / 4;
}

export function estimateTextWidth(text: string): number {
  return text.length * 6.6;
}
