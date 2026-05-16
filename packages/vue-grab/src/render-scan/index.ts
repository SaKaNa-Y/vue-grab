import type { RenderScanConfig } from "@sakana-y/vue-grab-shared";

import { esc, getComponentName } from "../utils";

export const RENDER_SCAN_HOST_ID = "vue-grab-render-scan-host";

export type RenderScanSeverity = "normal" | "warning" | "danger";

export interface RenderScanRecord {
  id: number;
  instance: unknown;
  name: string;
  filePath?: string;
  element: Element | null;
  timestamps: number[];
  count: number;
  severity: RenderScanSeverity;
  updatedAt: number;
}

export interface RenderScanSnapshot {
  id: number;
  name: string;
  filePath?: string;
  element: Element;
  count: number;
  severity: RenderScanSeverity;
  rect: DOMRectReadOnly;
  windowMs: number;
  updatedAt: number;
}

type VueComponentInstance = any;

export class RenderScanCollector {
  private records = new Map<object, RenderScanRecord>();
  private nextId = 1;
  private changeListeners = new Set<(entries: RenderScanRecord[]) => void>();
  private changeQueued = false;

  constructor(private readonly config: RenderScanConfig) {}

  record(instance: unknown, now = performance.now()): RenderScanSnapshot | null {
    if (!instance || (typeof instance !== "object" && typeof instance !== "function")) {
      return null;
    }
    const key = instance as object;
    let record = this.records.get(key);
    const timestamps = this.prune(record?.timestamps ?? [], now);
    timestamps.push(now);

    const component = instance as VueComponentInstance;
    const element = resolveComponentElement(component);
    const count = timestamps.length;
    record = {
      id: record?.id ?? this.nextId++,
      instance,
      name: getComponentName(component, "Anonymous"),
      filePath: component.type?.__file,
      element,
      timestamps,
      count,
      severity: this.classify(count),
      updatedAt: now,
    };
    this.records.set(key, record);
    this.trimRecords();
    this.notifyChange();

    if (!element) return null;
    const rect = getMeasurableRect(element);
    if (!rect) return null;
    return {
      id: record.id,
      name: record.name,
      filePath: record.filePath,
      element,
      count,
      severity: record.severity,
      rect,
      windowMs: this.config.windowMs,
      updatedAt: now,
    };
  }

  remove(instance: unknown): void {
    if (!instance || (typeof instance !== "object" && typeof instance !== "function")) return;
    if (this.records.delete(instance as object)) this.notifyChange();
  }

  clear(): void {
    if (this.records.size === 0) return;
    this.records.clear();
    this.notifyChange();
  }

  get size(): number {
    return this.records.size;
  }

  getRecord(instance: unknown): RenderScanRecord | null {
    if (!instance || (typeof instance !== "object" && typeof instance !== "function")) {
      return null;
    }
    return this.records.get(instance as object) ?? null;
  }

  entries(): RenderScanRecord[] {
    return [...this.records.values()].toSorted((a, b) => b.updatedAt - a.updatedAt);
  }

  onChange(cb: (entries: RenderScanRecord[]) => void): () => void {
    this.changeListeners.add(cb);
    return () => this.changeListeners.delete(cb);
  }

  private prune(timestamps: number[], now: number): number[] {
    const min = now - this.config.windowMs;
    return timestamps.filter((time) => time >= min);
  }

  private classify(count: number): RenderScanSeverity {
    if (count >= this.config.dangerThreshold) return "danger";
    if (count >= this.config.warningThreshold) return "warning";
    return "normal";
  }

  private trimRecords(): void {
    const overflow = this.records.size - this.config.maxRecords;
    if (overflow <= 0) return;

    const oldest: Array<[object, number]> = [];
    for (const [key, record] of this.records) {
      const index = oldest.findIndex(([, updatedAt]) => record.updatedAt < updatedAt);
      if (index === -1) {
        if (oldest.length < overflow) oldest.push([key, record.updatedAt]);
        continue;
      }

      oldest.splice(index, 0, [key, record.updatedAt]);
      if (oldest.length > overflow) oldest.pop();
    }

    for (const [key] of oldest) this.records.delete(key);
  }

  private notifyChange(): void {
    if (this.changeListeners.size === 0 || this.changeQueued) return;
    this.changeQueued = true;
    queueMicrotask(() => {
      this.changeQueued = false;
      if (this.changeListeners.size === 0) return;
      const entries = this.entries();
      this.changeListeners.forEach((fn) => fn(entries));
    });
  }
}

export class RenderScanOverlay {
  private host: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private active = false;
  private timers = new Map<HTMLElement, number>();
  private stateListeners = new Set<(active: boolean) => void>();

