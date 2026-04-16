import { describe, it, expect, afterEach, vi } from "vitest";
import { DEFAULT_MAGNIFIER } from "@sakana-y/vue-grab-shared";
import type { MagnifierConfig } from "@sakana-y/vue-grab-shared";
import { MagnifierOverlay, MAGNIFIER_HOST_ID } from "../src/magnifier";

function createMagnifier(overrides: Partial<MagnifierConfig> = {}): MagnifierOverlay {
  return new MagnifierOverlay({ ...DEFAULT_MAGNIFIER, ...overrides });
}

describe("MagnifierOverlay", () => {
  let mag: MagnifierOverlay;

  afterEach(() => {
    mag?.destroy();
    document.getElementById(MAGNIFIER_HOST_ID)?.remove();
  });

  describe("mount", () => {
    it("creates host element in document.body with correct ID", () => {
      mag = createMagnifier();
      mag.mount();
      const host = document.getElementById(MAGNIFIER_HOST_ID);
      expect(host).not.toBeNull();
      expect(host!.parentElement).toBe(document.body);
    });

    it("attaches shadow root with container and loupe", () => {
      mag = createMagnifier();
      mag.mount();
      const host = document.getElementById(MAGNIFIER_HOST_ID)!;
      expect(host.shadowRoot).not.toBeNull();
      expect(host.shadowRoot!.querySelector(".magnifier-container")).not.toBeNull();
      expect(host.shadowRoot!.querySelector(".loupe")).not.toBeNull();
    });

    it("is idempotent — second mount is no-op", () => {
      mag = createMagnifier();
      mag.mount();
      mag.mount();
      expect(document.querySelectorAll(`#${MAGNIFIER_HOST_ID}`).length).toBe(1);
    });

    it("creates html-label element when showHtmlOverlay is true", () => {
      mag = createMagnifier({ showHtmlOverlay: true });
      mag.mount();
      const host = document.getElementById(MAGNIFIER_HOST_ID)!;
      expect(host.shadowRoot!.querySelector(".html-label")).not.toBeNull();
    });

    it("does not create html-label when showHtmlOverlay is false", () => {
      mag = createMagnifier({ showHtmlOverlay: false });
      mag.mount();
      const host = document.getElementById(MAGNIFIER_HOST_ID)!;
      expect(host.shadowRoot!.querySelector(".html-label")).toBeNull();
    });
  });

  describe("activate / deactivate", () => {
    it("activate sets isActive to true", () => {
      mag = createMagnifier();
      mag.mount();
      mag.activate();
      expect(mag.isActive).toBe(true);
    });

    it("activate adds active class to container", () => {
      mag = createMagnifier();
      mag.mount();
      mag.activate();
      const host = document.getElementById(MAGNIFIER_HOST_ID)!;
      const container = host.shadowRoot!.querySelector(".magnifier-container")!;
      expect(container.classList.contains("active")).toBe(true);
    });

    it("deactivate sets isActive to false", () => {
      mag = createMagnifier();
      mag.mount();
      mag.activate();
      mag.deactivate();
      expect(mag.isActive).toBe(false);
    });

    it("deactivate removes active class", () => {
      mag = createMagnifier();
      mag.mount();
      mag.activate();
      mag.deactivate();
      const host = document.getElementById(MAGNIFIER_HOST_ID)!;
      const container = host.shadowRoot!.querySelector(".magnifier-container")!;
      expect(container.classList.contains("active")).toBe(false);
    });

    it("activate is no-op when already active", () => {
      mag = createMagnifier();
      mag.mount();
      const cb = vi.fn<() => void>();
      mag.onStateChange(cb);
      mag.activate();
      mag.activate();
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it("deactivate is no-op when already inactive", () => {
      mag = createMagnifier();
      mag.mount();
      const cb = vi.fn<() => void>();
      mag.onStateChange(cb);
      mag.deactivate();
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe("toggle", () => {
    it("activates when inactive", () => {
      mag = createMagnifier();
      mag.mount();
      mag.toggle();
      expect(mag.isActive).toBe(true);
    });

    it("deactivates when active", () => {
      mag = createMagnifier();
      mag.mount();
      mag.activate();
      mag.toggle();
      expect(mag.isActive).toBe(false);
    });
  });

  describe("onStateChange", () => {
    it("notifies listener on activate", () => {
      mag = createMagnifier();
      mag.mount();
      const cb = vi.fn<() => void>();
      mag.onStateChange(cb);
      mag.activate();
      expect(cb).toHaveBeenCalledWith(true);
    });

    it("notifies listener on deactivate", () => {
      mag = createMagnifier();
      mag.mount();
      const cb = vi.fn<() => void>();
      mag.onStateChange(cb);
      mag.activate();
      mag.deactivate();
      expect(cb).toHaveBeenCalledWith(false);
    });

    it("unsubscribe stops notifications", () => {
      mag = createMagnifier();
      mag.mount();
      const cb = vi.fn<() => void>();
      const unsub = mag.onStateChange(cb);
      unsub();
      mag.activate();
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe("updateConfig", () => {
    it("updates loupeSize and applies to loupe element dimensions", () => {
      mag = createMagnifier({ loupeSize: 300 });
      mag.mount();
      mag.updateConfig({ loupeSize: 500 });
      const host = document.getElementById(MAGNIFIER_HOST_ID)!;
      const loupe = host.shadowRoot!.querySelector(".loupe") as HTMLElement;
      expect(loupe.style.width).toBe("500px");
      expect(loupe.style.height).toBe("500px");
    });

    it("updates zoomLevel in config", () => {
      mag = createMagnifier({ zoomLevel: 2 });
      mag.mount();
      // Just verify it doesn't throw; zoomLevel is internal
      expect(() => mag.updateConfig({ zoomLevel: 5 })).not.toThrow();
    });
  });

  describe("destroy", () => {
    it("removes host element from document", () => {
      mag = createMagnifier();
      mag.mount();
      mag.destroy();
      expect(document.getElementById(MAGNIFIER_HOST_ID)).toBeNull();
    });

    it("deactivates if active", () => {
      mag = createMagnifier();
      mag.mount();
      mag.activate();
      mag.destroy();
      expect(mag.isActive).toBe(false);
    });

    it("is safe to call twice", () => {
      mag = createMagnifier();
      mag.mount();
      mag.destroy();
      expect(() => mag.destroy()).not.toThrow();
    });
  });
});
