import { describe, it, expect, afterEach, vi } from "vitest";
import type { CapturedLog, LogLevel } from "@sakana-y/vue-grab-shared";
import { DEFAULT_FLOATING_BUTTON } from "@sakana-y/vue-grab-shared";
import { FloatingButton, FAB_HOST_ID } from "../src/floating-button";
import { cleanupDOM } from "./helpers/setup";

function makeLog(
  level: LogLevel,
  message: string,
  overrides: Partial<CapturedLog> = {},
): CapturedLog {
  return {
    id: Math.random(),
    level,
    source: "console",
    message,
    count: 1,
    timestamp: Date.now(),
    ...overrides,
  };
}

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

function getToolbarRow(): HTMLElement | null {
  return getShadow()?.querySelector(".toolbar-row") ?? null;
}

function getExpandBody(): HTMLElement | null {
  return getShadow()?.querySelector(".expand-body") ?? null;
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
      expect(gear.parentElement).toBe(getToolbarRow());
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
      expect(getExpandBody()!.classList.contains("open")).toBe(true);
    });

    it("panel displays current hotkey", () => {
      fab = createFab();
      fab.mount();

      // Open settings panel first so the kbd element is rendered
      getGear()!.click();
      fab.setCurrentHotkey("Alt+Shift+G");

      const kbd = getShadow()!.querySelector("kbd")!;
      expect(kbd.textContent).toBe("Alt+Shift+G");
    });

    it("Escape closes the panel", () => {
      fab = createFab();
      fab.mount();

      getGear()!.click();
      expect(getExpandBody()!.classList.contains("open")).toBe(true);

      // Press Escape
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
      );

      expect(getExpandBody()!.classList.contains("open")).toBe(false);
    });

    it("clicking gear again closes the panel", () => {
      fab = createFab();
      fab.mount();

      getGear()!.click();
      expect(getExpandBody()!.classList.contains("open")).toBe(true);

      getGear()!.click();
      expect(getExpandBody()!.classList.contains("open")).toBe(false);
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

  describe("logs panel", () => {
    function getLogsBtn(): HTMLElement | null {
      return getShadow()?.querySelector(".logs-btn") ?? null;
    }
    function getLogsBadge(): HTMLElement | null {
      return getShadow()?.querySelector(".logs-badge") ?? null;
    }
    function getLogsPanel(): HTMLElement | null {
      return getShadow()?.querySelector(".logs-panel") ?? null;
    }
    function getPills(): NodeListOf<HTMLElement> {
      return getShadow()!.querySelectorAll<HTMLElement>(".logs-pill");
    }
    function getRows(): NodeListOf<HTMLElement> {
      return getShadow()!.querySelectorAll<HTMLElement>(".log-row");
    }
    function getSearch(): HTMLInputElement | null {
      return getShadow()?.querySelector<HTMLInputElement>(".logs-search") ?? null;
    }

    it("clicking logs button opens panel with five level pills", () => {
      fab = createFab();
      fab.mount();

      getLogsBtn()!.click();
      expect(getLogsPanel()).not.toBeNull();
      expect(getPills()).toHaveLength(5);
    });

    it("badge counts only warn + error levels", () => {
      fab = createFab();
      fab.mount();
      fab.setLogs([
        makeLog("log", "a"),
        makeLog("info", "b"),
        makeLog("warn", "c"),
        makeLog("error", "d"),
        makeLog("debug", "e"),
      ]);

      const badge = getLogsBadge()!;
      expect(badge.textContent).toBe("2");
      expect(badge.style.display).not.toBe("none");
    });

    it("badge gains has-error class when an error-level entry is present", () => {
      fab = createFab();
      fab.mount();
      fab.setLogs([makeLog("warn", "a"), makeLog("error", "b")]);
      expect(getLogsBadge()!.classList.contains("has-error")).toBe(true);
    });

    it("badge does not have has-error class when only warnings exist", () => {
      fab = createFab();
      fab.mount();
      fab.setLogs([makeLog("warn", "a"), makeLog("warn", "b")]);
      expect(getLogsBadge()!.classList.contains("has-error")).toBe(false);
    });

    it("badge is hidden when there are no warn or error entries", () => {
      fab = createFab();
      fab.mount();
      fab.setLogs([makeLog("log", "a"), makeLog("info", "b")]);
      expect(getLogsBadge()!.style.display).toBe("none");
    });

    it("clicking a level pill toggles visibility of rows at that level", () => {
      fab = createFab();
      fab.mount();
      fab.setLogs([makeLog("log", "a"), makeLog("warn", "b"), makeLog("error", "c")]);

      getLogsBtn()!.click();
      expect(getRows()).toHaveLength(3);

      const warnPill = getShadow()!.querySelector<HTMLElement>('.logs-pill[data-level="warn"]')!;
      warnPill.click();
      expect(getRows()).toHaveLength(2);
      const remainingLevels = Array.from(getRows()).map((r) => r.dataset.level);
      expect(remainingLevels).not.toContain("warn");

      warnPill.click();
      expect(getRows()).toHaveLength(3);
    });

    it("search input filters rows by message substring", async () => {
      fab = createFab();
      fab.mount();
      fab.setLogs([
        makeLog("log", "foo bar"),
        makeLog("log", "baz qux"),
        makeLog("log", "foo again"),
      ]);

      getLogsBtn()!.click();
      const search = getSearch()!;
      search.value = "foo";
      search.dispatchEvent(new Event("input", { bubbles: true }));

      await new Promise((r) => setTimeout(r, 150));

      const rows = getRows();
      expect(rows).toHaveLength(2);
      const messages = Array.from(rows).map((r) => r.querySelector(".log-row-msg")!.textContent);
      expect(messages.every((m) => m!.includes("foo"))).toBe(true);
    });

    it("Clear button triggers onLogsClear callback", () => {
      fab = createFab();
      fab.mount();
      const spy = vi.fn<() => void>();
      fab.onLogsClear(spy);
      fab.setLogs([makeLog("error", "x")]);

      getLogsBtn()!.click();
      const clearBtn = getShadow()!.querySelector<HTMLElement>(".logs-clear-btn")!;
      clearBtn.click();
      expect(spy).toHaveBeenCalledOnce();
    });

    it("non-console sources display an extra source badge", () => {
      fab = createFab();
      fab.mount();
      fab.setLogs([makeLog("error", "boom", { source: "runtime" })]);

      getLogsBtn()!.click();
      const row = getShadow()!.querySelector<HTMLElement>(".log-row")!;
      const sourceBadge = row.querySelector(".log-row-source");
      expect(sourceBadge).not.toBeNull();
      expect(sourceBadge!.textContent).toBe("runtime");
    });

    it("console-source entries do not render a source badge", () => {
      fab = createFab();
      fab.mount();
      fab.setLogs([makeLog("log", "hi")]);

      getLogsBtn()!.click();
      const row = getShadow()!.querySelector<HTMLElement>(".log-row")!;
      expect(row.querySelector(".log-row-source")).toBeNull();
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