  constructor(private readonly config: Pick<RenderScanConfig, "flashDurationMs">) {}

  get isActive(): boolean {
    return this.active;
  }

  activate(): void {
    if (this.active) return;
    this.active = true;
    this.mount();
    this.stateListeners.forEach((fn) => fn(true));
  }

  deactivate(): void {
    if (!this.active) return;
    this.active = false;
    this.clearFlashes();
    this.stateListeners.forEach((fn) => fn(false));
  }

  toggle(): void {
    if (this.active) this.deactivate();
    else this.activate();
  }

  flash(snapshot: RenderScanSnapshot): void {
    if (!this.active) return;
    if (!snapshot.element.isConnected) return;
    this.mount();
    if (!this.shadowRoot) return;

    const rect = snapshot.rect;
    const el = document.createElement("div");
    el.className = `render-scan-flash ${snapshot.severity}`;
    el.style.top = `${rect.top}px`;
    el.style.left = `${rect.left}px`;
    el.style.width = `${rect.width}px`;
    el.style.height = `${rect.height}px`;
    el.innerHTML = `<span>${esc(snapshot.name)} · ${snapshot.count}/${formatWindow(
      snapshot.windowMs,
    )}</span>`;
    this.shadowRoot.appendChild(el);

    const timer = window.setTimeout(() => {
      this.timers.delete(el);
      el.remove();
    }, this.config.flashDurationMs);
    this.timers.set(el, timer);
  }

  destroy(): void {
    this.deactivate();
    this.stateListeners.clear();
    this.host?.remove();
    this.host = null;
    this.shadowRoot = null;
  }

  onStateChange(cb: (active: boolean) => void): () => void {
    this.stateListeners.add(cb);
    return () => this.stateListeners.delete(cb);
  }

  private mount(): void {
    if (this.host) return;
    this.host = document.createElement("div");
    this.host.id = RENDER_SCAN_HOST_ID;
    this.host.style.cssText =
      "position:fixed;top:0;left:0;width:0;height:0;z-index:2147483646;pointer-events:none;";
    document.body.appendChild(this.host);
    this.shadowRoot = this.host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      .render-scan-flash {
        position: fixed;
        pointer-events: none;
        border: 2px solid #22d3ee;
        background: rgba(34, 211, 238, 0.10);
        box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.28), 0 0 24px rgba(34, 211, 238, 0.26);
        border-radius: 4px;
        box-sizing: border-box;
        animation: render-scan-fade ${this.config.flashDurationMs}ms ease-out forwards;
      }
      .render-scan-flash.warning {
        border-color: #f59e0b;
        background: rgba(245, 158, 11, 0.12);
        box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.34), 0 0 26px rgba(245, 158, 11, 0.28);
      }
      .render-scan-flash.danger {
        border-color: #ef4444;
        background: rgba(239, 68, 68, 0.13);
        box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.36), 0 0 28px rgba(239, 68, 68, 0.32);
      }
      .render-scan-flash span {
        position: absolute;
        left: 0;
        top: -24px;
        max-width: min(360px, 80vw);
        padding: 3px 7px;
        border-radius: 5px;
        background: rgba(17, 24, 39, 0.92);
        color: #f8fafc;
        font: 11px/1.35 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        box-shadow: 0 2px 10px rgba(0,0,0,0.28);
      }
      @keyframes render-scan-fade {
        0% { opacity: 0; transform: scale(0.985); }
        16% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(1.012); }
      }
    `;
    this.shadowRoot.appendChild(style);
  }

  private clearFlashes(): void {
    for (const timer of this.timers.values()) window.clearTimeout(timer);
    this.timers.clear();
    this.shadowRoot
      ?.querySelectorAll<HTMLElement>(".render-scan-flash")
      .forEach((el) => el.remove());
  }
}

export function resolveComponentElement(instance: VueComponentInstance): Element | null {
  const subTreeEl = instance?.subTree?.el;
  if (subTreeEl instanceof Element) return subTreeEl;
  const vnodeEl = instance?.vnode?.el;
  if (vnodeEl instanceof Element) return vnodeEl;
  const proxyEl = instance?.proxy?.$el;
  return proxyEl instanceof Element ? proxyEl : null;
}

export function isMeasurableElement(el: Element | null): el is Element {
  return getMeasurableRect(el) != null;
}

function getMeasurableRect(el: Element | null): DOMRectReadOnly | null {
  if (!el) return null;
  if (!el.isConnected) return null;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 ? rect : null;
}

function formatWindow(windowMs: number): string {
  return windowMs % 1000 === 0 ? `${windowMs / 1000}s` : `${windowMs}ms`;
}
