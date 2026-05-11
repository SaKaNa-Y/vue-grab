import type { GrabConfig, GrabResult, GrabUserConfig } from "@sakana-y/vue-grab-shared";
import { mergeConfig } from "@sakana-y/vue-grab-shared";
import { GrabOverlay } from "../overlay";
import { hasA11yAttributes } from "../utils";
import { shouldIgnoreElement } from "./filter";
import { createGrabResult } from "./result";
import { getComponentLabelFromInstance, getVueComponent } from "./vue-component";

export class GrabEngine {
  private config: GrabConfig;
  private overlay: GrabOverlay | null = null;
  private callbacks: Set<(result: GrabResult) => void> = new Set();
  private enrichers: Array<(result: GrabResult) => void> = [];
  private stateListeners: Set<(active: boolean) => void> = new Set();
  private active = false;
  private prevCursor = "";

  // Bound handlers for cleanup
  private handleMouseMove: ((e: MouseEvent) => void) | null = null;
  private handleClick: ((e: MouseEvent) => void) | null = null;
  private handleKeyDown: ((e: KeyboardEvent) => void) | null = null;

  constructor(config: GrabConfig) {
    this.config = config;
  }

  get isActive(): boolean {
    return this.active;
  }

  activate(): void {
    if (this.active) return;
    this.active = true;
    this.stateListeners.forEach((fn) => fn(true));

    this.overlay = new GrabOverlay(this.config);
    this.overlay.mount();

    this.prevCursor = document.body.style.cursor;
    document.body.style.cursor = "crosshair";

    this.handleMouseMove = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || this.shouldIgnore(el)) {
        this.overlay?.clearHighlight();
        return;
      }
      const instance = getVueComponent(el);
      this.overlay?.highlight(
        el,
        getComponentLabelFromInstance(el, instance),
        hasA11yAttributes(el),
      );
    };

    this.handleClick = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || this.shouldIgnore(el)) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const result = createGrabResult(el, this.config);

      for (const enrich of this.enrichers) enrich(result);
      this.callbacks.forEach((cb) => cb(result));
      this.deactivate();
    };

    this.handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        this.deactivate();
      }
    };

    document.addEventListener("mousemove", this.handleMouseMove, { capture: true });
    document.addEventListener("click", this.handleClick, { capture: true });
    document.addEventListener("keydown", this.handleKeyDown, { capture: true });
  }

  deactivate(): void {
    if (!this.active) return;
    this.active = false;
    this.stateListeners.forEach((fn) => fn(false));

    if (this.handleMouseMove)
      document.removeEventListener("mousemove", this.handleMouseMove, { capture: true });
    if (this.handleClick)
      document.removeEventListener("click", this.handleClick, { capture: true });
    if (this.handleKeyDown)
      document.removeEventListener("keydown", this.handleKeyDown, { capture: true });

    this.handleMouseMove = null;
    this.handleClick = null;
    this.handleKeyDown = null;

    this.overlay?.destroy();
    this.overlay = null;

    document.body.style.cursor = this.prevCursor;
  }

  onGrab(cb: (result: GrabResult) => void): () => void {
    this.callbacks.add(cb);
    return () => this.callbacks.delete(cb);
  }

  /** Synchronously mutate a GrabResult before any onGrab listeners run. */
  addResultEnricher(fn: (result: GrabResult) => void): () => void {
    this.enrichers.push(fn);
    return () => {
      const idx = this.enrichers.indexOf(fn);
      if (idx >= 0) this.enrichers.splice(idx, 1);
    };
  }

  onStateChange(cb: (active: boolean) => void): () => void {
    this.stateListeners.add(cb);
    return () => this.stateListeners.delete(cb);
  }

  toggle(): void {
    if (this.active) this.deactivate();
    else this.activate();
  }

  destroy(): void {
    this.deactivate();
    this.callbacks.clear();
    this.enrichers.length = 0;
    this.stateListeners.clear();
  }

  updateConfig(config: GrabUserConfig): void {
    this.config = mergeConfig(this.config, config);
  }

  private shouldIgnore(el: Element): boolean {
    return shouldIgnoreElement(el, this.config);
  }
}
