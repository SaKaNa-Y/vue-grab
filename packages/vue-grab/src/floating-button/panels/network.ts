import type { CapturedRequest, NetworkStatusClass } from "@sakana-y/vue-grab-shared";
import {
  ALL_NETWORK_STATUS_CLASSES,
  NETWORK_ERROR_CLASSES,
  NETWORK_WARN_CLASSES,
} from "@sakana-y/vue-grab-shared";
import { openInClaudeCode, openInEditor } from "../../editor";
import {
  buildRequestPrompt,
  esc,
  formatNetworkStatusLabel,
  resolveRequestSource,
  truncate,
} from "../../utils";
import { NETWORK_SVG } from "../icons";
import type { PanelId } from "../types";

export interface FloatingButtonNetworkPanelOptions {
  getActivePanel: () => PanelId | null;
  renderExpandBody: () => void;
  getEditorChoice: () => string;
}

export class FloatingButtonNetworkPanel {
  private entries: CapturedRequest[] = [];
  private filterStatus: Set<NetworkStatusClass> = new Set<NetworkStatusClass>(
    ALL_NETWORK_STATUS_CLASSES,
  );
  private searchTerm = "";
  private searchDebounceId: number | null = null;
  private renderRafId: number | null = null;
  private lastBadge: { count: number; hasError: boolean } | null = null;
  private clearCb: (() => void) | null = null;

  constructor(private readonly options: FloatingButtonNetworkPanelOptions) {}

  setEntries(entries: CapturedRequest[], badgeEl: HTMLElement | null): void {
    this.entries = entries;
    if (this.options.getActivePanel() === "network") {
      this.scheduleRender(badgeEl);
    } else {
      this.updateBadge(badgeEl);
    }
  }

  onClear(cb: () => void): void {
    this.clearCb = cb;
  }

  visible(): CapturedRequest[] {
    const needle = this.searchTerm.toLowerCase();
    const filtered = this.entries.filter(
      (e) =>
        this.filterStatus.has(e.statusClass) &&
        (needle === "" || e.url.toLowerCase().includes(needle)),
    );
    return filtered.toSorted((a, b) => b.timestamp - a.timestamp);
  }

