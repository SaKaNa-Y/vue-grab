import type { FloatingButtonConfig, FloatingButtonDockMode } from "@sakana-y/vue-grab-shared";

import type { DockEdge, PanelId, ToolbarAnchorRect } from "./types";

import {
  DRAG_THRESHOLD,
  EDGE_MARGIN,
  INITIAL_POSITIONS,
  INITIAL_SNAP_ZONE,
  SNAP_TRANSITION,
  clamp,
  clampCenterForSize,
  edgeMarginX,
  isDockMode,
} from "./geometry";
import { tryReadDockMode, tryReadPosition, trySaveDockMode, trySavePosition } from "./storage";

export interface FloatingButtonLayoutElements {
  host: HTMLElement | null;
  wrapper: HTMLElement | null;
  toolbar: HTMLElement | null;
  toolbarRow: HTMLElement | null;
  expandBody: HTMLElement | null;
}

export interface FloatingButtonLayoutControllerOptions {
  config: FloatingButtonConfig;
  getElements: () => FloatingButtonLayoutElements;
  getActivePanel: () => PanelId | null;
  renderExpandBody: () => void;
}

export class FloatingButtonLayoutController {
  private dockMode: FloatingButtonDockMode;
  private posX = 97;
  private posY = 85;
  private isDragging = false;
  private wasDragged = false;
  private dragPointerId = -1;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private lastAppliedEdge: DockEdge | null = null;
  private preservedToolbarRect: ToolbarAnchorRect | null = null;
  private pendingRafId: number | null = null;

  constructor(private readonly options: FloatingButtonLayoutControllerOptions) {
    const { config } = options;
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
    const configuredDockMode = isDockMode(config.dockMode) ? config.dockMode : "float";
    this.dockMode = tryReadDockMode(config.dockModeStorageKey) ?? configuredDockMode;
  }

  get mode(): FloatingButtonDockMode {
    return this.dockMode;
  }

  get wasToolbarDragged(): boolean {
    return this.wasDragged;
  }

  apply(): void {
    const { host, wrapper, toolbar } = this.options.getElements();
    if (!host || !wrapper || !toolbar) return;
    const edge = this.getEdgeFromPosition();
    if (this.dockMode === "edge" && this.isDragging && this.lastAppliedEdge === edge) {
      return;
    }
    host.style.transition = this.isDragging ? "none" : SNAP_TRANSITION;
    this.resetDockClasses();

    if (this.dockMode === "edge") {
      this.preservedToolbarRect = null;
      this.lastAppliedEdge = edge;
      this.applyEdgeLayout(edge);
    } else if (this.options.getActivePanel()) {
      this.lastAppliedEdge = null;
      this.applyFloatExpandedLayout(edge, this.preservedToolbarRect);
      this.preservedToolbarRect = null;
    } else {
      this.lastAppliedEdge = null;
      this.applyFloatClosedLayout(edge);
    }
  }

  preserveToolbarRect(): void {
    this.preservedToolbarRect =
      this.dockMode === "float"
        ? (this.options.getElements().toolbar?.getBoundingClientRect() ?? null)
        : null;
  }

  restoreAfterDeactivate(): void {
    const { host } = this.options.getElements();
    if (host && this.dockMode === "float") {
      host.style.transition = "none";
      host.style.transform = "translate(-50%, -50%)";
      this.applyPosition();
      if (this.pendingRafId !== null) cancelAnimationFrame(this.pendingRafId);
      this.pendingRafId = requestAnimationFrame(() => {
        this.pendingRafId = null;
        const currentHost = this.options.getElements().host;
        if (currentHost) currentHost.style.transition = SNAP_TRANSITION;
      });
    }

    if (this.dockMode !== "float") {
      this.preservedToolbarRect = null;
      this.apply();
    } else {
      this.preservedToolbarRect = null;
      this.applyOrientation(this.getEdgeFromPosition());
    }
  }

