import type {
  FloatingButtonDockEntriesConfig,
  FloatingButtonDockEntryId,
} from "@sakana-y/vue-grab-shared";
import { DOCK_ENTRY_DEFINITION_BY_ID } from "./definitions";
import type { DockEntryGroupId, PanelId } from "./types";

export interface FloatingButtonToolbarElements {
  grab: HTMLElement | null;
  "render-scan": HTMLElement | null;
  settings: HTMLElement | null;
  magnifier: HTMLElement | null;
  measurer: HTMLElement | null;
  accessibility: HTMLElement | null;
  logs: HTMLElement | null;
  network: HTMLElement | null;
}

export function createDockEntryButton(id: FloatingButtonDockEntryId): HTMLElement {
  const def = DOCK_ENTRY_DEFINITION_BY_ID.get(id)!;
  const el = document.createElement("div");
  el.className = `toolbar-btn ${def.buttonClass}`;
  el.dataset.dockEntry = id;
  el.innerHTML = def.icon;
  el.title = def.title;
  return el;
}

export function getDockEntryElement(
  elements: FloatingButtonToolbarElements,
  id: FloatingButtonDockEntryId,
): HTMLElement | null {
  return elements[id] ?? null;
}

export function visibleDockEntryIds(
  dockEntries: FloatingButtonDockEntriesConfig,
): FloatingButtonDockEntryId[] {
  const hidden = new Set(dockEntries.hidden);
  hidden.delete("settings");
  return dockEntries.order.filter((id) => id === "settings" || !hidden.has(id));
}

export function renderToolbarEntries(
  toolbarRowEl: HTMLElement | null,
  dockEntries: FloatingButtonDockEntriesConfig,
  elements: FloatingButtonToolbarElements,
): void {
  if (!toolbarRowEl) return;
  toolbarRowEl.replaceChildren();

  let previousGroup: DockEntryGroupId | null = null;
  for (const id of visibleDockEntryIds(dockEntries)) {
    const def = DOCK_ENTRY_DEFINITION_BY_ID.get(id);
    const el = getDockEntryElement(elements, id);
    if (!def || !el) continue;
    if (previousGroup && previousGroup !== def.group) {
      const divider = document.createElement("div");
      divider.className = "toolbar-divider";
      toolbarRowEl.appendChild(divider);
    }
    toolbarRowEl.appendChild(el);
    previousGroup = def.group;
  }
}

export function updatePanelButtonStates(
  elements: FloatingButtonToolbarElements,
  activePanel: PanelId | null,
): void {
  elements.settings?.classList.toggle("active", activePanel === "settings");
  elements["render-scan"]?.classList.toggle("panel-open", activePanel === "render-scan");
  elements.accessibility?.classList.toggle("active", activePanel === "accessibility");
  elements.logs?.classList.toggle("active", activePanel === "logs");
  elements.network?.classList.toggle("active", activePanel === "network");
}
