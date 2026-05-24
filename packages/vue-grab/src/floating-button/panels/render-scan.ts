import type { RenderScanRecord } from "../../render-scan";
import type { PanelId } from "../types";

import { openInEditor } from "../../editor";
import { esc, toRelativePath, truncate } from "../../utils";
import { RENDER_SCAN_SVG } from "../icons";

export interface FloatingButtonRenderScanPanelOptions {
  getActivePanel: () => PanelId | null;
  isScanActive: () => boolean;
  renderExpandBody: () => void;
  toggleScan: () => void;
  clearEntries: () => void;
  getEditorChoice: () => string;
}

export class FloatingButtonRenderScanPanel {
  private entries: RenderScanRecord[] = [];
  private searchTerm = "";
  private selectedId: number | null = null;
  private searchDebounceId: number | null = null;
  private renderRafId: number | null = null;

  constructor(private readonly options: FloatingButtonRenderScanPanelOptions) {}

  setEntries(entries: RenderScanRecord[]): void {
    this.entries = entries;
    if (this.selectedId != null && !entries.some((entry) => entry.id === this.selectedId)) {
      this.selectedId = entries[0]?.id ?? null;
    }
    if (this.options.getActivePanel() === "render-scan") this.scheduleRender();
  }

  visible(): RenderScanRecord[] {
    const needle = this.searchTerm.trim().toLowerCase();
    if (!needle) return this.entries;
    return this.entries.filter((entry) => {
      const filePath = entry.filePath ? toRelativePath(entry.filePath) : "";
      return entry.name.toLowerCase().includes(needle) || filePath.toLowerCase().includes(needle);
    });
  }

