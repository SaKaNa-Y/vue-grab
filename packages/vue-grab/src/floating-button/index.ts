import type { FloatingButtonConfig } from "@sakana-y/vue-grab-shared";
import { buildCombo } from "../hotkeys";

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

function tryReadStorage<T>(key: string, parse: (raw: string) => T | null): T | null {
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return parse(raw);
  } catch {
    return null;
  }
}

function trySaveStorage(key: string, value: string): void {
  if (!key) return;
  try {
    localStorage.setItem(key, value);
  } catch {}
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

const CROSSHAIR_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/><line x1="12" y1="15" x2="12" y2="9"/><line x1="9" y1="12" x2="15" y2="12"/></svg>`;

const GEAR_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.32 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;

const STYLES = `
  :host {
    all: initial;
  }
  .toolbar {
    display: inline-flex;
    align-items: center;
    height: 36px;
    padding: 0 4px;
    gap: 2px;
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
  .toolbar-divider {
    width: 1px;
    height: 18px;
    background: rgba(255,255,255,0.12);
    margin: 0 2px;
  }

  .panel {
    position: absolute;
    width: 240px;
    background: rgba(25,25,25,0.94);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    color: #e0e0e0;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    padding: 14px;
    display: none;
    z-index: 1;
  }
  .panel.open {
    display: block;
  }
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    font-weight: 600;
    font-size: 13px;
    color: #fff;
  }
  .panel-close {
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    padding: 0 2px;
  }
  .panel-close:hover {
    color: #fff;
  }
  .panel-label {
    font-size: 11px;
    color: #888;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
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
  .panel-hint {
    margin-top: 12px;
    font-size: 11px;
    color: #555;
    text-align: center;
  }
  .toolbar.vertical {
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
`;

export class FloatingButton {
  private host: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private toolbarEl: HTMLElement | null = null;
  private btnEl: HTMLElement | null = null;
  private gearEl: HTMLElement | null = null;
  private panelEl: HTMLElement | null = null;
  private kbdEl: HTMLElement | null = null;
  private recordBtn: HTMLElement | null = null;
  private config: FloatingButtonConfig;

  // Position (viewport %)
  private posX = 97;
  private posY = 85;

  // Drag state
  private isDragging = false;
  private wasDragged = false;
  private dragPointerId = -1;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  // Panel state
  private panelOpen = false;
  private isRecording = false;
  private currentHotkey = "";

  // Callbacks
  private toggleCb: (() => void) | null = null;
  private hotkeyChangeCb: ((combo: string) => void) | null = null;

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
      // Adjust left/right positions so pixel margin matches top/bottom
      if (this.posX <= INITIAL_SNAP_ZONE) this.posX = edgeMarginX();
      else if (this.posX >= 100 - INITIAL_SNAP_ZONE) this.posX = 100 - edgeMarginX();
    }
    this.currentHotkey = tryReadHotkey(config.hotkeyStorageKey) ?? "";
  }

  getCurrentHotkey(): string {
    return this.currentHotkey;
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

    // Toolbar container
    this.toolbarEl = document.createElement("div");
    this.toolbarEl.className = "toolbar";

    // Main grab button
    this.btnEl = document.createElement("div");
    this.btnEl.className = "toolbar-btn grab-btn";
    this.btnEl.innerHTML = CROSSHAIR_SVG;
    this.toolbarEl.appendChild(this.btnEl);

    // Divider
    const divider = document.createElement("div");
    divider.className = "toolbar-divider";
    this.toolbarEl.appendChild(divider);

    // Gear button (always visible)
    this.gearEl = document.createElement("div");
    this.gearEl.className = "toolbar-btn gear-btn";
    this.gearEl.innerHTML = GEAR_SVG;
    this.toolbarEl.appendChild(this.gearEl);

    // Settings panel
    this.panelEl = document.createElement("div");
    this.panelEl.className = "panel";
    this.panelEl.innerHTML = `
      <div class="panel-header">
        <span>Settings</span>
        <button class="panel-close" data-action="close">&times;</button>
      </div>
      <div class="panel-label">Hotkey</div>
      <div class="hotkey-row">
        <kbd></kbd>
        <button class="record-btn">Record</button>
      </div>
      <div class="panel-hint">Drag toolbar to reposition</div>
    `;
    this.toolbarEl.appendChild(this.panelEl);

    this.shadowRoot.appendChild(this.toolbarEl);

    this.kbdEl = this.panelEl.querySelector("kbd");
    this.recordBtn = this.panelEl.querySelector(".record-btn");
    this.updateHotkeyDisplay();

    // Set initial orientation based on position
    this.applyOrientation(this.getEdgeFromPosition());

    // --- Event wiring ---

    // Drag: pointer events on toolbar
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
      if (this.panelOpen) {
        this.closePanel();
        return;
      }
      this.toggleCb?.();
    });

    // Gear click → open panel
    this.gearEl.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
      if (this.wasDragged) return;
      this.togglePanel();
    });

    // Panel close button
    (this.panelEl.querySelector("[data-action=close]") as HTMLElement).addEventListener(
      "click",
      (e) => {
        e.stopPropagation();
        this.closePanel();
      },
    );

    // Record button
    this.recordBtn!.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
      this.toggleRecording();
    });

    // Document: close panel on outside click
    this.boundDocClick = (e: MouseEvent) => {
      if (!this.panelOpen) return;
      const path = e.composedPath();
      if (!path.includes(this.host!)) {
        this.closePanel();
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
        } else if (this.panelOpen) {
          this.closePanel();
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
    if (this.host) {
      this.host.remove();
      this.host = null;
      this.shadowRoot = null;
      this.toolbarEl = null;
      this.btnEl = null;
      this.gearEl = null;
      this.panelEl = null;
      this.kbdEl = null;
      this.recordBtn = null;
    }
  }

  setActive(active: boolean): void {
    if (!this.btnEl) return;
    if (active) {
      this.btnEl.classList.add("active");
    } else {
      this.btnEl.classList.remove("active");
    }
  }

  setHighlightColor(color: string): void {
    this.host?.style.setProperty("--grab-color", color);
  }

  setCurrentHotkey(combo: string): void {
    this.currentHotkey = combo;
    this.updateHotkeyDisplay();
  }

  onToggle(cb: () => void): void {
    this.toggleCb = cb;
  }

  onHotkeyChange(cb: (combo: string) => void): void {
    this.hotkeyChangeCb = cb;
  }

  // --- Drag ---

  private onPointerDown(e: PointerEvent): void {
    if (e.button !== 0) return;
    this.isDragging = true;
    this.wasDragged = false;
    this.dragPointerId = e.pointerId;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    const rect = this.toolbarEl!.getBoundingClientRect();
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
    if (this.panelOpen) this.positionPanel();
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

  // --- Settings panel ---

  private togglePanel(): void {
    if (this.panelOpen) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  }

  private openPanel(): void {
    if (!this.panelEl) return;
    this.panelOpen = true;
    this.positionPanel();
    this.panelEl.classList.add("open");
  }

  private closePanel(): void {
    if (!this.panelEl) return;
    this.panelOpen = false;
    this.panelEl.classList.remove("open");
    if (this.isRecording) this.stopRecording();
  }

  private positionPanel(): void {
    if (!this.panelEl) return;
    // Horizontal: open toward center
    if (this.posX > 50) {
      this.panelEl.style.right = "calc(100% + 8px)";
      this.panelEl.style.left = "auto";
    } else {
      this.panelEl.style.left = "calc(100% + 8px)";
      this.panelEl.style.right = "auto";
    }
    // Vertical: anchor top or bottom
    if (this.posY > 70) {
      this.panelEl.style.bottom = "-4px";
      this.panelEl.style.top = "auto";
    } else {
      this.panelEl.style.top = "-4px";
      this.panelEl.style.bottom = "auto";
    }
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
    this.kbdEl!.textContent = "Press keys\u2026";
    this.kbdEl!.classList.add("recording");
    this.recordBtn!.textContent = "Cancel";

    this.boundRecordKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      // Skip if only modifier pressed
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
    this.updateHotkeyDisplay();
    if (this.recordBtn) this.recordBtn.textContent = "Record";
    if (this.kbdEl) this.kbdEl.classList.remove("recording");
  }

  private updateHotkeyDisplay(): void {
    if (!this.kbdEl) return;
    this.kbdEl.textContent = this.currentHotkey || "None";
  }
}
