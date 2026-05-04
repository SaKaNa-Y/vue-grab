import { describe, it, expect } from "vitest";
import {
  DEFAULT_CONFIG,
  DEFAULT_FLOATING_BUTTON_DOCK_ENTRY_ORDER,
  DEFAULT_HIGHLIGHT_COLOR,
  mergeConfig,
} from "../src";

describe("constants", () => {
  it("should have default config values", () => {
    expect(DEFAULT_CONFIG.highlightColor).toBe(DEFAULT_HIGHLIGHT_COLOR);
    expect(DEFAULT_CONFIG.showTagHint).toBe(true);
    expect(DEFAULT_CONFIG.filter.ignoreSelectors).toEqual([]);
    expect(DEFAULT_CONFIG.networkCapture.captureBodies).toBe(false);
    expect(DEFAULT_CONFIG.floatingButton.dockEntries.order).toEqual(
      DEFAULT_FLOATING_BUTTON_DOCK_ENTRY_ORDER,
    );
    expect(DEFAULT_CONFIG.floatingButton.dockEntries.hidden).toEqual([]);
  });
});

describe("mergeConfig", () => {
  it("returns defaults when options is empty", () => {
    const result = mergeConfig(DEFAULT_CONFIG, {});
    expect(result).toEqual(DEFAULT_CONFIG);
  });

  it("overrides top-level scalar fields", () => {
    const result = mergeConfig(DEFAULT_CONFIG, {
      highlightColor: "#ff0000",
      showTagHint: false,
      maxHtmlLength: 500,
    });
    expect(result.highlightColor).toBe("#ff0000");
    expect(result.showTagHint).toBe(false);
    expect(result.maxHtmlLength).toBe(500);
  });

  it("deep-merges filter — partial override preserves sibling fields", () => {
    const result = mergeConfig(DEFAULT_CONFIG, {
      filter: { skipCommonComponents: true },
    });
    expect(result.filter.skipCommonComponents).toBe(true);
    expect(result.filter.ignoreSelectors).toEqual(DEFAULT_CONFIG.filter.ignoreSelectors);
    expect(result.filter.ignoreTags).toEqual(DEFAULT_CONFIG.filter.ignoreTags);
  });

  it("deep-merges floatingButton", () => {
    const result = mergeConfig(DEFAULT_CONFIG, {
      floatingButton: { enabled: true },
    });
    expect(result.floatingButton.enabled).toBe(true);
    expect(result.floatingButton.storageKey).toBe(DEFAULT_CONFIG.floatingButton.storageKey);
    expect(result.floatingButton.dockMode).toBe(DEFAULT_CONFIG.floatingButton.dockMode);
    expect(result.floatingButton.dockEntries).toEqual(DEFAULT_CONFIG.floatingButton.dockEntries);
    expect(result.floatingButton.closeOnOutsideClick).toBe(
      DEFAULT_CONFIG.floatingButton.closeOnOutsideClick,
    );
  });

  it("deep-merges floatingButton dock entries with array replacement", () => {
    const result = mergeConfig(DEFAULT_CONFIG, {
      floatingButton: {
        dockEntries: {
          hidden: ["logs", "network"],
        },
      },
    });
    expect(result.floatingButton.dockEntries.order).toEqual(
      DEFAULT_CONFIG.floatingButton.dockEntries.order,
    );
    expect(result.floatingButton.dockEntries.hidden).toEqual(["logs", "network"]);
  });

  it("defensively clones floatingButton dock entry arrays", () => {
    const result = mergeConfig(DEFAULT_CONFIG, {});
    expect(result.floatingButton.dockEntries.order).toEqual(
      DEFAULT_CONFIG.floatingButton.dockEntries.order,
    );
    expect(result.floatingButton.dockEntries.order).not.toBe(
      DEFAULT_CONFIG.floatingButton.dockEntries.order,
    );
    expect(result.floatingButton.dockEntries.hidden).not.toBe(
      DEFAULT_CONFIG.floatingButton.dockEntries.hidden,
    );
  });

  it("overrides floatingButton appearance settings", () => {
    const result = mergeConfig(DEFAULT_CONFIG, {
      floatingButton: {
        dockMode: "edge",
        closeOnOutsideClick: false,
      },
    });
    expect(result.floatingButton.dockMode).toBe("edge");
    expect(result.floatingButton.closeOnOutsideClick).toBe(false);
  });

  it("deep-merges consoleCapture", () => {
    const result = mergeConfig(DEFAULT_CONFIG, {
      consoleCapture: { maxEntries: 10 },
    });
    expect(result.consoleCapture.maxEntries).toBe(10);
    expect(result.consoleCapture.captureUnhandled).toBe(
      DEFAULT_CONFIG.consoleCapture.captureUnhandled,
    );
    expect(result.consoleCapture.captureVueErrors).toBe(
      DEFAULT_CONFIG.consoleCapture.captureVueErrors,
    );
  });

  it("replaces consoleCapture.levels wholesale (not element-merged)", () => {
    const result = mergeConfig(DEFAULT_CONFIG, {
      consoleCapture: { levels: ["warn", "error"] },
    });
    expect(result.consoleCapture.levels).toEqual(["warn", "error"]);
  });

  it("defensively clones consoleCapture.levels so the default array is not shared by reference", () => {
    const result = mergeConfig(DEFAULT_CONFIG, {});
    expect(result.consoleCapture.levels).toEqual(DEFAULT_CONFIG.consoleCapture.levels);
    expect(result.consoleCapture.levels).not.toBe(DEFAULT_CONFIG.consoleCapture.levels);
  });

  it("deep-merges magnifier", () => {
    const result = mergeConfig(DEFAULT_CONFIG, {
      magnifier: { zoomLevel: 5 },
    });
    expect(result.magnifier.zoomLevel).toBe(5);
    expect(result.magnifier.loupeSize).toBe(DEFAULT_CONFIG.magnifier.loupeSize);
  });

  it("deep-merges measurer", () => {
    const result = mergeConfig(DEFAULT_CONFIG, {
      measurer: { lineColor: "#000000" },
    });
    expect(result.measurer.lineColor).toBe("#000000");
    expect(result.measurer.guideColor).toBe(DEFAULT_CONFIG.measurer.guideColor);
  });

  it("does not mutate the defaults object", () => {
    const original = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    mergeConfig(DEFAULT_CONFIG, {
      highlightColor: "#ff0000",
      filter: { skipCommonComponents: true },
    });
    expect(DEFAULT_CONFIG).toEqual(original);
  });

  it("handles overriding multiple nested objects simultaneously", () => {
    const result = mergeConfig(DEFAULT_CONFIG, {
      highlightColor: "#aabbcc",
      filter: { ignoreTags: ["script"] },
      magnifier: { loupeSize: 200 },
      measurer: { lineWidth: 3 },
    });
    expect(result.highlightColor).toBe("#aabbcc");
    expect(result.filter.ignoreTags).toEqual(["script"]);
    expect(result.magnifier.loupeSize).toBe(200);
    expect(result.measurer.lineWidth).toBe(3);
    // Non-overridden fields preserved
    expect(result.filter.ignoreSelectors).toEqual(DEFAULT_CONFIG.filter.ignoreSelectors);
    expect(result.magnifier.zoomLevel).toBe(DEFAULT_CONFIG.magnifier.zoomLevel);
  });
});
