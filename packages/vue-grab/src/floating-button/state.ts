import type { FloatingButtonConfig, GrabResult } from "@sakana-y/vue-grab-shared";
import { DEFAULT_MAGNIFIER } from "@sakana-y/vue-grab-shared";
import type { PanelId, TabId } from "./types";
import { tryReadBoolean, tryReadEditor } from "./storage";

export interface FloatingButtonStateOptions {
  magnifierConfig?: {
    loupeSize: number;
    zoomLevel: number;
  };
}

export interface FloatingButtonRuntimeState {
  activePanel: PanelId | null;
  settingsTab: TabId;
  isGrabActive: boolean;
  isRenderScanActive: boolean;
  isMagnifierActive: boolean;
  isMeasurerActive: boolean;
  closeOnOutsideClick: boolean;
  editorChoice: string;
  lastGrabResult: GrabResult | null;
  magnifierLoupeSize: number;
  magnifierZoomLevel: number;
}

export function createFloatingButtonState(
  config: FloatingButtonConfig,
  options: FloatingButtonStateOptions = {},
): FloatingButtonRuntimeState {
  const magnifierConfig = options.magnifierConfig ?? DEFAULT_MAGNIFIER;
  return {
    activePanel: null,
    settingsTab: "dock",
    isGrabActive: false,
    isRenderScanActive: false,
    isMagnifierActive: false,
    isMeasurerActive: false,
    closeOnOutsideClick:
      tryReadBoolean(config.closeOnOutsideClickStorageKey) ?? config.closeOnOutsideClick,
    editorChoice: tryReadEditor(config.editorStorageKey) ?? "",
    lastGrabResult: null,
    magnifierLoupeSize: magnifierConfig.loupeSize,
    magnifierZoomLevel: magnifierConfig.zoomLevel,
  };
}
