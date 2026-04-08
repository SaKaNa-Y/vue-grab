import type {
  FloatingButtonConfig,
  GrabResult,
  MatchedCSSRule,
  StyleUpdateRequest,
} from "@sakana-y/vue-grab-shared";
import { buildCombo } from "../hotkeys";
import { openInEditor } from "../editor";
import { matchCSSRules } from "../css-inspector";
import {
  esc,
  tryReadStorage,
  trySaveStorage,
  renderInspectorHTML,
  wireInspectorEvents,
  INSPECTOR_STYLES,
} from "../utils";

export const FAB_HOST_ID = "vue-grab-fab-host";

const DRAG_THRESHOLD = 3;
const SNAP_TRANSITION = "left 0.3s ease, top 0.3s ease";
const EDGE_MARGIN = 3; // reference margin as % of viewport height
const INITIAL_SNAP_ZONE = 5; // positions within this % of edge get adjusted to responsive margin

function edgeMarginX(): number {
  return (EDGE_MARGIN * window.innerHeight) / window.innerWidth;
}

const INITIAL_POSITIONS: Record<FloatingButtonConfig["initialPosition"], { x: number; y: number }> =
  {
    "bottom-right": { x: 97, y: 85 },
    "bottom-left": { x: 3, y: 85 },
    "top-right": { x: 97, y: 15 },
    "top-left": { x: 3, y: 15 },
    "top-center": { x: 50, y: 3 },
  };

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

function tryReadPosition(key: string): { x: number; y: number } | null {
  return tryReadStorage(key, (raw) => {
    const { x, y } = JSON.parse(raw);
    return typeof x === "number" && typeof y === "number" ? { x, y } : null;
  });
}

function trySavePosition(key: string, x: number, y: number): void {
  trySaveStorage(key, JSON.stringify({ x, y }));
}

function tryReadHotkey(key: string): string | null {
  return tryReadStorage(key, (raw) => (typeof raw === "string" ? raw : null));
}

function trySaveHotkey(key: string, combo: string): void {
  trySaveStorage(key, combo);
}

function tryReadEditor(key: string): string | null {
  return tryReadStorage(key, (raw) => (typeof raw === "string" ? raw : null));
}

function trySaveEditor(key: string, editor: string): void {
  trySaveStorage(key, editor);
}

const CROSSHAIR_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/><line x1="12" y1="15" x2="12" y2="9"/><line x1="9" y1="12" x2="15" y2="12"/></svg>`;

const GEAR_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.32 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;

const INSPECTOR_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`;

const EDITOR_PRESETS = [
  { label: "Auto-detect", value: "" },
  { label: "VS Code", value: "code" },
  { label: "Cursor", value: "cursor" },
];

type TabId = "shortcuts" | "editor";
type PanelId = "settings" | "inspector";

