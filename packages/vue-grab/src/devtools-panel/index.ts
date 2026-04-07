import type {
  DevToolsPanelConfig,
  DevToolsPanelMode,
  GrabResult,
  MatchedCSSRule,
  StyleUpdateRequest,
} from "@sakana-y/vue-grab-shared";
import { matchCSSRules } from "../css-inspector";
import {
  tryReadStorage,
  trySaveStorage,
  renderInspectorHTML,
  wireInspectorEvents,
  INSPECTOR_STYLES,
} from "../utils";

export const DEVTOOLS_HOST_ID = "vue-grab-devtools-host";

const STYLES = `
  :host {
    all: initial;
  }
  .devtools-panel {
    position: fixed;
    z-index: 2147483645;
    display: none;
    flex-direction: column;
    background: rgba(25,25,25,0.94);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.1);
    color: #e0e0e0;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    overflow: hidden;
  }
  .devtools-panel.visible {
    display: flex;
  }

  /* Float mode */
  .devtools-panel.mode-float {
    border-radius: 12px;
    width: 420px;
    height: 520px;
    min-width: 320px;
    min-height: 300px;
    resize: both;
  }

  /* Edge mode - bottom */
  .devtools-panel.mode-edge.dock-bottom {
    left: 0;
    right: 0;
    bottom: 0;
    height: 300px;
    min-height: 150px;
    border-radius: 0;
    border-left: none;
    border-right: none;
    border-bottom: none;
    resize: vertical;
  }

  /* Edge mode - right */
  .devtools-panel.mode-edge.dock-right {
    top: 0;
    bottom: 0;
    right: 0;
    width: 420px;
    min-width: 280px;
    border-radius: 0;
    border-top: none;
    border-right: none;
    border-bottom: none;
    resize: horizontal;
  }

  /* Header */
  .dt-header {
    display: flex;
    align-items: center;
    padding: 10px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    gap: 8px;
    flex-shrink: 0;
    cursor: grab;
    user-select: none;
  }
  .dt-header.dragging {
    cursor: grabbing;
  }
  .mode-edge .dt-header {
    cursor: default;
  }
  .dt-title {
    font-weight: 600;
    font-size: 13px;
    color: #fff;
    flex: 1;
    white-space: nowrap;
  }
  .dt-mode-switcher {
    display: flex;
    gap: 0;
    background: rgba(255,255,255,0.06);
    border-radius: 6px;
    overflow: hidden;
  }
  .dt-mode-btn {
    background: none;
    border: none;
    color: #888;
    font-size: 11px;
    font-family: inherit;
    padding: 4px 10px;
    cursor: pointer;
    transition: color 0.15s, background 0.15s;
  }
  .dt-mode-btn:hover {
    color: #ccc;
  }
  .dt-mode-btn.active {
    color: #fff;
    background: var(--grab-color, #4f46e5);
  }
  .dt-close {
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    padding: 0 2px;
  }
  .dt-close:hover {
    color: #fff;
  }

  /* Scrollable body */
  .dt-body {
    flex: 1;
    overflow-y: auto;
    padding: 12px 14px;
  }
  .dt-body::-webkit-scrollbar {
    width: 6px;
  }
  .dt-body::-webkit-scrollbar-track {
    background: transparent;
  }
  .dt-body::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.15);
    border-radius: 3px;
  }

  ${INSPECTOR_STYLES}
`;

interface PanelGeometry {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class DevToolsPanel {
  private host: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private panelEl: HTMLElement | null = null;
  private headerEl: HTMLElement | null = null;
  private bodyEl: HTMLElement | null = null;
  private config: DevToolsPanelConfig;
  private mode: DevToolsPanelMode;

  // Float drag state
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragPanelStartX = 0;
  private dragPanelStartY = 0;

  // Current geometry for float mode
  private geometry: PanelGeometry = { x: -1, y: -1, w: 420, h: 520 };

  // Callbacks
  private styleChangeCbs: Set<(update: StyleUpdateRequest) => void> = new Set();
  private openEditorCbs: Set<(filePath: string, line?: number) => void> = new Set();
  private visibilityChangeCbs: Set<(visible: boolean) => void> = new Set();

  // Current state
  private currentResult: GrabResult | null = null;
  private currentRules: MatchedCSSRule[] = [];

  // Bound handlers
  private boundMouseMove: ((e: MouseEvent) => void) | null = null;
  private boundMouseUp: ((e: MouseEvent) => void) | null = null;

