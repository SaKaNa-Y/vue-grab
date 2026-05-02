import type { MeasurerConfig } from "@sakana-y/vue-grab-shared";
import { FAB_HOST_ID } from "../floating-button";
import { OVERLAY_HOST_ID } from "../overlay";
import { MAGNIFIER_HOST_ID } from "../magnifier";

export const MEASURER_HOST_ID = "vue-grab-measurer-host";

const SVG_NS = "http://www.w3.org/2000/svg";

const STYLES = `
  :host { all: initial; }

  .measurer-container {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 2147483645;
    display: none;
  }
  .measurer-container.active {
    display: block;
  }

  svg {
    width: 100%;
    height: 100%;
  }

  .dim-rect {
    fill: none;
    stroke-dasharray: 4 3;
  }
  .dim-rect-selected {
    fill: none;
    stroke-dasharray: none;
  }
  .dim-label {
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
    font-size: 11px;
    pointer-events: none;
  }
  .dim-label-bg {
    rx: 3;
    ry: 3;
  }
  .spacing-line {
    stroke-dasharray: none;
  }
  .spacing-label {
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
    font-size: 11px;
    font-weight: 600;
    pointer-events: none;
  }
  .spacing-label-bg {
    rx: 3;
    ry: 3;
  }
  .guide-line {
    stroke-dasharray: 6 4;
    opacity: 0.6;
  }
`;

export class MeasurerOverlay {
  private host: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private container: HTMLElement | null = null;
  private svg: SVGSVGElement | null = null;
  private config: MeasurerConfig;

  private active = false;
  private selectedElement: Element | null = null;
  private hoveredElement: Element | null = null;
  private rafId: number | null = null;
  private stateListeners: Set<(active: boolean) => void> = new Set();

  private boundMouseMove: ((e: MouseEvent) => void) | null = null;
  private boundClick: ((e: MouseEvent) => void) | null = null;
  private boundKeyDown: ((e: KeyboardEvent) => void) | null = null;

  constructor(config: MeasurerConfig) {
    this.config = { ...config };
  }

  get isActive(): boolean {
    return this.active;
  }

  mount(): void {
    if (this.host) return;

    this.host = document.createElement("div");
    this.host.id = MEASURER_HOST_ID;
    this.host.style.cssText =
      "position:fixed;top:0;left:0;width:0;height:0;overflow:visible;z-index:2147483645;pointer-events:none;";

    this.shadowRoot = this.host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = STYLES;
    this.shadowRoot.appendChild(style);

    this.container = document.createElement("div");
    this.container.className = "measurer-container";
    this.shadowRoot.appendChild(this.container);

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    this.svg = svg;
    this.container.appendChild(svg);

    document.body.appendChild(this.host);
  }

  unmount(): void {
    if (this.host) {
      this.deactivate();
      this.host.remove();
      this.host = null;
      this.shadowRoot = null;
      this.container = null;
      this.svg = null;
    }
  }

