import type { CapturedLog, CapturedRequest, GrabResult } from "@sakana-y/vue-grab-shared";

import type { PanelId } from "../types";

import { openInClaudeCode } from "../../editor";
import { buildContextPrompt, esc, toRelativePath } from "../../utils";
import { CONTEXT_SVG } from "../icons";

export interface FloatingButtonContextPanelOptions {
  getActivePanel: () => PanelId | null;
  getLastResult: () => GrabResult | null;
  renderExpandBody: () => void;
}

export class FloatingButtonContextPanel {
  private logs: CapturedLog[] = [];
  private network: CapturedRequest[] = [];
  private renderRafId: number | null = null;
  private cachedPrompt: string | null = null;

  constructor(private readonly options: FloatingButtonContextPanelOptions) {}

  setLogs(entries: CapturedLog[]): void {
    this.logs = entries;
    this.invalidatePrompt();
    this.scheduleRender();
  }

  setNetwork(entries: CapturedRequest[]): void {
    this.network = entries;
    this.invalidatePrompt();
    this.scheduleRender();
  }

  refresh(): void {
    this.invalidatePrompt();
    this.scheduleRender();
  }

  render(): string {
    const result = this.options.getLastResult();
    const prompt = (this.cachedPrompt = this.buildPrompt());
    const preview = truncatePreview(prompt);
    const firstComponent = result?.componentStack[0];
    const componentText = firstComponent
      ? `${firstComponent.name}${firstComponent.filePath ? ` (${toRelativePath(firstComponent.filePath)}${firstComponent.line ? `:${firstComponent.line}` : ""})` : ""}`
      : "No grabbed component yet";
    const meta = result ? "Grab + diagnostics ready" : "Diagnostics only";

    let html = `<div class="context-panel${result ? "" : " is-empty"}">`;
    html += '<div class="section-label context-section-label">Overview</div>';
    html += '<div class="settings-list context-overview-list">';
    html += '<div class="setting-row context-overview-row">';
    html += `<span class="setting-row-icon context-overview-icon">${CONTEXT_SVG}</span>`;
    html += '<span class="setting-row-copy">';
    html += '<span class="setting-row-title">Context Packet</span>';
    html += `<span class="setting-row-description context-panel-meta">${esc(meta)}</span>`;
    html += "</span>";
    html += '<span class="setting-row-control context-overview-control">';
    html += `<span class="logs-stat-chip"><span class="logs-stat-number">${result ? 1 : 0}</span> grab</span>`;
    html += `<span class="logs-stat-chip"><span class="logs-stat-number">${this.logs.length}</span> logs</span>`;
    html += `<span class="logs-stat-chip"><span class="logs-stat-number">${this.network.length}</span> net</span>`;
    html += "</span>";
    html += "</div>";
    html += "</div>";

    html += '<div class="section-label context-section-label">Selected Element</div>';
    html += '<div class="settings-list context-selected-list">';
    html += '<div class="setting-row context-selected-row">';
    html += `<span class="setting-row-icon context-selected-icon">${CONTEXT_SVG}</span>`;
    html += '<span class="setting-row-copy">';
    html += `<span class="setting-row-title">${esc(result?.selector ?? "No element grabbed")}</span>`;
    html += `<span class="setting-row-description">${esc(componentText)}</span>`;
    html += "</span>";
    html += "</div>";
    html += "</div>";

    html += '<div class="section-label context-section-label">Handoff</div>';
    html += '<div class="settings-list context-action-list">';
    html += '<div class="setting-row context-action-row">';
    html += `<span class="setting-row-icon context-action-icon">${CONTEXT_SVG}</span>`;
    html += '<span class="setting-row-copy">';
    html += '<span class="setting-row-title">Agent recovery packet</span>';
    html += `<span class="setting-row-description">${prompt.length.toLocaleString()} characters</span>`;
    html += "</span>";
    html += '<span class="setting-row-control context-actions">';
    html += '<button class="log-action-btn" data-context-copy type="button">Copy</button>';
    html +=
      '<button class="log-action-btn primary" data-context-claude type="button">Open in Claude Code</button>';
    html += "</span>";
    html += "</div>";
    html += "</div>";

    html += '<div class="section-label context-section-label">Preview</div>';
    html += `<pre class="context-preview">${esc(preview)}</pre>`;
    html += "</div>";
    return html;
  }

  wire(root: HTMLElement): void {
    const copyBtn = root.querySelector<HTMLElement>("[data-context-copy]");
    copyBtn?.addEventListener("click", (e: Event) => {
      e.stopPropagation();
      const prompt = this.cachedPrompt ?? this.buildPrompt();
      navigator.clipboard.writeText(prompt).then(() => {
        copyBtn.textContent = "Copied!";
        setTimeout(() => {
          copyBtn.textContent = "Copy";
        }, 1500);
      });
    });

    const claudeBtn = root.querySelector<HTMLElement>("[data-context-claude]");
    claudeBtn?.addEventListener("click", (e: Event) => {
      e.stopPropagation();
      const prompt = this.cachedPrompt ?? this.buildPrompt();
      openInClaudeCode(prompt);
      claudeBtn.textContent = "Opened!";
      setTimeout(() => {
        claudeBtn.textContent = "Open in Claude Code";
      }, 1500);
    });
  }

  destroy(): void {
    if (this.renderRafId) {
      cancelAnimationFrame(this.renderRafId);
      this.renderRafId = null;
    }
  }

  private buildPrompt(): string {
    return buildContextPrompt({
      result: this.options.getLastResult(),
      logs: this.logs,
      network: this.network,
    });
  }

  private invalidatePrompt(): void {
    this.cachedPrompt = null;
  }

  private scheduleRender(): void {
    if (this.options.getActivePanel() !== "context") return;
    if (this.renderRafId != null) return;
    this.renderRafId = requestAnimationFrame(() => {
      this.renderRafId = null;
      if (this.options.getActivePanel() === "context") this.options.renderExpandBody();
    });
  }
}

function truncatePreview(value: string): string {
  return value.length > 1600 ? `${value.slice(0, 1600)}\n...` : value;
}