  constructor(config: DevToolsPanelConfig) {
    this.config = config;
    this.mode =
      tryReadStorage<DevToolsPanelMode>(config.panelModeStorageKey, (raw) =>
        raw === "float" || raw === "edge" ? raw : null,
      ) ?? config.initialMode;
    const savedGeo = tryReadStorage<PanelGeometry>(config.panelGeometryStorageKey, (raw) => {
      const o = JSON.parse(raw);
      return typeof o.x === "number" ? o : null;
    });
    if (savedGeo) this.geometry = savedGeo;
  }

  mount(): void {
    if (this.host) return;

    this.host = document.createElement("div");
    this.host.id = DEVTOOLS_HOST_ID;
    this.host.style.cssText =
      "position:fixed;top:0;left:0;width:0;height:0;z-index:2147483645;pointer-events:none;";
    document.body.appendChild(this.host);

    this.shadowRoot = this.host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = STYLES;
    this.shadowRoot.appendChild(style);

    this.panelEl = document.createElement("div");
    this.panelEl.className = "devtools-panel";
    this.panelEl.style.pointerEvents = "auto";
    this.panelEl.innerHTML = this.buildShellHTML();
    this.shadowRoot.appendChild(this.panelEl);

    // Cache references
    this.headerEl = this.panelEl.querySelector(".dt-header");
    this.bodyEl = this.panelEl.querySelector(".dt-body");

    // Wire header events
    this.headerEl!.addEventListener("mousedown", this.onHeaderMouseDown.bind(this));
    this.panelEl.querySelector(".dt-close")!.addEventListener("click", () => this.hide());

    // Mode switcher
    for (const btn of Array.from(this.panelEl.querySelectorAll(".dt-mode-btn"))) {
      btn.addEventListener("click", () => {
        const m = (btn as HTMLElement).dataset.mode as DevToolsPanelMode;
        if (m) this.setMode(m);
      });
    }

    this.applyMode();
  }

  destroy(): void {
    this.cleanupDragListeners();
    if (this.host) {
      this.host.remove();
      this.host = null;
      this.shadowRoot = null;
      this.panelEl = null;
      this.headerEl = null;
      this.bodyEl = null;
    }
  }

  show(result: GrabResult): void {
    if (!this.panelEl) this.mount();
    this.currentResult = result;
    this.currentRules = matchCSSRules(result.element);
    this.renderBody();
    this.panelEl!.classList.add("visible");
    this.visibilityChangeCbs.forEach((cb) => cb(true));
    this.initFloatGeometryIfNeeded();
    this.applyMode();
  }

  hide(): void {
    this.panelEl?.classList.remove("visible");
    this.visibilityChangeCbs.forEach((cb) => cb(false));
  }

  isVisible(): boolean {
    return this.panelEl?.classList.contains("visible") ?? false;
  }

  toggle(): void {
    if (this.isVisible()) {
      this.hide();
    } else {
      // Re-show with last result if available
      if (this.currentResult) {
        this.show(this.currentResult);
      } else {
        // Show empty state
        if (!this.panelEl) this.mount();
        this.panelEl!.classList.add("visible");
        this.initFloatGeometryIfNeeded();
        this.applyMode();
      }
    }
  }

  onVisibilityChange(cb: (visible: boolean) => void): () => void {
    this.visibilityChangeCbs.add(cb);
    return () => this.visibilityChangeCbs.delete(cb);
  }

  onStyleChange(cb: (update: StyleUpdateRequest) => void): () => void {
    this.styleChangeCbs.add(cb);
    return () => this.styleChangeCbs.delete(cb);
  }

  onOpenEditor(cb: (filePath: string, line?: number) => void): () => void {
    this.openEditorCbs.add(cb);
    return () => this.openEditorCbs.delete(cb);
  }

  private buildShellHTML(): string {
    return `
      <div class="dt-header">
        <span class="dt-title">Vue Grab Inspector</span>
        <div class="dt-mode-switcher">
          <button class="dt-mode-btn${this.mode === "float" ? " active" : ""}" data-mode="float">Float</button>
          <button class="dt-mode-btn${this.mode === "edge" ? " active" : ""}" data-mode="edge">Edge</button>
        </div>
        <button class="dt-close">&times;</button>
      </div>
      <div class="dt-body">
        <div class="dt-empty">Grab an element to inspect</div>
      </div>
    `;
  }

