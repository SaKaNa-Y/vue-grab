import type { FloatingButtonConfig, FloatingButtonDockMode } from "@sakana-y/vue-grab-shared";

import type { FloatingButtonDockEntriesController } from "./dock-entries";
import type { FloatingButtonShortcutsController } from "./shortcuts";
import type { FloatingButtonRuntimeState } from "./state";
import type { TabId } from "./types";

import { openInEditor } from "../editor";
import { esc, toRelativePath } from "../utils";
import { DOCK_MODE_OPTIONS, EDITOR_PRESETS } from "./definitions";
import { CROSSHAIR_SVG, GEAR_SVG, LOGS_SVG, MAGNIFIER_SVG } from "./icons";
import { trySaveBoolean, trySaveEditor } from "./storage";

export interface FloatingButtonSettingsPanelOptions {
  config: FloatingButtonConfig;
  state: FloatingButtonRuntimeState;
  dockEntries: FloatingButtonDockEntriesController;
  shortcuts: FloatingButtonShortcutsController;
  getDockMode: () => FloatingButtonDockMode;
  setDockMode: (mode: FloatingButtonDockMode, persist: boolean) => void;
  onMagnifierConfigChange: (config: { loupeSize?: number; zoomLevel?: number }) => void;
}

export class FloatingButtonSettingsPanel {
  constructor(private readonly options: FloatingButtonSettingsPanelOptions) {}

  render(): string {
    const { state } = this.options;
    const editorOptions = EDITOR_PRESETS.map(
      (p) =>
        `<option value="${p.value}"${p.value === state.editorChoice ? " selected" : ""}>${p.label}</option>`,
    ).join("");
    const dockMode = this.options.getDockMode();
    const dockModeOptions = DOCK_MODE_OPTIONS.map(
      (p) =>
        `<button type="button" class="dock-mode-option${
          p.value === dockMode ? " active" : ""
        }" data-dock-mode="${p.value}" aria-pressed="${
          p.value === dockMode ? "true" : "false"
        }" title="${p.title}">${p.icon}<span>${p.label}</span></button>`,
    ).join("");

    const comp = state.lastGrabResult?.componentStack[0];
    const filePathText = comp?.filePath ? toRelativePath(comp.filePath) : "No element grabbed yet";
    const fileDisabled = !comp?.filePath;

    return `
      <div class="tab-bar">
        <button class="tab-btn${state.settingsTab === "dock" ? " active" : ""}" data-tab="dock">Dock</button>
        <button class="tab-btn${state.settingsTab === "shortcuts" ? " active" : ""}" data-tab="shortcuts">Shortcuts</button>
        <button class="tab-btn${state.settingsTab === "tools" ? " active" : ""}" data-tab="tools">Tools</button>
      </div>
      <div class="tab-content${state.settingsTab === "dock" ? " active" : ""}" data-tab-content="dock">
        <div class="section-label">Panel</div>
        <div class="settings-list dock-settings-list">
          <div class="setting-row dock-mode-row" data-settings-row="dock-mode">
            <span class="setting-row-icon">${GEAR_SVG}</span>
            <span class="setting-row-copy">
              <span class="setting-row-title">Dock mode</span>
              <span class="setting-row-description">How the DevTools panel is displayed.</span>
            </span>
            <span class="setting-row-control">
              <span class="dock-mode-group" role="group" aria-label="Dock mode">
                ${dockModeOptions}
              </span>
            </span>
          </div>
          <label class="setting-row setting-toggle-row" data-settings-row="outside-click">
            <span class="setting-row-icon">${CROSSHAIR_SVG}</span>
            <span class="setting-row-copy setting-toggle-copy">
              <span class="setting-row-title setting-toggle-title">Close panel on outside click</span>
              <span class="setting-row-description setting-toggle-description">Close the DevTools panel when clicking outside of it.</span>
            </span>
            <span class="setting-row-control">
              <input type="checkbox" class="setting-toggle-input outside-click-toggle"${
                state.closeOnOutsideClick ? " checked" : ""
              }>
              <span class="setting-toggle-switch" aria-hidden="true"></span>
            </span>
          </label>
        </div>
        <div class="section-label">Toolbar Entries</div>
        ${this.options.dockEntries.render()}
      </div>
      <div class="tab-content${state.settingsTab === "shortcuts" ? " active" : ""}" data-tab-content="shortcuts">
        <div class="section-label">Shortcuts</div>
        <div class="settings-list shortcuts-list">
          ${this.options.shortcuts.renderRows()}
        </div>
      </div>
      <div class="tab-content${state.settingsTab === "tools" ? " active" : ""}" data-tab-content="tools">
        <div class="section-label">Editor</div>
        <div class="settings-list tools-list">
          <div class="setting-row tool-row" data-settings-row="editor-choice">
            <span class="setting-row-icon">${GEAR_SVG}</span>
            <span class="setting-row-copy">
              <span class="setting-row-title">Preferred editor</span>
              <span class="setting-row-description">Choose the command used for source handoff.</span>
            </span>
            <span class="setting-row-control">
              <select class="editor-select">${editorOptions}</select>
            </span>
          </div>
          <div class="setting-row tool-row" data-settings-row="open-file">
            <span class="setting-row-icon">${LOGS_SVG}</span>
            <span class="setting-row-copy">
              <span class="setting-row-title">Open grabbed file</span>
              <span class="setting-row-description file-path-display">${esc(filePathText)}</span>
            </span>
            <span class="setting-row-control">
              <button class="open-file-btn"${fileDisabled ? " disabled" : ""}>Open in Editor</button>
            </span>
          </div>
        </div>
        <div class="section-label">Magnifier</div>
        <div class="settings-list tools-list">
          <div class="setting-row tool-row" data-settings-row="magnifier-size">
            <span class="setting-row-icon">${MAGNIFIER_SVG}</span>
            <span class="setting-row-copy">
              <span class="setting-row-title">Loupe size</span>
              <span class="setting-row-description">Adjust the diameter of the magnifier window.</span>
            </span>
            <span class="setting-row-control slider-row">
              <input type="range" class="magnifier-size-slider" min="100" max="600" step="50" value="${state.magnifierLoupeSize}">
              <span class="slider-value">${state.magnifierLoupeSize}px</span>
            </span>
          </div>
          <div class="setting-row tool-row" data-settings-row="magnifier-zoom">
            <span class="setting-row-icon">${MAGNIFIER_SVG}</span>
            <span class="setting-row-copy">
              <span class="setting-row-title">Zoom level</span>
              <span class="setting-row-description">Control the loupe magnification factor.</span>
            </span>
            <span class="setting-row-control slider-row">
              <input type="range" class="magnifier-zoom-slider" min="1" max="8" step="0.5" value="${state.magnifierZoomLevel}">
              <span class="slider-value">${state.magnifierZoomLevel}x</span>
            </span>
          </div>
        </div>
      </div>
    `;
  }

