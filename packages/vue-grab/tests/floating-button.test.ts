import { describe, it, expect, afterEach, vi } from "vitest";
import type { CapturedLog, CapturedRequest, GrabResult, LogLevel } from "@sakana-y/vue-grab-shared";
import {
  DEFAULT_FLOATING_BUTTON,
  DEFAULT_FLOATING_BUTTON_DOCK_ENTRY_ORDER,
} from "@sakana-y/vue-grab-shared";
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

function makeRequest(overrides: Partial<CapturedRequest> = {}): CapturedRequest {
  return {
    id: Math.random(),
    method: "GET",
    url: "https://example.com/api/items",
    initiator: "fetch",
    status: 200,
    statusClass: "2xx",
    startTime: 1,
    duration: 42,
    timestamp: Date.now(),
    count: 1,
    ...overrides,
  };
}

function makeGrabResult(overrides: Partial<GrabResult> = {}): GrabResult {
  return {
    element: document.createElement("button"),
    html: "<button>Grabbed</button>",
    componentStack: [],
    selector: "button",
    a11y: { attributes: [], audit: [], hasA11y: false },
    ...overrides,
  };
}

function makeVueComponentRoot(
  name: string,
  root: HTMLElement,
  filePath = `src/${name}.vue`,
): HTMLElement {
  root.setAttribute("data-testid", "grab-target");
  const instance = {
    type: { name, __file: filePath },
    subTree: { el: root },
  };
  (root as any).__vueParentComponent = instance;
  document.body.appendChild(root);
  return root;
}

function createFab(overrides: Partial<typeof DEFAULT_FLOATING_BUTTON> = {}): FloatingButton {
  return new FloatingButton({ ...DEFAULT_FLOATING_BUTTON, enabled: true, ...overrides });
}

