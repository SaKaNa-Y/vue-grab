import type { CapturedLog, LogLevel } from "@sakana-y/vue-grab-shared";
import { ALL_LOG_LEVELS } from "@sakana-y/vue-grab-shared";
import { openInClaudeCode, openInEditor } from "../../editor";
import type { PanelRenderer } from "../../utils/lifecycle";
import { buildLogPrompt, esc, resolveLogSource, truncate } from "../../utils";
import { LOGS_SVG } from "../icons";
import type { PanelId } from "../types";

export interface FloatingButtonLogsPanelOptions {
  getActivePanel: () => PanelId | null;
  renderExpandBody: () => void;
  getEditorChoice: () => string;
}

export class FloatingButtonLogsPanel implements PanelRenderer<CapturedLog[]> {
  private entries: CapturedLog[] = [];
  private filterLevels: Set<LogLevel> = new Set<LogLevel>(ALL_LOG_LEVELS);
  private searchTerm = "";
  private searchDebounceId: number | null = null;
  private renderRafId: number | null = null;
  private clearCb: (() => void) | null = null;

  constructor(private readonly options: FloatingButtonLogsPanelOptions) {}

  setEntries(entries: CapturedLog[], badgeEl: HTMLElement | null): void {
    this.entries = entries;
    if (this.options.getActivePanel() === "logs") {
      this.scheduleRender(badgeEl);
    } else {
      this.updateBadge(badgeEl);
    }
  }

  onClear(cb: () => void): void {
    this.clearCb = cb;
  }

  visible(): CapturedLog[] {
    const needle = this.searchTerm.toLowerCase();
    const filtered = this.entries.filter(
      (e) =>
        this.filterLevels.has(e.level) &&
        (needle === "" || e.message.toLowerCase().includes(needle)),
    );
    return filtered.toSorted((a, b) => b.timestamp - a.timestamp);
  }

