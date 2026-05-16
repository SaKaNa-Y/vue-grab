import type {
  FloatingButtonDockEntryId,
  FloatingButtonShortcutCommandId,
} from "@sakana-y/vue-grab-shared";

export type DockEdge = "top" | "bottom" | "left" | "right";
export type ToolbarAnchorRect = Pick<
  DOMRect,
  "left" | "top" | "right" | "bottom" | "width" | "height"
>;

export type TabId = "dock" | "shortcuts" | "tools";
export type PanelId = "settings" | "render-scan" | "accessibility" | "logs" | "network";
export type DockEntryGroupId = "capture" | "inspection" | "diagnostics" | "system";
export type DockEntryDropPlacement = "before" | "after";

export interface DockEntryDefinition {
  id: FloatingButtonDockEntryId;
  label: string;
  title: string;
  group: DockEntryGroupId;
  buttonClass: string;
  icon: string;
  badge?: string;
  locked?: boolean;
}

export interface DockEntryGroupDefinition {
  id: DockEntryGroupId;
  label: string;
}

export interface ShortcutCommandDefinition {
  id: FloatingButtonShortcutCommandId;
  label: string;
  description: string;
  icon: string;
  legacyKbdClass?: string;
  legacyRecordClass?: string;
}

export interface FloatingButtonState {
  activePanel: PanelId | null;
  settingsTab: TabId;
  isGrabActive: boolean;
  isRenderScanActive: boolean;
  isMagnifierActive: boolean;
  isMeasurerActive: boolean;
}