  activate(): void {
    if (this.active || !this.container) return;
    this.active = true;
    this.container.classList.add("active");
    document.documentElement.style.cursor = "crosshair";

    this.boundMouseMove = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || this.shouldIgnore(el)) {
        if (this.hoveredElement) {
          this.hoveredElement = null;
          this.scheduleRender();
        }
        return;
      }
      if (el !== this.hoveredElement) {
        this.hoveredElement = el;
        this.scheduleRender();
      }
    };

    this.boundClick = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);

      // Let clicks on vue-grab UI (FAB, overlay, etc.) pass through
      if (!el || this.shouldIgnore(el)) return;

      e.preventDefault();

      if (el === this.selectedElement) {
        // Click same element → deselect
        this.selectedElement = null;
      } else {
        this.selectedElement = el;
      }
      this.scheduleRender();
    };

    this.boundKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        this.deactivate();
      }
    };

    document.addEventListener("mousemove", this.boundMouseMove, { capture: true });
    document.addEventListener("click", this.boundClick, { capture: true });
    document.addEventListener("keydown", this.boundKeyDown, { capture: true });
    this.notifyState(true);
  }

  deactivate(): void {
    if (!this.active) return;
    this.active = false;
    this.container?.classList.remove("active");
    document.documentElement.style.cursor = "";

    if (this.boundMouseMove) {
      document.removeEventListener("mousemove", this.boundMouseMove, { capture: true });
      this.boundMouseMove = null;
    }
    if (this.boundClick) {
      document.removeEventListener("click", this.boundClick, { capture: true });
      this.boundClick = null;
    }
    if (this.boundKeyDown) {
      document.removeEventListener("keydown", this.boundKeyDown, { capture: true });
      this.boundKeyDown = null;
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.selectedElement = null;
    this.hoveredElement = null;
    this.clearSvg();
    this.notifyState(false);
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

  updateConfig(partial: Partial<MeasurerConfig>): void {
    Object.assign(this.config, partial);
  }

  destroy(): void {
    this.unmount();
    this.stateListeners.clear();
  }

  // ── Private ──

  private notifyState(active: boolean): void {
    for (const cb of this.stateListeners) cb(active);
  }

  private shouldIgnore(el: Element): boolean {
    return !!el.closest(
      `#${MEASURER_HOST_ID}, #${FAB_HOST_ID}, #${OVERLAY_HOST_ID}, #${MAGNIFIER_HOST_ID}`,
    );
  }

  private scheduleRender(): void {
    if (this.rafId !== null) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.render();
    });
  }

  private clearSvg(): void {
    if (!this.svg) return;
    while (this.svg.firstChild) {
      this.svg.removeChild(this.svg.firstChild);
    }
  }

  private render(): void {
    if (!this.svg) return;
    this.clearSvg();

    const { lineColor, guideColor, lineWidth, showAlignmentGuides, alignmentTolerance } =
      this.config;

    // Draw selected element (solid border)
    if (this.selectedElement) {
      const rect = this.selectedElement.getBoundingClientRect();
      this.drawDimensionBox(rect, lineColor, lineWidth, false);
    }

    // Draw hovered element (dashed border) if different from selected
    if (this.hoveredElement && this.hoveredElement !== this.selectedElement) {
      const rect = this.hoveredElement.getBoundingClientRect();
      this.drawDimensionBox(rect, lineColor, lineWidth, true);

      // If both selected and hovered, draw spacing + guides
      if (this.selectedElement) {
        const selectedRect = this.selectedElement.getBoundingClientRect();
        this.drawSpacingLines(selectedRect, rect, lineColor, lineWidth);
        if (showAlignmentGuides) {
          this.drawAlignmentGuides(selectedRect, rect, guideColor, lineWidth, alignmentTolerance);
        }
      }
    }
  }

  private drawDimensionBox(rect: DOMRect, color: string, lineWidth: number, dashed: boolean): void {
    if (!this.svg) return;
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);

    // Border rect
    const r = this.createSvgEl("rect");
    r.setAttribute("x", String(rect.left));
    r.setAttribute("y", String(rect.top));
    r.setAttribute("width", String(rect.width));
    r.setAttribute("height", String(rect.height));
    r.setAttribute("stroke", color);
    r.setAttribute("stroke-width", String(lineWidth));
    r.setAttribute("fill", "none");
    r.setAttribute("class", dashed ? "dim-rect" : "dim-rect-selected");
    this.svg.appendChild(r);

    // Dimension label: "W × H"
    const label = `${w} × ${h}`;
    const labelX = rect.left + rect.width / 2;
    // Position label below the element, or above if near bottom
    const labelBelow = rect.bottom + 20 < window.innerHeight;
    const labelY = labelBelow ? rect.bottom + 14 : rect.top - 8;

    // Background
    const textMetrics = this.estimateTextWidth(label);
    const bgPad = 4;
    const bg = this.createSvgEl("rect");
    bg.setAttribute("x", String(labelX - textMetrics / 2 - bgPad));
    bg.setAttribute("y", String(labelY - 10));
    bg.setAttribute("width", String(textMetrics + bgPad * 2));
    bg.setAttribute("height", "16");
    bg.setAttribute("fill", color);
    bg.setAttribute("class", "dim-label-bg");
    this.svg.appendChild(bg);

    // Text
    const text = this.createSvgEl("text");
    text.setAttribute("x", String(labelX));
    text.setAttribute("y", String(labelY + 2));
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "#fff");
    text.setAttribute("class", "dim-label");
    text.textContent = label;
    this.svg.appendChild(text);
  }

  private drawSpacingLines(a: DOMRect, b: DOMRect, color: string, lineWidth: number): void {
    if (!this.svg) return;

    // Horizontal spacing
    const hGap = this.computeGap(a.left, a.right, b.left, b.right);
    if (hGap) {
      const midY = this.computeSharedMidY(a, b);
      // Line from one edge to the other
      this.drawMeasurementLine(hGap.start, midY, hGap.end, midY, hGap.distance, color, lineWidth);
    }

    // Vertical spacing
    const vGap = this.computeGap(a.top, a.bottom, b.top, b.bottom);
    if (vGap) {
      const midX = this.computeSharedMidX(a, b);
      this.drawMeasurementLine(midX, vGap.start, midX, vGap.end, vGap.distance, color, lineWidth);
    }
  }

  private computeGap(
    aStart: number,
    aEnd: number,
    bStart: number,
    bEnd: number,
  ): { start: number; end: number; distance: number } | null {
    // A is left/top of B
    if (aEnd <= bStart) {
      return { start: aEnd, end: bStart, distance: Math.round(bStart - aEnd) };
    }
    // B is left/top of A
    if (bEnd <= aStart) {
      return { start: bEnd, end: aStart, distance: Math.round(aStart - bEnd) };
    }
    // Overlapping — no gap to show
    return null;
  }

  private computeSharedMidY(a: DOMRect, b: DOMRect): number {
    // Use the overlap midpoint if they overlap vertically, otherwise average
    const overlapTop = Math.max(a.top, b.top);
    const overlapBottom = Math.min(a.bottom, b.bottom);
    if (overlapTop < overlapBottom) {
      return (overlapTop + overlapBottom) / 2;
    }
    return (a.top + a.bottom + b.top + b.bottom) / 4;
  }

  private computeSharedMidX(a: DOMRect, b: DOMRect): number {
    const overlapLeft = Math.max(a.left, b.left);
    const overlapRight = Math.min(a.right, b.right);
    if (overlapLeft < overlapRight) {
      return (overlapLeft + overlapRight) / 2;
    }
    return (a.left + a.right + b.left + b.right) / 4;
  }

  private drawMeasurementLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    distance: number,
    color: string,
    lineWidth: number,
  ): void {
    if (!this.svg || distance <= 0) return;

    // Main line
    const line = this.createSvgEl("line");
    line.setAttribute("x1", String(x1));
    line.setAttribute("y1", String(y1));
    line.setAttribute("x2", String(x2));
    line.setAttribute("y2", String(y2));
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", String(lineWidth));
    line.setAttribute("class", "spacing-line");
    this.svg.appendChild(line);

    // End caps (perpendicular ticks)
    const isHorizontal = Math.abs(y2 - y1) < Math.abs(x2 - x1);
    const capLen = 6;
    if (isHorizontal) {
      this.drawCap(x1, y1, 0, -capLen, 0, capLen, color, lineWidth);
      this.drawCap(x2, y2, 0, -capLen, 0, capLen, color, lineWidth);
    } else {
      this.drawCap(x1, y1, -capLen, 0, capLen, 0, color, lineWidth);
      this.drawCap(x2, y2, -capLen, 0, capLen, 0, color, lineWidth);
    }

    // Distance label
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const label = `${distance}px`;
    const textW = this.estimateTextWidth(label);
    const bgPad = 4;

    // Offset label to avoid overlapping the line
    const offsetX = isHorizontal ? 0 : 12;
    const offsetY = isHorizontal ? -12 : 0;

    const bg = this.createSvgEl("rect");
    bg.setAttribute("x", String(midX + offsetX - textW / 2 - bgPad));
    bg.setAttribute("y", String(midY + offsetY - 10));
    bg.setAttribute("width", String(textW + bgPad * 2));
    bg.setAttribute("height", "16");
    bg.setAttribute("fill", color);
    bg.setAttribute("class", "spacing-label-bg");
    this.svg.appendChild(bg);

    const text = this.createSvgEl("text");
    text.setAttribute("x", String(midX + offsetX));
    text.setAttribute("y", String(midY + offsetY + 2));
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "#fff");
    text.setAttribute("class", "spacing-label");
    text.textContent = label;
    this.svg.appendChild(text);
  }

  private drawCap(
    cx: number,
    cy: number,
    dx1: number,
    dy1: number,
    dx2: number,
    dy2: number,
    color: string,
    lineWidth: number,
  ): void {
    if (!this.svg) return;
    const cap = this.createSvgEl("line");
    cap.setAttribute("x1", String(cx + dx1));
    cap.setAttribute("y1", String(cy + dy1));
    cap.setAttribute("x2", String(cx + dx2));
    cap.setAttribute("y2", String(cy + dy2));
    cap.setAttribute("stroke", color);
    cap.setAttribute("stroke-width", String(lineWidth));
    this.svg.appendChild(cap);
  }

  private drawAlignmentGuides(
    a: DOMRect,
    b: DOMRect,
    guideColor: string,
    lineWidth: number,
    tolerance: number,
  ): void {
    if (!this.svg) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const checks: Array<{ val1: number; val2: number; horizontal: boolean }> = [
      // Horizontal alignment (shared Y positions)
      { val1: a.top, val2: b.top, horizontal: true },
      { val1: a.bottom, val2: b.bottom, horizontal: true },
      { val1: a.top + a.height / 2, val2: b.top + b.height / 2, horizontal: true },
      // Vertical alignment (shared X positions)
      { val1: a.left, val2: b.left, horizontal: false },
      { val1: a.right, val2: b.right, horizontal: false },
      { val1: a.left + a.width / 2, val2: b.left + b.width / 2, horizontal: false },
    ];

    for (const { val1, val2, horizontal } of checks) {
      if (Math.abs(val1 - val2) <= tolerance) {
        const pos = (val1 + val2) / 2;
        const line = this.createSvgEl("line");
        if (horizontal) {
          line.setAttribute("x1", "0");
          line.setAttribute("y1", String(pos));
          line.setAttribute("x2", String(vw));
          line.setAttribute("y2", String(pos));
        } else {
          line.setAttribute("x1", String(pos));
          line.setAttribute("y1", "0");
          line.setAttribute("x2", String(pos));
          line.setAttribute("y2", String(vh));
        }
        line.setAttribute("stroke", guideColor);
        line.setAttribute("stroke-width", String(lineWidth));
        line.setAttribute("class", "guide-line");
        this.svg.appendChild(line);
      }
    }
  }

  private createSvgEl(tag: string): SVGElement {
    return document.createElementNS(SVG_NS, tag);
  }

  private estimateTextWidth(text: string): number {
    // Rough estimate: ~6.6px per character at 11px monospace
    return text.length * 6.6;
  }
}
