import type {
  CapturedLog,
  CapturedRequest,
  FloatingButtonConfig,
  FloatingButtonDockMode,
  FloatingButtonShortcutCommandId,
  FloatingButtonShortcutsConfig,
  GrabResult,
} from "@sakana-y/vue-grab-shared";

import type { RenderScanRecord } from "../render-scan";
import type { PanelId } from "./types";

import { VG_FOUNDATION_CSS } from "../styles";
import { mountFabVueApp, type FabVueApp } from "./app/mount";
import { MIGRATED_PANELS } from "./app/store";
import { FloatingButtonDockEntriesController } from "./dock-entries";
import { createHostStyle, FloatingButtonLayoutController } from "./layout";
import { FloatingButtonA11yPanel } from "./panels/a11y";
import { FloatingButtonContextPanel } from "./panels/context";
import { FloatingButtonLogsPanel } from "./panels/logs";
import { FloatingButtonNetworkPanel } from "./panels/network";
import { FloatingButtonRenderScanPanel } from "./panels/render-scan";
import { FloatingButtonSettingsPanel } from "./settings-panel";
import { FloatingButtonShortcutsController } from "./shortcuts";
import { createFloatingButtonState, type FloatingButtonRuntimeState } from "./state";
import { STYLES } from "./styles";
import {
  createDockEntryButton,
  getDockEntryElement,
  renderToolbarEntries,
  updatePanelButtonStates,
  type FloatingButtonToolbarElements,
} from "./toolbar";

export const FAB_HOST_ID = "vue-grab-fab-host";

export class FloatingButton {
  private host: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private wrapperEl: HTMLElement | null = null;
  private toolbarEl: HTMLElement | null = null;
  private toolbarRowEl: HTMLElement | null = null;
  private expandBodyEl: HTMLElement | null = null;
  private vueHostEl: HTMLElement | null = null;
  private legacyHostEl: HTMLElement | null = null;
  private teleportEl: HTMLElement | null = null;
  private vueApp: FabVueApp | null = null;
  private btnEl: HTMLElement | null = null;
  private contextBtnEl: HTMLElement | null = null;
  private gearEl: HTMLElement | null = null;
  private a11yIndicatorEl: HTMLElement | null = null;
  private renderScanBtnEl: HTMLElement | null = null;
  private logsBtnEl: HTMLElement | null = null;
  private logsBadgeEl: HTMLElement | null = null;
  private networkBtnEl: HTMLElement | null = null;
  private networkBadgeEl: HTMLElement | null = null;
  private magnifierBtnEl: HTMLElement | null = null;
  private measurerBtnEl: HTMLElement | null = null;

  private readonly state: FloatingButtonRuntimeState;
  private readonly dockEntries: FloatingButtonDockEntriesController;
  private readonly shortcuts: FloatingButtonShortcutsController;
  private readonly settingsPanel: FloatingButtonSettingsPanel;
  private readonly contextPanel: FloatingButtonContextPanel;
  private readonly renderScanPanel: FloatingButtonRenderScanPanel;
  private readonly a11yPanel: FloatingButtonA11yPanel;
  private readonly logsPanel: FloatingButtonLogsPanel;
  private readonly networkPanel: FloatingButtonNetworkPanel;
  private readonly layout: FloatingButtonLayoutController;

  private toggleCb: (() => void) | null = null;
  private renderScanToggleCb: (() => void) | null = null;
  private renderScanClearCb: (() => void) | null = null;
  private magnifierToggleCb: (() => void) | null = null;
  private measurerToggleCb: (() => void) | null = null;
  private magnifierConfigChangeCb:
    | ((config: { loupeSize?: number; zoomLevel?: number }) => void)
    | null = null;

  private boundPointerDown: ((e: PointerEvent) => void) | null = null;
  private boundPointerMove: ((e: PointerEvent) => void) | null = null;
  private boundPointerUp: ((e: PointerEvent) => void) | null = null;
  private boundDocClick: ((e: MouseEvent) => void) | null = null;
  private boundDocKeyDown: ((e: KeyboardEvent) => void) | null = null;

