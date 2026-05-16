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
    html += '<div class="render-scan-header">';
    html += '<span class="render-scan-title-wrap">';
    html += `<span class="render-scan-title-icon">${RENDER_SCAN_SVG}</span>`;
    html += '<span class="render-scan-title-copy">';
    html += '<span class="render-scan-title">Render Scan</span>';
    html += `<span class="render-scan-meta">${esc(meta)}</span>`;
    html += "</span>";
    html += "</span>";
    html += '<span class="render-scan-actions">';
    html += `<button class="render-scan-toggle" type="button" aria-pressed="${active ? "true" : "false"}">${active ? "Pause" : "Resume"}</button>`;
    html += `<button class="render-scan-clear" type="button"${totalCount === 0 ? " disabled" : ""}>Reset</button>`;
    html += "</span>";
    html += "</div>";
    html += '<div class="render-scan-summary">';
    html += `<span class="render-scan-stat"><span class="render-scan-stat-number">${totalCount}</span> tracked</span>`;
    html += `<span class="render-scan-stat"><span class="render-scan-stat-number">${hotCount}</span> hot</span>`;
    html += `<span class="render-scan-stat"><span class="render-scan-stat-number">${maxCount}</span> peak</span>`;
    html += "</div>";
    html += '<div class="render-scan-detail">';

    if (selected) {
      const relativePath = selected.filePath ? toRelativePath(selected.filePath) : "";
      html += '<div class="render-scan-detail-kicker">Selected component</div>';
      html += `<div class="render-scan-detail-title">${esc(selected.name)}</div>`;
      html += '<div class="render-scan-detail-grid">';
      html += `<span>Updates</span><strong>${selected.count}</strong>`;
      html += `<span>Severity</span><strong class="render-scan-severity ${selected.severity}">${selected.severity}</strong>`;
      html += `<span>Window</span><strong>${formatTimestampSpan(
        selected.timestamps,
        selected.updatedAt,
      )}</strong>`;
      html += `<span>File</span><strong title="${esc(relativePath)}">${esc(relativePath || "Unknown")}</strong>`;
      html += "</div>";
      html += '<div class="render-scan-detail-note">';
      html +=
        "Vue Grab v1 reports update frequency. Prop, state, and context cause analysis is not captured yet.";
      html += "</div>";
      if (selected.filePath) {
        html += `<button class="render-scan-open" type="button" data-render-scan-open="${selected.id}">Open in Editor</button>`;
      }
    } else {
      html += '<div class="render-scan-empty-card">';
      html += active
        ? "Interact with the page to collect component update activity."
        : "Resume scanning to collect component update activity.";
      html += "</div>";
    }

    html += "</div>";
    html += "</div>";
    html += '<div class="render-scan-list-pane">';
    html += '<div class="render-scan-search-row">';
    html += `<input class="render-scan-search" type="text" placeholder="Component name or file..." value="${esc(this.searchTerm)}">`;
    html += "</div>";

    if (visible.length === 0) {
      const empty = totalCount === 0 ? "No component updates yet" : "No components match";
      html += `<div class="render-scan-empty-list">${empty}</div>`;
    } else {
      html += '<div class="render-scan-list">';
      for (const entry of visible) {
        const isSelected = selected?.id === entry.id;
        const relativePath = entry.filePath ? toRelativePath(entry.filePath) : "";
        const label = truncate(relativePath || "Unknown file", 58);
        html += `<button class="render-scan-row${isSelected ? " selected" : ""}" type="button" data-render-scan-select="${entry.id}">`;
        html += `<span class="render-scan-row-dot ${entry.severity}"></span>`;
        html += '<span class="render-scan-row-copy">';
        html += `<span class="render-scan-row-name">${esc(entry.name)}</span>`;
        html += `<span class="render-scan-row-file" title="${esc(relativePath)}">${esc(label)}</span>`;
        html += "</span>";
        html += `<span class="render-scan-row-count">&times;${entry.count}</span>`;
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
