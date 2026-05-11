import type { FloatingButtonDockEntriesConfig } from "@sakana-y/vue-grab-shared";
import { esc } from "../utils";
import { DOCK_ENTRY_DEFINITION_BY_ID, DOCK_ENTRY_GROUPS } from "./definitions";
import type { DockEntryDefinition } from "./types";

export function renderDockEntryManager(dockEntries: FloatingButtonDockEntriesConfig): string {
  const hidden = new Set(dockEntries.hidden);
  let html = '<div class="dock-entry-manager">';

  for (const group of DOCK_ENTRY_GROUPS) {
    const entries = dockEntries.order
      .map((id) => DOCK_ENTRY_DEFINITION_BY_ID.get(id))
      .filter((entry): entry is DockEntryDefinition => entry?.group === group.id);
    if (entries.length === 0) continue;

    const hideable = entries.filter((entry) => !entry.locked);
    const visibleCount = entries.filter((entry) => entry.locked || !hidden.has(entry.id)).length;
    const hideableVisibleCount = hideable.filter((entry) => !hidden.has(entry.id)).length;
    const groupAllVisible = hideable.length === 0 || hideableVisibleCount === hideable.length;
    const groupPartial = hideableVisibleCount > 0 && hideableVisibleCount < hideable.length;

    html += `<div class="dock-entry-group" data-dock-group="${group.id}">`;
    html += '<div class="dock-entry-group-header">';
    html += `<span class="dock-entry-group-title">${esc(group.label)}</span>`;
    html += `<span class="dock-entry-group-count">(${visibleCount})</span>`;
    html += `<button class="dock-entry-group-toggle${groupPartial ? " is-partial" : ""}" type="button" data-dock-group-toggle="${group.id}"${
      hideable.length === 0 ? " disabled" : ""
    } aria-pressed="${groupAllVisible ? "true" : "false"}">${groupAllVisible ? "\u2713" : groupPartial ? "\u2013" : ""}</button>`;
    html += "</div>";
    html += '<div class="settings-list dock-entry-list">';

    for (let index = 0; index < entries.length; index++) {
      const entry = entries[index];
      const visible = entry.locked || !hidden.has(entry.id);
      const disableUp = index === 0;
      const disableDown = index === entries.length - 1;

      html += `<div class="setting-row dock-entry-row" data-dock-entry-row="${entry.id}" data-dock-group="${group.id}">`;
      html += `<span class="setting-row-icon dock-entry-icon">${entry.icon}</span>`;
      html += `<span class="setting-row-copy dock-entry-label"><span class="setting-row-title dock-entry-label-text">${esc(entry.label)}</span>${
        entry.badge ? `<span class="dock-entry-badge">${esc(entry.badge)}</span>` : ""
      }</span>`;
      html += '<span class="setting-row-control dock-entry-controls">';
      html += `<span class="dock-entry-drag" draggable="true" data-dock-entry-drag="${entry.id}" aria-label="Drag ${esc(entry.label)}" title="Drag to reorder">::</span>`;
      html += `<button class="dock-entry-check${visible ? "" : " is-hidden"}" type="button" data-dock-entry-toggle="${entry.id}" aria-pressed="${visible ? "true" : "false"}"${
        entry.locked ? " disabled" : ""
      } aria-label="${visible ? "Hide" : "Show"} ${esc(entry.label)}">${visible ? "\u2713" : ""}</button>`;
      if (entry.locked) {
        html += '<span class="dock-entry-lock">Locked</span>';
      }
      html += `<button class="dock-entry-move" type="button" data-dock-entry-move="${entry.id}" data-direction="up"${
        disableUp ? " disabled" : ""
      } aria-label="Move ${esc(entry.label)} up">\u2191</button>`;
      html += `<button class="dock-entry-move" type="button" data-dock-entry-move="${entry.id}" data-direction="down"${
        disableDown ? " disabled" : ""
      } aria-label="Move ${esc(entry.label)} down">\u2193</button>`;
      html += "</span>";
      html += "</div>";
    }

    html += "</div>";
    html += "</div>";
  }

  html += "</div>";
  return html;
}