  constructor(private readonly config: FloatingButtonConfig) {
    this.state = createFloatingButtonState(config);
    this.dockEntries = new FloatingButtonDockEntriesController(config, () =>
      this.refreshDockEntryUi(),
    );
    this.shortcuts = new FloatingButtonShortcutsController(config, {
      getActivePanel: () => this.state.activePanel,
      getSettingsTab: () => this.state.settingsTab,
      renderExpandBody: () => this.renderExpandBody(),
    });
    this.layout = new FloatingButtonLayoutController({
      config,
      getElements: () => ({
        host: this.host,
        wrapper: this.wrapperEl,
        toolbar: this.toolbarEl,
        toolbarRow: this.toolbarRowEl,
        expandBody: this.expandBodyEl,
      }),
      getActivePanel: () => this.state.activePanel,
      renderExpandBody: () => this.renderExpandBody(),
    });
    this.settingsPanel = new FloatingButtonSettingsPanel({
      config,
      state: this.state,
      dockEntries: this.dockEntries,
      shortcuts: this.shortcuts,
      getDockMode: () => this.layout.mode,
      setDockMode: (mode, persist) => this.setDockMode(mode, persist),
      onMagnifierConfigChange: (changes) => this.magnifierConfigChangeCb?.(changes),
    });
    this.contextPanel = new FloatingButtonContextPanel({
      getActivePanel: () => this.state.activePanel,
      getLastResult: () => this.state.lastGrabResult,
      renderExpandBody: () => this.renderExpandBody(),
    });
    this.renderScanPanel = new FloatingButtonRenderScanPanel({
      getActivePanel: () => this.state.activePanel,
      isScanActive: () => this.state.isRenderScanActive,
      renderExpandBody: () => this.renderExpandBody(),
      toggleScan: () => this.renderScanToggleCb?.(),
      clearEntries: () => this.renderScanClearCb?.(),
      getEditorChoice: () => this.getEditorChoice(),
    });
    this.a11yPanel = new FloatingButtonA11yPanel({
      isActive: () => this.state.activePanel === "accessibility",
      rerender: (forceRescan) => this.renderA11yPanel(forceRescan),
    });
    this.logsPanel = new FloatingButtonLogsPanel();
    this.networkPanel = new FloatingButtonNetworkPanel({
      getActivePanel: () => this.state.activePanel,
      renderExpandBody: () => this.renderExpandBody(),
      getEditorChoice: () => this.getEditorChoice(),
    });
  }

  getCurrentHotkey(): string {
    return this.shortcuts.getCurrentHotkey();
  }

  getShortcuts(): FloatingButtonShortcutsConfig {
    return this.shortcuts.getShortcuts();
  }

  getEditorChoice(): string {
    return this.state.editorChoice;
  }

  setLastResult(result: GrabResult | null): void {
    this.state.lastGrabResult = result;

    if (this.state.activePanel === "settings") {
      this.settingsPanel.updateEditorTabInPlace(this.legacyHostEl);
    } else if (this.state.activePanel === "context") {
      this.contextPanel.refresh();
    } else if (this.state.activePanel === "accessibility") {
      this.renderExpandBody();
    }
  }

  triggerShortcut(id: FloatingButtonShortcutCommandId): void {
    getDockEntryElement(this.getToolbarElements(), id)?.click();
  }

