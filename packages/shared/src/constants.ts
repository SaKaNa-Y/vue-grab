import type {
  DevToolsPanelConfig,
  ErrorCaptureConfig,
  FloatingButtonConfig,
  GrabConfig,
  MagnifierConfig,
} from "./types";

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

export const VUE_ERROR_EVENT = "vue-grab:vue-error";

export const DEFAULT_ERROR_CAPTURE: ErrorCaptureConfig = {
  enabled: true,
  maxErrors: 50,
  captureConsoleError: true,
  captureUnhandled: true,
  captureVueErrors: true,
};

export const DEFAULT_MAGNIFIER: MagnifierConfig = {
  enabled: true,
  loupeSize: 400,
  zoomLevel: 3,
  showHtmlOverlay: true,
  maxOverlayHtmlLength: 200,
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
  errorCapture: DEFAULT_ERROR_CAPTURE,
  magnifier: DEFAULT_MAGNIFIER,
};

/**
 * Deep-merge user config with defaults, properly handling nested objects.
 */
export function mergeConfig(defaults: GrabConfig, options: Partial<GrabConfig>): GrabConfig {
  const { filter, floatingButton, devtoolsPanel, errorCapture, magnifier, ...rest } = options;
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
    errorCapture: {
      ...defaults.errorCapture,
      ...errorCapture,
    },
    magnifier: {
      ...defaults.magnifier,
      ...magnifier,
    },
  };
}