function createFabWithAllToolbarEntries(
  overrides: Partial<typeof DEFAULT_FLOATING_BUTTON> = {},
): FloatingButton {
  return createFab({
    dockEntries: {
      order: [...DEFAULT_FLOATING_BUTTON_DOCK_ENTRY_ORDER],
      hidden: [],
    },
    ...overrides,
  });
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

function getShortcutRow(id: string): HTMLElement | null {
  return getShadow()?.querySelector<HTMLElement>(`[data-shortcut-row="${id}"]`) ?? null;
}

function getShortcutRecordButton(id: string): HTMLElement | null {
  return getShadow()?.querySelector<HTMLElement>(`[data-shortcut-record="${id}"]`) ?? null;
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

      expect(getDockEntryButtonIds()).toEqual(["grab", "settings", "measurer", "accessibility"]);
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
      fab = createFabWithAllToolbarEntries({
        dockMode: "float",
        initialPosition: "bottom-right",
      });
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
      ).toEqual(["Dock", "Shortcuts", "Tools"]);
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

    it("renders Dock controls with settings-style rows and lists", () => {
      fab = createFab();
      fab.mount();

      getGear()!.click();

      const dockTab = getShadow()!.querySelector<HTMLElement>('[data-tab-content="dock"]')!;
      expect(dockTab.querySelector('[data-settings-row="dock-mode"]')).not.toBeNull();
      expect(dockTab.querySelector('[data-settings-row="outside-click"]')).not.toBeNull();
      expect(dockTab.querySelector(".dock-settings-list")).not.toBeNull();
      expect(dockTab.querySelectorAll(".dock-entry-list")).toHaveLength(4);
      expect(getDockEntryRow("grab")!.classList.contains("setting-row")).toBe(true);
      expect(getDockEntryRow("grab")!.closest(".settings-list")).not.toBeNull();
      expect(getDockEntryRow("grab")!.querySelector(".setting-row-title")!.textContent).toBe(
        "Grab",
      );
      expect(getDockEntryRow("grab")!.querySelector("[data-dock-entry-drag]")).not.toBeNull();
      expect(getDockEntryRow("grab")!.querySelector("[data-dock-entry-toggle]")).not.toBeNull();
      expect(
        getDockEntryRow("grab")!.querySelector('[data-dock-entry-move][data-direction="up"]'),
      ).not.toBeNull();
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

    it("renders beta labels for hidden beta dock entries", () => {
      fab = createFab();
      fab.mount();

      getGear()!.click();

      const expectedBetaIds = DEFAULT_FLOATING_BUTTON.dockEntries.hidden;
      const betaRows = Array.from(
        getShadow()!.querySelectorAll<HTMLElement>(".dock-entry-row:has(.dock-entry-badge)"),
      );
      expect(getDockEntryButtonIds()).toEqual(["grab", "settings", "measurer", "accessibility"]);
      expect(betaRows.map((row) => row.dataset.dockEntryRow)).toEqual(expectedBetaIds);
      for (const id of expectedBetaIds) {
        const row = getDockEntryRow(id)!;
        expect(row).not.toBeNull();
        expect(getDockEntryToggle(id)!.getAttribute("aria-pressed")).toBe("false");
        expect(row.querySelector(".dock-entry-badge")?.textContent).toBe("Beta");
      }
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
      fab = createFabWithAllToolbarEntries();
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
      fab = createFabWithAllToolbarEntries();
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
      fab = createFabWithAllToolbarEntries();
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
      fab = createFabWithAllToolbarEntries();
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
      fab = createFabWithAllToolbarEntries();
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

    it("Shortcuts tab only renders keybinding controls", () => {
      fab = createFab();
      fab.mount();

      getGear()!.click();
      getSettingsTab("Shortcuts")!.click();

      const shortcuts = getShadow()!.querySelector('[data-tab-content="shortcuts"]')!;
      expect(shortcuts.querySelectorAll(".shortcut-row")).toHaveLength(7);
      expect(
        Array.from(shortcuts.querySelectorAll<HTMLElement>(".setting-row-title")).map((el) =>
          el.textContent?.trim(),
        ),
      ).toEqual([
        "Grab element",
        "Open settings",
        "Magnifier",
        "Measure spacing",
        "Accessibility",
        "Logs",
        "Network",
      ]);
      expect(shortcuts.querySelector(".grab-hotkey-kbd")).not.toBeNull();
      expect(shortcuts.querySelector(".measurer-hotkey-kbd")).not.toBeNull();
      expect(shortcuts.querySelector(".editor-select")).toBeNull();
      expect(shortcuts.querySelector(".magnifier-size-slider")).toBeNull();
      expect(shortcuts.querySelector(".magnifier-zoom-slider")).toBeNull();
    });

    it("records and persists additional feature shortcuts", () => {
      fab = createFab();
      const spy = vi.fn<(shortcuts: Record<string, string[]>) => void>();
      fab.onShortcutsChange(spy);
      fab.mount();

      getGear()!.click();
      getSettingsTab("Shortcuts")!.click();
      getShortcutRecordButton("logs")!.click();
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "L",
          ctrlKey: true,
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );

      expect(fab.getShortcuts().logs).toEqual(["Ctrl+Shift+L"]);
      expect(JSON.parse(localStorage.getItem("vue-grab-shortcuts")!)).toMatchObject({
        logs: ["Ctrl+Shift+L"],
      });
      expect(getShortcutRow("logs")!.textContent).toContain("Ctrl+Shift+L");
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ logs: ["Ctrl+Shift+L"] }));
    });

    it("removes feature shortcuts and persists the updated map", () => {
      fab = createFab({ shortcuts: { ...DEFAULT_FLOATING_BUTTON.shortcuts, logs: ["Ctrl+L"] } });
      fab.mount();

      getGear()!.click();
      getSettingsTab("Shortcuts")!.click();
      getShortcutRow("logs")!
        .querySelector<HTMLButtonElement>('[data-shortcut-remove="logs"]')!
        .click();

      expect(fab.getShortcuts().logs).toBeUndefined();
      expect(JSON.parse(localStorage.getItem("vue-grab-shortcuts")!)).not.toHaveProperty("logs");
      expect(getShortcutRow("logs")!.textContent).toContain("Add shortcut");
    });

    it("rejects duplicate shortcuts across features", () => {
      fab = createFab();
      fab.mount();

      getGear()!.click();
      getSettingsTab("Shortcuts")!.click();
      getShortcutRecordButton("logs")!.click();
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "G",
          altKey: true,
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );

      expect(fab.getShortcuts().logs).toBeUndefined();
      expect(getShortcutRow("logs")!.textContent).toContain("Already used by another feature");
    });

    it("migrates legacy grab and measurer hotkey storage when shortcut storage is absent", () => {
      localStorage.setItem("vue-grab-hotkey", "Ctrl+Shift+G");
      localStorage.setItem("vue-grab-measurer-hotkey", "Ctrl+Shift+M");

      fab = createFab();

      expect(fab.getShortcuts().grab).toEqual(["Ctrl+Shift+G"]);
      expect(fab.getShortcuts().measurer).toEqual(["Ctrl+Shift+M"]);
    });

    it("Tools tab renders editor and magnifier controls", () => {
      fab = createFab();
      fab.mount();

      getGear()!.click();
      getSettingsTab("Tools")!.click();

      const tools = getShadow()!.querySelector('[data-tab-content="tools"]')!;
      expect(tools.querySelector(".editor-select")).not.toBeNull();
      expect(tools.querySelector(".file-path-display")!.textContent).toBe("No element grabbed yet");
      expect(tools.querySelector<HTMLButtonElement>(".open-file-btn")!.disabled).toBe(true);
      expect(tools.querySelector(".magnifier-size-slider")).not.toBeNull();
      expect(tools.querySelector(".magnifier-zoom-slider")).not.toBeNull();
    });

    it("Tools tab initializes magnifier controls from injected runtime config", () => {
      fab = createFab();
      fab.setMagnifierConfig({ loupeSize: 250, zoomLevel: 2.5 });
      fab.mount();

      getGear()!.click();
      getSettingsTab("Tools")!.click();

      const size = getShadow()!.querySelector<HTMLInputElement>(".magnifier-size-slider")!;
      const zoom = getShadow()!.querySelector<HTMLInputElement>(".magnifier-zoom-slider")!;
      expect(size.value).toBe("250");
      expect(zoom.value).toBe("2.5");
      expect(size.parentElement!.querySelector(".slider-value")!.textContent).toBe("250px");
      expect(zoom.parentElement!.querySelector(".slider-value")!.textContent).toBe("2.5x");
    });

    it("Tools tab persists editor choice", () => {
      fab = createFab();
      fab.mount();

      getGear()!.click();
      getSettingsTab("Tools")!.click();
      const select = getShadow()!.querySelector<HTMLSelectElement>(".editor-select")!;
      select.value = "cursor";
      select.dispatchEvent(new Event("change", { bubbles: true }));

      expect(fab.getEditorChoice()).toBe("cursor");
      expect(localStorage.getItem("vue-grab-editor")).toBe("cursor");
    });

    it("Tools tab opens the last grabbed file with the selected editor", async () => {
      const fetchSpy = vi.fn<typeof fetch>(() =>
        Promise.resolve(new Response(null, { status: 204 })),
      );
      vi.stubGlobal("fetch", fetchSpy);
      fab = createFab();
      fab.mount();
      fab.setLastResult(
        makeGrabResult({
          componentStack: [{ name: "Panel", filePath: "src/Panel.vue", line: 42 }],
        }),
      );

      getGear()!.click();
      getSettingsTab("Tools")!.click();
      const select = getShadow()!.querySelector<HTMLSelectElement>(".editor-select")!;
      select.value = "code";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      const openBtn = getShadow()!.querySelector<HTMLButtonElement>(".open-file-btn")!;
      expect(openBtn.disabled).toBe(false);
      openBtn.click();

      await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledOnce());
      expect(JSON.parse(fetchSpy.mock.calls[0]![1]!.body as string)).toEqual({
        file: "src/Panel.vue",
        line: 42,
        editor: "code",
      });
    });

    it("Tools tab emits magnifier slider changes", () => {
      fab = createFab();
      const spy = vi.fn<(config: { loupeSize?: number; zoomLevel?: number }) => void>();
      fab.onMagnifierConfigChange(spy);
      fab.mount();

      getGear()!.click();
      getSettingsTab("Tools")!.click();
      const size = getShadow()!.querySelector<HTMLInputElement>(".magnifier-size-slider")!;
      const zoom = getShadow()!.querySelector<HTMLInputElement>(".magnifier-zoom-slider")!;
      size.value = "500";
      size.dispatchEvent(new Event("input", { bubbles: true }));
      zoom.value = "4.5";
      zoom.dispatchEvent(new Event("input", { bubbles: true }));

      expect(spy).toHaveBeenNthCalledWith(1, { loupeSize: 500 });
      expect(spy).toHaveBeenNthCalledWith(2, { zoomLevel: 4.5 });
      expect(size.parentElement!.querySelector(".slider-value")!.textContent).toBe("500px");
      expect(zoom.parentElement!.querySelector(".slider-value")!.textContent).toBe("4.5x");
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

    it("cancels stale transition restoration frames when closing repeatedly", () => {
      const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
      const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
      let nextRafId = 0;
      const requestSpy = vi.fn<(cb: FrameRequestCallback) => number>(() => ++nextRafId);
      const cancelSpy = vi.fn<(handle: number) => void>();
      vi.stubGlobal("requestAnimationFrame", requestSpy);
      vi.stubGlobal("cancelAnimationFrame", cancelSpy);

      try {
        fab = createFab();
        fab.mount();

        getGear()!.click();
        getGear()!.click();
        getGear()!.click();
        getGear()!.click();

        expect(requestSpy).toHaveBeenCalledTimes(2);
        expect(cancelSpy).toHaveBeenCalledWith(1);
      } finally {
        vi.stubGlobal("requestAnimationFrame", originalRequestAnimationFrame);
        vi.stubGlobal("cancelAnimationFrame", originalCancelAnimationFrame);
      }
    });

    it("hotkey recording adds modifier+key combo", () => {
      fab = createFab();
      const spy = vi.fn<(shortcuts: Record<string, string[]>) => void>();
      fab.onShortcutsChange(spy);
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

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ grab: ["Alt+Shift+G", "Ctrl+Shift+K"] }),
      );
      expect(fab.getShortcuts().grab).toEqual(["Alt+Shift+G", "Ctrl+Shift+K"]);
      expect(getShadow()!.querySelector(".grab-hotkey-kbd")!.textContent).toBe("Alt+Shift+G");
      expect(getShortcutRow("grab")!.textContent).toContain("Ctrl+Shift+K");
    });

    it("measurer hotkey recording adds modifier+key combo from Shortcuts", () => {
      fab = createFab();
      const spy = vi.fn<(shortcuts: Record<string, string[]>) => void>();
      fab.onShortcutsChange(spy);
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

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ measurer: ["Alt+Shift+M"] }));
      expect(getShadow()!.querySelector(".measurer-hotkey-kbd")!.textContent).toBe("Alt+Shift+M");
    });
  });

  describe("accessibility panel", () => {
    function getA11yBtn(): HTMLElement | null {
      return getShadow()?.querySelector(".a11y-btn") ?? null;
    }
    function getA11yPanel(): HTMLElement | null {
      return getShadow()?.querySelector(".a11y-panel") ?? null;
    }
    function createA11yFixtures(): void {
      const issueRoot = document.createElement("section");
      const unlabeledButton = document.createElement("button");
      issueRoot.appendChild(unlabeledButton);
      makeVueComponentRoot("IssuePanel", issueRoot, "src/IssuePanel.vue");

      const neutralRoot = document.createElement("article");
      neutralRoot.textContent = "Plain content";
      makeVueComponentRoot("PlainPanel", neutralRoot, "src/PlainPanel.vue");

      const passingRoot = document.createElement("nav");
      passingRoot.setAttribute("aria-label", "Primary");
      const passingButton = document.createElement("button");
      passingButton.textContent = "Save";
      passingRoot.appendChild(passingButton);
      makeVueComponentRoot("PassingPanel", passingRoot, "src/PassingPanel.vue");
    }

    it("renders audit content with settings-style compact rows", () => {
      createA11yFixtures();
      fab = createFabWithAllToolbarEntries();
      fab.mount();

      getA11yBtn()!.click();

      const panel = getA11yPanel()!;
      expect(panel).not.toBeNull();
      expect(panel.querySelector(".a11y-header")).not.toBeNull();
      expect(panel.querySelector(".a11y-summary")!.classList.contains("a11y-summary-strip")).toBe(
        true,
      );
      expect(panel.querySelector(".a11y-summary")!.classList.contains("setting-row")).toBe(false);
      expect(panel.querySelector(".a11y-summary")!.closest(".settings-list")).toBeNull();
      expect(panel.querySelectorAll(".a11y-audit-list")).toHaveLength(3);

      const row = panel.querySelector<HTMLElement>('[data-a11y-status="fail"]')!;
      expect(row.classList.contains("setting-row")).toBe(true);
      expect(row.closest(".settings-list")).not.toBeNull();
      expect(row.querySelector(".setting-row-icon")).not.toBeNull();
      expect(row.querySelector(".setting-row-title")!.textContent).toContain("<IssuePanel>");
      expect(row.querySelector(".setting-row-description")!.textContent).toBe("src/IssuePanel.vue");
      expect(row.querySelector(".setting-row-control")).not.toBeNull();
    });

    it("keeps summary counts for passing, issues, neutral, and total", () => {
      createA11yFixtures();
      fab = createFabWithAllToolbarEntries();
      fab.mount();

      getA11yBtn()!.click();

      const summaryText = getA11yPanel()!
        .querySelector(".a11y-summary")!
        .textContent!.replace(/\s+/g, " ")
        .trim();
      expect(summaryText).toBe(
        "1 passing \u00B7 1 with issues \u00B7 1 no a11y attrs \u00B7 3 total",
      );
      expect(
        Array.from(getA11yPanel()!.querySelectorAll<HTMLElement>(".a11y-summary-count")).map(
          (item) => item.textContent,
        ),
      ).toEqual(["1", "1", "1", "3"]);
      expect(
        Array.from(getA11yPanel()!.querySelectorAll(".a11y-group-label")).map((label) =>
          label.textContent?.trim(),
        ),
      ).toEqual(["Issues 1", "No Accessibility 1", "Passing 1"]);
    });

    it("re-scans with loading state and refreshes cached results", async () => {
      const neutralRoot = document.createElement("article");
      neutralRoot.textContent = "Plain content";
      makeVueComponentRoot("PlainPanel", neutralRoot, "src/PlainPanel.vue");
      fab = createFabWithAllToolbarEntries();
      fab.mount();

      getA11yBtn()!.click();
      expect(getA11yPanel()!.querySelector(".a11y-summary")!.textContent).toContain("1 total");

      const issueRoot = document.createElement("section");
      const unlabeledButton = document.createElement("button");
      issueRoot.appendChild(unlabeledButton);
      makeVueComponentRoot("IssuePanel", issueRoot, "src/IssuePanel.vue");

      await new Promise((resolve) => setTimeout(resolve, 510));
      const rescan = getA11yPanel()!.querySelector<HTMLElement>(".a11y-rescan-btn")!;
      rescan.click();

      expect(rescan.textContent).toBe("Scanning\u2026");
      expect(rescan.classList.contains("a11y-rescan-btn--loading")).toBe(true);

      await new Promise((resolve) => requestAnimationFrame(resolve));

      const summary = Array.from(
        getA11yPanel()!.querySelectorAll<HTMLElement>(".a11y-summary-count"),
      ).map((item) => item.textContent);
      expect(summary).toEqual(["0", "1", "1", "2"]);
    });

    it("toggles child detail drawers and chevron state", () => {
      createA11yFixtures();
      fab = createFabWithAllToolbarEntries();
      fab.mount();

      getA11yBtn()!.click();

      const toggle = getA11yPanel()!.querySelector<HTMLElement>(".a11y-row-toggle")!;
      const details = toggle.querySelector<HTMLElement>(".a11y-child-details")!;
      const chevron = toggle.querySelector<HTMLElement>(".a11y-row-chevron")!;

      expect(details.classList.contains("open")).toBe(false);
      toggle.click();

      expect(details.classList.contains("open")).toBe(true);
      expect(chevron.classList.contains("open")).toBe(true);
      expect(details.querySelector(".a11y-child-surface")).not.toBeNull();
      expect(details.textContent).toContain("has no accessible name");
    });

    it("renders a compact empty state when no Vue components are found", () => {
      fab = createFabWithAllToolbarEntries();
      fab.mount();

      getA11yBtn()!.click();

      expect(getA11yPanel()).not.toBeNull();
      expect(getA11yPanel()!.querySelector(".a11y-empty")!.textContent).toBe(
        "No Vue components found on this page",
      );
      expect(getA11yPanel()!.querySelector(".settings-list")).toBeNull();
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
    function getNetworkPanel(): HTMLElement | null {
      return getShadow()?.querySelector(".network-panel") ?? null;
    }
    function getNetworkBtn(): HTMLElement | null {
      return getShadow()?.querySelector(".network-btn") ?? null;
    }
    function getNetworkPills(): NodeListOf<HTMLElement> {
      return getShadow()!.querySelectorAll<HTMLElement>(".net-pill");
    }
    function getNetworkRows(): NodeListOf<HTMLElement> {
      return getShadow()!.querySelectorAll<HTMLElement>(".net-row");
    }
    function getNetworkSearch(): HTMLInputElement | null {
      return getShadow()?.querySelector<HTMLInputElement>(".net-search") ?? null;
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
      fab = createFabWithAllToolbarEntries();
      fab.mount();

      getLogsBtn()!.click();
      expect(getLogsPanel()).not.toBeNull();
      expect(getPills()).toHaveLength(5);
      expect(getShadow()!.querySelector(".logs-panel-meta")!.textContent).toBe("No entries yet");
      expect(
        Array.from(getShadow()!.querySelectorAll(".logs-section-label")).map((label) =>
          label.textContent?.trim(),
        ),
      ).toEqual(["Overview", "Levels", "Entries"]);
      expect(getShadow()!.querySelector(".logs-level-list")).not.toBeNull();
    });

    it("renders a compact empty state before any logs are captured", () => {
      fab = createFabWithAllToolbarEntries();
      fab.mount();

      getLogsBtn()!.click();

      const panel = getLogsPanel()!;
      const entriesSection = getShadow()!.querySelector<HTMLElement>(".logs-entries-section")!;
      const emptyList = getShadow()!.querySelector<HTMLElement>(".logs-empty-list")!;

      expect(panel.classList.contains("is-empty")).toBe(true);
      expect(getComputedStyle(panel).display).toBe("flex");
      expect(entriesSection).not.toBeNull();
      expect(getComputedStyle(entriesSection).flexGrow).toBe("1");
      expect(getSearch()).toBeNull();
      expect(getShadow()!.querySelector(".logs-list")).not.toBeNull();
      expect(emptyList.classList.contains("settings-list")).toBe(true);
      expect(getComputedStyle(emptyList).flexGrow).toBe("1");
      expect(Number.parseFloat(getComputedStyle(emptyList).minHeight)).toBeGreaterThan(100);
      expect(getShadow()!.querySelector(".logs-empty-compact")!.textContent).toBe(
        "No logs captured yet",
      );
      expect(getComputedStyle(getExpandBody()!).height).not.toBe("auto");
      expect(getShadow()!.querySelector("style")!.textContent).not.toContain(
        ".expand-body:has(.logs-panel.is-empty)",
      );
    });

    it("badge counts only warn + error levels", () => {
      fab = createFabWithAllToolbarEntries();
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
      fab = createFabWithAllToolbarEntries();
      fab.mount();
      fab.setLogs([makeLog("warn", "a"), makeLog("error", "b")]);
      expect(getLogsBadge()!.classList.contains("has-error")).toBe(true);
    });

    it("badge does not have has-error class when only warnings exist", () => {
      fab = createFabWithAllToolbarEntries();
      fab.mount();
      fab.setLogs([makeLog("warn", "a"), makeLog("warn", "b")]);
      expect(getLogsBadge()!.classList.contains("has-error")).toBe(false);
    });

    it("badge is hidden when there are no warn or error entries", () => {
      fab = createFabWithAllToolbarEntries();
      fab.mount();
      fab.setLogs([makeLog("log", "a"), makeLog("info", "b")]);
      expect(getLogsBadge()!.style.display).toBe("none");
    });

    it("clicking a level pill toggles visibility of rows at that level", () => {
      fab = createFabWithAllToolbarEntries();
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
      fab = createFabWithAllToolbarEntries();
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
      expect(getShadow()!.querySelector(".logs-panel-meta")!.textContent).toBe("2 of 3 entries");
    });

    it("keeps search visible when filters leave a non-empty log set with no matches", async () => {
      fab = createFabWithAllToolbarEntries();
      fab.mount();
      fab.setLogs([makeLog("log", "alpha")]);

      getLogsBtn()!.click();
      const search = getSearch()!;
      search.value = "missing";
      search.dispatchEvent(new Event("input", { bubbles: true }));

      await new Promise((r) => setTimeout(r, 150));

      expect(getLogsPanel()!.classList.contains("is-empty")).toBe(false);
      expect(getSearch()).not.toBeNull();
      expect(getShadow()!.querySelector(".logs-list")).not.toBeNull();
      expect(getShadow()!.querySelector(".logs-empty")!.textContent).toBe(
        "No logs match the current filter",
      );
    });

    it("Clear button triggers onLogsClear callback", () => {
      fab = createFabWithAllToolbarEntries();
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
      fab = createFabWithAllToolbarEntries();
      fab.mount();
      fab.setLogs([makeLog("error", "boom", { source: "runtime" })]);

      getLogsBtn()!.click();
      const row = getShadow()!.querySelector<HTMLElement>(".log-row")!;
      const sourceBadge = row.querySelector(".log-row-source");
      expect(sourceBadge).not.toBeNull();
      expect(sourceBadge!.textContent).toBe("runtime");
    });

    it("console-source entries do not render a source badge", () => {
      fab = createFabWithAllToolbarEntries();
      fab.mount();
      fab.setLogs([makeLog("log", "hi")]);

      getLogsBtn()!.click();
      const row = getShadow()!.querySelector<HTMLElement>(".log-row")!;
      expect(row.querySelector(".log-row-source")).toBeNull();
    });

    it("renders entries in a settings-style list with compact one-line rows", () => {
      fab = createFabWithAllToolbarEntries();
      fab.mount();
      fab.setLogs([makeLog("warn", "settings aligned row", { count: 3 })]);

      getLogsBtn()!.click();

      expect(getShadow()!.querySelector(".logs-list")).not.toBeNull();
      expect(getShadow()!.querySelectorAll(".logs-section-label")).toHaveLength(3);
      expect(getShadow()!.querySelector(".logs-panel-meta")!.textContent).toBe("1 of 1 entry");
      expect(getShadow()!.querySelector(".logs-overview-list")).not.toBeNull();
      expect(getShadow()!.querySelector(".logs-level-list")).not.toBeNull();
      const row = getShadow()!.querySelector<HTMLElement>(".log-row")!;
      expect(row.closest(".logs-list")).not.toBeNull();
      expect(row.querySelector(".log-row-header")!.tagName).toBe("BUTTON");
      expect(row.querySelector(".log-row-header")!.classList.contains("setting-row")).toBe(true);
      expect(row.querySelector(".log-row-dot")).not.toBeNull();
      expect(row.querySelector(".log-row-msg")!.textContent).toBe("settings aligned row");
      expect(row.querySelector(".log-row-count")!.textContent).toBe("×3");
    });

    it("expands a compact drawer with details and actions", () => {
      fab = createFabWithAllToolbarEntries();
      fab.mount();
      fab.setLogs([
        makeLog("error", "boom", {
          stack: "Error: boom\n at setup",
          vueInfo: "mounted hook",
          sourceFile: "/src/App.vue",
        }),
      ]);

      getLogsBtn()!.click();
      const header = getShadow()!.querySelector<HTMLElement>(".log-row-header")!;
      const details = getShadow()!.querySelector<HTMLElement>(".log-row-details")!;
      const chevron = getShadow()!.querySelector<HTMLElement>(".log-row-chevron")!;

      expect(details.classList.contains("open")).toBe(false);
      header.click();

      expect(details.classList.contains("open")).toBe(true);
      expect(chevron.classList.contains("open")).toBe(true);
      expect(details.querySelector(".log-row-detail-surface")).not.toBeNull();
      expect(details.textContent).toContain("Vue: mounted hook");
      expect(details.textContent).toContain("Error: boom");
      expect(details.querySelector("[data-log-copy]")).not.toBeNull();
      expect(details.querySelector("[data-log-claude]")).not.toBeNull();
      expect(details.querySelector("[data-log-open]")).not.toBeNull();
    });

    it("keeps large console log sets scrollable inside the entries list", () => {
      fab = createFabWithAllToolbarEntries();
      fab.mount();
      fab.setLogs(
        Array.from({ length: 28 }, (_, index) =>
          makeLog(index % 2 === 0 ? "warn" : "error", `scrollable log ${index}`, {
            id: index,
            timestamp: Date.now() + index,
          }),
        ),
      );

      getLogsBtn()!.click();

      const panel = getLogsPanel()!;
      const entriesSection = getShadow()!.querySelector<HTMLElement>(".logs-entries-section")!;
      const list = getShadow()!.querySelector<HTMLElement>(".logs-list")!;
      const panelHeight = Number.parseFloat(getComputedStyle(panel).height);
      const expandBodyHeight = Number.parseFloat(getComputedStyle(getExpandBody()!).height);

      expect(getRows()).toHaveLength(28);
      expect(panelHeight).toBeGreaterThan(0);
      expect(panelHeight).toBeLessThanOrEqual(expandBodyHeight);
      expect(getComputedStyle(panel).minHeight).toBe("0px");
      expect(getComputedStyle(panel).overflowY).toBe("hidden");
      expect(getComputedStyle(entriesSection).overflowY).toBe("hidden");
      expect(getComputedStyle(entriesSection).minHeight).toBe("0px");
      expect(getComputedStyle(list).overflowY).toBe("auto");
      expect(getComputedStyle(list).flexGrow).toBe("1");
      expect(getComputedStyle(list).minHeight).toBe("0px");
      expect(list.classList.contains("logs-empty-list")).toBe(false);
    });

    it("expands only the selected console log row inside the scrollable list", () => {
      fab = createFabWithAllToolbarEntries();
      fab.mount();
      fab.setLogs([
        makeLog("error", "first expandable", { id: 1, stack: "Error: first" }),
        makeLog("error", "second stays closed", { id: 2, stack: "Error: second" }),
      ]);

      getLogsBtn()!.click();

      const rows = Array.from(getRows());
      const firstHeader = rows[0].querySelector<HTMLElement>(".log-row-header")!;
      const firstDetails = rows[0].querySelector<HTMLElement>(".log-row-details")!;
      const secondDetails = rows[1].querySelector<HTMLElement>(".log-row-details")!;
      const list = getShadow()!.querySelector<HTMLElement>(".logs-list")!;

      expect(getComputedStyle(list).overflowY).toBe("auto");
      expect(firstDetails.classList.contains("open")).toBe(false);
      expect(secondDetails.classList.contains("open")).toBe(false);

      firstHeader.click();

      expect(firstDetails.classList.contains("open")).toBe(true);
      expect(secondDetails.classList.contains("open")).toBe(false);
      expect(getComputedStyle(list).overflowY).toBe("auto");
      expect(getComputedStyle(getLogsPanel()!).overflowY).toBe("hidden");
    });

    it("renders the network panel with console-style sections", () => {
      fab = createFabWithAllToolbarEntries();
      fab.mount();
      fab.setNetwork([makeRequest()]);

      getNetworkBtn()!.click();

      expect(getNetworkPanel()).not.toBeNull();
      expect(
        Array.from(getShadow()!.querySelectorAll(".network-section-label")).map((label) =>
          label.textContent?.trim(),
        ),
      ).toEqual(["Overview", "Status", "Requests"]);
      expect(getNetworkPanel()!.querySelector(".network-overview-list")).not.toBeNull();
      expect(getNetworkPanel()!.querySelector(".network-status-list")).not.toBeNull();
      expect(getNetworkPanel()!.querySelector(".network-list")).not.toBeNull();
      expect(getNetworkPanel()!.querySelector(".network-panel-meta")!.textContent).toBe(
        "1 of 1 request",
      );
      expect(getNetworkPills()).toHaveLength(5);
      expect(getNetworkPanel()!.querySelector(".net-row")).not.toBeNull();
    });

    it("renders a compact empty network state before any requests are captured", () => {
      fab = createFabWithAllToolbarEntries();
      fab.mount();

      getNetworkBtn()!.click();

      const panel = getNetworkPanel()!;
      const requestsSection = getShadow()!.querySelector<HTMLElement>(".network-requests-section")!;
      const emptyList = getShadow()!.querySelector<HTMLElement>(".network-empty-list")!;

      expect(panel.classList.contains("is-empty")).toBe(true);
      expect(getComputedStyle(panel).display).toBe("flex");
      expect(requestsSection).not.toBeNull();
      expect(getComputedStyle(requestsSection).flexGrow).toBe("1");
      expect(getNetworkSearch()).toBeNull();
      expect(emptyList.classList.contains("settings-list")).toBe(true);
      expect(getComputedStyle(emptyList).flexGrow).toBe("1");
      expect(getShadow()!.querySelector(".net-empty-compact")!.textContent).toBe(
        "No network activity captured",
      );
      expect(getShadow()!.querySelector(".network-panel-meta")!.textContent).toBe(
        "No requests yet",
      );
    });

    it("keeps large network request sets scrollable inside the request list", () => {
      fab = createFabWithAllToolbarEntries();
      fab.mount();
      fab.setNetwork(
        Array.from({ length: 24 }, (_, index) =>
          makeRequest({
            id: index,
            timestamp: Date.now() + index,
            url: `https://example.com/api/items/${index}`,
          }),
        ),
      );

      getNetworkBtn()!.click();

      const panel = getNetworkPanel()!;
      const requestsSection = getShadow()!.querySelector<HTMLElement>(".network-requests-section")!;
      const list = getShadow()!.querySelector<HTMLElement>(".network-list")!;
      const panelHeight = Number.parseFloat(getComputedStyle(panel).height);
      const expandBodyHeight = Number.parseFloat(getComputedStyle(getExpandBody()!).height);

      expect(getNetworkRows()).toHaveLength(24);
      expect(panelHeight).toBeGreaterThan(0);
      expect(panelHeight).toBeLessThanOrEqual(expandBodyHeight);
      expect(getComputedStyle(panel).minHeight).toBe("0px");
      expect(getComputedStyle(panel).overflowY).toBe("hidden");
      expect(getComputedStyle(requestsSection).overflowY).toBe("hidden");
      expect(getComputedStyle(requestsSection).minHeight).toBe("0px");
      expect(getComputedStyle(list).overflowY).toBe("auto");
      expect(getComputedStyle(list).flexGrow).toBe("1");
      expect(getComputedStyle(list).minHeight).toBe("0px");
      expect(list.classList.contains("network-empty-list")).toBe(false);
    });

    it("keeps the network status row stable when toggling active categories", () => {
      fab = createFabWithAllToolbarEntries();
      fab.mount();
      fab.setNetwork([
        makeRequest({ status: 200, statusClass: "2xx", url: "https://example.com/ok" }),
        makeRequest({ status: 500, statusClass: "5xx", url: "https://example.com/failure" }),
        makeRequest({
          status: undefined,
          statusClass: "failed",
          url: "https://vg-unreachable.invalid/",
        }),
      ]);

      getNetworkBtn()!.click();

      const statusRow = getShadow()!.querySelector<HTMLElement>(".network-status-row")!;
      const requestsLabel = getShadow()!.querySelector<HTMLElement>(
        ".network-requests-section .network-section-label",
      )!;
      const initialHeight = statusRow.getBoundingClientRect().height;
      const initialLabelTop = requestsLabel.getBoundingClientRect().top;
      const initialPillHeights = Array.from(getNetworkPills()).map(
        (pill) => pill.getBoundingClientRect().height,
      );

      getShadow()!.querySelector<HTMLElement>('.net-pill[data-status="2xx"]')!.click();

      const updatedStatusRow = getShadow()!.querySelector<HTMLElement>(".network-status-row")!;
      const updatedRequestsLabel = getShadow()!.querySelector<HTMLElement>(
        ".network-requests-section .network-section-label",
      )!;

      expect(updatedStatusRow.getBoundingClientRect().height).toBe(initialHeight);
      expect(updatedRequestsLabel.getBoundingClientRect().top).toBe(initialLabelTop);
      expect(
        Array.from(getNetworkPills()).map((pill) => pill.getBoundingClientRect().height),
      ).toEqual(initialPillHeights);
      expect(getComputedStyle(getNetworkPills()[0]).flexShrink).toBe("0");
      expect(
        getShadow()!.querySelector(".network-status-row .setting-row-description")!.textContent,
      ).toBe("4 of 5 active");
    });

    it("status pills filter network rows and update overview meta", () => {
      fab = createFabWithAllToolbarEntries();
      fab.mount();
      fab.setNetwork([
        makeRequest({ status: 200, statusClass: "2xx", url: "https://example.com/ok" }),
        makeRequest({ status: 404, statusClass: "4xx", url: "https://example.com/missing" }),
        makeRequest({
          status: 500,
          statusClass: "5xx",
          url: "https://example.com/failure",
        }),
      ]);

      getNetworkBtn()!.click();
      expect(getNetworkRows()).toHaveLength(3);

      getShadow()!.querySelector<HTMLElement>('.net-pill[data-status="4xx"]')!.click();
      expect(getNetworkRows()).toHaveLength(2);
      expect(Array.from(getNetworkRows()).map((row) => row.dataset.status)).not.toContain("4xx");
      expect(getShadow()!.querySelector(".network-panel-meta")!.textContent).toBe(
        "2 of 3 requests",
      );
      expect(
        getShadow()!.querySelector(".network-status-row .setting-row-description")!.textContent,
      ).toBe("4 of 5 active");
    });

    it("search filters network rows by URL and stays visible for no matches", async () => {
      fab = createFabWithAllToolbarEntries();
      fab.mount();
      fab.setNetwork([
        makeRequest({ url: "https://example.com/api/users" }),
        makeRequest({ url: "https://example.com/api/projects" }),
      ]);

      getNetworkBtn()!.click();
      const search = getNetworkSearch()!;
      search.value = "users";
      search.dispatchEvent(new Event("input", { bubbles: true }));

      await new Promise((r) => setTimeout(r, 150));

      expect(getNetworkRows()).toHaveLength(1);
      expect(getNetworkRows()[0].querySelector(".net-row-url")!.textContent).toContain("users");
      expect(getShadow()!.querySelector(".network-panel-meta")!.textContent).toBe(
        "1 of 2 requests",
      );

      const nextSearch = getNetworkSearch()!;
      nextSearch.value = "missing";
      nextSearch.dispatchEvent(new Event("input", { bubbles: true }));

      await new Promise((r) => setTimeout(r, 150));

      expect(getNetworkSearch()).not.toBeNull();
      expect(getNetworkRows()).toHaveLength(0);
      expect(getShadow()!.querySelector(".net-empty")!.textContent).toBe(
        "No requests match the current filter",
      );
    });

    it("renders URL-first network rows with expandable details and actions", () => {
      fab = createFabWithAllToolbarEntries();
      fab.mount();
      fab.setNetwork([
        makeRequest({
          method: "POST",
          url: "https://example.com/api/orders",
          status: 201,
          requestHeaders: { "content-type": "application/json" },
          requestBody: '{"name":"desk"}',
          responseBody: '{"ok":true}',
          sourceFile: "/src/api.ts",
          count: 2,
        }),
      ]);

      getNetworkBtn()!.click();
      const row = getNetworkRows()[0];
      const header = row.querySelector<HTMLElement>(".net-row-header")!;
      const details = row.querySelector<HTMLElement>(".net-row-details")!;
      const chevron = row.querySelector<HTMLElement>(".net-row-chevron")!;

      expect(row.closest(".network-list")).not.toBeNull();
      expect(header.tagName).toBe("BUTTON");
      expect(header.classList.contains("setting-row")).toBe(true);
      expect(row.querySelector(".net-row-dot")).not.toBeNull();
      expect(row.querySelector(".net-row-url")!.textContent).toContain("/api/orders");
      expect(row.querySelector(".net-row-method")!.textContent).toBe("POST");
      expect(row.querySelector(".net-row-count")!.textContent).toBe("×2");
      expect(details.classList.contains("open")).toBe(false);

      header.click();

      expect(details.classList.contains("open")).toBe(true);
      expect(chevron.classList.contains("open")).toBe(true);
      expect(details.querySelector(".net-row-detail-surface")).not.toBeNull();
      expect(details.textContent).toContain("Request headers");
      expect(details.textContent).toContain("Response body");
      expect(details.querySelector("[data-net-copy]")).not.toBeNull();
      expect(details.querySelector("[data-net-claude]")).not.toBeNull();
      expect(details.querySelector("[data-net-open]")).not.toBeNull();
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
