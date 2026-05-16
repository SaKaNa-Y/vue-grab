import type {
  FloatingButtonConfig,
  FloatingButtonDockEntriesConfig,
  FloatingButtonDockEntryId,
} from "@sakana-y/vue-grab-shared";

import type { DockEntryDropPlacement, DockEntryGroupId } from "./types";

import { DOCK_ENTRY_DEFINITION_BY_ID, isDockEntryId } from "./definitions";
import { renderDockEntryManager } from "./render-dock";
import {
  DEFAULT_DOCK_ENTRIES_STORAGE_KEY,
  normalizeDockEntries,
  tryReadDockEntries,
  trySaveDockEntries,
} from "./storage";

export class FloatingButtonDockEntriesController {
  private entries: FloatingButtonDockEntriesConfig;
  private storageKey: string;
  private dragId: FloatingButtonDockEntryId | null = null;
  private dropTargetEl: HTMLElement | null = null;

  constructor(
    config: FloatingButtonConfig,
    private readonly onChange: () => void,
  ) {
    this.storageKey = config.dockEntriesStorageKey ?? DEFAULT_DOCK_ENTRIES_STORAGE_KEY;
    this.entries = tryReadDockEntries(this.storageKey) ?? normalizeDockEntries(config.dockEntries);
  }

  get value(): FloatingButtonDockEntriesConfig {
    return this.entries;
  }

  render(): string {
    return renderDockEntryManager(this.entries);
  }

