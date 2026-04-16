import { describe, it, expect, afterEach, vi } from "vitest";
import { DEFAULT_MEASURER } from "@sakana-y/vue-grab-shared";
import type { MeasurerConfig } from "@sakana-y/vue-grab-shared";

// Import magnifier first to resolve circular dependency initialization
// (magnifier imports MEASURER_HOST_ID from measurer, and measurer imports MAGNIFIER_HOST_ID from magnifier)
import "../src/magnifier";
import { MeasurerOverlay, MEASURER_HOST_ID } from "../src/measurer";

function createMeasurer(overrides: Partial<MeasurerConfig> = {}): MeasurerOverlay {
  return new MeasurerOverlay({ ...DEFAULT_MEASURER, ...overrides });
}

describe("MeasurerOverlay", () => {
  let meas: MeasurerOverlay;

  afterEach(() => {
    meas?.destroy();
    document.getElementById(MEASURER_HOST_ID)?.remove();
    document.documentElement.style.cursor = "";
  });

  describe("mount / unmount", () => {
    it("creates host element with correct ID", () => {
      meas = createMeasurer();
      meas.mount();
      const host = document.getElementById(MEASURER_HOST_ID);
      expect(host).not.toBeNull();
      expect(host!.parentElement).toBe(document.body);
    });

    it("attaches shadow root with SVG element", () => {
      meas = createMeasurer();
      meas.mount();
      const host = document.getElementById(MEASURER_HOST_ID)!;
      expect(host.shadowRoot).not.toBeNull();
      expect(host.shadowRoot!.querySelector("svg")).not.toBeNull();
    });

    it("is idempotent", () => {
      meas = createMeasurer();
      meas.mount();
      meas.mount();
      expect(document.querySelectorAll(`#${MEASURER_HOST_ID}`).length).toBe(1);
    });

    it("unmount removes host from document", () => {
      meas = createMeasurer();
      meas.mount();
      meas.unmount();
      expect(document.getElementById(MEASURER_HOST_ID)).toBeNull();
    });

    it("unmount deactivates if active", () => {
      meas = createMeasurer();
      meas.mount();
      meas.activate();
      meas.unmount();
      expect(meas.isActive).toBe(false);
    });
  });

  describe("activate / deactivate", () => {
    it("activate sets isActive to true and adds active class", () => {
      meas = createMeasurer();
      meas.mount();
      meas.activate();
      expect(meas.isActive).toBe(true);
      const host = document.getElementById(MEASURER_HOST_ID)!;
      const container = host.shadowRoot!.querySelector(".measurer-container")!;
      expect(container.classList.contains("active")).toBe(true);
    });

    it("activate sets document cursor to crosshair", () => {
      meas = createMeasurer();
      meas.mount();
      meas.activate();
      expect(document.documentElement.style.cursor).toBe("crosshair");
    });

    it("deactivate sets isActive to false and removes active class", () => {
      meas = createMeasurer();
      meas.mount();
      meas.activate();
      meas.deactivate();
      expect(meas.isActive).toBe(false);
      const host = document.getElementById(MEASURER_HOST_ID)!;
      const container = host.shadowRoot!.querySelector(".measurer-container")!;
      expect(container.classList.contains("active")).toBe(false);
    });

    it("deactivate restores cursor", () => {
      meas = createMeasurer();
      meas.mount();
      meas.activate();
      meas.deactivate();
      expect(document.documentElement.style.cursor).toBe("");
    });

    it("activate is no-op without prior mount", () => {
      meas = createMeasurer();
      expect(() => meas.activate()).not.toThrow();
      expect(meas.isActive).toBe(false);
    });

    it("deactivate is no-op when inactive", () => {
      meas = createMeasurer();
      meas.mount();
      const cb = vi.fn<() => void>();
      meas.onStateChange(cb);
      meas.deactivate();
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe("toggle", () => {
    it("activates when inactive", () => {
      meas = createMeasurer();
      meas.mount();
      meas.toggle();
      expect(meas.isActive).toBe(true);
    });

    it("deactivates when active", () => {
      meas = createMeasurer();
      meas.mount();
      meas.activate();
      meas.toggle();
      expect(meas.isActive).toBe(false);
    });
  });

  describe("onStateChange", () => {
    it("notifies listener on activate with true", () => {
      meas = createMeasurer();
      meas.mount();
      const cb = vi.fn<() => void>();
      meas.onStateChange(cb);
      meas.activate();
      expect(cb).toHaveBeenCalledWith(true);
    });

    it("notifies listener on deactivate with false", () => {
      meas = createMeasurer();
      meas.mount();
      const cb = vi.fn<() => void>();
      meas.onStateChange(cb);
      meas.activate();
      meas.deactivate();
      expect(cb).toHaveBeenCalledWith(false);
    });

    it("unsubscribe stops notifications", () => {
      meas = createMeasurer();
      meas.mount();
      const cb = vi.fn<() => void>();
      const unsub = meas.onStateChange(cb);
      unsub();
      meas.activate();
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe("updateConfig", () => {
    it("merges partial config into existing config", () => {
      meas = createMeasurer({ lineColor: "#ff0000" });
      expect(() => meas.updateConfig({ lineWidth: 5 })).not.toThrow();
    });
  });

  describe("destroy", () => {
    it("calls unmount and clears state listeners", () => {
      meas = createMeasurer();
      meas.mount();
      const cb = vi.fn<() => void>();
      meas.onStateChange(cb);
      meas.destroy();
      expect(document.getElementById(MEASURER_HOST_ID)).toBeNull();
    });

    it("is safe to call twice", () => {
      meas = createMeasurer();
      meas.mount();
      meas.destroy();
      expect(() => meas.destroy()).not.toThrow();
    });
  });
});