  private renderBody(): void {
    if (!this.bodyEl || !this.currentResult) return;

    this.bodyEl.innerHTML = renderInspectorHTML(this.currentResult, this.currentRules);

    wireInspectorEvents(this.bodyEl, {
      onOpenFile: (file, line) => {
        this.openEditorCbs.forEach((cb) => cb(file, line));
      },
      onStyleChange: (update) => {
        this.styleChangeCbs.forEach((cb) => cb(update));
      },
    });
  }

  // --- Mode switching ---

  private setMode(mode: DevToolsPanelMode): void {
    if (mode === this.mode) return;
    // Save float geometry before switching away
    if (this.mode === "float" && this.panelEl) {
      const rect = this.panelEl.getBoundingClientRect();
      this.geometry = { x: rect.left, y: rect.top, w: rect.width, h: rect.height };
    }
    this.mode = mode;
    trySaveStorage(this.config.panelModeStorageKey, mode);
    this.applyMode();
    this.updateModeSwitcher();
  }

  private applyMode(): void {
    if (!this.panelEl) return;
    this.panelEl.classList.remove("mode-float", "mode-edge", "dock-bottom", "dock-right");

    if (this.mode === "float") {
      this.panelEl.classList.add("mode-float");
      this.panelEl.style.left = `${this.geometry.x}px`;
      this.panelEl.style.top = `${this.geometry.y}px`;
      this.panelEl.style.width = `${this.geometry.w}px`;
      this.panelEl.style.height = `${this.geometry.h}px`;
      this.panelEl.style.right = "auto";
      this.panelEl.style.bottom = "auto";
    } else {
      this.panelEl.classList.add("mode-edge", `dock-${this.config.edgeSide}`);
      // Clear float positioning
      this.panelEl.style.left = "";
      this.panelEl.style.top = "";
      this.panelEl.style.width = "";
      this.panelEl.style.height = "";
      this.panelEl.style.right = "";
      this.panelEl.style.bottom = "";
    }
  }

  private updateModeSwitcher(): void {
    if (!this.panelEl) return;
    for (const btn of Array.from(this.panelEl.querySelectorAll(".dt-mode-btn"))) {
      btn.classList.toggle("active", (btn as HTMLElement).dataset.mode === this.mode);
    }
  }

  private initFloatGeometryIfNeeded(): void {
    if (this.mode === "float" && this.geometry.x < 0) {
      this.geometry.x = Math.max(20, window.innerWidth - 420 - 40);
      this.geometry.y = Math.max(20, Math.round((window.innerHeight - 520) / 2));
    }
  }

  // --- Float drag ---

  private onHeaderMouseDown(e: MouseEvent): void {
    if (this.mode !== "float") return;
    if ((e.target as HTMLElement).closest("button")) return;

    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    const rect = this.panelEl!.getBoundingClientRect();
    this.dragPanelStartX = rect.left;
    this.dragPanelStartY = rect.top;

    this.headerEl!.classList.add("dragging");

    this.boundMouseMove = this.onDragMove.bind(this);
    this.boundMouseUp = this.onDragEnd.bind(this);
    document.addEventListener("mousemove", this.boundMouseMove);
    document.addEventListener("mouseup", this.boundMouseUp);
  }

  private onDragMove(e: MouseEvent): void {
    if (!this.isDragging || !this.panelEl) return;
    const dx = e.clientX - this.dragStartX;
    const dy = e.clientY - this.dragStartY;
    const x = this.dragPanelStartX + dx;
    const y = this.dragPanelStartY + dy;
    this.panelEl.style.left = `${x}px`;
    this.panelEl.style.top = `${y}px`;
  }

  private onDragEnd(): void {
    this.isDragging = false;
    this.headerEl?.classList.remove("dragging");
    this.cleanupDragListeners();

    // Save geometry
    if (this.panelEl) {
      const rect = this.panelEl.getBoundingClientRect();
      this.geometry = { x: rect.left, y: rect.top, w: rect.width, h: rect.height };
      trySaveStorage(this.config.panelGeometryStorageKey, JSON.stringify(this.geometry));
    }
  }

  private cleanupDragListeners(): void {
    if (this.boundMouseMove) {
      document.removeEventListener("mousemove", this.boundMouseMove);
      this.boundMouseMove = null;
    }
    if (this.boundMouseUp) {
      document.removeEventListener("mouseup", this.boundMouseUp);
      this.boundMouseUp = null;
    }
  }
}
