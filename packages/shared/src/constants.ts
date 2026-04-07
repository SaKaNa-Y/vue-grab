import type { DevToolsPanelConfig, FloatingButtonConfig, GrabConfig } from "./types";

export const DEFAULT_HIGHLIGHT_COLOR = "#4f46e5";
export const DEFAULT_LABEL_TEXT_COLOR = "#ffffff";
export const DEFAULT_HOTKEY = "Alt+Shift+G";

export const DEFAULT_FLOATING_BUTTON: FloatingButtonConfig = {
  enabled: false,
  initialPosition: "top-center",
  storageKey: "vue-grab-fab-pos",
  hotkeyStorageKey: "vue-grab-hotkey",
  editorStorageKey: "vue-grab-editor",
};

export const DEFAULT_DEVTOOLS_PANEL: DevToolsPanelConfig = {
  enabled: true,
  initialMode: "float",
  edgeSide: "bottom",
  panelModeStorageKey: "vue-grab-devtools-mode",
  panelGeometryStorageKey: "vue-grab-devtools-geometry",
};

export const DEFAULT_CONFIG: GrabConfig = {
  highlightColor: DEFAULT_HIGHLIGHT_COLOR,
  labelTextColor: DEFAULT_LABEL_TEXT_COLOR,
  showTagHint: true,
  maxHtmlLength: 10_000,
  filter: {
    ignoreSelectors: [],
    ignoreTags: [],
    skipCommonComponents: false,
  },
  floatingButton: DEFAULT_FLOATING_BUTTON,
  devtoolsPanel: DEFAULT_DEVTOOLS_PANEL,
};

/**
 * Deep-merge user config with defaults, properly handling nested objects.
 */
export function mergeConfig(defaults: GrabConfig, options: Partial<GrabConfig>): GrabConfig {
  const { filter, floatingButton, devtoolsPanel, ...rest } = options;
  return {
    ...defaults,
    ...rest,
    filter: {
      ...defaults.filter,
      ...filter,
    },
    floatingButton: {
      ...defaults.floatingButton,
      ...floatingButton,
    },
    devtoolsPanel: {
      ...defaults.devtoolsPanel,
      ...devtoolsPanel,
    },
  };
}