  render(visible = this.visible()): string {
    const counts = this.countsByStatusClass();
    const totalCount = this.entries.length;
    const visibleCount = visible.length;
    const isCapturedEmpty = totalCount === 0;
    const activeStatusCount = this.filterStatus.size;
    const meta = isCapturedEmpty
      ? "No requests yet"
      : `${visibleCount} of ${totalCount} ${totalCount === 1 ? "request" : "requests"}`;
    const pills = ALL_NETWORK_STATUS_CLASSES.map((cls) => {
      const active = this.filterStatus.has(cls);
      return `<button class="net-pill${active ? " active" : ""}" data-status="${cls}" type="button">${cls}<span class="count">${counts[cls]}</span></button>`;
    }).join("");

    let html = `<div class="network-panel${isCapturedEmpty ? " is-empty" : ""}">`;
    html += '<div class="section-label network-section-label">Overview</div>';
    html += '<div class="settings-list network-overview-list">';
    html += '<div class="setting-row network-overview-row">';
    html += `<span class="setting-row-icon network-overview-icon">${NETWORK_SVG}</span>`;
    html += '<span class="setting-row-copy">';
    html += '<span class="setting-row-title">Network</span>';
    html += `<span class="setting-row-description network-panel-meta">${esc(meta)}</span>`;
    html += "</span>";
    html += '<span class="setting-row-control network-overview-control">';
    html += `<span class="logs-stat-chip"><span class="logs-stat-number">${visibleCount}</span> shown</span>`;
    html += `<span class="logs-stat-chip"><span class="logs-stat-number">${totalCount}</span> total</span>`;
    html += '<button class="logs-clear-btn net-clear-btn" type="button">Clear</button>';
    html += "</span>";
    html += "</div>";
    html += "</div>";
    html += '<div class="section-label network-section-label">Status</div>';
    html += '<div class="settings-list network-status-list">';
    html += '<div class="setting-row network-status-row">';
    html += `<span class="setting-row-icon network-status-icon">${NETWORK_SVG}</span>`;
    html += '<span class="setting-row-copy">';
    html += '<span class="setting-row-title">Captured statuses</span>';
    html += `<span class="setting-row-description">${activeStatusCount} of ${ALL_NETWORK_STATUS_CLASSES.length} active</span>`;
    html += "</span>";
    html += `<span class="setting-row-control logs-filter-bar network-status-controls">${pills}</span>`;
    html += "</div>";
    html += "</div>";
    html += '<div class="network-requests-section">';
    html += '<div class="section-label network-section-label">Requests</div>';

    if (!isCapturedEmpty) {
      html += '<div class="net-search-row">';
      html += `<input class="logs-search net-search" type="text" placeholder="Filter URLs..." value="${esc(this.searchTerm)}">`;
      html += "</div>";
    }

    if (visible.length === 0) {
      const empty = isCapturedEmpty
        ? "No network activity captured"
        : "No requests match the current filter";
      const emptyClass = isCapturedEmpty ? "net-empty-compact" : "net-empty";
      html += '<div class="settings-list network-list network-empty-list">';
      html += `<div class="${emptyClass}">${empty}</div>`;
      html += "</div>";
      html += "</div>";
      html += "</div>";
      return html;
    }

    html += '<div class="settings-list network-list">';
    for (let i = 0; i < visible.length; i++) {
      const req = visible[i];
      const time = new Date(req.timestamp).toLocaleTimeString();
      const statusLabel = formatNetworkStatusLabel(req);
      const duration = req.duration != null ? `${Math.round(req.duration)}ms` : "";
      const urlTrunc = truncate(req.url, 160);

      html += `<div class="net-row" data-status="${req.statusClass}" data-net-idx="${i}">`;
      html += '<button class="net-row-header setting-row" type="button">';
      html +=
        '<span class="setting-row-icon net-row-icon" aria-hidden="true"><span class="net-row-dot"></span></span>';
      html += '<span class="setting-row-copy net-row-copy">';
      html += `<span class="setting-row-title net-row-url" title="${esc(req.url)}">${esc(urlTrunc)}</span>`;
      html += '<span class="setting-row-description net-row-meta">';
      html += `<span class="net-row-method">${esc(req.method)}</span>`;
      html += `<span class="net-row-status">${esc(statusLabel)}</span>`;
      html += "</span>";
      html += "</span>";
      html += '<span class="setting-row-control net-row-control">';
      if (req.count > 1) {
        html += `<span class="net-row-count">&times;${req.count}</span>`;
      }
      if (duration) html += `<span class="net-row-duration">${duration}</span>`;
      html += `<span class="net-row-time">${esc(time)}</span>`;
      html += `<span class="net-row-chevron" data-net-toggle="${i}">&#9654;</span>`;
      html += "</span>";
      html += "</button>";
      html += `<div class="net-row-details" data-net-details="${i}">`;
      html += '<div class="net-row-detail-surface">';
      if (req.error) {
        html += `<div class="net-row-error">Error: ${esc(req.error)}</div>`;
      }
      if (req.requestHeaders && Object.keys(req.requestHeaders).length > 0) {
        html += `<div class="net-section-title">Request headers</div>`;
        for (const [k, v] of Object.entries(req.requestHeaders)) {
          html += `<div class="net-kv"><span class="k">${esc(k)}</span>: ${esc(v)}</div>`;
        }
      }
      if (req.requestBody) {
        html += `<div class="net-section-title">Request body</div>`;
        html += `<div class="net-body">${esc(req.requestBody)}</div>`;
      }
      if (req.responseHeaders && Object.keys(req.responseHeaders).length > 0) {
        html += `<div class="net-section-title">Response headers</div>`;
        for (const [k, v] of Object.entries(req.responseHeaders)) {
          html += `<div class="net-kv"><span class="k">${esc(k)}</span>: ${esc(v)}</div>`;
        }
      }
      if (req.responseBody) {
        html += `<div class="net-section-title">Response body</div>`;
        html += `<div class="net-body">${esc(req.responseBody)}</div>`;
      }
      html += '<div class="log-row-actions">';
      html += `<button class="log-action-btn" data-net-copy="${i}" type="button">Copy</button>`;
      html += `<button class="log-action-btn primary" data-net-claude="${i}" type="button">Open in Claude Code</button>`;
      if (req.sourceFile) {
        html += `<button class="log-action-btn" data-net-open="${i}" type="button">Open in Editor</button>`;
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

  wire(root: HTMLElement, sorted: CapturedRequest[]): void {
    const clearBtn = root.querySelector(".net-clear-btn");
    clearBtn?.addEventListener("click", (e: Event) => {
      e.stopPropagation();
      this.clearCb?.();
    });

    for (const pill of root.querySelectorAll<HTMLElement>(".net-pill")) {
      pill.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const cls = pill.dataset.status as NetworkStatusClass | undefined;
        if (!cls) return;
        if (this.filterStatus.has(cls)) this.filterStatus.delete(cls);
        else this.filterStatus.add(cls);
        this.options.renderExpandBody();
      });
    }

    const searchInput = root.querySelector<HTMLInputElement>(".net-search");
    searchInput?.addEventListener("input", () => {
      this.searchTerm = searchInput.value;
      if (this.searchDebounceId != null) window.clearTimeout(this.searchDebounceId);
      this.searchDebounceId = window.setTimeout(() => {
        this.searchDebounceId = null;
        if (this.options.getActivePanel() !== "network") return;
        this.options.renderExpandBody();
        const fresh = root.querySelector<HTMLInputElement>(".net-search");
        if (fresh && document.activeElement !== fresh) {
          fresh.focus();
          const pos = this.searchTerm.length;
          fresh.setSelectionRange(pos, pos);
        }
      }, 120);
    });
    searchInput?.addEventListener("click", (e: Event) => e.stopPropagation());
    searchInput?.addEventListener("keydown", (e: KeyboardEvent) => e.stopPropagation());

    for (const header of root.querySelectorAll(".net-row-header")) {
      header.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const row = (header as HTMLElement).closest(".net-row");
        const idx = row?.getAttribute("data-net-idx");
        if (idx == null) return;
        const details = root.querySelector(`[data-net-details="${idx}"]`);
        const chevron = root.querySelector(`[data-net-toggle="${idx}"]`);
        if (details) details.classList.toggle("open");
        if (chevron) chevron.classList.toggle("open");
      });
    }

