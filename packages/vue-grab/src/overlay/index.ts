import type { GrabConfig } from "@sakana-y/vue-grab-shared";
import { A11Y_ICON_SVG } from "../utils";

const OVERLAY_HOST_ID = "vue-grab-overlay-host";

export class GrabOverlay {
  private host: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private highlightBox: HTMLElement | null = null;
  private labelEl: HTMLElement | null = null;
  private labelTextEl: HTMLElement | null = null;
  private labelIconEl: HTMLElement | null = null;
  private config: Pick<GrabConfig, "highlightColor" | "labelTextColor" | "showTagHint">;

  constructor(config: Pick<GrabConfig, "highlightColor" | "labelTextColor" | "showTagHint">) {
    this.config = config;
  }

  mount(): void {
    if (this.host) return;

    this.host = document.createElement("div");
    this.host.id = OVERLAY_HOST_ID;
    this.host.style.cssText =
      "position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;pointer-events:none;";
    document.body.appendChild(this.host);

    this.shadowRoot = this.host.attachShadow({ mode: "open" });

    // Use CSS custom properties to avoid style injection via config values
    this.host.style.setProperty("--grab-color", this.config.highlightColor);
    this.host.style.setProperty("--grab-label-color", this.config.labelTextColor);

    const style = document.createElement("style");
    style.textContent = `
      .grab-highlight {
        position: fixed;
        pointer-events: none;
        border: 2px solid var(--grab-color);
        background: color-mix(in srgb, var(--grab-color) 12%, transparent);
        border-radius: 2px;
        transition: all 0.05s ease-out;
        display: none;
        box-sizing: border-box;
      }
      .grab-label {
        position: fixed;
        pointer-events: none;
        background: var(--grab-color);
        color: var(--grab-label-color);
        font-size: 11px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        padding: 2px 6px;
        border-radius: 2px;
        white-space: nowrap;
        display: none;
        line-height: 1.4;
        align-items: center;
        gap: 4px;
      }
      .grab-a11y-icon {
        display: flex;
        align-items: center;
        opacity: 0.3;
        transition: opacity 0.1s ease;
      }
      .grab-a11y-icon.has-a11y {
        opacity: 1;
        color: #4ade80;
      }
    `;
    this.shadowRoot.appendChild(style);

    this.highlightBox = document.createElement("div");
    this.highlightBox.className = "grab-highlight";
    this.shadowRoot.appendChild(this.highlightBox);

    this.labelEl = document.createElement("div");
    this.labelEl.className = "grab-label";

    this.labelTextEl = document.createElement("span");
    this.labelIconEl = document.createElement("span");
    this.labelIconEl.className = "grab-a11y-icon";
    this.labelIconEl.innerHTML = A11Y_ICON_SVG;
    this.labelEl.appendChild(this.labelTextEl);
    this.labelEl.appendChild(this.labelIconEl);

    this.shadowRoot.appendChild(this.labelEl);
  }

  highlight(el: Element, label?: string, hasA11y?: boolean): void {
    if (!this.highlightBox || !this.labelEl) return;

    const rect = el.getBoundingClientRect();

    this.highlightBox.style.top = `${rect.top}px`;
    this.highlightBox.style.left = `${rect.left}px`;
    this.highlightBox.style.width = `${rect.width}px`;
    this.highlightBox.style.height = `${rect.height}px`;
    this.highlightBox.style.display = "block";

    if (this.config.showTagHint && label) {
      this.labelTextEl!.textContent = label;
      this.labelIconEl!.classList.toggle("has-a11y", !!hasA11y);
      // Position label above the highlight, or below if near viewport top
      const labelHeight = 20;
      if (rect.top > labelHeight + 4) {
        this.labelEl.style.top = `${rect.top - labelHeight - 4}px`;
      } else {
        this.labelEl.style.top = `${rect.bottom + 4}px`;
      }
      this.labelEl.style.left = `${rect.left}px`;
      this.labelEl.style.display = "inline-flex";
    } else {
      this.labelEl.style.display = "none";
    }
  }

  clearHighlight(): void {
    if (this.highlightBox) this.highlightBox.style.display = "none";
    if (this.labelEl) this.labelEl.style.display = "none";
  }

  destroy(): void {
    if (this.host) {
      this.host.remove();
      this.host = null;
      this.shadowRoot = null;
      this.highlightBox = null;
      this.labelEl = null;
      this.labelTextEl = null;
      this.labelIconEl = null;
    }
  }
}

export { OVERLAY_HOST_ID };
