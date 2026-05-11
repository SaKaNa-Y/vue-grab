import type { FloatingButtonConfig, FloatingButtonDockMode } from "@sakana-y/vue-grab-shared";

export const DRAG_THRESHOLD = 3;
export const SNAP_TRANSITION = "left 0.3s ease, top 0.3s ease";
export const EDGE_MARGIN = 3;
export const INITIAL_SNAP_ZONE = 5;

export const INITIAL_POSITIONS: Record<
  FloatingButtonConfig["initialPosition"],
  { x: number; y: number }
> = {
  "bottom-right": { x: 97, y: 85 },
  "bottom-left": { x: 3, y: 85 },
  "top-right": { x: 97, y: 15 },
  "top-left": { x: 3, y: 15 },
  "top-center": { x: 50, y: 3 },
};

export function edgeMarginX(): number {
  return (EDGE_MARGIN * window.innerHeight) / window.innerWidth;
}

export function isDockMode(value: string): value is FloatingButtonDockMode {
  return value === "float" || value === "edge";
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

export function clampCenterForSize(center: number, size: number, viewportSize: number): number {
  if (size >= viewportSize) return viewportSize / 2;
  return clamp(center, size / 2, viewportSize - size / 2);
}