  render(visible = this.visible()): string {
    const totalCount = this.entries.length;
    const visibleCount = visible.length;
    const selected = this.getSelectedEntry(visible);
    const maxCount = this.entries.reduce((max, entry) => Math.max(max, entry.count), 0);
    const hotCount = this.entries.filter((entry) => entry.severity !== "normal").length;
    const active = this.options.isScanActive();
    const meta = active
      ? totalCount === 0
        ? "Watching component updates"
        : `${visibleCount} of ${totalCount} ${totalCount === 1 ? "component" : "components"}`
      : "Paused";

    let html = `<div class="render-scan-panel${totalCount === 0 ? " is-empty" : ""}">`;
    html += '<div class="render-scan-shell">';
    html += '<div class="render-scan-main">';
    html += '<div class="section-label render-scan-section-label">Overview</div>';
    html += '<div class="settings-list render-scan-overview-list">';
    html += '<div class="setting-row render-scan-overview-row">';
    html += `<span class="setting-row-icon render-scan-title-icon">${RENDER_SCAN_SVG}</span>`;
    html += '<span class="setting-row-copy render-scan-title-copy">';
    html += '<span class="setting-row-title render-scan-title">Render Scan</span>';
    html += `<span class="setting-row-description render-scan-meta">${esc(meta)}</span>`;
    html += "</span>";
    html += '<span class="setting-row-control render-scan-actions">';
    html += `<button class="render-scan-toggle" type="button" aria-pressed="${active ? "true" : "false"}">${active ? "Pause" : "Resume"}</button>`;
    html += `<button class="render-scan-clear" type="button"${totalCount === 0 ? " disabled" : ""}>Reset</button>`;
    html += "</span>";
    html += "</div>";
    html += "</div>";
    html += '<div class="section-label render-scan-section-label">Summary</div>';
    html += '<div class="settings-list render-scan-summary-list">';
    html += '<div class="setting-row render-scan-summary-row">';
    html +=
      '<span class="setting-row-icon render-scan-summary-icon" aria-hidden="true"><span class="render-scan-row-dot"></span></span>';
    html += '<span class="setting-row-copy">';
    html += '<span class="setting-row-title">Update activity</span>';
    html += `<span class="setting-row-description">${hotCount} hot ${hotCount === 1 ? "component" : "components"}</span>`;
    html += "</span>";
    html += '<span class="setting-row-control render-scan-summary">';
    html += `<span class="render-scan-stat"><span class="render-scan-stat-number">${totalCount}</span> tracked</span>`;
    html += `<span class="render-scan-stat"><span class="render-scan-stat-number">${hotCount}</span> hot</span>`;
    html += `<span class="render-scan-stat"><span class="render-scan-stat-number">${maxCount}</span> peak</span>`;
    html += "</span>";
    html += "</div>";
    html += "</div>";
    html +=
      '<div class="section-label render-scan-section-label render-scan-detail-kicker">Selected Component</div>';
    html += '<div class="settings-list render-scan-detail">';

    if (selected) {
      const relativePath = selected.filePath ? toRelativePath(selected.filePath) : "";
      html += '<div class="setting-row render-scan-detail-heading">';
      html += `<span class="setting-row-icon render-scan-selected-icon" aria-hidden="true"><span class="render-scan-row-dot ${selected.severity}"></span></span>`;
      html += '<span class="setting-row-copy">';
      html += `<span class="setting-row-title render-scan-detail-title">${esc(selected.name)}</span>`;
      html += `<span class="setting-row-description render-scan-detail-file" title="${esc(relativePath)}">${esc(relativePath || "Unknown file")}</span>`;
      html += "</span>";
      html += '<span class="setting-row-control">';
      html += `<span class="render-scan-severity-chip ${selected.severity}">${esc(selected.severity)}</span>`;
      html += "</span>";
      html += "</div>";
      html += '<div class="setting-row render-scan-detail-metrics">';
      html +=
        '<span class="setting-row-icon render-scan-metrics-icon" aria-hidden="true"><span class="render-scan-row-dot"></span></span>';
      html += '<span class="setting-row-copy">';
      html += '<span class="setting-row-title">Update window</span>';
      html += `<span class="setting-row-description">${formatTimestampSpan(
        selected.timestamps,
        selected.updatedAt,
      )}</span>`;
      html += "</span>";
      html += '<span class="setting-row-control render-scan-detail-grid">';
      html += `<span class="render-scan-stat"><span class="render-scan-stat-number">${selected.count}</span> updates</span>`;
      html += `<span class="render-scan-stat"><span class="render-scan-stat-number">${maxCount}</span> peak</span>`;
      html += "</span>";
      html += "</div>";
      html += '<div class="setting-row render-scan-detail-note-row">';
      html += `<span class="setting-row-icon render-scan-note-icon">${RENDER_SCAN_SVG}</span>`;
      html += '<span class="setting-row-copy">';
      html += '<span class="setting-row-title">Scope</span>';
      html += '<span class="setting-row-description render-scan-detail-note">';
      html += "Vue Grab v1 reports update frequency. Cause analysis is not captured yet.";
      html += "</span>";
      html += "</span>";
      html += '<span class="setting-row-control render-scan-open-control">';
      if (selected.filePath) {
        html += `<button class="render-scan-open" type="button" data-render-scan-open="${selected.id}">Open in Editor</button>`;
      }
      html += "</span>";
      html += "</div>";
    } else {
      html += '<div class="setting-row render-scan-empty-card">';
      html += `<span class="setting-row-icon render-scan-empty-icon">${RENDER_SCAN_SVG}</span>`;
      html += '<span class="setting-row-copy">';
      html += '<span class="setting-row-title">No component selected</span>';
      html += '<span class="setting-row-description">';
      html += active
        ? "Interact with the page to collect updates."
        : "Resume scanning to collect updates.";
      html += "</span>";
      html += "</span>";
      html += '<span class="setting-row-control"></span>';
      html += "</div>";
    }

    html += "</div>";
    html += "</div>";
    html += '<div class="render-scan-list-pane">';
    html += '<div class="section-label render-scan-section-label">Components</div>';
    html += '<div class="render-scan-search-row">';
    html += `<input class="render-scan-search" type="text" placeholder="Component name or file..." value="${esc(this.searchTerm)}">`;
    html += "</div>";

    if (visible.length === 0) {
      const empty = totalCount === 0 ? "No component updates yet" : "No components match";
      html += '<div class="settings-list render-scan-list render-scan-empty-list">';
      html += '<div class="setting-row render-scan-empty-row">';
      html += `<span class="setting-row-icon render-scan-empty-icon">${RENDER_SCAN_SVG}</span>`;
      html += '<span class="setting-row-copy">';
      html += `<span class="setting-row-title">${esc(empty)}</span>`;
      html +=
        '<span class="setting-row-description">Render activity will appear here while scanning.</span>';
      html += "</span>";
      html += '<span class="setting-row-control"></span>';
      html += "</div>";
      html += "</div>";
    } else {
      html += '<div class="settings-list render-scan-list">';
      for (const entry of visible) {
        const isSelected = selected?.id === entry.id;
        const relativePath = entry.filePath ? toRelativePath(entry.filePath) : "";
        const label = truncate(relativePath || "Unknown file", 58);
        html += `<button class="setting-row render-scan-row${isSelected ? " selected" : ""}" type="button" data-render-scan-select="${entry.id}" aria-pressed="${isSelected ? "true" : "false"}">`;
        html += `<span class="setting-row-icon render-scan-row-icon" aria-hidden="true"><span class="render-scan-row-dot ${entry.severity}"></span></span>`;
        html += '<span class="setting-row-copy render-scan-row-copy">';
        html += `<span class="setting-row-title render-scan-row-name">${esc(entry.name)}</span>`;
        html += `<span class="setting-row-description render-scan-row-file" title="${esc(relativePath)}">${esc(label)}</span>`;
        html += "</span>";
        html += '<span class="setting-row-control render-scan-row-control">';
        html += `<span class="render-scan-row-count">&times;${entry.count}</span>`;
        html += "</span>";
        html += "</button>";
      }
      html += "</div>";
    }

    html += "</div>";
    html += "</div>";
    html += "</div>";
    return html;
  }