  mount(): void {
    if (this.host) return;

    this.host = document.createElement("div");
    this.host.id = FAB_HOST_ID;
    this.host.style.cssText = createHostStyle();
    document.body.appendChild(this.host);

    this.shadowRoot = this.host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    // `display:contents` keeps the migrated Vue panel and the legacy panel a
    // direct flex child of `.expand-body`, preserving its min-height:0 scroll
    // chain despite the intermediate host wrappers (ADR 0002 transition bridge).
    style.textContent = `${VG_FOUNDATION_CSS}${STYLES}\n.vg-vue-host,.vg-legacy-host{display:contents;}`;
    this.shadowRoot.appendChild(style);

    this.toolbarEl = document.createElement("div");
    this.toolbarEl.className = "toolbar";

    this.toolbarRowEl = document.createElement("div");
    this.toolbarRowEl.className = "toolbar-row";

    this.createToolbarButtons();
    this.renderToolbarEntries();
    this.toolbarEl.appendChild(this.toolbarRowEl);

    this.expandBodyEl = document.createElement("div");
    this.expandBodyEl.className = "expand-body";

    // Vue panels render here; legacy (not-yet-migrated) panels render into the
    // sibling legacy host (ADR 0002 transition bridge). Both live inside the
    // expand body so the layout controller sizes them together.
    this.vueHostEl = document.createElement("div");
    this.vueHostEl.className = "vg-vue-host";
    this.legacyHostEl = document.createElement("div");
    this.legacyHostEl.className = "vg-legacy-host";
    this.expandBodyEl.appendChild(this.vueHostEl);
    this.expandBodyEl.appendChild(this.legacyHostEl);

    this.wrapperEl = document.createElement("div");
    this.wrapperEl.className = "fab-wrapper";
    this.wrapperEl.appendChild(this.toolbarEl);
    this.wrapperEl.appendChild(this.expandBodyEl);

    // In-shadow teleport target so reka-ui overlays stay within the shadow root.
    this.teleportEl = document.createElement("div");
    this.teleportEl.className = "vg-teleport";
    this.wrapperEl.appendChild(this.teleportEl);

    this.shadowRoot.appendChild(this.wrapperEl);

    this.vueApp = mountFabVueApp(this.vueHostEl, this.teleportEl, this.state.editorChoice);

    this.layout.apply();
    this.wireEvents();
  }

  destroy(): void {
    if (this.boundDocClick) {
      document.removeEventListener("click", this.boundDocClick, { capture: true });
      this.boundDocClick = null;
    }
    if (this.boundDocKeyDown) {
      document.removeEventListener("keydown", this.boundDocKeyDown, { capture: true });
      this.boundDocKeyDown = null;
    }

    this.shortcuts.destroy();
    this.layout.destroy();
    this.renderScanPanel.destroy();
    this.contextPanel.destroy();
    this.networkPanel.destroy();

    this.vueApp?.unmount();
    this.vueApp = null;

    if (this.host) {
      this.host.remove();
      this.host = null;
      this.shadowRoot = null;
      this.wrapperEl = null;
      this.toolbarEl = null;
      this.toolbarRowEl = null;
      this.expandBodyEl = null;
      this.vueHostEl = null;
      this.legacyHostEl = null;
      this.teleportEl = null;
      this.btnEl = null;
      this.contextBtnEl = null;
      this.renderScanBtnEl = null;
      this.gearEl = null;
      this.a11yIndicatorEl = null;
      this.logsBtnEl = null;
      this.logsBadgeEl = null;
      this.networkBtnEl = null;
      this.networkBadgeEl = null;
      this.magnifierBtnEl = null;
      this.measurerBtnEl = null;
    }
  }

  setActive(active: boolean): void {
    this.state.isGrabActive = active;
    this.btnEl?.classList.toggle("active", active);
  }

  setRenderScanActive(active: boolean): void {
    this.state.isRenderScanActive = active;
    this.renderScanBtnEl?.classList.toggle("active", active);
    if (this.state.activePanel === "render-scan") this.renderExpandBody();
  }

  setRenderScanDisabled(disabled: boolean): void {
    if (!this.renderScanBtnEl) return;
    this.renderScanBtnEl.classList.toggle("disabled", disabled);
    this.renderScanBtnEl.title = disabled
      ? "Render Scan requires createVueGrab() in a Vue app"
      : "Render update heatmap";
  }

  setHighlightColor(color: string): void {
    this.host?.style.setProperty("--grab-color", color);
  }

  setCurrentHotkey(combo: string): void {
    this.shortcuts.setFirst("grab", combo, false);
  }

  onToggle(cb: () => void): void {
    this.toggleCb = cb;
  }

  onRenderScanToggle(cb: () => void): void {
    this.renderScanToggleCb = cb;
  }

  onRenderScanClear(cb: () => void): void {
    this.renderScanClearCb = cb;
  }

  setRenderScanEntries(entries: RenderScanRecord[]): void {
    this.renderScanPanel.setEntries(entries);
  }

  onHotkeyChange(cb: (combo: string) => void): void {
    this.shortcuts.onHotkeyChange(cb);
  }