  render(visible = this.visible()): string {
    const counts = this.countsByLevel();
    const totalCount = this.entries.length;
    const visibleCount = visible.length;
    const isCapturedEmpty = totalCount === 0;
    const activeLevelCount = this.filterLevels.size;
    const meta = isCapturedEmpty
      ? "No entries yet"
      : `${visibleCount} of ${totalCount} ${totalCount === 1 ? "entry" : "entries"}`;
    const pills = ALL_LOG_LEVELS.map((lvl) => {
      const active = this.filterLevels.has(lvl);
      return `<button class="logs-pill${active ? " active" : ""}" data-level="${lvl}" type="button">${lvl}<span class="count">${counts[lvl]}</span></button>`;
    }).join("");

    let html = `<div class="logs-panel${isCapturedEmpty ? " is-empty" : ""}">`;
    html += '<div class="section-label logs-section-label">Overview</div>';
    html += '<div class="settings-list logs-overview-list">';
    html += '<div class="setting-row logs-overview-row">';
    html += `<span class="setting-row-icon logs-overview-icon">${LOGS_SVG}</span>`;
    html += '<span class="setting-row-copy">';
    html += '<span class="setting-row-title logs-title">Console</span>';
    html += `<span class="setting-row-description logs-panel-meta">${esc(meta)}</span>`;
    html += "</span>";
    html += '<span class="setting-row-control logs-overview-control">';
    html += `<span class="logs-stat-chip"><span class="logs-stat-number">${visibleCount}</span> shown</span>`;
    html += `<span class="logs-stat-chip"><span class="logs-stat-number">${totalCount}</span> total</span>`;
    html += '<button class="logs-clear-btn" type="button">Clear</button>';
    html += "</span>";
    html += "</div>";
    html += "</div>";
    html += '<div class="section-label logs-section-label">Levels</div>';
    html += '<div class="settings-list logs-level-list">';
    html += '<div class="setting-row logs-level-row">';
    html += `<span class="setting-row-icon logs-level-icon">${LOGS_SVG}</span>`;
    html += '<span class="setting-row-copy">';
    html += '<span class="setting-row-title">Captured levels</span>';
    html += `<span class="setting-row-description">${activeLevelCount} of ${ALL_LOG_LEVELS.length} active</span>`;
    html += "</span>";
    html += `<span class="setting-row-control logs-filter-bar logs-level-controls">${pills}</span>`;
    html += "</div>";
    html += "</div>";
    html += '<div class="logs-entries-section">';
    html += '<div class="section-label logs-section-label">Entries</div>';

    if (!isCapturedEmpty) {
      html += '<div class="logs-search-row">';
      html += `<input class="logs-search" type="text" placeholder="Filter messages..." value="${esc(this.searchTerm)}">`;
      html += "</div>";
    }

    if (visible.length === 0) {
      const empty = isCapturedEmpty ? "No logs captured yet" : "No logs match the current filter";
      const emptyClass = isCapturedEmpty ? "logs-empty-compact" : "logs-empty";
      html += '<div class="settings-list logs-list logs-empty-list">';
      html += `<div class="${emptyClass}">${empty}</div>`;
      html += "</div>";
      html += "</div>";
      html += "</div>";
      return html;
    }

    html += '<div class="settings-list logs-list">';
    for (let i = 0; i < visible.length; i++) {
      const log = visible[i];
      const time = new Date(log.timestamp).toLocaleTimeString();
      const msgTrunc = truncate(log.message, 120);

      html += `<div class="log-row" data-level="${log.level}" data-log-idx="${i}">`;
      html += '<button class="log-row-header setting-row" type="button">';
      html +=
        '<span class="setting-row-icon log-row-icon" aria-hidden="true"><span class="log-row-dot"></span></span>';
      html += '<span class="setting-row-copy log-row-copy">';
      html += `<span class="setting-row-title log-row-msg" title="${esc(log.message)}">${esc(msgTrunc)}</span>`;
      html += '<span class="setting-row-description log-row-meta">';
      html += `<span class="log-row-level">${esc(log.level)}</span>`;
      if (log.source !== "console") {
        html += `<span class="log-row-source">${esc(log.source)}</span>`;
      }
      html += "</span>";
      html += "</span>";
      html += '<span class="setting-row-control log-row-control">';
      if (log.count > 1) {
        html += `<span class="log-row-count">&times;${log.count}</span>`;
      }
      html += `<span class="log-row-time">${esc(time)}</span>`;
      html += `<span class="log-row-chevron" data-log-toggle="${i}">&#9654;</span>`;
      html += "</span>";
      html += "</button>";
      html += `<div class="log-row-details" data-log-details="${i}">`;
      html += '<div class="log-row-detail-surface">';
      if (log.vueInfo) {
        html += `<div class="log-row-vue-info">Vue: ${esc(log.vueInfo)}</div>`;
      }
      if (log.stack) {
        html += `<div class="log-row-stack">${esc(log.stack)}</div>`;
      }
      html += '<div class="log-row-actions">';
      html += `<button class="log-action-btn" data-log-copy="${i}" type="button">Copy</button>`;
      html += `<button class="log-action-btn primary" data-log-claude="${i}" type="button">Open in Claude Code</button>`;
      if (log.sourceFile || log.componentStack?.[0]?.filePath) {
        html += `<button class="log-action-btn" data-log-open="${i}" type="button">Open in Editor</button>`;
      }
      html += "</div>";
      html += "</div>";
      html += "</div>";
      html += "</div>";
    }

    html += "</div>";
    html += "</div>";
    html += "</div>";
    return html;
  }

