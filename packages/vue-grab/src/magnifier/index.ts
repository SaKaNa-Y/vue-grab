import type { MagnifierConfig } from "@sakana-y/vue-grab-shared";
import { FAB_HOST_ID } from "../floating-button";
import { OVERLAY_HOST_ID } from "../overlay";
import { MEASURER_HOST_ID } from "../measurer";

export const MAGNIFIER_HOST_ID = "vue-grab-magnifier-host";

/** IDs of vue-grab host elements to strip from clones */
const HOST_IDS = [MAGNIFIER_HOST_ID, FAB_HOST_ID, OVERLAY_HOST_ID, MEASURER_HOST_ID];

const CLONE_REFRESH_INTERVAL = 500;
const BRACKET_INSET = 25; // % inset from edge for corner brackets
const BRACKET_LEN = 20; // px length of each bracket arm

const STYLES = `
  :host { all: initial; }

  .magnifier-container {
    position: fixed;
    pointer-events: none;
    z-index: 2147483645;
    display: none;
  }
  .magnifier-container.active {
    display: block;
  }

  .loupe {
    position: relative;
    border-radius: 50%;
    overflow: hidden;
    box-shadow:
      0 0 0 2px rgba(255, 255, 255, 0.2),
      0 0 30px rgba(74, 222, 128, 0.12),
      0 4px 24px rgba(0, 0, 0, 0.5);
  }

  /* ── Cloned page content ── */
  .clone-wrapper {
    overflow: hidden;
    border-radius: 50%;
    position: relative;
    background: transparent;
  }
  .page-clone {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    transform-origin: 0 0;
  }

  /* ── Green glass tint overlay ── */
  .glass-tint {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: rgba(0, 35, 18, 0.4);
    mix-blend-mode: multiply;
    z-index: 1;
  }

  /* ── Full-size crosshair lines ── */
  .crosshair-h {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 1px;
    background: rgba(255, 255, 255, 0.18);
    z-index: 4;
    transform: translateY(-0.5px);
  }
  .crosshair-v {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 1px;
    background: rgba(255, 255, 255, 0.18);
    z-index: 4;
    transform: translateX(-0.5px);
  }
  /* Small bright dot at center */
  .crosshair-dot {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(74, 222, 128, 0.7);
    transform: translate(-50%, -50%);
    z-index: 5;
  }

  /* ── Corner bracket marks ── */
  .bracket {
    position: absolute;
    width: ${BRACKET_LEN}px;
    height: ${BRACKET_LEN}px;
    z-index: 4;
  }
  .bracket::before,
  .bracket::after {
    content: '';
    position: absolute;
    background: rgba(255, 255, 255, 0.35);
  }
  /* Top-left ┌ */
  .bracket.tl {
    top: ${BRACKET_INSET}%;
    left: ${BRACKET_INSET}%;
  }
  .bracket.tl::before { top: 0; left: 0; width: ${BRACKET_LEN}px; height: 1.5px; }
  .bracket.tl::after  { top: 0; left: 0; width: 1.5px; height: ${BRACKET_LEN}px; }
  /* Top-right ┐ */
  .bracket.tr {
    top: ${BRACKET_INSET}%;
    right: ${BRACKET_INSET}%;
  }
  .bracket.tr::before { top: 0; right: 0; width: ${BRACKET_LEN}px; height: 1.5px; }
  .bracket.tr::after  { top: 0; right: 0; width: 1.5px; height: ${BRACKET_LEN}px; }
  /* Bottom-left └ */
  .bracket.bl {
    bottom: ${BRACKET_INSET}%;
    left: ${BRACKET_INSET}%;
  }
  .bracket.bl::before { bottom: 0; left: 0; width: ${BRACKET_LEN}px; height: 1.5px; }
  .bracket.bl::after  { bottom: 0; left: 0; width: 1.5px; height: ${BRACKET_LEN}px; }
  /* Bottom-right ┘ */
  .bracket.br {
    bottom: ${BRACKET_INSET}%;
    right: ${BRACKET_INSET}%;
  }
  .bracket.br::before { bottom: 0; right: 0; width: ${BRACKET_LEN}px; height: 1.5px; }
  .bracket.br::after  { bottom: 0; right: 0; width: 1.5px; height: ${BRACKET_LEN}px; }

  /* ── HTML element label (compact green pill) ── */
  .html-label {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, 10px);
    background: rgba(74, 222, 128, 0.85);
    color: #0a0a0a;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 4px;
    white-space: nowrap;
    max-width: 75%;
    overflow: hidden;
    text-overflow: ellipsis;
    z-index: 5;
    pointer-events: none;
  }

  /* ── Coordinate info at bottom ── */
  .info-label {
    position: absolute;
    bottom: 14%;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(255, 255, 255, 0.4);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    white-space: nowrap;
    z-index: 5;
    pointer-events: none;
  }
`;

export class MagnifierOverlay {
  private host: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private container: HTMLElement | null = null;
  private cloneWrapper: HTMLElement | null = null;
  private cloneEl: HTMLElement | null = null;
  private htmlLabelEl: HTMLElement | null = null;
  private infoLabelEl: HTMLElement | null = null;