  onShortcutsChange(cb: (shortcuts: FloatingButtonShortcutsConfig) => void): void {
    this.shortcuts.onShortcutsChange(cb);
  }

  onLogsClear(cb: () => void): void {
    // mount() runs before session wiring, so the Vue app/store already exists.
    this.vueApp?.store.onClearLogs(cb);
  }

  setLogs(entries: CapturedLog[]): void {
    // Legacy panel now only counts the badge; the Vue logs panel reads the store.
    this.logsPanel.setEntries(entries, this.logsBadgeEl);
    if (this.vueApp) this.vueApp.store.logs.value = entries;
    this.contextPanel.setLogs(entries);
  }

  onNetworkClear(cb: () => void): void {
    this.networkPanel.onClear(cb);
  }

  setNetwork(entries: CapturedRequest[]): void {
    this.networkPanel.setEntries(entries, this.networkBadgeEl);
    this.contextPanel.setNetwork(entries);
  }

  onMagnifierToggle(cb: () => void): void {
    this.magnifierToggleCb = cb;
  }

  onMagnifierConfigChange(cb: (config: { loupeSize?: number; zoomLevel?: number }) => void): void {
    this.magnifierConfigChangeCb = cb;
  }

  setMagnifierConfig(config: { loupeSize: number; zoomLevel: number }): void {
    this.state.magnifierLoupeSize = config.loupeSize;
    this.state.magnifierZoomLevel = config.zoomLevel;
  }

  setMagnifierActive(active: boolean): void {
    this.state.isMagnifierActive = active;
    this.magnifierBtnEl?.classList.toggle("active", active);
  }

  setMagnifierDisabled(disabled: boolean): void {
    if (!this.magnifierBtnEl) return;
    this.magnifierBtnEl.classList.toggle("disabled", disabled);
    this.magnifierBtnEl.title = disabled
      ? "Magnifier requires Chrome 138+ with html-in-canvas support"
      : "Magnifier loupe";
  }

  onMeasurerToggle(cb: () => void): void {
    this.measurerToggleCb = cb;
  }

  setMeasurerActive(active: boolean): void {
    this.state.isMeasurerActive = active;
    this.measurerBtnEl?.classList.toggle("active", active);
  }

  getCurrentMeasurerHotkey(): string {
    return this.shortcuts.getCurrentMeasurerHotkey();
  }

  onMeasurerHotkeyChange(cb: (combo: string) => void): void {
    this.shortcuts.onMeasurerHotkeyChange(cb);
  }

  setCurrentMeasurerHotkey(combo: string): void {
    this.shortcuts.setFirst("measurer", combo, false);
  }

  private createToolbarButtons(): void {
    this.btnEl = createDockEntryButton("grab");
    this.contextBtnEl = createDockEntryButton("context");
    this.renderScanBtnEl = createDockEntryButton("render-scan");
    this.gearEl = createDockEntryButton("settings");
    this.magnifierBtnEl = createDockEntryButton("magnifier");
    this.measurerBtnEl = createDockEntryButton("measurer");
    this.a11yIndicatorEl = createDockEntryButton("accessibility");

    this.logsBtnEl = createDockEntryButton("logs");
    this.logsBadgeEl = document.createElement("span");
    this.logsBadgeEl.className = "logs-badge";
    this.logsBadgeEl.style.display = "none";
    this.logsBtnEl.appendChild(this.logsBadgeEl);

    this.networkBtnEl = createDockEntryButton("network");
    this.networkBadgeEl = document.createElement("span");
    this.networkBadgeEl.className = "network-badge";
    this.networkBadgeEl.style.display = "none";
    this.networkBtnEl.appendChild(this.networkBadgeEl);
  }

