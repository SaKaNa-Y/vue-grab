import { describe, expect, it, afterEach, vi } from "vitest";

import { RENDER_SCAN_HOST_ID, RenderScanCollector, RenderScanOverlay } from "../src/render-scan";
import { cleanupDOM } from "./helpers/setup";

const TEST_RENDER_SCAN_CONFIG = {
  enabled: true,
  windowMs: 2000,
  warningThreshold: 8,
  dangerThreshold: 20,
  flashDurationMs: 700,
  maxRecords: 200,
};

function nextMicrotask(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

function makeRect(overrides: Partial<DOMRectReadOnly> = {}): DOMRectReadOnly {
  return {
    x: 10,
    y: 20,
    top: 20,
    left: 10,
    right: 130,
    bottom: 80,
    width: 120,
    height: 60,
    toJSON: () => ({}),
    ...overrides,
  };
}

function makeInstance(name = "RenderCard", el = document.createElement("section")) {
  return {
    type: { name, __file: `src/${name}.vue` },
    subTree: { el },
  };
}

function attachSizedElement(el = document.createElement("section")): HTMLElement {
  const target = el as HTMLElement;
  document.body.appendChild(target);
  vi.spyOn(target, "getBoundingClientRect").mockReturnValue(makeRect());
  return target;
}

describe("RenderScanCollector", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    cleanupDOM();
  });

  it("records updates and classifies rolling thresholds", () => {
    const el = attachSizedElement();
    const instance = makeInstance("RenderCard", el);
    const collector = new RenderScanCollector({
      ...TEST_RENDER_SCAN_CONFIG,
      windowMs: 1000,
      warningThreshold: 2,
      dangerThreshold: 3,
    });

    expect(collector.record(instance, 100)!.severity).toBe("normal");
    expect(collector.record(instance, 200)!.severity).toBe("warning");
    const danger = collector.record(instance, 300)!;

    expect(danger).toMatchObject({
      id: 1,
      name: "RenderCard",
      filePath: "src/RenderCard.vue",
      count: 3,
      severity: "danger",
      windowMs: 1000,
    });
  });

  it("keeps stable record ids and returns entries by recent activity", () => {
    const collector = new RenderScanCollector(TEST_RENDER_SCAN_CONFIG);
    const first = makeInstance("FirstCard", attachSizedElement());
    const second = makeInstance("SecondCard", attachSizedElement());

    const firstInitial = collector.record(first, 100)!;
    const secondSnapshot = collector.record(second, 200)!;
    const firstAgain = collector.record(first, 300)!;

    expect(firstAgain.id).toBe(firstInitial.id);
    expect(secondSnapshot.id).not.toBe(firstInitial.id);
    expect(collector.entries().map((entry) => entry.name)).toEqual(["FirstCard", "SecondCard"]);
  });

  it("batches listener notifications in a microtask", async () => {
    const collector = new RenderScanCollector(TEST_RENDER_SCAN_CONFIG);
    const instance = makeInstance("WatchedCard", attachSizedElement());
    const spy = vi.fn<(entries: ReturnType<RenderScanCollector["entries"]>) => void>();

    const cleanup = collector.onChange(spy);
    collector.record(instance, 1);
    collector.remove(instance);
    collector.record(instance, 2);
    collector.clear();

    expect(spy).not.toHaveBeenCalled();
    await nextMicrotask();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toHaveLength(0);

    collector.record(instance, 3);
    await nextMicrotask();

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[1][0]).toHaveLength(1);

    cleanup();
    collector.record(instance, 3);

    await nextMicrotask();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("prunes timestamps outside the rolling window", () => {
    const instance = makeInstance("Windowed", attachSizedElement());
    const collector = new RenderScanCollector({
      ...TEST_RENDER_SCAN_CONFIG,
      windowMs: 100,
      warningThreshold: 2,
      dangerThreshold: 3,
    });

    collector.record(instance, 0);
    const snapshot = collector.record(instance, 150)!;

    expect(snapshot.count).toBe(1);
    expect(snapshot.severity).toBe("normal");
  });

  it("removes unmounted component records", () => {
    const instance = makeInstance("Gone", attachSizedElement());
    const collector = new RenderScanCollector(TEST_RENDER_SCAN_CONFIG);
    collector.record(instance, 1);

    collector.remove(instance);

    expect(collector.getRecord(instance)).toBeNull();
    expect(collector.size).toBe(0);
  });

  it("ignores non-element and zero-size roots safely", () => {
    const collector = new RenderScanCollector(TEST_RENDER_SCAN_CONFIG);
    expect(collector.record({ type: { name: "NoElement" }, subTree: { el: null } }, 1)).toBeNull();

    const el = attachSizedElement();
    vi.mocked(el.getBoundingClientRect).mockReturnValue(makeRect({ width: 0, height: 0 }));

    expect(collector.record(makeInstance("Zero", el), 2)).toBeNull();
  });

  it("trims oldest records beyond maxRecords", () => {
    const collector = new RenderScanCollector({ ...TEST_RENDER_SCAN_CONFIG, maxRecords: 2 });
    const first = makeInstance("First", attachSizedElement());
    const second = makeInstance("Second", attachSizedElement());
    const third = makeInstance("Third", attachSizedElement());

    collector.record(first, 1);
    collector.record(second, 2);
    collector.record(third, 3);

    expect(collector.getRecord(first)).toBeNull();
    expect(collector.getRecord(second)).not.toBeNull();
    expect(collector.getRecord(third)).not.toBeNull();
  });
});