const STYLES = `
  :host {
    all: initial;
  }

  /* ── FAB wrapper (flex column: bar + panel) ── */
  .fab-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .fab-wrapper.expand-up {
    flex-direction: column-reverse;
  }
  .fab-wrapper.expand-right {
    flex-direction: row;
    align-items: center;
  }
  .fab-wrapper.expand-left {
    flex-direction: row-reverse;
    align-items: center;
  }

  /* ── Toolbar (compact bar) ── */
  .toolbar {
    display: inline-flex;
    flex-direction: column;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(30,30,30,0.85);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 0 2px 10px rgba(0,0,0,0.35);
    cursor: grab;
    user-select: none;
    touch-action: none;
    position: relative;
  }
  .toolbar.dragging {
    cursor: grabbing;
    box-shadow: 0 4px 16px rgba(0,0,0,0.5);
  }

  /* ── Button row ── */
  .toolbar-row {
    display: inline-flex;
    align-items: center;
    height: 36px;
    padding: 0 4px;
    gap: 2px;
    flex-shrink: 0;
  }

  .toolbar-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: #a0a0a0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
  }
  .toolbar-btn:hover {
    color: #e0e0e0;
    background: rgba(255,255,255,0.08);
  }
  .grab-btn.active {
    color: var(--grab-color, #4f46e5);
    box-shadow: inset 0 0 0 1.5px var(--grab-color, #4f46e5);
    background: color-mix(in srgb, var(--grab-color, #4f46e5) 12%, transparent);
  }
  .gear-btn.active,
  .inspector-btn.active {
    color: var(--grab-color, #4f46e5);
    box-shadow: inset 0 0 0 1.5px var(--grab-color, #4f46e5);
    background: color-mix(in srgb, var(--grab-color, #4f46e5) 12%, transparent);
  }
  .toolbar-divider {
    width: 1px;
    height: 18px;
    background: rgba(255,255,255,0.12);
    margin: 0 2px;
  }

  /* ── Expand body (separate card below/above bar) ── */
  .expand-body {
    display: none;
    flex-direction: column;
    overflow-y: auto;
    height: min(500px, 65vh);
    width: min(900px, 85vw);
    color: #e0e0e0;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    cursor: default;
    touch-action: pan-y;
    user-select: text;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(30,30,30,0.85);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 0 2px 10px rgba(0,0,0,0.35);
    box-sizing: border-box;
  }
  .expand-body.open {
    display: flex;
  }
  .expand-body::-webkit-scrollbar {
    width: 6px;
  }
  .expand-body::-webkit-scrollbar-track {
    background: transparent;
  }
  .expand-body::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.15);
    border-radius: 3px;
  }

  /* ── Tabs (inside settings content) ── */
  .tab-bar {
    display: flex;
    padding: 0 14px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    gap: 0;
    flex-shrink: 0;
  }
  .tab-btn {
    background: none;
    border: none;
    color: #888;
    font-size: 12px;
    font-family: inherit;
    padding: 8px 12px;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: color 0.15s ease, border-color 0.15s ease;
    white-space: nowrap;
  }
  .tab-btn:hover {
    color: #ccc;
  }
  .tab-btn.active {
    color: var(--grab-color, #4f46e5);
    border-bottom-color: var(--grab-color, #4f46e5);
  }
  .tab-content {
    padding: 14px;
    display: none;
  }
  .tab-content.active {
    display: block;
  }

  /* Section label */
  .section-label {
    font-size: 11px;
    color: #888;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .section-label:not(:first-child) {
    margin-top: 14px;
  }

  /* Hotkey row */
  .hotkey-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  kbd {
    display: inline-flex;
    align-items: center;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 6px;
    padding: 4px 10px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    color: #ddd;
    min-width: 80px;
    justify-content: center;
    flex: 1;
  }
  kbd.recording {
    border-color: var(--grab-color, #4f46e5);
    box-shadow: 0 0 0 1px var(--grab-color, #4f46e5);
    animation: pulse 1.5s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  .record-btn {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 6px;
    color: #ccc;
    padding: 4px 10px;
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;
    font-family: inherit;
  }
  .record-btn:hover {
    background: rgba(255,255,255,0.14);
    color: #fff;
  }

  /* Select dropdown */
  .editor-select {
    width: 100%;
    padding: 6px 10px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 6px;
    color: #ddd;
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
  }
  .editor-select:focus {
    outline: none;
    border-color: var(--grab-color, #4f46e5);
  }
  .editor-select option {
    background: #1e1e1e;
    color: #ddd;
  }

  /* Open file button */
  .open-file-btn {
    width: 100%;
    margin-top: 12px;
    padding: 7px 12px;
    background: var(--grab-color, #4f46e5);
    border: none;
    border-radius: 6px;
    color: #fff;
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
    transition: opacity 0.15s ease;
  }
  .open-file-btn:hover {
    opacity: 0.85;
  }
  .open-file-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .file-path-display {
    margin-top: 8px;
    font-size: 11px;
    color: #666;
    word-break: break-all;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }

  /* Vertical layout */
  .toolbar.vertical .toolbar-row {
    flex-direction: column;
    height: auto;
    width: 36px;
    padding: 4px 0;
  }
  .toolbar.vertical .toolbar-divider {
    width: 18px;
    height: 1px;
    margin: 2px 0;
  }
  /* When expanded vertically + vertical toolbar, override to horizontal row */
  .fab-wrapper.expanded:not(.expand-left):not(.expand-right) .toolbar.vertical .toolbar-row {
    flex-direction: row;
    width: auto;
    height: 36px;
    padding: 0 4px;
  }
  .fab-wrapper.expanded:not(.expand-left):not(.expand-right) .toolbar.vertical .toolbar-divider {
    width: 1px;
    height: 18px;
    margin: 0 2px;
  }

  ${INSPECTOR_STYLES}
`;