  private _isActive = false;
  private config: MagnifierConfig;
  private rafId: number | null = null;
  private cloneTimerId: ReturnType<typeof setInterval> | null = null;
  private lastX = 0;
  private lastY = 0;
  private lastElement: Element | null = null;
  private stateListeners: Set<(active: boolean) => void> = new Set();

  private boundMouseMove: ((e: MouseEvent) => void) | null = null;
  private boundKeyDown: ((e: KeyboardEvent) => void) | null = null;

  constructor(config: MagnifierConfig) {
    this.config = config;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  mount(): void {
    if (this.host) return;

    this.host = document.createElement("div");
    this.host.id = MAGNIFIER_HOST_ID;
    this.host.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;";
    document.body.appendChild(this.host);

    this.shadowRoot = this.host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = STYLES;
    this.shadowRoot.appendChild(style);

    const size = this.config.loupeSize;

    this.container = document.createElement("div");
    this.container.className = "magnifier-container";

    const loupe = document.createElement("div");
    loupe.className = "loupe";
    loupe.style.width = `${size}px`;
    loupe.style.height = `${size}px`;

    // Clone wrapper — circular viewport for the scaled page clone
    this.cloneWrapper = document.createElement("div");
    this.cloneWrapper.className = "clone-wrapper";
    this.cloneWrapper.style.width = `${size}px`;
    this.cloneWrapper.style.height = `${size}px`;
    loupe.appendChild(this.cloneWrapper);

    // Green glass tint
    const glassTint = document.createElement("div");
    glassTint.className = "glass-tint";
    loupe.appendChild(glassTint);

    // Full-size crosshair lines
    const ch = document.createElement("div");
    ch.className = "crosshair-h";
    loupe.appendChild(ch);

    const cv = document.createElement("div");
    cv.className = "crosshair-v";
    loupe.appendChild(cv);

    // Center dot
    const dot = document.createElement("div");
    dot.className = "crosshair-dot";
    loupe.appendChild(dot);

    // Corner brackets
    for (const pos of ["tl", "tr", "bl", "br"]) {
      const b = document.createElement("div");
      b.className = `bracket ${pos}`;
      loupe.appendChild(b);
    }

    // HTML element label (compact pill)
    if (this.config.showHtmlOverlay) {
      this.htmlLabelEl = document.createElement("div");
      this.htmlLabelEl.className = "html-label";
      loupe.appendChild(this.htmlLabelEl);
    }

    // Coordinate / info label
    this.infoLabelEl = document.createElement("div");
    this.infoLabelEl.className = "info-label";
    loupe.appendChild(this.infoLabelEl);

    this.container.appendChild(loupe);
    this.shadowRoot.appendChild(this.container);
  }

  activate(): void {
    if (this._isActive) return;

    this._isActive = true;
    this.notifyState(true);

    if (this.container) {
      this.container.classList.add("active");
    }

    // Take initial clone
    this.refreshClone();

    // Periodically refresh clone to catch DOM changes
    this.cloneTimerId = setInterval(() => this.refreshClone(), CLONE_REFRESH_INTERVAL);

    this.boundMouseMove = (e: MouseEvent) => {
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      if (this.rafId === null) {
        this.rafId = requestAnimationFrame(() => {
          this.rafId = null;
          this.render();
        });
      }
    };

    this.boundKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        e.preventDefault();
        this.deactivate();
      }
    };