describe("RenderScanOverlay", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    cleanupDOM();
  });

  it("flashes update rectangles only while active", () => {
    vi.useFakeTimers();
    const overlay = new RenderScanOverlay({ flashDurationMs: 700 });
    const element = attachSizedElement();

    overlay.flash({
      name: "Inactive",
      element,
      count: 1,
      severity: "normal",
      rect: makeRect(),
      windowMs: 2000,
      updatedAt: 1,
    });
    expect(document.getElementById(RENDER_SCAN_HOST_ID)).toBeNull();

    overlay.activate();
    overlay.flash({
      name: "ActiveCard",
      element,
      count: 12,
      severity: "warning",
      rect: makeRect(),
      windowMs: 2000,
      updatedAt: 2,
    });

    const host = document.getElementById(RENDER_SCAN_HOST_ID)!;
    const flash = host.shadowRoot!.querySelector<HTMLElement>(".render-scan-flash")!;
    expect(flash).not.toBeNull();
    expect(flash.classList.contains("warning")).toBe(true);
    expect(flash.textContent).toContain("ActiveCard · 12/2s");

    vi.advanceTimersByTime(700);
    expect(host.shadowRoot!.querySelector(".render-scan-flash")).toBeNull();
    overlay.destroy();
  });

  it("uses the snapshot rect without measuring again", () => {
    vi.useFakeTimers();
    const overlay = new RenderScanOverlay({ flashDurationMs: 700 });
    const element = attachSizedElement();
    const rectSpy = vi.mocked(element.getBoundingClientRect);
    const collector = new RenderScanCollector(TEST_RENDER_SCAN_CONFIG);
    const snapshot = collector.record(makeInstance("CachedRect", element), 1)!;

    expect(rectSpy).toHaveBeenCalledTimes(1);

    overlay.activate();
    overlay.flash(snapshot);

    expect(rectSpy).toHaveBeenCalledTimes(1);
    const host = document.getElementById(RENDER_SCAN_HOST_ID)!;
    const flash = host.shadowRoot!.querySelector<HTMLElement>(".render-scan-flash")!;
    expect(flash.style.top).toBe("20px");
    expect(flash.style.left).toBe("10px");
    expect(flash.style.width).toBe("120px");
    expect(flash.style.height).toBe("60px");
    overlay.destroy();
  });

  it("notifies state listeners", () => {
    const overlay = new RenderScanOverlay({ flashDurationMs: 700 });
    const spy = vi.fn<(active: boolean) => void>();
    overlay.onStateChange(spy);

    overlay.activate();
    overlay.deactivate();

    expect(spy).toHaveBeenNthCalledWith(1, true);
    expect(spy).toHaveBeenNthCalledWith(2, false);
    overlay.destroy();
  });
});