export class FloatingButton {
  private host: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private wrapperEl: HTMLElement | null = null;
  private toolbarEl: HTMLElement | null = null;
  private toolbarRowEl: HTMLElement | null = null;
  private expandBodyEl: HTMLElement | null = null;
  private btnEl: HTMLElement | null = null;
  private gearEl: HTMLElement | null = null;
  private inspectorEl: HTMLElement | null = null;
  private pendingRafId: number | null = null;
  private config: FloatingButtonConfig;

  // Expand state
  private activePanel: PanelId | null = null;
  private settingsTab: TabId = "shortcuts";

  // Editor state
  private editorChoice = "";
  private lastGrabResult: GrabResult | null = null;
  private lastCSSRules: MatchedCSSRule[] = [];

  // Position (viewport %)
  private posX = 97;
  private posY = 85;

  // Drag state (toolbar)
  private isDragging = false;
  private wasDragged = false;
  private dragPointerId = -1;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  // Hotkey state
  private isRecording = false;
  private currentHotkey = "";

  // Callbacks
  private toggleCb: (() => void) | null = null;
  private hotkeyChangeCb: ((combo: string) => void) | null = null;
  private configChangeCb: ((changes: Record<string, unknown>) => void) | null = null;
  private styleChangeCb: ((update: StyleUpdateRequest) => void) | null = null;

  // Bound handlers for cleanup
  private boundPointerDown: ((e: PointerEvent) => void) | null = null;
  private boundPointerMove: ((e: PointerEvent) => void) | null = null;
  private boundPointerUp: ((e: PointerEvent) => void) | null = null;
  private boundDocClick: ((e: MouseEvent) => void) | null = null;
  private boundDocKeyDown: ((e: KeyboardEvent) => void) | null = null;
  private boundRecordKeyDown: ((e: KeyboardEvent) => void) | null = null;

  constructor(config: FloatingButtonConfig) {
    this.config = config;
    const initial = INITIAL_POSITIONS[config.initialPosition] ?? INITIAL_POSITIONS["bottom-right"];
    const saved = tryReadPosition(config.storageKey);
    if (saved) {
      this.posX = saved.x;
      this.posY = saved.y;
    } else {
      this.posX = initial.x;
      this.posY = initial.y;
      if (this.posX <= INITIAL_SNAP_ZONE) this.posX = edgeMarginX();
      else if (this.posX >= 100 - INITIAL_SNAP_ZONE) this.posX = 100 - edgeMarginX();
    }
    this.currentHotkey = tryReadHotkey(config.hotkeyStorageKey) ?? "";
    this.editorChoice = tryReadEditor(config.editorStorageKey) ?? "";
  }

  getCurrentHotkey(): string {
    return this.currentHotkey;
  }

  getEditorChoice(): string {
    return this.editorChoice;
  }

