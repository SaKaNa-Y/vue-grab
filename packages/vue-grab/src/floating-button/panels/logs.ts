import type { CapturedLog } from "@sakana-y/vue-grab-shared";

/**
 * Badge counter for captured console logs. The logs panel itself is now a Vue
 * component (`LogsPanel.vue`) that reads entries from the FAB store (ADR 0002);
 * this class survives only to own the toolbar badge count.
 */
export class FloatingButtonLogsPanel {
  private entries: CapturedLog[] = [];

  setEntries(entries: CapturedLog[], badgeEl: HTMLElement | null): void {
    this.entries = entries;
    this.updateBadge(badgeEl);
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
}
