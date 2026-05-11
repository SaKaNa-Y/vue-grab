import { esc, scanPageA11y, toRelativePath } from "../../utils";

type A11yResult = ReturnType<typeof scanPageA11y>[number];
type A11yStatus = "pass" | "fail" | "neutral";

export interface FloatingButtonA11yPanelOptions {
  isActive: () => boolean;
  rerender: (forceRescan?: boolean) => void;
}

export class FloatingButtonA11yPanel {
  private cachedResults: ReturnType<typeof scanPageA11y> | null = null;
  private lastScanTime = 0;

  constructor(private readonly options: FloatingButtonA11yPanelOptions) {}

  render(forceRescan = false): string {
    if (forceRescan || !this.cachedResults) {
      this.cachedResults = scanPageA11y();
      this.lastScanTime = Date.now();
    }
    const results = this.cachedResults;

    if (results.length === 0) {
      return '<div class="a11y-panel"><div class="a11y-empty">No Vue components found on this page</div></div>';
    }

    const passing = results.filter((r) => r.a11y.hasA11y && r.a11y.audit.length === 0);
    const issues = results.filter((r) => r.a11y.audit.length > 0);
    const neutral = results.filter((r) => !r.a11y.hasA11y && r.a11y.audit.length === 0);

    let html = '<div class="a11y-panel">';
    html += '<div class="a11y-header">';
    html += '<span class="a11y-title">Accessibility Audit</span>';
    html += '<button class="a11y-rescan-btn">Re-scan</button>';
    html += "</div>";
    html += '<div class="section-label">Summary</div>';
    html += '<div class="a11y-summary a11y-summary-strip">';
    html += `<span><span class="a11y-summary-count pass">${passing.length}</span> passing</span>`;
    html += '<span class="a11y-summary-separator"> &middot; </span>';
    html += `<span><span class="a11y-summary-count fail">${issues.length}</span> with issues</span>`;
    html += '<span class="a11y-summary-separator"> &middot; </span>';
    html += `<span><span class="a11y-summary-count neutral">${neutral.length}</span> no a11y attrs</span>`;
    html += '<span class="a11y-summary-separator"> &middot; </span>';
    html += `<span><span class="a11y-summary-count">${results.length}</span> total</span>`;
    html += "</div>";

    let idx = 0;
    const sections = [
      { items: issues, label: "Issues", status: "fail" },
      { items: neutral, label: "No Accessibility", status: "neutral" },
      { items: passing, label: "Passing", status: "pass" },
    ] satisfies Array<{
      items: typeof results;
      label: string;
      status: A11yStatus;
    }>;

    for (const { items, label, status } of sections) {
      if (items.length === 0) continue;
      html += `<div class="section-label a11y-group-label">${label} <span class="a11y-group-count">${items.length}</span></div>`;
      html += '<div class="settings-list a11y-audit-list">';
      for (const item of items) {
        html += renderA11yRow(item, status, idx++);
      }
      html += "</div>";
    }

    html += "</div>";
    return html;
  }

  wire(root: HTMLElement): void {
    const rescanBtn = root.querySelector(".a11y-rescan-btn");
    rescanBtn?.addEventListener("click", (e: Event) => {
      e.stopPropagation();
      if (Date.now() - this.lastScanTime < 500) return;
      (rescanBtn as HTMLElement).textContent = "Scanning\u2026";
      rescanBtn.classList.add("a11y-rescan-btn--loading");
      requestAnimationFrame(() => {
        if (!this.options.isActive()) return;
        this.options.rerender(true);
      });
    });

    for (const toggle of root.querySelectorAll(".a11y-row-toggle")) {
      toggle.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const idx = (toggle as HTMLElement).dataset.a11yIdx;
        const details = root.querySelector(`[data-a11y-details="${idx}"]`);
        const chevron = toggle.querySelector(".a11y-row-chevron");
        if (details) details.classList.toggle("open");
        if (chevron) chevron.classList.toggle("open");
      });
    }
  }
}

function renderA11yRow(item: A11yResult, status: A11yStatus, idx: number): string {
  const icon = status === "pass" ? "&#10003;" : status === "fail" ? "&#9888;" : "&mdash;";
  const statusLabel = status === "pass" ? "Passing" : status === "fail" ? "Issue" : "No a11y";
  const hasChildren = item.childElements.length > 0;

  let html = hasChildren ? `<div class="a11y-row-toggle" data-a11y-idx="${idx}">` : "";
  html += `<div class="setting-row a11y-row" data-a11y-row="${idx}" data-a11y-status="${status}">`;
  html += `<span class="setting-row-icon a11y-row-icon ${status}" aria-hidden="true">${icon}</span>`;
  html += '<span class="setting-row-copy">';
  html += '<span class="setting-row-title a11y-row-name">';
  if (hasChildren) {
    html += '<span class="a11y-row-chevron">&#9654;</span> ';
  }
  html += `&lt;${esc(item.componentName)}&gt;`;
  html += "</span>";

  if (item.filePath) {
    html += `<span class="setting-row-description a11y-row-file">${esc(toRelativePath(item.filePath))}</span>`;
  }

  if (status === "pass" && item.a11y.attributes.length > 0) {
    const attrNames = item.a11y.attributes.map((a) => a.name).join(", ");
    html += `<span class="setting-row-description a11y-row-detail">${esc(attrNames)}</span>`;
  }

  html += "</span>";
  html += '<span class="setting-row-control a11y-row-control">';
  if (hasChildren) {
    html += `<span class="a11y-row-count">${item.childElements.length}</span>`;
  } else {
    html += `<span class="a11y-status-chip ${status}">${statusLabel}</span>`;
  }
  html += "</span>";
  html += "</div>";

  if (hasChildren) {
    html += `<div class="a11y-child-details" data-a11y-details="${idx}">`;
    html += '<div class="a11y-child-surface">';
    for (const child of item.childElements) {
      html += '<div class="a11y-child-row">';
      html += `<div class="a11y-child-tag">&lt;${esc(child.selector)}&gt;</div>`;
      if (child.a11y.audit.length > 0) {
        for (const audit of child.a11y.audit) {
          html += `<div class="a11y-child-msg warning">${esc(audit.message)}</div>`;
        }
      } else if (child.a11y.hasA11y) {
        const attrs = child.a11y.attributes.map((a) => a.name).join(", ");
        html += `<div class="a11y-child-msg pass">&#10003; ${esc(attrs)}</div>`;
      } else {
        html += '<div class="a11y-child-msg neutral">no a11y attributes</div>';
      }
      html += "</div>";
    }
    html += "</div>";
    html += "</div>";
  }

  if (hasChildren) html += "</div>";
  return html;
}