    for (const btn of root.querySelectorAll("[data-net-copy]")) {
      btn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const idx = Number((btn as HTMLElement).dataset.netCopy);
        const req = sorted[idx];
        if (!req) return;
        const prompt = buildRequestPrompt(req);
        navigator.clipboard.writeText(prompt).then(() => {
          (btn as HTMLElement).textContent = "Copied!";
          setTimeout(() => {
            (btn as HTMLElement).textContent = "Copy";
          }, 1500);
        });
      });
    }

    for (const btn of root.querySelectorAll("[data-net-claude]")) {
      btn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const idx = Number((btn as HTMLElement).dataset.netClaude);
        const req = sorted[idx];
        if (!req) return;
        const prompt = buildRequestPrompt(req);
        openInClaudeCode(prompt);
        (btn as HTMLElement).textContent = "Opened!";
        setTimeout(() => {
          (btn as HTMLElement).textContent = "Open in Claude Code";
        }, 1500);
      });
    }

    for (const btn of root.querySelectorAll("[data-net-open]")) {
      btn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const idx = Number((btn as HTMLElement).dataset.netOpen);
        const req = sorted[idx];
        if (!req) return;
        const source = resolveRequestSource(req);
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
      if (NETWORK_ERROR_CLASSES.has(e.statusClass)) {
        count++;
        hasError = true;
      } else if (NETWORK_WARN_CLASSES.has(e.statusClass)) {
        count++;
      }
    }
    if (this.lastBadge && this.lastBadge.count === count && this.lastBadge.hasError === hasError) {
      return;
    }
    this.lastBadge = { count, hasError };
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
      if (this.options.getActivePanel() === "network") this.options.renderExpandBody();
    });
  }

  private countsByStatusClass(): Record<NetworkStatusClass, number> {
    const out: Record<NetworkStatusClass, number> = {
      "2xx": 0,
      "3xx": 0,
      "4xx": 0,
      "5xx": 0,
      failed: 0,
    };
    for (const e of this.entries) out[e.statusClass]++;
    return out;
  }
}