  private wireEvents(): void {
    if (
      !this.toolbarEl ||
      !this.btnEl ||
      !this.contextBtnEl ||
      !this.renderScanBtnEl ||
      !this.gearEl ||
      !this.a11yIndicatorEl ||
      !this.logsBtnEl ||
      !this.networkBtnEl ||
      !this.magnifierBtnEl ||
      !this.measurerBtnEl
    ) {
      return;
    }

    this.boundPointerDown = (e) => this.layout.onPointerDown(e);
    this.boundPointerMove = (e) => this.layout.onPointerMove(e);
    this.boundPointerUp = (e) => this.layout.onPointerUp(e);
    this.toolbarEl.addEventListener("pointerdown", this.boundPointerDown);
    this.toolbarEl.addEventListener("pointermove", this.boundPointerMove);
    this.toolbarEl.addEventListener("pointerup", this.boundPointerUp);

    this.btnEl.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
      if (this.layout.wasToolbarDragged) return;
      if (this.state.isGrabActive) {
        this.toggleCb?.();
        return;
      }
      if (this.state.isMagnifierActive || this.state.isMeasurerActive) return;
      if (this.state.isRenderScanActive) this.renderScanToggleCb?.();
      if (this.state.activePanel) {
        this.deactivatePanel();
        return;
      }
      this.toggleCb?.();
    });

    this.contextBtnEl.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
      if (this.layout.wasToolbarDragged || !this.canActivatePanel()) return;
      this.activatePanel("context");
    });

    this.gearEl.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
      if (this.layout.wasToolbarDragged || !this.canActivatePanel()) return;
      this.activatePanel("settings");
    });

    this.a11yIndicatorEl.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
      if (this.layout.wasToolbarDragged || !this.canActivatePanel()) return;
      this.activatePanel("accessibility");
    });

    this.renderScanBtnEl.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
      if (this.layout.wasToolbarDragged) return;
      if (this.renderScanBtnEl?.classList.contains("disabled")) return;
      if (
        !this.state.isRenderScanActive &&
        (this.state.isGrabActive || this.state.isMagnifierActive || this.state.isMeasurerActive)
      )
        return;
      if (!this.state.isRenderScanActive) {
        if (this.state.activePanel && this.state.activePanel !== "render-scan") {
          this.deactivatePanel();
        }
        this.renderScanToggleCb?.();
        this.activatePanel("render-scan");
        return;
      }
      if (this.state.activePanel === "render-scan") {
        this.renderScanToggleCb?.();
        this.deactivatePanel();
        return;
      }
      if (this.state.activePanel) this.deactivatePanel();
      this.activatePanel("render-scan");
    });

    this.logsBtnEl.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
      if (this.layout.wasToolbarDragged || !this.canActivatePanel()) return;
      this.activatePanel("logs");
    });

    this.networkBtnEl.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
      if (this.layout.wasToolbarDragged || !this.canActivatePanel()) return;
      this.activatePanel("network");
    });

    this.magnifierBtnEl.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
      if (this.layout.wasToolbarDragged) return;
      if (this.magnifierBtnEl?.classList.contains("disabled")) return;
      if (this.state.isMagnifierActive) {
        this.magnifierToggleCb?.();
        return;
      }
      if (this.state.isGrabActive || this.state.isMeasurerActive) return;
      if (this.state.isRenderScanActive) this.renderScanToggleCb?.();
      if (this.state.activePanel) this.deactivatePanel();
      this.magnifierToggleCb?.();
    });

    this.measurerBtnEl.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
      if (this.layout.wasToolbarDragged) return;
      if (!this.state.isMeasurerActive && (this.state.isGrabActive || this.state.isMagnifierActive))
        return;
      if (!this.state.isMeasurerActive && this.state.isRenderScanActive)
        this.renderScanToggleCb?.();
      if (this.state.activePanel) this.deactivatePanel();
      this.measurerToggleCb?.();
    });

    this.boundDocClick = (e: MouseEvent) => {
      if (!this.state.activePanel || !this.state.closeOnOutsideClick || !this.host) return;
      if (!e.composedPath().includes(this.host)) {
        this.deactivatePanel();
      }
    };
    document.addEventListener("click", this.boundDocClick, { capture: true });

    this.boundDocKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (this.shortcuts.isRecording) {
        this.shortcuts.stopRecording();
        e.preventDefault();
        e.stopPropagation();
      } else if (this.state.activePanel) {
        this.deactivatePanel();
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("keydown", this.boundDocKeyDown, { capture: true });
  }

  private canActivatePanel(): boolean {
    return (
      !this.state.isGrabActive && !this.state.isMagnifierActive && !this.state.isMeasurerActive
    );
  }

  private activatePanel(panel: PanelId): void {
    if (this.state.activePanel === panel) {
      this.deactivatePanel();
      return;
    }
    this.layout.preserveToolbarRect();
    if (this.shortcuts.isRecording) this.shortcuts.stopRecording();

    this.state.activePanel = panel;
    this.wrapperEl?.classList.add("expanded");
    this.expandBodyEl?.classList.add("open");
    this.renderExpandBody();
    this.layout.apply();
    this.updatePanelButtonStates();
  }

  private deactivatePanel(): void {
    if (!this.state.activePanel) return;
    this.clearPanelState();
    this.layout.restoreAfterDeactivate();
  }

  private clearPanelState(): void {
    if (this.shortcuts.isRecording) this.shortcuts.stopRecording();
    this.state.activePanel = null;
    // Keep the reactive bridge in step so the Vue panel unmounts on close, not
    // just on open (renderExpandBody is not called on the deactivate path).
    this.syncVueStore();
    this.layout.clearPanelClasses();
    this.updatePanelButtonStates();
  }

  /** Panels migrated to Vue components render through the Vue app, not innerHTML. */
  private isVuePanel(panel: PanelId | null): boolean {
    return panel != null && MIGRATED_PANELS.has(panel);
  }

  /** Push host state into the reactive bridge the Vue panels read (ADR 0002). */
  private syncVueStore(): void {
    if (!this.vueApp) return;
    this.vueApp.store.editorChoice.value = this.state.editorChoice;
    this.vueApp.store.activePanel.value = this.state.activePanel;
  }

  private renderExpandBody(): void {
    const host = this.legacyHostEl;
    if (!host) return;

    this.syncVueStore();

    if (this.isVuePanel(this.state.activePanel)) {
      host.innerHTML = "";
      return;
    }

    if (this.state.activePanel === "settings") {
      host.innerHTML = this.settingsPanel.render();
      this.settingsPanel.wire(host);
    } else if (this.state.activePanel === "context") {
      host.innerHTML = this.contextPanel.render();
      this.contextPanel.wire(host);
    } else if (this.state.activePanel === "render-scan") {
      const visible = this.renderScanPanel.visible();
      host.innerHTML = this.renderScanPanel.render(visible);
      this.renderScanPanel.wire(host, visible);
    } else if (this.state.activePanel === "accessibility") {
      this.renderA11yPanel();
    } else if (this.state.activePanel === "network") {
      const visible = this.networkPanel.visible();
      host.innerHTML = this.networkPanel.render(visible);
      this.networkPanel.wire(host, visible);
    } else {
      host.innerHTML = "";
    }
  }

  private renderA11yPanel(forceRescan = false): void {
    if (!this.legacyHostEl) return;
    this.legacyHostEl.innerHTML = this.a11yPanel.render(forceRescan);
    this.a11yPanel.wire(this.legacyHostEl);
  }

  private refreshDockEntryUi(): void {
    this.renderToolbarEntries();
    this.logsPanel.updateBadge(this.logsBadgeEl);
    this.networkPanel.updateBadge(this.networkBadgeEl);
    this.updatePanelButtonStates();
    this.layout.apply();
    if (this.state.activePanel === "settings") this.renderExpandBody();
  }

  private renderToolbarEntries(): void {
    renderToolbarEntries(this.toolbarRowEl, this.dockEntries.value, this.getToolbarElements());
  }

  private updatePanelButtonStates(): void {
    updatePanelButtonStates(this.getToolbarElements(), this.state.activePanel);
  }

  private setDockMode(mode: FloatingButtonDockMode, persist: boolean): void {
    this.layout.setMode(mode, persist);
  }

  private getToolbarElements(): FloatingButtonToolbarElements {
    return {
      grab: this.btnEl,
      context: this.contextBtnEl,
      "render-scan": this.renderScanBtnEl,
      settings: this.gearEl,
      magnifier: this.magnifierBtnEl,
      measurer: this.measurerBtnEl,
      accessibility: this.a11yIndicatorEl,
      logs: this.logsBtnEl,
      network: this.networkBtnEl,
    };
  }
}
