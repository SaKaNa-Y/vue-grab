import type { MagnifierConfig } from "@sakana-y/vue-grab-shared";
import { FAB_HOST_ID } from "../floating-button";
import { OVERLAY_HOST_ID } from "../overlay";
import { buildCloneTransform, removeVueGrabHosts } from "./clone";
import { buildCompactTag } from "./html-label";
import { STYLES } from "./styles";

export const MAGNIFIER_HOST_ID = "vue-grab-magnifier-host";

const CLONE_REFRESH_INTERVAL = 500;

export class MagnifierOverlay {
  private host: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private container: HTMLElement | null = null;
  private cloneWrapper: HTMLElement | null = null;
  private cloneEl: HTMLElement | null = null;
  private htmlLabelEl: HTMLElement | null = null;
  private infoLabelEl: HTMLElement | null = null;

  private active = false;
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
    return this.active;
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

    // Clone wrapper 鈥?circular viewport for the scaled page clone
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
    if (this.active) return;

    this.active = true;
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
    if (!this.active) return;

    this.active = false;
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
    if (this.active) {
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
    if (this.active && this.cloneEl) {
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

    removeVueGrabHosts(clone);

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
    clone.style.transform = buildCloneTransform(
      this.lastX,
      this.lastY,
      window.scrollX,
      window.scrollY,
      size,
      zoom,
    );

    // Atomic swap 鈥?avoid blank frame between remove and insert
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
    this.cloneEl.style.transform = buildCloneTransform(
      this.lastX,
      this.lastY,
      window.scrollX,
      window.scrollY,
      size,
      zoom,
    );

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

    this.htmlLabelEl.textContent = buildCompactTag(el, this.config.maxOverlayHtmlLength);
  }
}