  setLastResult(result: GrabResult | null): void {
    this.lastGrabResult = result;
    this.lastCSSRules = [];
    // Re-render active panel if relevant
    if (this.activePanel === "inspector") {
      this.lastCSSRules = result ? matchCSSRules(result.element) : [];
      this.renderExpandBody();
    } else if (this.activePanel === "settings") {
      this.updateEditorTabInPlace();
    }
  }

  mount(): void {
    if (this.host) return;

    this.host = document.createElement("div");
    this.host.id = FAB_HOST_ID;
    this.host.style.cssText = `position:fixed;z-index:2147483646;pointer-events:auto;transform:translate(-50%,-50%);transition:${SNAP_TRANSITION};`;
    this.applyPosition();
    document.body.appendChild(this.host);

    this.shadowRoot = this.host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = STYLES;
    this.shadowRoot.appendChild(style);

    // Toolbar (outer column container)
    this.toolbarEl = document.createElement("div");
    this.toolbarEl.className = "toolbar";

    // Button row
    this.toolbarRowEl = document.createElement("div");
    this.toolbarRowEl.className = "toolbar-row";

    // Main grab button
    this.btnEl = document.createElement("div");
    this.btnEl.className = "toolbar-btn grab-btn";
    this.btnEl.innerHTML = CROSSHAIR_SVG;
    this.toolbarRowEl.appendChild(this.btnEl);

    // Divider
    const divider1 = document.createElement("div");
    divider1.className = "toolbar-divider";
    this.toolbarRowEl.appendChild(divider1);

    // Gear button (settings)
    this.gearEl = document.createElement("div");
    this.gearEl.className = "toolbar-btn gear-btn";
    this.gearEl.innerHTML = GEAR_SVG;
    this.toolbarRowEl.appendChild(this.gearEl);

    // Inspector button
    this.inspectorEl = document.createElement("div");
    this.inspectorEl.className = "toolbar-btn inspector-btn";
    this.inspectorEl.innerHTML = INSPECTOR_SVG;
    this.toolbarRowEl.appendChild(this.inspectorEl);

    this.toolbarEl.appendChild(this.toolbarRowEl);

    // Expandable body (separate card element)
    this.expandBodyEl = document.createElement("div");
    this.expandBodyEl.className = "expand-body";

    // Wrapper (flex column: bar + panel)
    this.wrapperEl = document.createElement("div");
    this.wrapperEl.className = "fab-wrapper";
    this.wrapperEl.appendChild(this.toolbarEl);
    this.wrapperEl.appendChild(this.expandBodyEl);

    this.shadowRoot.appendChild(this.wrapperEl);

    // Set initial orientation based on position
    this.applyOrientation(this.getEdgeFromPosition());

    // --- Event wiring ---

    // Drag: pointer events on toolbar row only
    this.boundPointerDown = this.onPointerDown.bind(this);
    this.boundPointerMove = this.onPointerMove.bind(this);
    this.boundPointerUp = this.onPointerUp.bind(this);
    this.toolbarEl.addEventListener("pointerdown", this.boundPointerDown);
    this.toolbarEl.addEventListener("pointermove", this.boundPointerMove);
    this.toolbarEl.addEventListener("pointerup", this.boundPointerUp);

    // Click on grab button (toggle)
    this.btnEl.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
      if (this.wasDragged) return;
      if (this.activePanel) {
        this.deactivatePanel();
        return;
      }
      this.toggleCb?.();
    });

    // Gear click → toggle settings panel
    this.gearEl.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
      if (this.wasDragged) return;
      this.activatePanel("settings");
    });

    // Inspector click → toggle inspector panel
    this.inspectorEl.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
      if (this.wasDragged) return;
      this.activatePanel("inspector");
    });

    // Document: close on outside click
    this.boundDocClick = (e: MouseEvent) => {
      if (!this.activePanel) return;
      const path = e.composedPath();
      if (!path.includes(this.host!)) {
        this.deactivatePanel();
      }
    };
    document.addEventListener("click", this.boundDocClick, { capture: true });

    // Document: Escape closes panel or stops recording
    this.boundDocKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (this.isRecording) {
          this.stopRecording();
          e.preventDefault();
          e.stopPropagation();
        } else if (this.activePanel) {
          this.deactivatePanel();
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    document.addEventListener("keydown", this.boundDocKeyDown, { capture: true });
  }

  destroy(): void {
    if (this.boundDocClick) {
      document.removeEventListener("click", this.boundDocClick, { capture: true });
    }
    if (this.boundDocKeyDown) {
      document.removeEventListener("keydown", this.boundDocKeyDown, { capture: true });
    }
    if (this.boundRecordKeyDown) {
      document.removeEventListener("keydown", this.boundRecordKeyDown, { capture: true });
    }
    if (this.pendingRafId) {
      cancelAnimationFrame(this.pendingRafId);
      this.pendingRafId = null;
    }
    if (this.host) {
      this.host.remove();
      this.host = null;
      this.shadowRoot = null;
      this.wrapperEl = null;
      this.toolbarEl = null;
      this.toolbarRowEl = null;
      this.expandBodyEl = null;
      this.btnEl = null;
      this.gearEl = null;
      this.inspectorEl = null;
    }
  }

  setActive(active: boolean): void {
    if (!this.btnEl) return;
    this.btnEl.classList.toggle("active", active);
  }

  setHighlightColor(color: string): void {
    this.host?.style.setProperty("--grab-color", color);
  }

  setCurrentHotkey(combo: string): void {
    this.currentHotkey = combo;
    // Update display if settings panel is showing
    if (this.activePanel === "settings") {
      const kbd = this.expandBodyEl?.querySelector("kbd");
      if (kbd) kbd.textContent = combo || "None";
    }
  }

  onToggle(cb: () => void): void {
    this.toggleCb = cb;
  }

  onHotkeyChange(cb: (combo: string) => void): void {
    this.hotkeyChangeCb = cb;
  }

  onConfigChange(cb: (changes: Record<string, unknown>) => void): void {
    this.configChangeCb = cb;
  }

  onStyleChange(cb: (update: StyleUpdateRequest) => void): void {
    this.styleChangeCb = cb;
  }

  // --- Panel activation (expand/collapse) ---

  private activatePanel(panel: PanelId): void {
    // Toggle off if already active
    if (this.activePanel === panel) {
      this.deactivatePanel();
      return;
    }
    // Stop recording if switching away from settings
    if (this.isRecording) this.stopRecording();

    this.activePanel = panel;
    this.wrapperEl!.classList.add("expanded");

    const edge = this.getEdgeFromPosition();
    const isHorizontal = edge === "left" || edge === "right";

    // Remove all expand direction classes first
    this.wrapperEl!.classList.remove("expand-up", "expand-left", "expand-right");

    if (isHorizontal) {
      // Left edge → panel expands right; Right edge → panel expands left
      this.wrapperEl!.classList.add(edge === "left" ? "expand-right" : "expand-left");
    } else {
      const expandUp = this.posY > 50;
      this.wrapperEl!.classList.toggle("expand-up", expandUp);
    }

    this.expandBodyEl!.classList.add("open");
    // Lazily compute CSS rules when inspector is first opened
    if (panel === "inspector" && this.lastCSSRules.length === 0 && this.lastGrabResult) {
      this.lastCSSRules = matchCSSRules(this.lastGrabResult.element);
    }
    this.renderExpandBody();

    // Anchor the host so the toolbar stays in place while the panel expands
    if (this.host) {
      this.host.style.transition = "none";

      if (isHorizontal) {
        const toolbarW = this.toolbarEl?.getBoundingClientRect().width ?? 36;
        const centerX = (this.posX / 100) * window.innerWidth;
        const centerY = (this.posY / 100) * window.innerHeight;
        this.host.style.top = `${centerY}px`;
        if (edge === "left") {
          const leftX = centerX - toolbarW / 2;
          this.host.style.left = `${leftX}px`;
          this.host.style.transform = "translate(0, -50%)";
        } else {
          const rightX = centerX + toolbarW / 2;
          this.host.style.left = `${rightX}px`;
          this.host.style.transform = "translate(-100%, -50%)";
        }
      } else {
        const toolbarH = 36;
        const centerY = (this.posY / 100) * window.innerHeight;
        if (this.posY > 50) {
          const bottomY = centerY + toolbarH / 2;
          this.host.style.top = `${bottomY}px`;
          this.host.style.transform = "translate(-50%, -100%)";
        } else {
          const topY = centerY - toolbarH / 2;
          this.host.style.top = `${topY}px`;
          this.host.style.transform = "translate(-50%, 0)";
        }
      }
    }

    // Update icon highlights
    this.gearEl!.classList.toggle("active", panel === "settings");
    this.inspectorEl!.classList.toggle("active", panel === "inspector");
  }

  private deactivatePanel(): void {
    if (!this.activePanel) return;
    if (this.isRecording) this.stopRecording();

    this.activePanel = null;
    this.wrapperEl!.classList.remove("expanded", "expand-up", "expand-left", "expand-right");
    this.expandBodyEl!.classList.remove("open");
    this.gearEl!.classList.remove("active");
    this.inspectorEl!.classList.remove("active");

    // Restore original centering transform and position instantly (no animated shift)
    if (this.host) {
      this.host.style.transition = "none";
      this.host.style.transform = "translate(-50%, -50%)";
      this.applyPosition();
      this.pendingRafId = requestAnimationFrame(() => {
        this.pendingRafId = null;
        if (this.host) this.host.style.transition = SNAP_TRANSITION;
      });
    }

    // Re-apply vertical orientation if needed
    this.applyOrientation(this.getEdgeFromPosition());
  }

  // --- Content rendering ---

  private renderExpandBody(): void {
    if (!this.expandBodyEl) return;
    if (this.activePanel === "settings") {
      this.expandBodyEl.innerHTML = this.buildSettingsHTML();
      this.wireSettingsEvents();
    } else if (this.activePanel === "inspector") {
      this.expandBodyEl.innerHTML = this.renderInspectorContent();
      this.wireInspectorEventsOnContainer(this.expandBodyEl);
    }
  }

  // --- Settings content ---

  private buildSettingsHTML(): string {
    const editorOptions = EDITOR_PRESETS.map(
      (p) =>
        `<option value="${p.value}"${p.value === this.editorChoice ? " selected" : ""}>${p.label}</option>`,
    ).join("");

    const comp = this.lastGrabResult?.componentStack[0];
    const filePathText = comp?.filePath ?? "No element grabbed yet";
    const fileDisabled = !comp?.filePath;

    return `
      <div class="tab-bar">
        <button class="tab-btn${this.settingsTab === "shortcuts" ? " active" : ""}" data-tab="shortcuts">Shortcuts</button>
        <button class="tab-btn${this.settingsTab === "editor" ? " active" : ""}" data-tab="editor">Editor</button>
      </div>
      <div class="tab-content${this.settingsTab === "shortcuts" ? " active" : ""}" data-tab-content="shortcuts">
        <div class="section-label">Hotkey</div>
        <div class="hotkey-row">
          <kbd>${esc(this.currentHotkey || "None")}</kbd>
          <button class="record-btn">Record</button>
        </div>
      </div>
      <div class="tab-content${this.settingsTab === "editor" ? " active" : ""}" data-tab-content="editor">
        <div class="section-label">Editor</div>
        <select class="editor-select">${editorOptions}</select>
        <div class="section-label">Open file</div>
        <div class="file-path-display">${esc(filePathText)}</div>
        <button class="open-file-btn"${fileDisabled ? " disabled" : ""}>Open in Editor</button>
      </div>
    `;
  }

  private wireSettingsEvents(): void {
    if (!this.expandBodyEl) return;

    // Tab clicks
    for (const btn of Array.from(this.expandBodyEl.querySelectorAll(".tab-btn"))) {
      btn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const tabId = (btn as HTMLElement).dataset.tab as TabId;
        if (tabId) this.switchSettingsTab(tabId);
      });
    }

    // Editor: select
    const selectEl = this.expandBodyEl.querySelector<HTMLSelectElement>(".editor-select");
    selectEl?.addEventListener("change", () => {
      this.editorChoice = selectEl.value;
      trySaveEditor(this.config.editorStorageKey, this.editorChoice);
    });

    // Editor: open file button
    const openBtn = this.expandBodyEl.querySelector(".open-file-btn");
    openBtn?.addEventListener("click", (e: Event) => {
      e.stopPropagation();
      const filePath = this.lastGrabResult?.componentStack[0]?.filePath;
      if (filePath) {
        const line = this.lastGrabResult?.componentStack[0]?.line;
        const editor = this.getEditorChoice();
        openInEditor(filePath, line, editor || undefined);
      }
    });

    // Record button
    const recordBtn = this.expandBodyEl.querySelector(".record-btn");
    recordBtn?.addEventListener("click", (e: Event) => {
      e.stopPropagation();
      this.toggleRecording();
    });
  }

  private switchSettingsTab(tabId: TabId): void {
    this.settingsTab = tabId;
    if (!this.expandBodyEl) return;
    for (const btn of Array.from(this.expandBodyEl.querySelectorAll(".tab-btn"))) {
      btn.classList.toggle("active", (btn as HTMLElement).dataset.tab === tabId);
    }
    for (const content of Array.from(this.expandBodyEl.querySelectorAll(".tab-content"))) {
      content.classList.toggle("active", (content as HTMLElement).dataset.tabContent === tabId);
    }
  }

  private updateEditorTabInPlace(): void {
    if (!this.expandBodyEl || this.activePanel !== "settings") return;
    const filePathEl = this.expandBodyEl.querySelector(".file-path-display");
    const openBtn = this.expandBodyEl.querySelector<HTMLButtonElement>(".open-file-btn");
    if (!filePathEl || !openBtn) return;

    const comp = this.lastGrabResult?.componentStack[0];
    if (comp?.filePath) {
      filePathEl.textContent = comp.filePath;
      openBtn.disabled = false;
    } else {
      filePathEl.textContent = "No element grabbed yet";
      openBtn.disabled = true;
    }
  }

  // --- Inspector content ---

  private renderInspectorContent(): string {
    if (!this.lastGrabResult) {
      return '<div class="dt-empty">Grab an element to inspect</div>';
    }
    return `<div style="padding:12px 14px;">${renderInspectorHTML(this.lastGrabResult, this.lastCSSRules)}</div>`;
  }

  private wireInspectorEventsOnContainer(container: HTMLElement): void {
    wireInspectorEvents(container, {
      onOpenFile: (file, line) => {
        const editor = this.getEditorChoice();
        openInEditor(file, line, editor || undefined);
      },
      onStyleChange: (update) => this.styleChangeCb?.(update),
    });
  }

  // --- Toolbar Drag ---

  private onPointerDown(e: PointerEvent): void {
    if (e.button !== 0) return;
    // Don't drag from expand body content
    const target = e.composedPath()[0] as HTMLElement;
    if (this.expandBodyEl?.contains(target)) return;

    this.isDragging = true;
    this.wasDragged = false;
    this.dragPointerId = e.pointerId;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    const rect = this.toolbarRowEl!.getBoundingClientRect();
    this.dragOffsetX = e.clientX - rect.left - rect.width / 2;
    this.dragOffsetY = e.clientY - rect.top - rect.height / 2;
    this.host!.style.transition = "none";
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.isDragging) return;
    const dx = e.clientX - this.dragStartX;
    const dy = e.clientY - this.dragStartY;
    if (!this.wasDragged && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
    if (!this.wasDragged) {
      this.wasDragged = true;
      this.toolbarEl!.setPointerCapture(this.dragPointerId);
      this.toolbarEl!.classList.add("dragging");
    }
    this.posX = clamp(((e.clientX - this.dragOffsetX) / window.innerWidth) * 100, 2, 98);
    this.posY = clamp(((e.clientY - this.dragOffsetY) / window.innerHeight) * 100, 2, 98);
    this.applyPosition();
  }

  private onPointerUp(e: PointerEvent): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.toolbarEl!.releasePointerCapture(e.pointerId);
    this.toolbarEl!.classList.remove("dragging");
    if (this.wasDragged) {
      this.host!.style.transition = SNAP_TRANSITION;
      this.snapToEdge();
      trySavePosition(this.config.storageKey, this.posX, this.posY);
    }
  }

  private snapToEdge(): void {
    const edge = this.getEdgeFromPosition();
    const mx = edgeMarginX();

    if (edge === "right") {
      this.posX = 100 - mx;
    } else if (edge === "bottom") {
      this.posY = 100 - EDGE_MARGIN;
    } else if (edge === "top") {
      this.posY = EDGE_MARGIN;
    } else {
      this.posX = mx;
    }
    this.applyPosition();
    this.applyOrientation(edge);
  }

  private applyPosition(): void {
    if (!this.host) return;
    this.host.style.left = `${this.posX}%`;
    this.host.style.top = `${this.posY}%`;
  }

  private getEdgeFromPosition(): "top" | "bottom" | "left" | "right" {
    const angle = Math.atan2(this.posY - 50, this.posX - 50);
    const deg = (angle * 180) / Math.PI;
    if (deg >= -45 && deg < 45) return "right";
    if (deg >= 45 && deg < 135) return "bottom";
    if (deg >= -135 && deg < -45) return "top";
    return "left";
  }

  private applyOrientation(edge: "top" | "bottom" | "left" | "right"): void {
    if (!this.toolbarEl) return;
    const wantVertical = edge === "left" || edge === "right";
    this.toolbarEl.classList.toggle("vertical", wantVertical);
  }

  // --- Hotkey recording ---

  private toggleRecording(): void {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  private startRecording(): void {
    this.isRecording = true;
    const kbdEl = this.expandBodyEl?.querySelector("kbd");
    const recordBtn = this.expandBodyEl?.querySelector(".record-btn");
    if (kbdEl) {
      kbdEl.textContent = "Press keys\u2026";
      kbdEl.classList.add("recording");
    }
    if (recordBtn) recordBtn.textContent = "Cancel";

    this.boundRecordKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      if (["Alt", "Control", "Shift", "Meta"].includes(e.key)) return;

      const combo = buildCombo(e);
      this.currentHotkey = combo;
      this.stopRecording();
      trySaveHotkey(this.config.hotkeyStorageKey, combo);
      this.hotkeyChangeCb?.(combo);
    };

    document.addEventListener("keydown", this.boundRecordKeyDown, { capture: true });
  }

  private stopRecording(): void {
    this.isRecording = false;
    if (this.boundRecordKeyDown) {
      document.removeEventListener("keydown", this.boundRecordKeyDown, { capture: true });
      this.boundRecordKeyDown = null;
    }
    // Update display if settings panel is showing
    const kbdEl = this.expandBodyEl?.querySelector("kbd");
    const recordBtn = this.expandBodyEl?.querySelector(".record-btn");
    if (kbdEl) {
      kbdEl.textContent = this.currentHotkey || "None";
      kbdEl.classList.remove("recording");
    }
    if (recordBtn) recordBtn.textContent = "Record";
  }
}