  wire(root: HTMLElement, visible: RenderScanRecord[]): void {
    const toggleBtn = root.querySelector(".render-scan-toggle");
    toggleBtn?.addEventListener("click", (e: Event) => {
      e.stopPropagation();
      this.options.toggleScan();
    });

    const clearBtn = root.querySelector(".render-scan-clear");
    clearBtn?.addEventListener("click", (e: Event) => {
      e.stopPropagation();
      this.selectedId = null;
      this.options.clearEntries();
    });

    const searchInput = root.querySelector<HTMLInputElement>(".render-scan-search");
    searchInput?.addEventListener("input", () => {
      this.searchTerm = searchInput.value;
      if (this.searchDebounceId != null) window.clearTimeout(this.searchDebounceId);
      this.searchDebounceId = window.setTimeout(() => {
        this.searchDebounceId = null;
        if (this.options.getActivePanel() !== "render-scan") return;
        this.options.renderExpandBody();
        const fresh = root.querySelector<HTMLInputElement>(".render-scan-search");
        if (fresh && document.activeElement !== fresh) {
          fresh.focus();
          const pos = this.searchTerm.length;
          fresh.setSelectionRange(pos, pos);
        }
      }, 120);
    });
    searchInput?.addEventListener("click", (e: Event) => e.stopPropagation());
    searchInput?.addEventListener("keydown", (e: KeyboardEvent) => e.stopPropagation());

    for (const row of root.querySelectorAll<HTMLElement>("[data-render-scan-select]")) {
      row.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const id = Number(row.dataset.renderScanSelect);
        if (!Number.isFinite(id)) return;
        this.selectedId = id;
        this.options.renderExpandBody();
      });
    }

    for (const btn of root.querySelectorAll<HTMLElement>("[data-render-scan-open]")) {
      btn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const id = Number(btn.dataset.renderScanOpen);
        const entry =
          visible.find((item) => item.id === id) ?? this.entries.find((item) => item.id === id);
        if (!entry?.filePath) return;
        const editor = this.options.getEditorChoice();
        openInEditor(entry.filePath, undefined, editor || undefined);
      });
    }
  }

  destroy(): void {
    if (this.renderRafId != null) {
      cancelAnimationFrame(this.renderRafId);
      this.renderRafId = null;
    }
    if (this.searchDebounceId != null) {
      window.clearTimeout(this.searchDebounceId);
      this.searchDebounceId = null;
    }
  }

  private getSelectedEntry(visible: RenderScanRecord[]): RenderScanRecord | null {
    if (this.selectedId != null) {
      const selected =
        visible.find((entry) => entry.id === this.selectedId) ??
        this.entries.find((entry) => entry.id === this.selectedId);
      if (selected) return selected;
    }
    return visible[0] ?? this.entries[0] ?? null;
  }

  private scheduleRender(): void {
    if (this.renderRafId != null) return;
    this.renderRafId = requestAnimationFrame(() => {
      this.renderRafId = null;
      if (this.options.getActivePanel() === "render-scan") this.options.renderExpandBody();
    });
  }
}

function formatTimestampSpan(timestamps: number[], updatedAt: number): string {
  if (timestamps.length <= 1) return "single update";
  const first = timestamps[0] ?? updatedAt;
  const seconds = Math.max(0, (updatedAt - first) / 1000);
  if (seconds < 0.1) return "burst";
  return `${seconds.toFixed(seconds >= 10 ? 0 : 1)}s span`;
}
