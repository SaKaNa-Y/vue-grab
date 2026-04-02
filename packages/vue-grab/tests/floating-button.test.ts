import { describe, it, expect, afterEach, vi } from "vitest";
import { DEFAULT_FLOATING_BUTTON } from "@sakana/vue-grab-shared";
import { FloatingButton, FAB_HOST_ID } from "../src/floating-button";
import { cleanupDOM } from "./helpers/setup";

function createFab(overrides: Partial<typeof DEFAULT_FLOATING_BUTTON> = {}): FloatingButton {
  return new FloatingButton({ ...DEFAULT_FLOATING_BUTTON, enabled: true, ...overrides });
}

function getHost(): HTMLElement | null {
  return document.getElementById(FAB_HOST_ID);
}

function getShadow(): ShadowRoot | null {
  return getHost()?.shadowRoot ?? null;
}

function getToolbar(): HTMLElement | null {
  return getShadow()?.querySelector(".toolbar") ?? null;
}

function getButton(): HTMLElement | null {
  return getShadow()?.querySelector(".grab-btn") ?? null;
}

function getGear(): HTMLElement | null {
  return getShadow()?.querySelector(".gear-btn") ?? null;
}

function getPanel(): HTMLElement | null {
  return getShadow()?.querySelector(".panel") ?? null;
}

describe("FloatingButton", () => {
  let fab: FloatingButton;

  afterEach(() => {
    fab?.destroy();
    cleanupDOM();
    localStorage.clear();
  });

  describe("mount", () => {
    it("creates a host element with correct id in document.body", () => {
      fab = createFab();
      fab.mount();

      const host = getHost();
      expect(host).not.toBeNull();
      expect(host!.parentElement).toBe(document.body);
    });

    it("attaches an open shadow root with a toolbar and grab button", () => {
      fab = createFab();
      fab.mount();

      const shadow = getShadow();
      expect(shadow).not.toBeNull();
      expect(getToolbar()).not.toBeNull();
      expect(getButton()).not.toBeNull();
    });

    it("is idempotent — second mount is a no-op", () => {
      fab = createFab();
      fab.mount();
      fab.mount();

      expect(document.querySelectorAll(`#${FAB_HOST_ID}`).length).toBe(1);
    });

    it("uses initialPosition default when no localStorage data", () => {
      fab = createFab({ initialPosition: "top-center" });
      fab.mount();

      const host = getHost()!;
      expect(host.style.left).toBe("50%");
      expect(host.style.top).toBe("3%");
    });

    it("reads position from localStorage if available", () => {
      localStorage.setItem("vue-grab-fab-pos", JSON.stringify({ x: 50, y: 40 }));
      fab = createFab();
      fab.mount();

      const host = getHost()!;
      expect(host.style.left).toBe("50%");
      expect(host.style.top).toBe("40%");
    });
  });

  describe("toolbar layout", () => {
    it("gear button is always visible in toolbar", () => {
      fab = createFab();
      fab.mount();

      const gear = getGear()!;
      expect(gear).not.toBeNull();
      expect(gear.parentElement).toBe(getToolbar());
    });

    it("contains a divider between grab and gear buttons", () => {
      fab = createFab();
      fab.mount();

      const divider = getShadow()!.querySelector(".toolbar-divider");
      expect(divider).not.toBeNull();
    });
  });

  describe("setActive", () => {
    it("adds active CSS class to button when true", () => {
      fab = createFab();
      fab.mount();
      fab.setActive(true);

      expect(getButton()!.classList.contains("active")).toBe(true);
    });

    it("removes active CSS class when false", () => {
      fab = createFab();
      fab.mount();
      fab.setActive(true);
      fab.setActive(false);

      expect(getButton()!.classList.contains("active")).toBe(false);
    });
  });

  describe("click", () => {
    it("calls onToggle callback on click", () => {
      fab = createFab();
      const spy = vi.fn<() => void>();
      fab.onToggle(spy);
      fab.mount();

      getButton()!.click();
      expect(spy).toHaveBeenCalledOnce();
    });
  });

  describe("settings panel", () => {
    it("clicking gear opens settings panel", () => {
      fab = createFab();
      fab.mount();

      getGear()!.click();
      expect(getPanel()!.classList.contains("open")).toBe(true);
    });

    it("panel displays current hotkey", () => {
      fab = createFab();
      fab.mount();
      fab.setCurrentHotkey("Alt+Shift+G");

      const kbd = getShadow()!.querySelector("kbd")!;
      expect(kbd.textContent).toBe("Alt+Shift+G");
    });

    it("Escape closes the panel", () => {
      fab = createFab();
      fab.mount();

      getGear()!.click();
      expect(getPanel()!.classList.contains("open")).toBe(true);

      // Press Escape
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
      );

      expect(getPanel()!.classList.contains("open")).toBe(false);
    });

    it("close button closes the panel", () => {
      fab = createFab();
      fab.mount();

      getGear()!.click();

      const closeBtn = getShadow()!.querySelector(".panel-close") as HTMLElement;
      closeBtn.click();

      expect(getPanel()!.classList.contains("open")).toBe(false);
    });

    it("hotkey recording captures modifier+key combo", () => {
      fab = createFab();
      const spy = vi.fn<() => void>();
      fab.onHotkeyChange(spy);
      fab.mount();

      // Open panel
      getGear()!.click();

      // Click record
      const recordBtn = getShadow()!.querySelector(".record-btn") as HTMLElement;
      recordBtn.click();

      // Simulate keypress
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "K",
          ctrlKey: true,
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );

      expect(spy).toHaveBeenCalledWith("Ctrl+Shift+K");
      expect(getShadow()!.querySelector("kbd")!.textContent).toBe("Ctrl+Shift+K");
    });
  });

  describe("destroy", () => {
    it("removes host from document", () => {
      fab = createFab();
      fab.mount();
      fab.destroy();

      expect(getHost()).toBeNull();
    });

    it("is safe to call twice", () => {
      fab = createFab();
      fab.mount();
      fab.destroy();
      fab.destroy();

      expect(getHost()).toBeNull();
    });
  });
});
