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

function getDockModeOption(mode: string, shadow = getShadow()): HTMLElement | null {
  return shadow?.querySelector<HTMLElement>(`.dock-mode-option[data-dock-mode="${mode}"]`) ?? null;
}

function getDockEntryButtonIds(): string[] {
  return Array.from(getToolbarRow()?.querySelectorAll<HTMLElement>(".toolbar-btn") ?? []).map(
    (btn) => btn.dataset.dockEntry ?? "",
  );
}

function getDockEntryRow(id: string): HTMLElement | null {
  return getShadow()?.querySelector<HTMLElement>(`[data-dock-entry-row="${id}"]`) ?? null;
}

function getDockEntryToggle(id: string): HTMLButtonElement | null {
  return getShadow()?.querySelector<HTMLButtonElement>(`[data-dock-entry-toggle="${id}"]`) ?? null;
}

function getDockEntryDragHandle(id: string): HTMLElement | null {
  return getShadow()?.querySelector<HTMLElement>(`[data-dock-entry-drag="${id}"]`) ?? null;
}

function mockToolbarRowRect(left = 540, top = 102, width = 120, height = 36): void {
  vi.spyOn(getToolbarRow()!, "getBoundingClientRect").mockReturnValue({
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
  });
}

function dispatchPointer(
  type: string,
  target: HTMLElement,
  clientX: number,
  clientY: number,
): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      composed: true,
      cancelable: true,
      button: 0,
      pointerId: 1,
      clientX,
      clientY,
    }),
  );
}

function mockDockEntryRowRect(id: string, top: number, left = 100, width = 260, height = 52): void {
  vi.spyOn(getDockEntryRow(id)!, "getBoundingClientRect").mockReturnValue({
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
  });
}

function dispatchDrag(
  type: string,
  target: HTMLElement,
  options: { clientY?: number; relatedTarget?: EventTarget | null } = {},
): void {
  const event = new DragEvent(type, {
    bubbles: true,
    composed: true,
    cancelable: true,
    clientY: options.clientY ?? 0,
  });
  if ("relatedTarget" in options) {
    Object.defineProperty(event, "relatedTarget", { value: options.relatedTarget });
  }
  Object.defineProperty(event, "dataTransfer", {
    value: {
      effectAllowed: "move",
      dropEffect: "move",
      setData: vi.fn<(format: string, data: string) => void>(),
      getData: vi.fn<(format: string) => string>(() => ""),
    },
  });
  target.dispatchEvent(event);
}

function expectStylePx(value: string, expected: number): void {
  expect(Math.abs(Number.parseFloat(value) - expected)).toBeLessThanOrEqual(1);
}

function expectRectStable(
  actual: Pick<DOMRect, "left" | "top" | "right" | "bottom">,
  expected: Pick<DOMRect, "left" | "top" | "right" | "bottom">,
): void {
  expect(Math.abs(actual.left - expected.left)).toBeLessThanOrEqual(1);
  expect(Math.abs(actual.top - expected.top)).toBeLessThanOrEqual(1);
  expect(Math.abs(actual.right - expected.right)).toBeLessThanOrEqual(1);
  expect(Math.abs(actual.bottom - expected.bottom)).toBeLessThanOrEqual(1);
}

function clickOutside(): void {
  document.body.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
}