  wire(root: HTMLElement): void {
    for (const btn of root.querySelectorAll<HTMLElement>("[data-dock-entry-toggle]")) {
      btn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const id = btn.dataset.dockEntryToggle;
        if (!isDockEntryId(id) || id === "settings") return;
        this.toggleVisibility(id);
      });
    }

    for (const btn of root.querySelectorAll<HTMLElement>("[data-dock-group-toggle]")) {
      btn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const groupId = btn.dataset.dockGroupToggle as DockEntryGroupId | undefined;
        if (!groupId) return;
        this.toggleGroupVisibility(groupId);
      });
    }

    for (const btn of root.querySelectorAll<HTMLElement>("[data-dock-entry-move]")) {
      btn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const id = btn.dataset.dockEntryMove;
        const direction = btn.dataset.direction;
        if (!isDockEntryId(id) || (direction !== "up" && direction !== "down")) return;
        this.moveWithinGroup(id, direction);
      });
    }

    for (const handle of root.querySelectorAll<HTMLElement>("[data-dock-entry-drag]")) {
      handle.addEventListener("dragstart", (e: DragEvent) => {
        e.stopPropagation();
        const id = handle.dataset.dockEntryDrag;
        if (!isDockEntryId(id)) return;
        this.dragId = id;
        e.dataTransfer?.setData("text/plain", id);
        if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
        handle.closest<HTMLElement>("[data-dock-entry-row]")?.classList.add("is-dragging");
      });

      handle.addEventListener("dragend", (e: DragEvent) => {
        e.stopPropagation();
        this.dragId = null;
        this.clearDragState(root);
      });
    }

    for (const row of root.querySelectorAll<HTMLElement>("[data-dock-entry-row]")) {
      row.addEventListener("dragover", (e: DragEvent) => {
        const dragId = this.dragId;
        const targetId = row.dataset.dockEntryRow;
        if (!isDockEntryId(dragId) || !isDockEntryId(targetId)) return;
        if (!this.canDropOn(dragId, targetId)) {
          this.clearDropTargets();
          return;
        }

        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
        this.setDropTarget(row, this.getDropPlacement(row, e));
      });

      row.addEventListener("dragleave", (e: DragEvent) => {
        const relatedTarget = e.relatedTarget;
        if (relatedTarget instanceof Node && row.contains(relatedTarget)) return;
        row.classList.remove("is-drop-before", "is-drop-after");
      });

      row.addEventListener("drop", (e: DragEvent) => {
        const dragId = this.dragId;
        const targetId = row.dataset.dockEntryRow;
        if (!isDockEntryId(dragId) || !isDockEntryId(targetId)) return;
        if (!this.canDropOn(dragId, targetId)) {
          this.clearDragState(root);
          this.dragId = null;
          return;
        }

        e.preventDefault();
        e.stopPropagation();
        const placement = this.getDropPlacement(row, e);
        this.clearDragState(root);
        this.dragId = null;
        this.reorderWithinGroup(dragId, targetId, placement);
      });
    }
  }

  private persist(): void {
    trySaveDockEntries(this.storageKey, this.entries);
  }

  private commit(patch: Partial<FloatingButtonDockEntriesConfig>): void {
    this.entries = normalizeDockEntries({ ...this.entries, ...patch });
    this.persist();
    this.onChange();
  }

  private toggleVisibility(id: FloatingButtonDockEntryId): void {
    if (id === "settings") return;
    const hidden = new Set(this.entries.hidden);
    if (hidden.has(id)) hidden.delete(id);
    else hidden.add(id);
    hidden.delete("settings");
    this.commit({ hidden: [...hidden] });
  }

  private toggleGroupVisibility(groupId: DockEntryGroupId): void {
    const groupEntries = this.entries.order.filter((id) => {
      const def = DOCK_ENTRY_DEFINITION_BY_ID.get(id);
      return def?.group === groupId && !def.locked;
    });
    if (groupEntries.length === 0) return;
    const hidden = new Set(this.entries.hidden);
    const allVisible = groupEntries.every((id) => !hidden.has(id));
    for (const id of groupEntries) {
      if (allVisible) hidden.add(id);
      else hidden.delete(id);
    }
    hidden.delete("settings");
    this.commit({ hidden: [...hidden] });
  }

  private moveWithinGroup(id: FloatingButtonDockEntryId, direction: "up" | "down"): void {
    const def = DOCK_ENTRY_DEFINITION_BY_ID.get(id);
    if (!def) return;

    const groupIds = this.entries.order.filter(
      (entryId) => DOCK_ENTRY_DEFINITION_BY_ID.get(entryId)?.group === def.group,
    );
    const groupIndex = groupIds.indexOf(id);
    const swapGroupIndex = direction === "up" ? groupIndex - 1 : groupIndex + 1;
    const swapId = groupIds[swapGroupIndex];
    if (!swapId) return;

    const order = [...this.entries.order];
    const index = order.indexOf(id);
    const swapIndex = order.indexOf(swapId);
    if (index < 0 || swapIndex < 0) return;
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];

    this.commit({ order });
  }

  private reorderWithinGroup(
    dragId: FloatingButtonDockEntryId,
    targetId: FloatingButtonDockEntryId,
    placement: DockEntryDropPlacement,
  ): void {
    if (!this.canDropOn(dragId, targetId)) return;

    const orderWithoutDrag = this.entries.order.filter((id) => id !== dragId);
    const targetIndex = orderWithoutDrag.indexOf(targetId);
    if (targetIndex < 0) return;

    const insertIndex = placement === "before" ? targetIndex : targetIndex + 1;
    const order = [...orderWithoutDrag];
    order.splice(insertIndex, 0, dragId);

    this.commit({ order });
  }

  private canDropOn(
    dragId: FloatingButtonDockEntryId,
    targetId: FloatingButtonDockEntryId,
  ): boolean {
    if (dragId === targetId) return false;
    const dragDef = DOCK_ENTRY_DEFINITION_BY_ID.get(dragId);
    const targetDef = DOCK_ENTRY_DEFINITION_BY_ID.get(targetId);
    return Boolean(dragDef && targetDef && dragDef.group === targetDef.group);
  }

  private getDropPlacement(row: HTMLElement, e: DragEvent): DockEntryDropPlacement {
    const rect = row.getBoundingClientRect();
    return e.clientY < rect.top + rect.height / 2 ? "before" : "after";
  }

  private setDropTarget(row: HTMLElement, placement: DockEntryDropPlacement): void {
    if (this.dropTargetEl && this.dropTargetEl !== row) {
      this.dropTargetEl.classList.remove("is-drop-before", "is-drop-after");
    }
    row.classList.add(placement === "before" ? "is-drop-before" : "is-drop-after");
    row.classList.remove(placement === "before" ? "is-drop-after" : "is-drop-before");
    this.dropTargetEl = row;
  }

  private clearDropTargets(): void {
    this.dropTargetEl?.classList.remove("is-drop-before", "is-drop-after");
    this.dropTargetEl = null;
  }

  private clearDragState(root: HTMLElement): void {
    for (const row of root.querySelectorAll<HTMLElement>("[data-dock-entry-row]")) {
      row.classList.remove("is-dragging", "is-drop-before", "is-drop-after");
    }
    this.dropTargetEl = null;
  }
}
