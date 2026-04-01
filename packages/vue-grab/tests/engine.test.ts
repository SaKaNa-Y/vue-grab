import { describe, it, expect, afterEach, vi } from "vitest";
import { DEFAULT_CONFIG } from "@sakana/vue-grab-shared";
import { GrabEngine } from "../src/core";
import { OVERLAY_HOST_ID } from "../src/overlay";
import { cleanupDOM, createTargetElement, fireClickAtCenter, fireKey } from "./helpers/setup";

function createEngine(config = DEFAULT_CONFIG): GrabEngine {
  return new GrabEngine({ ...config });
}

describe("GrabEngine", () => {
  let engine: GrabEngine;

  afterEach(() => {
    engine?.destroy();
    cleanupDOM();
  });

  describe("activate / deactivate", () => {
    it("activate sets isActive to true", () => {
      engine = createEngine();
      engine.activate();
      expect(engine.isActive).toBe(true);
    });

    it("activate mounts the overlay", () => {
      engine = createEngine();
      engine.activate();
      expect(document.getElementById(OVERLAY_HOST_ID)).not.toBeNull();
    });

    it("activate sets cursor to crosshair", () => {
      engine = createEngine();
      engine.activate();
      expect(document.body.style.cursor).toBe("crosshair");
    });

    it("fires onStateChange with true on activate", () => {
      engine = createEngine();
      const cb = vi.fn();
      engine.onStateChange(cb);
      engine.activate();
      expect(cb).toHaveBeenCalledWith(true);
    });

    it("is idempotent — second activate is a no-op", () => {
      engine = createEngine();
      const cb = vi.fn();
      engine.onStateChange(cb);
      engine.activate();
      engine.activate();
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it("deactivate sets isActive to false", () => {
      engine = createEngine();
      engine.activate();
      engine.deactivate();
      expect(engine.isActive).toBe(false);
    });

    it("deactivate removes the overlay", () => {
      engine = createEngine();
      engine.activate();
      engine.deactivate();
      expect(document.getElementById(OVERLAY_HOST_ID)).toBeNull();
    });

    it("deactivate restores previous cursor", () => {
      document.body.style.cursor = "pointer";
      engine = createEngine();
      engine.activate();
      engine.deactivate();
      expect(document.body.style.cursor).toBe("pointer");
    });

    it("fires onStateChange with false on deactivate", () => {
      engine = createEngine();
      const cb = vi.fn();
      engine.onStateChange(cb);
      engine.activate();
      engine.deactivate();
      expect(cb).toHaveBeenCalledWith(false);
    });

    it("deactivate is a no-op when already inactive", () => {
      engine = createEngine();
      const cb = vi.fn();
      engine.onStateChange(cb);
      engine.deactivate();
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe("toggle", () => {
    it("activates when inactive", () => {
      engine = createEngine();
      engine.toggle();
      expect(engine.isActive).toBe(true);
    });

    it("deactivates when active", () => {
      engine = createEngine();
      engine.activate();
      engine.toggle();
      expect(engine.isActive).toBe(false);
    });
  });

  describe("click (grab)", () => {
    it("calls onGrab with GrabResult on click", () => {
      engine = createEngine();
      const cb = vi.fn();
      engine.onGrab(cb);
      engine.activate();

      const target = createTargetElement("div", { id: "my-el" });
      fireClickAtCenter(target);

      expect(cb).toHaveBeenCalledOnce();
      const result = cb.mock.calls[0][0];
      expect(result.element).toBe(target);
      expect(result.html).toContain("my-el");
      expect(result.selector).toBe("#my-el");
      expect(result.componentStack).toEqual([]);
    });

    it("deactivates after grab", () => {
      engine = createEngine();
      engine.onGrab(() => {});
      engine.activate();

      const target = createTargetElement();
      fireClickAtCenter(target);

      expect(engine.isActive).toBe(false);
    });

    it("prevents default and stops propagation", () => {
      engine = createEngine();
      engine.onGrab(() => {});
      engine.activate();

      const target = createTargetElement();
      const rect = target.getBoundingClientRect();
      const event = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        view: window,
      });
      const pdSpy = vi.spyOn(event, "preventDefault");
      const spSpy = vi.spyOn(event, "stopPropagation");
      document.dispatchEvent(event);

      expect(pdSpy).toHaveBeenCalled();
      expect(spSpy).toHaveBeenCalled();
    });
  });

  describe("Escape key", () => {
    it("deactivates engine on Escape", () => {
      engine = createEngine();
      engine.activate();
      fireKey("Escape");
      expect(engine.isActive).toBe(false);
    });

    it("prevents default on Escape", () => {
      engine = createEngine();
      engine.activate();
      const event = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      });
      const spy = vi.spyOn(event, "preventDefault");
      document.dispatchEvent(event);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("subscriptions", () => {
    it("onGrab returns an unsubscribe function", () => {
      engine = createEngine();
      const cb = vi.fn();
      const unsub = engine.onGrab(cb);
      unsub();

      engine.activate();
      const target = createTargetElement();
      fireClickAtCenter(target);

      expect(cb).not.toHaveBeenCalled();
    });

    it("onStateChange returns an unsubscribe function", () => {
      engine = createEngine();
      const cb = vi.fn();
      const unsub = engine.onStateChange(cb);
      unsub();

      engine.activate();
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe("HTML truncation", () => {
    it("truncates and appends <!-- truncated --> when exceeding maxHtmlLength", () => {
      engine = createEngine({
        ...DEFAULT_CONFIG,
        maxHtmlLength: 20,
      });
      const cb = vi.fn();
      engine.onGrab(cb);
      engine.activate();

      const target = createTargetElement("div", { id: "long-html" });
      target.textContent = "This is some long content that should be truncated";
      fireClickAtCenter(target);

      expect(cb).toHaveBeenCalledOnce();
      const html = cb.mock.calls[0][0].html;
      expect(html.length).toBe(20 + "<!-- truncated -->".length);
      expect(html).toMatch(/<!-- truncated -->$/);
    });

    it("does not truncate when maxHtmlLength is 0", () => {
      engine = createEngine({
        ...DEFAULT_CONFIG,
        maxHtmlLength: 0,
      });
      const cb = vi.fn();
      engine.onGrab(cb);
      engine.activate();

      const target = createTargetElement("div", { id: "no-trunc" });
      target.textContent = "content";
      fireClickAtCenter(target);

      expect(cb).toHaveBeenCalledOnce();
      const html = cb.mock.calls[0][0].html;
      expect(html).toBe(target.outerHTML);
    });

    it("does not truncate when HTML is shorter than maxHtmlLength", () => {
      engine = createEngine({
        ...DEFAULT_CONFIG,
        maxHtmlLength: 100_000,
      });
      const cb = vi.fn();
      engine.onGrab(cb);
      engine.activate();

      const target = createTargetElement("div", { id: "short" });
      fireClickAtCenter(target);

      expect(cb).toHaveBeenCalledOnce();
      const html = cb.mock.calls[0][0].html;
      expect(html).not.toContain("<!-- truncated -->");
    });
  });

  describe("CSS selector generation", () => {
    it("returns #id for elements with an ID", () => {
      engine = createEngine();
      const cb = vi.fn();
      engine.onGrab(cb);
      engine.activate();

      const target = createTargetElement("div", { id: "test-id" });
      fireClickAtCenter(target);

      expect(cb.mock.calls[0][0].selector).toBe("#test-id");
    });

    it("generates tag.class1.class2 for elements without ID", () => {
      engine = createEngine();
      const cb = vi.fn();
      engine.onGrab(cb);
      engine.activate();

      const target = createTargetElement("span");
      target.removeAttribute("id");
      target.className = "foo bar";
      fireClickAtCenter(target);

      const selector = cb.mock.calls[0][0].selector;
      expect(selector).toContain("span.foo.bar");
    });

    it("limits to first 2 classes per segment", () => {
      engine = createEngine();
      const cb = vi.fn();
      engine.onGrab(cb);
      engine.activate();

      const target = createTargetElement("div");
      target.removeAttribute("id");
      target.className = "a b c d";
      fireClickAtCenter(target);

      const selector = cb.mock.calls[0][0].selector;
      // Should have at most 2 classes in the innermost segment
      const lastSegment = selector.split(" > ").pop()!;
      const dotCount = (lastSegment.match(/\./g) || []).length;
      expect(dotCount).toBeLessThanOrEqual(2);
    });

    it("walks up to ancestor with ID", () => {
      engine = createEngine();
      const cb = vi.fn();
      engine.onGrab(cb);
      engine.activate();

      // Parent with ID, child with explicit dimensions so elementFromPoint hits it
      const parent = createTargetElement("div", { id: "parent-id" });
      const child = document.createElement("span");
      child.className = "child-cls";
      Object.assign(child.style, {
        display: "block",
        width: "100px",
        height: "40px",
      });
      parent.appendChild(child);

      fireClickAtCenter(child);

      const selector = cb.mock.calls[0][0].selector;
      expect(selector).toContain("#parent-id");
      expect(selector).toContain("span.child-cls");
    });
  });

  describe("element filtering", () => {
    it("ignores elements matching filter.ignoreTags", () => {
      engine = createEngine({
        ...DEFAULT_CONFIG,
        filter: { ...DEFAULT_CONFIG.filter, ignoreTags: ["span"] },
      });
      const cb = vi.fn();
      engine.onGrab(cb);
      engine.activate();

      const target = createTargetElement("span", { id: "ignored-span" });
      fireClickAtCenter(target);

      expect(cb).not.toHaveBeenCalled();
    });

    it("ignores elements matching filter.ignoreSelectors", () => {
      engine = createEngine({
        ...DEFAULT_CONFIG,
        filter: { ...DEFAULT_CONFIG.filter, ignoreSelectors: [".ignore-me"] },
      });
      const cb = vi.fn();
      engine.onGrab(cb);
      engine.activate();

      const target = createTargetElement("div");
      target.className = "ignore-me";
      fireClickAtCenter(target);

      expect(cb).not.toHaveBeenCalled();
    });

    it("handles invalid selectors gracefully", () => {
      engine = createEngine({
        ...DEFAULT_CONFIG,
        filter: { ...DEFAULT_CONFIG.filter, ignoreSelectors: ["[invalid!!!"] },
      });
      const cb = vi.fn();
      engine.onGrab(cb);
      engine.activate();

      const target = createTargetElement("div", { id: "valid-el" });
      fireClickAtCenter(target);

      expect(cb).toHaveBeenCalledOnce();
    });
  });

  describe("destroy", () => {
    it("deactivates and clears all callbacks", () => {
      engine = createEngine();
      const grabCb = vi.fn();
      const stateCb = vi.fn();
      engine.onGrab(grabCb);
      engine.onStateChange(stateCb);
      engine.activate();
      engine.destroy();

      expect(engine.isActive).toBe(false);

      // Re-activate should not fire cleared state listeners
      // (but engine itself still works since destroy doesn't prevent reuse)
      stateCb.mockClear();
      engine.activate();
      expect(stateCb).not.toHaveBeenCalled();
    });
  });

  describe("updateConfig", () => {
    it("deep-merges new config options", () => {
      engine = createEngine();
      engine.updateConfig({
        highlightColor: "#ff0000",
        filter: { ignoreSelectors: [".new"], ignoreTags: [], skipCommonComponents: false },
      });
      // Verify by activating and checking overlay color
      engine.activate();
      const host = document.getElementById(OVERLAY_HOST_ID)!;
      expect(host.style.getPropertyValue("--grab-color")).toBe("#ff0000");
    });
  });
});
