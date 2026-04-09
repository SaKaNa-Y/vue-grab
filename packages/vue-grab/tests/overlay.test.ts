import { describe, it, expect, afterEach } from "vitest";
import { DEFAULT_HIGHLIGHT_COLOR, DEFAULT_LABEL_TEXT_COLOR } from "@sakana-y/vue-grab-shared";
import { GrabOverlay, OVERLAY_HOST_ID } from "../src/overlay";
import { cleanupDOM, createTargetElement } from "./helpers/setup";

function createOverlay(showTagHint = true): GrabOverlay {
  return new GrabOverlay({
    highlightColor: DEFAULT_HIGHLIGHT_COLOR,
    labelTextColor: DEFAULT_LABEL_TEXT_COLOR,
    showTagHint,
  });
}

describe("GrabOverlay", () => {
  let overlay: GrabOverlay;

  afterEach(() => {
    overlay?.destroy();
    cleanupDOM();
  });

  describe("mount", () => {
    it("creates a host element in document.body", () => {
      overlay = createOverlay();
      overlay.mount();

      const host = document.getElementById(OVERLAY_HOST_ID);
      expect(host).not.toBeNull();
      expect(host!.parentElement).toBe(document.body);
    });

    it("sets host to fixed position with correct z-index and pointer-events", () => {
      overlay = createOverlay();
      overlay.mount();

      const host = document.getElementById(OVERLAY_HOST_ID)!;
      expect(host.style.position).toBe("fixed");
      expect(host.style.zIndex).toBe("2147483647");
      expect(host.style.pointerEvents).toBe("none");
    });

    it("attaches an open shadow root with highlight and label elements", () => {
      overlay = createOverlay();
      overlay.mount();

      const host = document.getElementById(OVERLAY_HOST_ID)!;
      expect(host.shadowRoot).not.toBeNull();

      const highlight = host.shadowRoot!.querySelector(".grab-highlight");
      const label = host.shadowRoot!.querySelector(".grab-label");
      expect(highlight).not.toBeNull();
      expect(label).not.toBeNull();
    });

    it("sets CSS custom properties from config", () => {
      overlay = new GrabOverlay({
        highlightColor: "#ff0000",
        labelTextColor: "#00ff00",
        showTagHint: true,
      });
      overlay.mount();

      const host = document.getElementById(OVERLAY_HOST_ID)!;
      expect(host.style.getPropertyValue("--grab-color")).toBe("#ff0000");
      expect(host.style.getPropertyValue("--grab-label-color")).toBe("#00ff00");
    });

    it("is idempotent — second mount is a no-op", () => {
      overlay = createOverlay();
      overlay.mount();
      overlay.mount();

      const hosts = document.querySelectorAll(`#${OVERLAY_HOST_ID}`);
      expect(hosts.length).toBe(1);
    });
  });

  describe("highlight", () => {
    it("positions highlight box to match target element bounding rect", () => {
      overlay = createOverlay();
      overlay.mount();

      const target = createTargetElement(
        "div",
        {},
        {
          position: "absolute",
          top: "100px",
          left: "50px",
          width: "200px",
          height: "80px",
        },
      );
      const rect = target.getBoundingClientRect();
      overlay.highlight(target, "div");

      const host = document.getElementById(OVERLAY_HOST_ID)!;
      const box = host.shadowRoot!.querySelector(".grab-highlight") as HTMLElement;
      expect(box.style.display).toBe("block");
      expect(box.style.top).toBe(`${rect.top}px`);
      expect(box.style.left).toBe(`${rect.left}px`);
      expect(box.style.width).toBe(`${rect.width}px`);
      expect(box.style.height).toBe(`${rect.height}px`);
    });

    it("shows label with provided text when showTagHint is true", () => {
      overlay = createOverlay();
      overlay.mount();

      const target = createTargetElement();
      overlay.highlight(target, "<MyComp>");

      const host = document.getElementById(OVERLAY_HOST_ID)!;
      const label = host.shadowRoot!.querySelector(".grab-label") as HTMLElement;
      expect(label.style.display).toBe("inline-flex");
      expect(label.textContent).toContain("<MyComp>");
    });

    it("positions label above element when there is enough space", () => {
      overlay = createOverlay();
      overlay.mount();

      const target = createTargetElement("div", {}, { top: "100px" });
      const rect = target.getBoundingClientRect();
      overlay.highlight(target, "label");

      const host = document.getElementById(OVERLAY_HOST_ID)!;
      const label = host.shadowRoot!.querySelector(".grab-label") as HTMLElement;
      // labelHeight=20, so label top = rect.top - 20 - 4
      expect(label.style.top).toBe(`${rect.top - 24}px`);
    });

    it("positions label below element when near viewport top", () => {
      overlay = createOverlay();
      overlay.mount();

      const target = createTargetElement("div", {}, { top: "10px" });
      const rect = target.getBoundingClientRect();
      overlay.highlight(target, "label");

      const host = document.getElementById(OVERLAY_HOST_ID)!;
      const label = host.shadowRoot!.querySelector(".grab-label") as HTMLElement;
      expect(label.style.top).toBe(`${rect.bottom + 4}px`);
    });

    it("hides label when showTagHint is false", () => {
      overlay = createOverlay(false);
      overlay.mount();

      const target = createTargetElement();
      overlay.highlight(target, "label");

      const host = document.getElementById(OVERLAY_HOST_ID)!;
      const label = host.shadowRoot!.querySelector(".grab-label") as HTMLElement;
      expect(label.style.display).toBe("none");
    });

    it("is a no-op if mount was never called", () => {
      overlay = createOverlay();
      // Should not throw
      const target = createTargetElement();
      expect(() => overlay.highlight(target, "label")).not.toThrow();
    });
  });

  describe("clearHighlight", () => {
    it("hides both highlight and label", () => {
      overlay = createOverlay();
      overlay.mount();

      const target = createTargetElement();
      overlay.highlight(target, "label");
      overlay.clearHighlight();

      const host = document.getElementById(OVERLAY_HOST_ID)!;
      const box = host.shadowRoot!.querySelector(".grab-highlight") as HTMLElement;
      const label = host.shadowRoot!.querySelector(".grab-label") as HTMLElement;
      expect(box.style.display).toBe("none");
      expect(label.style.display).toBe("none");
    });
  });

  describe("destroy", () => {
    it("removes host from document", () => {
      overlay = createOverlay();
      overlay.mount();
      overlay.destroy();

      expect(document.getElementById(OVERLAY_HOST_ID)).toBeNull();
    });

    it("is safe to call twice", () => {
      overlay = createOverlay();
      overlay.mount();
      overlay.destroy();
      expect(() => overlay.destroy()).not.toThrow();
    });
  });
});