  setMode(mode: FloatingButtonDockMode, persist: boolean): void {
    if (mode === this.dockMode) return;
    const previousMode = this.dockMode;
    this.dockMode = mode;
    if (persist) trySaveDockMode(this.options.config.dockModeStorageKey, mode);

    if (previousMode === "edge" && mode === "float") {
      this.restoreFloatPositionFromEdge(this.getEdgeFromPosition());
    }
    this.apply();
    if (this.options.getActivePanel()) this.options.renderExpandBody();
  }

  onPointerDown(e: PointerEvent): void {
    if (e.button !== 0) return;
    const { host, toolbarRow, expandBody } = this.options.getElements();
    const target = e.composedPath()[0] as HTMLElement;
    if (expandBody?.contains(target)) return;
    if (!host || !toolbarRow) return;

    this.isDragging = true;
    this.wasDragged = false;
    this.dragPointerId = e.pointerId;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    const rect = toolbarRow.getBoundingClientRect();
    this.dragOffsetX = e.clientX - rect.left - rect.width / 2;
    this.dragOffsetY = e.clientY - rect.top - rect.height / 2;
    host.style.transition = "none";
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.isDragging) return;
    const { host, toolbar } = this.options.getElements();
    if (!host || !toolbar) return;
    const dx = e.clientX - this.dragStartX;
    const dy = e.clientY - this.dragStartY;
    if (!this.wasDragged && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
    if (!this.wasDragged) {
      this.wasDragged = true;
      toolbar.setPointerCapture(this.dragPointerId);
      toolbar.classList.add("dragging");
    }
    this.posX = clamp(((e.clientX - this.dragOffsetX) / window.innerWidth) * 100, 2, 98);
    this.posY = clamp(((e.clientY - this.dragOffsetY) / window.innerHeight) * 100, 2, 98);
    if (this.dockMode === "edge") {
      this.snapToEdge();
    } else if (this.options.getActivePanel()) {
      this.apply();
    } else {
      this.applyPosition();
    }
  }

  onPointerUp(e: PointerEvent): void {
    if (!this.isDragging) return;
    const { host, toolbar } = this.options.getElements();
    if (!host || !toolbar) return;
    this.isDragging = false;
    toolbar.releasePointerCapture(e.pointerId);
    toolbar.classList.remove("dragging");
    if (this.wasDragged) {
      host.style.transition = SNAP_TRANSITION;
      this.snapToEdge();
      trySavePosition(this.options.config.storageKey, this.posX, this.posY);
    }
  }

  clearPanelClasses(): void {
    const { wrapper, expandBody } = this.options.getElements();
    wrapper?.classList.remove("expanded", "expand-up", "expand-left", "expand-right");
    expandBody?.classList.remove("open");
  }

  destroy(): void {
    if (this.pendingRafId) {
      cancelAnimationFrame(this.pendingRafId);
      this.pendingRafId = null;
    }
  }

  private resetDockClasses(): void {
    const { wrapper, toolbar } = this.options.getElements();
    if (!wrapper || !toolbar) return;
    wrapper.classList.remove("edge", "edge-top", "edge-bottom", "edge-left", "edge-right");
    toolbar.classList.remove("vertical");
  }

  private resetLayoutStyles(): void {
    const { host } = this.options.getElements();
    if (!host) return;
    host.style.position = "fixed";
    host.style.inset = "";
    host.style.width = "";
    host.style.height = "";
    host.style.left = "";
    host.style.top = "";
    host.style.right = "";
    host.style.bottom = "";
    host.style.transform = "";
  }

  private applyFloatClosedLayout(edge: DockEdge): void {
    this.resetLayoutStyles();
    const { host } = this.options.getElements();
    if (!host) return;
    host.style.transform = "translate(-50%, -50%)";
    this.applyPosition();
    this.applyOrientation(edge);
  }