    document.addEventListener("mousemove", this.boundMouseMove, true);
    document.addEventListener("keydown", this.boundKeyDown, true);
  }

  deactivate(): void {
    if (!this._isActive) return;

    this._isActive = false;
    this.notifyState(false);

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.cloneTimerId !== null) {
      clearInterval(this.cloneTimerId);
      this.cloneTimerId = null;
    }

    if (this.boundMouseMove) {
      document.removeEventListener("mousemove", this.boundMouseMove, true);
      this.boundMouseMove = null;
    }
    if (this.boundKeyDown) {
      document.removeEventListener("keydown", this.boundKeyDown, true);
      this.boundKeyDown = null;
    }

    if (this.container) {
      this.container.classList.remove("active");
    }

    // Clean up clone
    if (this.cloneWrapper) {
      this.cloneWrapper.innerHTML = "";
    }
    this.cloneEl = null;
    this.lastElement = null;
  }

  toggle(): void {
    if (this._isActive) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  onStateChange(cb: (active: boolean) => void): () => void {
    this.stateListeners.add(cb);
    return () => this.stateListeners.delete(cb);
  }

  updateConfig(partial: Partial<Pick<MagnifierConfig, "loupeSize" | "zoomLevel">>): void {
    if (partial.loupeSize !== undefined) {
      this.config.loupeSize = partial.loupeSize;
      // Update loupe and clone wrapper dimensions
      if (this.shadowRoot) {
        const loupe = this.shadowRoot.querySelector<HTMLElement>(".loupe");
        if (loupe) {
          loupe.style.width = `${partial.loupeSize}px`;
          loupe.style.height = `${partial.loupeSize}px`;
        }
        if (this.cloneWrapper) {
          this.cloneWrapper.style.width = `${partial.loupeSize}px`;
          this.cloneWrapper.style.height = `${partial.loupeSize}px`;
        }
      }
    }
    if (partial.zoomLevel !== undefined) {
      this.config.zoomLevel = partial.zoomLevel;
    }
    // Re-render immediately if active
    if (this._isActive && this.cloneEl) {
      this.render();
    }
  }

  destroy(): void {
    this.deactivate();
    this.stateListeners.clear();
    if (this.host) {
      this.host.remove();
      this.host = null;
      this.shadowRoot = null;
      this.container = null;
      this.cloneWrapper = null;
      this.cloneEl = null;
      this.htmlLabelEl = null;
      this.infoLabelEl = null;
    }
  }

  private notifyState(active: boolean): void {
    for (const cb of this.stateListeners) cb(active);
  }

  private refreshClone(): void {
    if (!this.cloneWrapper) return;

    const clone = document.body.cloneNode(true) as HTMLElement;

    // Remove vue-grab host elements from the clone
    for (const id of HOST_IDS) {
      const el = clone.querySelector(`#${id}`);
      el?.remove();
    }

    // Style the clone as an absolute-positioned layer
    clone.className = "page-clone";
    clone.style.width = `${document.documentElement.scrollWidth}px`;
    clone.style.height = `${document.documentElement.scrollHeight}px`;
    clone.style.margin = "0";
    // Copy computed background from body
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    if (bodyBg) clone.style.backgroundColor = bodyBg;

    // Pre-apply current transform so the new clone appears at the correct zoom immediately
    // (avoids a blank/unzoomed frame between old clone removal and next rAF)
    const size = this.config.loupeSize;
    const zoom = this.config.zoomLevel;
    const halfSize = size / 2;
    const pageX = this.lastX + window.scrollX;
    const pageY = this.lastY + window.scrollY;
    const tx = -pageX * zoom + halfSize;
    const ty = -pageY * zoom + halfSize;
    clone.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`;

    // Atomic swap — avoid blank frame between remove and insert
    const oldClone = this.cloneEl;
    if (oldClone && oldClone.parentNode === this.cloneWrapper) {
      this.cloneWrapper.replaceChild(clone, oldClone);
    } else {
      this.cloneWrapper.innerHTML = "";
      this.cloneWrapper.appendChild(clone);
    }
    this.cloneEl = clone;
  }

  private render(): void {
    if (!this.container || !this.cloneEl) return;

    const size = this.config.loupeSize;
    const halfSize = size / 2;
    const zoom = this.config.zoomLevel;

    // Center loupe on cursor
    this.container.style.left = `${this.lastX - halfSize}px`;
    this.container.style.top = `${this.lastY - halfSize}px`;

    // Position the clone so the cursor's page position maps to the loupe center
    const pageX = this.lastX + window.scrollX;
    const pageY = this.lastY + window.scrollY;
    const tx = -pageX * zoom + halfSize;
    const ty = -pageY * zoom + halfSize;
    this.cloneEl.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`;

    // Update HTML label
    if (this.config.showHtmlOverlay) {
      this.updateHtmlLabel();
    }

    // Update coordinate info
    if (this.infoLabelEl) {
      this.infoLabelEl.textContent = `X: ${Math.round(pageX)}  Y: ${Math.round(pageY)}`;
    }
  }

  private updateHtmlLabel(): void {
    if (!this.htmlLabelEl) return;

    const el = document.elementFromPoint(this.lastX, this.lastY);
    if (!el || el === this.lastElement) return;

    // Skip vue-grab host elements
    if (el.closest(`#${MAGNIFIER_HOST_ID}, #${FAB_HOST_ID}, #${OVERLAY_HOST_ID}`)) {
      return;
    }

    this.lastElement = el;

    // Build a compact tag representation like <button class="btn">Click me</button>
    this.htmlLabelEl.textContent = this.buildCompactTag(el);
  }

  /** Build a short tag string: `<tagName ...attrs>textContent</tagName>` */
  private buildCompactTag(el: Element): string {
    const tag = el.tagName.toLowerCase();
    const maxLen = this.config.maxOverlayHtmlLength;

    // Get key attributes (class, id) for context
    let attrs = "";
    if (el.id) attrs += ` id="${el.id}"`;
    if (el.className && typeof el.className === "string") {
      const cls = el.className.trim();
      if (cls) attrs += ` class="${cls}"`;
    }

    // Get inner text (first text content, trimmed)
    const text = el.textContent?.trim().slice(0, 40) || "";
    const inner = text ? text + (el.textContent!.trim().length > 40 ? "..." : "") : "";

    let result = `<${tag}${attrs}>${inner}</${tag}>`;
    if (result.length > maxLen) {
      result = result.slice(0, maxLen) + "...";
    }
    return result;
  }
}
