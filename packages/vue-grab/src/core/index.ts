import type { GrabConfig, GrabResult, ComponentInfo } from "@sakana-y/vue-grab-shared";
import { mergeConfig } from "@sakana-y/vue-grab-shared";
import { GrabOverlay, OVERLAY_HOST_ID } from "../overlay";
import { FAB_HOST_ID } from "../floating-button";
import { MAGNIFIER_HOST_ID } from "../magnifier";
import { MEASURER_HOST_ID } from "../measurer";
import { hasA11yAttributes, extractA11yInfo, getComponentName } from "../utils";

const shortPathCache = new WeakMap<object, string>();

const COMMON_LAYOUT_NAMES = new Set([
  "header",
  "nav",
  "footer",
  "aside",
  "main",
  "layout",
  "sidebar",
]);

export class GrabEngine {
  private config: GrabConfig;
  private overlay: GrabOverlay | null = null;
  private callbacks: Set<(result: GrabResult) => void> = new Set();
  private stateListeners: Set<(active: boolean) => void> = new Set();
  private _isActive = false;
  private prevCursor = "";

  // Bound handlers for cleanup
  private handleMouseMove: ((e: MouseEvent) => void) | null = null;
  private handleClick: ((e: MouseEvent) => void) | null = null;
  private handleKeyDown: ((e: KeyboardEvent) => void) | null = null;

  constructor(config: GrabConfig) {
    this.config = config;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  activate(): void {
    if (this._isActive) return;
    this._isActive = true;
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
      const instance = this.getVueComponent(el);
      this.overlay?.highlight(
        el,
        this.getComponentLabelFromInstance(el, instance),
        hasA11yAttributes(el),
      );
    };

    this.handleClick = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || this.shouldIgnore(el)) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      let html = el.outerHTML;
      if (this.config.maxHtmlLength > 0 && html.length > this.config.maxHtmlLength) {
        html = html.slice(0, this.config.maxHtmlLength) + "<!-- truncated -->";
      }

      const result: GrabResult = {
        element: el,
        html,
        componentStack: this.getComponentStack(el),
        selector: this.generateSelector(el),
        a11y: extractA11yInfo(el),
      };

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
    if (!this._isActive) return;
    this._isActive = false;
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

  onStateChange(cb: (active: boolean) => void): () => void {
    this.stateListeners.add(cb);
    return () => this.stateListeners.delete(cb);
  }

  toggle(): void {
    if (this._isActive) this.deactivate();
    else this.activate();
  }

  destroy(): void {
    this.deactivate();
    this.callbacks.clear();
    this.stateListeners.clear();
  }

  updateConfig(config: Partial<GrabConfig>): void {
    this.config = mergeConfig(this.config, config);
  }

  private shouldIgnore(el: Element): boolean {
    // Ignore our own overlay and floating button
    if (
      el.closest(
        `#${OVERLAY_HOST_ID}, #${FAB_HOST_ID}, #${MAGNIFIER_HOST_ID}, #${MEASURER_HOST_ID}`,
      )
    )
      return true;

    const tag = el.tagName.toLowerCase();

    // Check ignored tags
    if (this.config.filter.ignoreTags.includes(tag)) return true;

    // Check ignored selectors
    for (const selector of this.config.filter.ignoreSelectors) {
      try {
        if (el.matches(selector)) return true;
      } catch {
        // Invalid selector, skip
      }
    }

    // Check common layout components
    if (this.config.filter.skipCommonComponents) {
      const comp = this.getVueComponent(el);
      if (comp) {
        if (COMMON_LAYOUT_NAMES.has(getComponentName(comp).toLowerCase())) return true;
      }
    }

    return false;
  }

  private getVueComponent(el: Element): any {
    let node: Element | null = el;
    while (node) {
      const instance = (node as any).__vueParentComponent || (node as any).__vue_app__?._instance;
      if (instance) return instance;
      node = node.parentElement;
    }
    return null;
  }

  private getComponentLabelFromInstance(el: Element, instance: any): string {
    const tag = getComponentName(instance, el.tagName.toLowerCase());
    let label = `<${tag}>`;
    if (instance) {
      const type = instance.type;
      if (type?.__file) {
        if (!shortPathCache.has(type)) {
          const normalized = type.__file.replace(/\\/g, "/");
          const srcIndex = normalized.indexOf("src/");
          shortPathCache.set(type, srcIndex >= 0 ? normalized.slice(srcIndex) : normalized);
        }
        label += ` ${shortPathCache.get(type)}`;
      }
    }
    return label;
  }

  private getComponentStack(el: Element): ComponentInfo[] {
    const stack: ComponentInfo[] = [];
    let node: Element | null = el;

    while (node) {
      const instance = (node as any).__vueParentComponent || (node as any).__vue_app__?._instance;
      if (instance) {
        const name = getComponentName(instance, "Anonymous");
        const filePath = instance.type?.__file;
        const info: ComponentInfo = { name };
        if (filePath) info.filePath = filePath;
        stack.push(info);
      }
      node = node.parentElement;
    }

    return stack;
  }

  private generateSelector(el: Element): string {
    if (el.id) return `#${CSS.escape(el.id)}`;

    const parts: string[] = [];
    let current: Element | null = el;

    while (current && current !== document.body && current !== document.documentElement) {
      let segment = current.tagName.toLowerCase();

      if (current.id) {
        parts.unshift(`#${CSS.escape(current.id)}`);
        break;
      }

      if (current.className && typeof current.className === "string") {
        const classes = current.className.trim().split(/\s+/).filter(Boolean);
        if (classes.length > 0) {
          segment += `.${classes
            .slice(0, 2)
            .map((c) => CSS.escape(c))
            .join(".")}`;
        }
      }

      parts.unshift(segment);
      current = current.parentElement;
    }

    return parts.join(" > ");
  }
}