  wire(root: HTMLElement, sorted: CapturedLog[]): void {
    const clearBtn = root.querySelector(".logs-clear-btn");
    clearBtn?.addEventListener("click", (e: Event) => {
      e.stopPropagation();
      this.clearCb?.();
    });

    for (const pill of root.querySelectorAll<HTMLElement>(".logs-pill")) {
      pill.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const lvl = pill.dataset.level as LogLevel | undefined;
        if (!lvl) return;
        if (this.filterLevels.has(lvl)) this.filterLevels.delete(lvl);
        else this.filterLevels.add(lvl);
        this.options.renderExpandBody();
      });
    }

    const searchInput = root.querySelector<HTMLInputElement>(".logs-search");
    searchInput?.addEventListener("input", () => {
      this.searchTerm = searchInput.value;
      if (this.searchDebounceId != null) window.clearTimeout(this.searchDebounceId);
      this.searchDebounceId = window.setTimeout(() => {
        this.searchDebounceId = null;
        if (this.options.getActivePanel() !== "logs") return;
        this.options.renderExpandBody();
        const fresh = root.querySelector<HTMLInputElement>(".logs-search");
        if (fresh && document.activeElement !== fresh) {
          fresh.focus();
          const pos = this.searchTerm.length;
          fresh.setSelectionRange(pos, pos);
        }
      }, 120);
    });
    searchInput?.addEventListener("click", (e: Event) => e.stopPropagation());
    searchInput?.addEventListener("keydown", (e: KeyboardEvent) => e.stopPropagation());

    for (const header of root.querySelectorAll(".log-row-header")) {
      header.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const row = (header as HTMLElement).closest(".log-row");
        const idx = row?.getAttribute("data-log-idx");
        if (idx == null) return;
        const details = root.querySelector(`[data-log-details="${idx}"]`);
        const chevron = root.querySelector(`[data-log-toggle="${idx}"]`);
        if (details) details.classList.toggle("open");
        if (chevron) chevron.classList.toggle("open");
      });
    }

    for (const btn of root.querySelectorAll("[data-log-copy]")) {
      btn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const idx = Number((btn as HTMLElement).dataset.logCopy);
        const log = sorted[idx];
        if (!log) return;
        const prompt = buildLogPrompt(log);
        navigator.clipboard.writeText(prompt).then(() => {
          (btn as HTMLElement).textContent = "Copied!";
          setTimeout(() => {
            (btn as HTMLElement).textContent = "Copy";
          }, 1500);
        });
      });
    }

    for (const btn of root.querySelectorAll("[data-log-claude]")) {
      btn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const idx = Number((btn as HTMLElement).dataset.logClaude);
        const log = sorted[idx];
        if (!log) return;
        const prompt = buildLogPrompt(log);
        openInClaudeCode(prompt);
        (btn as HTMLElement).textContent = "Opened!";
        setTimeout(() => {
          (btn as HTMLElement).textContent = "Open in Claude Code";
        }, 1500);
      });
    }

    for (const btn of root.querySelectorAll("[data-log-open]")) {
      btn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const idx = Number((btn as HTMLElement).dataset.logOpen);
        const log = sorted[idx];
        if (!log) return;
        const source = resolveLogSource(log);
        if (!source) return;
        const editor = this.options.getEditorChoice();
        openInEditor(source.file, source.line, editor || undefined);
      });
    }
  }

  updateBadge(badgeEl: HTMLElement | null): void {
    if (!badgeEl) return;
    let count = 0;
    let hasError = false;
    for (const e of this.entries) {
      if (e.level === "error") {
        count++;
        hasError = true;
      } else if (e.level === "warn") {
        count++;
      }
    }
    badgeEl.textContent = count > 99 ? "99+" : String(count);
    badgeEl.style.display = count > 0 ? "" : "none";
    badgeEl.classList.toggle("has-error", hasError);
  }

  destroy(): void {
    if (this.renderRafId) {
      cancelAnimationFrame(this.renderRafId);
      this.renderRafId = null;
    }
    if (this.searchDebounceId != null) {
      window.clearTimeout(this.searchDebounceId);
      this.searchDebounceId = null;
    }
  }

  private scheduleRender(badgeEl: HTMLElement | null): void {
    if (this.renderRafId != null) return;
    this.renderRafId = requestAnimationFrame(() => {
      this.renderRafId = null;
      this.updateBadge(badgeEl);
      if (this.options.getActivePanel() === "logs") this.options.renderExpandBody();
    });
  }

  private countsByLevel(): Record<LogLevel, number> {
    const out: Record<LogLevel, number> = { log: 0, info: 0, warn: 0, error: 0, debug: 0 };
    for (const e of this.entries) out[e.level]++;
    return out;
  }
}