  wire(root: HTMLElement): void {
    for (const btn of Array.from(root.querySelectorAll(".tab-btn"))) {
      btn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const tabId = (btn as HTMLElement).dataset.tab as TabId;
        if (tabId) this.switchTab(root, tabId);
      });
    }

    for (const btn of Array.from(root.querySelectorAll(".dock-mode-option"))) {
      btn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const dockMode = (btn as HTMLElement).dataset.dockMode;
        if (dockMode !== "float" && dockMode !== "edge") return;
        this.options.setDockMode(dockMode, true);
        this.updateDockModeControls(root);
      });
    }

    const outsideClickToggle = root.querySelector<HTMLInputElement>(".outside-click-toggle");
    outsideClickToggle?.addEventListener("click", (e: Event) => e.stopPropagation());
    outsideClickToggle?.addEventListener("change", () => {
      this.options.state.closeOnOutsideClick = outsideClickToggle.checked;
      trySaveBoolean(
        this.options.config.closeOnOutsideClickStorageKey,
        this.options.state.closeOnOutsideClick,
      );
    });

    this.options.dockEntries.wire(root);

    const selectEl = root.querySelector<HTMLSelectElement>(".editor-select");
    selectEl?.addEventListener("change", () => {
      this.options.state.editorChoice = selectEl.value;
      trySaveEditor(this.options.config.editorStorageKey, this.options.state.editorChoice);
    });

    const openBtn = root.querySelector(".open-file-btn");
    openBtn?.addEventListener("click", (e: Event) => {
      e.stopPropagation();
      const filePath = this.options.state.lastGrabResult?.componentStack[0]?.filePath;
      if (filePath) {
        const line = this.options.state.lastGrabResult?.componentStack[0]?.line;
        const editor = this.options.state.editorChoice;
        openInEditor(filePath, line, editor || undefined);
      }
    });

    this.options.shortcuts.wire(root);

    const sizeSlider = root.querySelector<HTMLInputElement>(".magnifier-size-slider");
    sizeSlider?.addEventListener("input", () => {
      const val = Number(sizeSlider.value);
      this.options.state.magnifierLoupeSize = val;
      const label = sizeSlider.parentElement?.querySelector(".slider-value");
      if (label) label.textContent = `${val}px`;
      this.options.onMagnifierConfigChange({ loupeSize: val });
    });

    const zoomSlider = root.querySelector<HTMLInputElement>(".magnifier-zoom-slider");
    zoomSlider?.addEventListener("input", () => {
      const val = Number(zoomSlider.value);
      this.options.state.magnifierZoomLevel = val;
      const label = zoomSlider.parentElement?.querySelector(".slider-value");
      if (label) label.textContent = `${val}x`;
      this.options.onMagnifierConfigChange({ zoomLevel: val });
    });
  }

  updateEditorTabInPlace(root: HTMLElement | null): void {
    if (!root) return;
    const filePathEl = root.querySelector(".file-path-display");
    const openBtn = root.querySelector<HTMLButtonElement>(".open-file-btn");
    if (!filePathEl || !openBtn) return;

    const comp = this.options.state.lastGrabResult?.componentStack[0];
    if (comp?.filePath) {
      filePathEl.textContent = toRelativePath(comp.filePath);
      openBtn.disabled = false;
    } else {
      filePathEl.textContent = "No element grabbed yet";
      openBtn.disabled = true;
    }
  }

  private switchTab(root: HTMLElement, tabId: TabId): void {
    this.options.state.settingsTab = tabId;
    for (const btn of Array.from(root.querySelectorAll(".tab-btn"))) {
      btn.classList.toggle("active", (btn as HTMLElement).dataset.tab === tabId);
    }
    for (const content of Array.from(root.querySelectorAll(".tab-content"))) {
      content.classList.toggle("active", (content as HTMLElement).dataset.tabContent === tabId);
    }
  }

  private updateDockModeControls(root: HTMLElement): void {
    const dockMode = this.options.getDockMode();
    for (const btn of Array.from(root.querySelectorAll(".dock-mode-option"))) {
      const active = (btn as HTMLElement).dataset.dockMode === dockMode;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    }
  }
}
