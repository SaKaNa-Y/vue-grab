import { describe, expect, it } from "vitest";

import {
  computeGap,
  computeSharedMidX,
  computeSharedMidY,
  estimateTextWidth,
} from "../src/measurer/geometry";

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return new DOMRect(left, top, width, height);
}

describe("measurer geometry", () => {
  it("computes gaps between separated ranges", () => {
    expect(computeGap(0, 10, 25, 40)).toEqual({ start: 10, end: 25, distance: 15 });
    expect(computeGap(25, 40, 0, 10)).toEqual({ start: 10, end: 25, distance: 15 });
  });

  it("returns null for overlapping ranges", () => {
    expect(computeGap(0, 20, 10, 30)).toBeNull();
  });

  it("uses overlap midpoints when rectangles overlap on the perpendicular axis", () => {
    expect(computeSharedMidY(rect(0, 0, 10, 40), rect(30, 20, 10, 40))).toBe(30);
    expect(computeSharedMidX(rect(0, 0, 40, 10), rect(20, 30, 40, 10))).toBe(30);
  });

  it("estimates monospace label width", () => {
    expect(estimateTextWidth("12px")).toBeCloseTo(26.4);
  });
});