describe("FloatingButton", () => {
  let fab: FloatingButton;

  afterEach(() => {
    fab?.destroy();
    vi.restoreAllMocks();
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
    it("uses the default dock entry order", () => {
      fab = createFab();
      fab.mount();

      expect(getDockEntryButtonIds()).toEqual([
        "grab",
        "settings",
        "magnifier",
        "measurer",
        "accessibility",
        "logs",
        "network",
      ]);
    });

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

  describe("dock modes", () => {
    it("float mode preserves current expansion near the toolbar", () => {
      fab = createFab({ dockMode: "float", initialPosition: "bottom-right" });
      fab.mount();

      getGear()!.click();

      const host = getHost()!;
      expect(getExpandBody()!.classList.contains("open")).toBe(true);
      expect(getShadow()!.querySelector(".fab-wrapper")!.classList.contains("edge")).toBe(false);
      expect(host.style.transform).toBe("translate(-100%, -50%)");
    });

    it("float mode keeps an open panel anchored to the dragged toolbar center", () => {
      localStorage.setItem("vue-grab-fab-pos", JSON.stringify({ x: 50, y: 20 }));
      fab = createFab({ dockMode: "float" });
      fab.mount();
      getGear()!.click();
      const centerX = window.innerWidth / 2;
      mockToolbarRowRect(centerX - 60, 102);

      const toolbar = getToolbar()!;
      dispatchPointer("pointerdown", toolbar, centerX, 120);
      dispatchPointer("pointermove", toolbar, centerX, 260);

      expect(getExpandBody()!.classList.contains("open")).toBe(true);
      expect(getHost()!.style.top).toBe("242px");
      expect(getHost()!.style.transform).toBe("translate(-50%, 0px)");

      dispatchPointer("pointerup", toolbar, centerX, 260);
    });

    it("float mode keeps the bar and panel synced when dragging open to the right edge", () => {
      localStorage.setItem("vue-grab-fab-pos", JSON.stringify({ x: 50, y: 20 }));
      fab = createFab({ dockMode: "float" });
      fab.mount();
      getGear()!.click();
      const centerX = window.innerWidth / 2;
      mockToolbarRowRect(centerX - 60, 102);

      const toolbar = getToolbar()!;
      dispatchPointer("pointerdown", toolbar, centerX, 120);
      dispatchPointer("pointermove", toolbar, window.innerWidth - 4, 260);

      const wrapper = getShadow()!.querySelector(".fab-wrapper")!;
      expect(wrapper.classList.contains("expand-left")).toBe(true);
      expect(getHost()!.style.transform).toBe("translate(-100%, -50%)");
      expectStylePx(getHost()!.style.left, window.innerWidth);
      expect(getExpandBody()!.classList.contains("open")).toBe(true);

      dispatchPointer("pointerup", toolbar, window.innerWidth - 4, 260);

      const saved = JSON.parse(localStorage.getItem("vue-grab-fab-pos")!);
      expect(saved.x).toBeCloseTo(100 - (3 * window.innerHeight) / window.innerWidth);
      expect(saved.y).toBeCloseTo((260 / window.innerHeight) * 100);
    });

    it("float mode keeps the bar visible when dragging open to the left edge", () => {
      localStorage.setItem("vue-grab-fab-pos", JSON.stringify({ x: 50, y: 20 }));
      fab = createFab({ dockMode: "float" });
      fab.mount();
      getGear()!.click();
      const centerX = window.innerWidth / 2;
      mockToolbarRowRect(centerX - 60, 102);

      const toolbar = getToolbar()!;
      dispatchPointer("pointerdown", toolbar, centerX, 120);
      dispatchPointer("pointermove", toolbar, 4, 260);

      const wrapper = getShadow()!.querySelector(".fab-wrapper")!;
      expect(wrapper.classList.contains("expand-right")).toBe(true);
      expect(getHost()!.style.transform).toBe("translate(0px, -50%)");
      expectStylePx(getHost()!.style.left, 0);
      expect(getExpandBody()!.classList.contains("open")).toBe(true);

      dispatchPointer("pointerup", toolbar, 4, 260);
    });

    it("float mode does not shift the right-edge toolbar when opening from a button click", () => {
      fab = createFab({ dockMode: "float", initialPosition: "bottom-right" });
      fab.mount();
      const toolbar = getToolbar()!;
      const before = {
        left: window.innerWidth - 36,
        top: 180,
        right: window.innerWidth,
        bottom: 360,
        width: 36,
        height: 180,
      };
      const rectSpy = vi.spyOn(toolbar, "getBoundingClientRect");
      rectSpy.mockReturnValueOnce({ ...before, x: before.left, y: before.top, toJSON: () => ({}) });

      getGear()!.click();

      expect(getShadow()!.querySelector(".fab-wrapper")!.classList.contains("expand-left")).toBe(
        true,
      );
      expect(getExpandBody()!.classList.contains("open")).toBe(true);
      expectRectStable(
        {
          left: Number.parseFloat(getHost()!.style.left) - before.width,
          top: Number.parseFloat(getHost()!.style.top) - before.height / 2,
          right: Number.parseFloat(getHost()!.style.left),
          bottom: Number.parseFloat(getHost()!.style.top) + before.height / 2,
        },
        before,
      );
    });

    it("float mode does not shift the left-edge toolbar when opening from a button click", () => {
      fab = createFab({ dockMode: "float", initialPosition: "bottom-left" });
      fab.mount();
      const toolbar = getToolbar()!;
      const before = {
        left: 0,
        top: 180,
        right: 36,
        bottom: 360,
        width: 36,
        height: 180,
      };
      const rectSpy = vi.spyOn(toolbar, "getBoundingClientRect");
      rectSpy.mockReturnValueOnce({ ...before, x: before.left, y: before.top, toJSON: () => ({}) });

      getGear()!.click();

      expect(getShadow()!.querySelector(".fab-wrapper")!.classList.contains("expand-right")).toBe(
        true,
      );
      expect(getExpandBody()!.classList.contains("open")).toBe(true);
      expectRectStable(
        {
          left: Number.parseFloat(getHost()!.style.left),
          top: Number.parseFloat(getHost()!.style.top) - before.height / 2,
          right: Number.parseFloat(getHost()!.style.left) + before.width,
          bottom: Number.parseFloat(getHost()!.style.top) + before.height / 2,
        },
        before,
      );
    });

    it("float mode keeps the toolbar stable when switching between open panels", () => {
      fab = createFab({ dockMode: "float", initialPosition: "bottom-right" });
      fab.mount();
      const toolbar = getToolbar()!;
      const openingRect = {
        left: window.innerWidth - 36,
        top: 180,
        right: window.innerWidth,
        bottom: 360,
        width: 36,
        height: 180,
      };
      const expandedRect = {
        ...openingRect,
        x: openingRect.left,
        y: openingRect.top,
        toJSON: () => ({}),
      };
      const rectSpy = vi.spyOn(toolbar, "getBoundingClientRect");
      rectSpy.mockReturnValueOnce(expandedRect).mockReturnValueOnce(expandedRect);

      getGear()!.click();
      getShadow()!.querySelector<HTMLElement>(".logs-btn")!.click();

      expect(getShadow()!.querySelector(".fab-wrapper")!.classList.contains("expand-left")).toBe(
        true,
      );
      expect(getExpandBody()!.classList.contains("open")).toBe(true);
      expect(getShadow()!.querySelector(".logs-btn")!.classList.contains("active")).toBe(true);
      expectRectStable(
        {
          left: Number.parseFloat(getHost()!.style.left) - openingRect.width,
          top: Number.parseFloat(getHost()!.style.top) - openingRect.height / 2,
          right: Number.parseFloat(getHost()!.style.left),
          bottom: Number.parseFloat(getHost()!.style.top) + openingRect.height / 2,
        },
        openingRect,
      );
    });

    it("edge mode docks to the nearest left edge with a full-height rail", () => {
      fab = createFab({ dockMode: "edge", initialPosition: "bottom-left" });
      fab.mount();

      getGear()!.click();

      const host = getHost()!;
      const wrapper = getShadow()!.querySelector(".fab-wrapper")!;
      expect(wrapper.classList.contains("edge")).toBe(true);
      expect(wrapper.classList.contains("edge-left")).toBe(true);
      expect(host.style.left).toBe("0px");
      expect(host.style.top).toBe("0px");
      expect(host.style.bottom).toBe("0px");
      expect(host.style.transform).toBe("none");
      expect(getToolbar()!.classList.contains("vertical")).toBe(true);
      expectStylePx(getComputedStyle(getToolbar()!).width, 36);
      expectStylePx(getComputedStyle(getToolbar()!).height, window.innerHeight);
      expect(getComputedStyle(getToolbarRow()!).flexDirection).toBe("column");
    });

    it("edge mode docks to the nearest right edge with a full-height rail", () => {
      localStorage.setItem("vue-grab-fab-pos", JSON.stringify({ x: 92, y: 55 }));
      fab = createFab({ dockMode: "edge" });
      fab.mount();

      getGear()!.click();

      const host = getHost()!;
      const wrapper = getShadow()!.querySelector(".fab-wrapper")!;
      expect(wrapper.classList.contains("edge-right")).toBe(true);
      expect(host.style.right).toBe("0px");
      expect(host.style.top).toBe("0px");
      expect(host.style.bottom).toBe("0px");
      expect(host.style.transform).toBe("none");
      expectStylePx(getComputedStyle(getToolbar()!).width, 36);
      expectStylePx(getComputedStyle(getToolbar()!).height, window.innerHeight);
      expect(getComputedStyle(getToolbarRow()!).flexDirection).toBe("column");
    });

    it("edge mode docks top and bottom edges from configured positions", () => {
      fab = createFab({ dockMode: "edge", initialPosition: "top-center" });
      fab.mount();
      getGear()!.click();
      expect(getShadow()!.querySelector(".fab-wrapper")!.classList.contains("edge-top")).toBe(true);
      expectStylePx(getComputedStyle(getToolbar()!).width, window.innerWidth);
      expectStylePx(getComputedStyle(getToolbar()!).height, 36);
      fab.destroy();
      cleanupDOM();

      localStorage.setItem("vue-grab-fab-pos", JSON.stringify({ x: 50, y: 85 }));
      fab = createFab({ dockMode: "edge" });
      fab.mount();
      getGear()!.click();
      expect(getShadow()!.querySelector(".fab-wrapper")!.classList.contains("edge-bottom")).toBe(
        true,
      );
      expectStylePx(getComputedStyle(getToolbar()!).width, window.innerWidth);
      expectStylePx(getComputedStyle(getToolbar()!).height, 36);
    });

    it("edge mode uses the same nearest edge while closed and open", () => {
      localStorage.setItem("vue-grab-fab-pos", JSON.stringify({ x: 50, y: 85 }));
      fab = createFab({ dockMode: "edge" });
      fab.mount();

      const wrapper = getShadow()!.querySelector(".fab-wrapper")!;
      expect(wrapper.classList.contains("edge-bottom")).toBe(true);

      getGear()!.click();

      expect(wrapper.classList.contains("edge-bottom")).toBe(true);
      expect(getExpandBody()!.classList.contains("open")).toBe(true);
    });

    it("edge mode keeps the open bar and panel attached while dragging across side edges", () => {
      fab = createFab({ dockMode: "edge", initialPosition: "bottom-left" });
      fab.mount();
      getGear()!.click();
      mockToolbarRowRect(0, 242, 36, 220);

      const toolbar = getToolbar()!;
      dispatchPointer("pointerdown", toolbar, 18, 352);
      dispatchPointer("pointermove", toolbar, 10, 300);

      const wrapper = getShadow()!.querySelector(".fab-wrapper")!;
      expect(wrapper.classList.contains("edge-left")).toBe(true);
      expect(getHost()!.style.left).toBe("0px");
      expect(getExpandBody()!.classList.contains("open")).toBe(true);

      dispatchPointer("pointermove", toolbar, window.innerWidth - 4, 300);

      expect(wrapper.classList.contains("edge-right")).toBe(true);
      expect(getHost()!.style.right).toBe("0px");
      expect(getHost()!.style.top).toBe("0px");
      expect(getHost()!.style.bottom).toBe("0px");
      expect(getHost()!.style.transform).toBe("none");
      expectStylePx(getComputedStyle(getToolbar()!).height, window.innerHeight);
      expect(getComputedStyle(getToolbarRow()!).flexDirection).toBe("column");
      expect(getExpandBody()!.classList.contains("open")).toBe(true);

      dispatchPointer("pointerup", toolbar, window.innerWidth - 4, 300);
    });

    it("switching modes while open re-layouts without losing panel content", () => {
      fab = createFab({ dockMode: "float" });
      fab.mount();

      getGear()!.click();
      expect(getShadow()!.querySelector(".tab-bar")).not.toBeNull();

      getDockModeOption("edge")!.click();

      const wrapper = getShadow()!.querySelector(".fab-wrapper")!;
      expect(wrapper.classList.contains("edge")).toBe(true);
      expect(getShadow()!.querySelector(".tab-bar")).not.toBeNull();
      expect(getExpandBody()!.classList.contains("open")).toBe(true);
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
    function getSettingsTab(label: string): HTMLElement | null {
      return (
        Array.from(getShadow()?.querySelectorAll<HTMLElement>(".tab-btn") ?? []).find(
          (btn) => btn.textContent === label,
        ) ?? null
      );
    }

    function getActiveDockMode(): HTMLElement | null {
      return getShadow()?.querySelector(".dock-mode-option.active") ?? null;
    }

    it("clicking gear opens settings panel", () => {
      fab = createFab();
      fab.mount();

      getGear()!.click();
      expect(getExpandBody()!.classList.contains("open")).toBe(true);
    });

    it("opens the Dock tab with dock mode and outside-click controls", () => {
      fab = createFab();
      fab.mount();

      getGear()!.click();

      expect(getSettingsTab("Dock")!.classList.contains("active")).toBe(true);
      expect(
        Array.from(getShadow()!.querySelectorAll(".tab-btn")).map((btn) => btn.textContent?.trim()),
      ).toEqual(["Dock", "Shortcuts", "Editor", "Magnifier"]);
      expect(
        Array.from(getShadow()!.querySelectorAll(".dock-mode-option")).map((btn) =>
          btn.textContent?.trim(),
        ),
      ).toEqual(["Float", "Edge"]);
      expect(getActiveDockMode()!.textContent?.trim()).toBe("Float");
      expect(getDockModeOption("popup")).toBeNull();
      expect(getShadow()!.querySelector<HTMLInputElement>(".outside-click-toggle")!.checked).toBe(
        true,
      );
    });

    it("renders grouped dock entries and keeps settings locked visible", () => {
      fab = createFab();
      fab.mount();

      getGear()!.click();

      expect(
        Array.from(getShadow()!.querySelectorAll(".dock-entry-group-title")).map((el) =>
          el.textContent?.trim(),
        ),
      ).toEqual(["Capture", "Inspection", "Diagnostics", "System"]);
      const settingsToggle = getDockEntryToggle("settings")!;
      expect(settingsToggle.disabled).toBe(true);
      expect(settingsToggle.getAttribute("aria-pressed")).toBe("true");
      settingsToggle.click();
      expect(getGear()).not.toBeNull();
      expect(getDockEntryButtonIds()).toContain("settings");
    });

    it("ignores config attempts to hide settings", () => {
      fab = createFab({
        dockEntries: {
          order: ["grab", "settings", "logs"],
          hidden: ["settings", "logs"],
        },
      });
      fab.mount();

      expect(getDockEntryButtonIds()).toContain("settings");
      expect(getDockEntryButtonIds()).not.toContain("logs");
    });

    it("ignores localStorage attempts to hide settings and unknown ids", () => {
      localStorage.setItem(
        "vue-grab-dock-entries",
        JSON.stringify({
          order: ["logs", "missing", "settings"],
          hidden: ["settings", "network", "missing"],
        }),
      );
      fab = createFab();
      fab.mount();

      expect(getDockEntryButtonIds()[0]).toBe("logs");
      expect(getDockEntryButtonIds()).toContain("settings");
      expect(getDockEntryButtonIds()).not.toContain("network");
      expect(getDockEntryButtonIds()).toEqual([
        "logs",
        "settings",
        "grab",
        "magnifier",
        "measurer",
        "accessibility",
      ]);
    });

    it("hides toolbar entries and persists hidden ids", () => {
      fab = createFab();
      fab.mount();
      getGear()!.click();

      getDockEntryToggle("logs")!.click();

      expect(getShadow()!.querySelector(".logs-btn")).toBeNull();
      expect(getDockEntryButtonIds()).not.toContain("logs");
      expect(JSON.parse(localStorage.getItem("vue-grab-dock-entries")!)).toMatchObject({
        hidden: ["logs"],
      });
    });

    it("group toggles hide and restore hideable entries", () => {
      fab = createFab();
      fab.mount();
      getGear()!.click();

      getShadow()!
        .querySelector<HTMLButtonElement>('[data-dock-group-toggle="diagnostics"]')!
        .click();

      expect(getDockEntryButtonIds()).not.toContain("logs");
      expect(getDockEntryButtonIds()).not.toContain("network");

      getShadow()!
        .querySelector<HTMLButtonElement>('[data-dock-group-toggle="diagnostics"]')!
        .click();

      expect(getDockEntryButtonIds()).toContain("logs");
      expect(getDockEntryButtonIds()).toContain("network");
    });

    it("reorders entries within a feature group and persists order", () => {
      fab = createFab();
      fab.mount();
      getGear()!.click();

      getDockEntryRow("network")!
        .querySelector<HTMLButtonElement>('[data-direction="up"]')!
        .click();

      expect(getDockEntryButtonIds()).toEqual([
        "grab",
        "settings",
        "magnifier",
        "measurer",
        "accessibility",
        "network",
        "logs",
      ]);
      expect(JSON.parse(localStorage.getItem("vue-grab-dock-entries")!).order).toEqual([
        "grab",
        "settings",
        "magnifier",
        "measurer",
        "accessibility",
        "network",
        "logs",
      ]);
    });

    it("drag-reorders entries within a feature group and persists order", () => {
      fab = createFab();
      fab.mount();
      getGear()!.click();

      mockDockEntryRowRect("logs", 100);
      mockDockEntryRowRect("network", 152);
      dispatchDrag("dragstart", getDockEntryDragHandle("network")!);
      dispatchDrag("dragover", getDockEntryRow("logs")!, { clientY: 104 });
      dispatchDrag("drop", getDockEntryRow("logs")!, { clientY: 104 });

      expect(getDockEntryButtonIds()).toEqual([
        "grab",
        "settings",
        "magnifier",
        "measurer",
        "accessibility",
        "network",
        "logs",
      ]);
      expect(JSON.parse(localStorage.getItem("vue-grab-dock-entries")!).order).toEqual([
        "grab",
        "settings",
        "magnifier",
        "measurer",
        "accessibility",
        "network",
        "logs",
      ]);
    });

    it("ignores drag drops across feature groups", () => {
      fab = createFab();
      fab.mount();
      getGear()!.click();

      mockDockEntryRowRect("magnifier", 100);
      mockDockEntryRowRect("network", 152);
      dispatchDrag("dragstart", getDockEntryDragHandle("network")!);
      dispatchDrag("dragover", getDockEntryRow("magnifier")!, { clientY: 104 });
      dispatchDrag("drop", getDockEntryRow("magnifier")!, { clientY: 104 });

      expect(getDockEntryButtonIds()).toEqual([
        "grab",
        "settings",
        "magnifier",
        "measurer",
        "accessibility",
        "logs",
        "network",
      ]);
      expect(localStorage.getItem("vue-grab-dock-entries")).toBeNull();
    });

    it("uses configured dock mode before localStorage is set", () => {
      fab = createFab({ dockMode: "edge" });
      fab.mount();

      getGear()!.click();

      expect(getActiveDockMode()!.textContent?.trim()).toBe("Edge");
    });

    it("ignores stale popup dock mode values from storage", () => {
      localStorage.setItem("vue-grab-dock-mode", "popup");
      fab = createFab({ dockMode: "edge" });
      fab.mount();

      getGear()!.click();

      expect(getDockModeOption("popup")).toBeNull();
      expect(getActiveDockMode()!.textContent?.trim()).toBe("Float");
      expect(getShadow()!.querySelector(".fab-wrapper")!.classList.contains("edge")).toBe(false);
    });

    it("persists dock mode changes to localStorage and restores them", () => {
      fab = createFab();
      fab.mount();
      getGear()!.click();

      getDockModeOption("edge")!.click();

      expect(localStorage.getItem("vue-grab-dock-mode")).toBe("edge");
      expect(getActiveDockMode()!.textContent?.trim()).toBe("Edge");

      fab.destroy();
      cleanupDOM();
      fab = createFab({ dockMode: "float" });
      fab.mount();
      getGear()!.click();

      expect(getActiveDockMode()!.textContent?.trim()).toBe("Edge");
    });

    it("closes on outside click by default", () => {
      fab = createFab();
      fab.mount();

      getGear()!.click();
      clickOutside();

      expect(getExpandBody()!.classList.contains("open")).toBe(false);
    });

    it("keeps the panel open on outside click when the setting is disabled", () => {
      fab = createFab();
      fab.mount();

      getGear()!.click();
      getShadow()!.querySelector<HTMLInputElement>(".outside-click-toggle")!.click();
      clickOutside();

      expect(localStorage.getItem("vue-grab-close-on-outside-click")).toBe("false");
      expect(getExpandBody()!.classList.contains("open")).toBe(true);
    });

    it("Shortcuts tab displays current grab and measurer hotkeys", () => {
      fab = createFab();
      fab.mount();

      getGear()!.click();
      getSettingsTab("Shortcuts")!.click();
      fab.setCurrentHotkey("Alt+Shift+G");
      fab.setCurrentMeasurerHotkey("Alt+Shift+M");

      expect(getShadow()!.querySelector(".grab-hotkey-kbd")!.textContent).toBe("Alt+Shift+G");
      expect(getShadow()!.querySelector(".measurer-hotkey-kbd")!.textContent).toBe("Alt+Shift+M");
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
      getSettingsTab("Shortcuts")!.click();

      // Click record
      const recordBtn = getShadow()!.querySelector(".grab-record-btn") as HTMLElement;
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
      expect(getShadow()!.querySelector(".grab-hotkey-kbd")!.textContent).toBe("Ctrl+Shift+K");
    });

    it("measurer hotkey recording captures modifier+key combo from Shortcuts", () => {
      fab = createFab();
      const spy = vi.fn<() => void>();
      fab.onMeasurerHotkeyChange(spy);
      fab.mount();

      getGear()!.click();
      getSettingsTab("Shortcuts")!.click();

      const recordBtn = getShadow()!.querySelector(".measurer-record-btn") as HTMLElement;
      recordBtn.click();

      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "M",
          altKey: true,
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );

      expect(spy).toHaveBeenCalledWith("Alt+Shift+M");
      expect(getShadow()!.querySelector(".measurer-hotkey-kbd")!.textContent).toBe("Alt+Shift+M");
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