  private applyFloatExpandedLayout(edge: DockEdge, anchorRect: ToolbarAnchorRect | null): void {
    const { host, wrapper } = this.options.getElements();
    if (!host || !wrapper) return;
    const isHorizontal = edge === "left" || edge === "right";
    const centerX = (this.posX / 100) * window.innerWidth;
    const centerY = (this.posY / 100) * window.innerHeight;
    const toolbarW = anchorRect?.width ?? 36;
    const toolbarH = anchorRect?.height ?? 36;
    const toolbarLeft = anchorRect?.left ?? centerX - toolbarW / 2;
    const toolbarRight = anchorRect?.right ?? centerX + toolbarW / 2;
    const toolbarTop = anchorRect?.top ?? centerY - toolbarH / 2;
    const toolbarBottom = anchorRect?.bottom ?? centerY + toolbarH / 2;
    const toolbarCenterX = anchorRect ? toolbarLeft + toolbarW / 2 : centerX;
    const toolbarCenterY = anchorRect ? toolbarTop + toolbarH / 2 : centerY;

    wrapper.classList.remove("expand-up", "expand-left", "expand-right");
    if (isHorizontal) {
      wrapper.classList.add(edge === "left" ? "expand-right" : "expand-left");
    } else {
      wrapper.classList.toggle("expand-up", this.posY > 50);
    }

    this.resetLayoutStyles();
    host.style.transition = "none";

    if (isHorizontal) {
      host.style.top = `${clampCenterForSize(toolbarCenterY, toolbarH, window.innerHeight)}px`;
      if (edge === "left") {
        const leftX = Math.max(0, toolbarLeft);
        host.style.left = `${leftX}px`;
        host.style.transform = "translate(0, -50%)";
      } else {
        const rightX = Math.min(window.innerWidth, toolbarRight);
        host.style.left = `${rightX}px`;
        host.style.transform = "translate(-100%, -50%)";
      }
    } else if (this.posY > 50) {
      const bottomY = Math.min(window.innerHeight, toolbarBottom);
      host.style.top = `${bottomY}px`;
      host.style.left = `${clampCenterForSize(toolbarCenterX, toolbarW, window.innerWidth)}px`;
      host.style.transform = "translate(-50%, -100%)";
    } else {
      const topY = Math.max(0, toolbarTop);
      host.style.top = `${topY}px`;
      host.style.left = `${clampCenterForSize(toolbarCenterX, toolbarW, window.innerWidth)}px`;
      host.style.transform = "translate(-50%, 0)";
    }
    this.applyOrientation(edge);
  }

  private applyEdgeLayout(edge: DockEdge): void {
    const { host, wrapper } = this.options.getElements();
    if (!host || !wrapper) return;
    wrapper.classList.add("edge", `edge-${edge}`);
    wrapper.classList.remove("expand-up", "expand-left", "expand-right");
    this.resetLayoutStyles();

    if (edge === "left" || edge === "right") {
      host.style.top = "0";
      host.style.bottom = "0";
      host.style[edge] = "0";
      host.style.transform = "none";
    } else {
      host.style.left = "0";
      host.style.right = "0";
      host.style[edge] = "0";
      host.style.transform = "none";
    }
    this.applyOrientation(edge);
  }

  private restoreFloatPositionFromEdge(edge: DockEdge): void {
    const mx = edgeMarginX();
    if (edge === "left") this.posX = mx;
    else if (edge === "right") this.posX = 100 - mx;
    else if (edge === "top") this.posY = EDGE_MARGIN;
    else this.posY = 100 - EDGE_MARGIN;
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
    this.apply();
  }

  private applyPosition(): void {
    const { host } = this.options.getElements();
    if (!host) return;
    host.style.inset = "";
    host.style.left = `${this.posX}%`;
    host.style.top = `${this.posY}%`;
  }

  private getEdgeFromPosition(): DockEdge {
    const angle = Math.atan2(this.posY - 50, this.posX - 50);
    const deg = (angle * 180) / Math.PI;
    if (deg >= -45 && deg < 45) return "right";
    if (deg >= 45 && deg < 135) return "bottom";
    if (deg >= -135 && deg < -45) return "top";
    return "left";
  }

  private applyOrientation(edge: DockEdge): void {
    const { toolbar } = this.options.getElements();
    if (!toolbar) return;
    const wantVertical = edge === "left" || edge === "right";
    toolbar.classList.toggle("vertical", wantVertical);
  }
}

export function createHostStyle(): string {
  return `position:fixed;z-index:2147483646;pointer-events:auto;transform:translate(-50%,-50%);transition:${SNAP_TRANSITION};`;
}
