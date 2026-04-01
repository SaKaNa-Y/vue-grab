import { describe, it, expect } from "vitest";
import { DEFAULT_CONFIG, DEFAULT_HIGHLIGHT_COLOR } from "../src";

describe("constants", () => {
  it("should have default config values", () => {
    expect(DEFAULT_CONFIG.highlightColor).toBe(DEFAULT_HIGHLIGHT_COLOR);
    expect(DEFAULT_CONFIG.showTagHint).toBe(true);
    expect(DEFAULT_CONFIG.filter.ignoreSelectors).toEqual([]);
  });
});
