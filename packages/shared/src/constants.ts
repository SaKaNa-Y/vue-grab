import type {
  ConsoleCaptureConfig,
  FloatingButtonConfig,
  GrabConfig,
  GrabUserConfig,
  LogLevel,
  MagnifierConfig,
  MeasurerConfig,
  NetworkCaptureConfig,
  NetworkStatusClass,
} from "./types";
import { OPEN_IN_EDITOR_ENDPOINT } from "./protocol";

export const DEFAULT_HIGHLIGHT_COLOR = "#4f46e5";
export const DEFAULT_LABEL_TEXT_COLOR = "#ffffff";
export const DEFAULT_HOTKEY = "Alt+Shift+G";

export const DEFAULT_FLOATING_BUTTON: FloatingButtonConfig = {
  enabled: false,
  initialPosition: "top-center",
  dockMode: "float",
  storageKey: "vue-grab-fab-pos",
  dockModeStorageKey: "vue-grab-dock-mode",
  hotkeyStorageKey: "vue-grab-hotkey",
  editorStorageKey: "vue-grab-editor",
  measurerHotkeyStorageKey: "vue-grab-measurer-hotkey",
  closeOnOutsideClick: true,
  closeOnOutsideClickStorageKey: "vue-grab-close-on-outside-click",
};

export const VUE_ERROR_EVENT = "vue-grab:vue-error";

export const ALL_LOG_LEVELS: readonly LogLevel[] = ["log", "info", "warn", "error", "debug"];

export const DEFAULT_CONSOLE_CAPTURE: ConsoleCaptureConfig = {
  enabled: true,
  maxEntries: 200,
  levels: [...ALL_LOG_LEVELS],
  captureUnhandled: true,
  captureVueErrors: true,
};

export const ALL_NETWORK_STATUS_CLASSES: readonly NetworkStatusClass[] = [
  "2xx",
  "3xx",
  "4xx",
  "5xx",
  "failed",
];

export const NETWORK_ERROR_CLASSES: ReadonlySet<NetworkStatusClass> = new Set(["5xx", "failed"]);
export const NETWORK_WARN_CLASSES: ReadonlySet<NetworkStatusClass> = new Set(["4xx"]);

export const DEFAULT_REDACT_HEADERS: readonly string[] = [
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
];

export const DEFAULT_URL_DENY_LIST: readonly string[] = [OPEN_IN_EDITOR_ENDPOINT];

export const DEFAULT_NETWORK_CAPTURE: NetworkCaptureConfig = {
  enabled: true,
  maxEntries: 100,
  captureFetch: true,
  captureXhr: true,
  captureBodies: false,
  bodyMaxBytes: 2048,
  redactHeaders: [...DEFAULT_REDACT_HEADERS],
  urlDenyList: [...DEFAULT_URL_DENY_LIST],
  grabSnapshot: {
    enabled: true,
    maxEntries: 20,
    windowMs: 10_000,
  },
};

export const DEFAULT_MAGNIFIER: MagnifierConfig = {
  enabled: true,
  loupeSize: 400,
  zoomLevel: 3,
  showHtmlOverlay: true,
  maxOverlayHtmlLength: 200,
};

export const DEFAULT_MEASURER: MeasurerConfig = {
  enabled: true,
  lineColor: "#06b6d4",
  guideColor: "#a855f7",
  lineWidth: 1,
  showAlignmentGuides: true,
  alignmentTolerance: 3,
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
  consoleCapture: DEFAULT_CONSOLE_CAPTURE,
  networkCapture: DEFAULT_NETWORK_CAPTURE,
  magnifier: DEFAULT_MAGNIFIER,
  measurer: DEFAULT_MEASURER,
};

/**
 * Deep-merge user config with defaults, properly handling nested objects.
 */
export function mergeConfig(defaults: GrabConfig, options: GrabUserConfig): GrabConfig {
  const { filter, floatingButton, consoleCapture, networkCapture, magnifier, measurer, ...rest } =
    options;
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
    consoleCapture: {
      ...defaults.consoleCapture,
      ...consoleCapture,
      levels: [...(consoleCapture?.levels ?? defaults.consoleCapture.levels)],
    },
    networkCapture: {
      ...defaults.networkCapture,
      ...networkCapture,
      redactHeaders: [...(networkCapture?.redactHeaders ?? defaults.networkCapture.redactHeaders)],
      urlDenyList: [...(networkCapture?.urlDenyList ?? defaults.networkCapture.urlDenyList)],
      grabSnapshot: {
        ...defaults.networkCapture.grabSnapshot,
        ...networkCapture?.grabSnapshot,
      },
    },
    magnifier: {
      ...defaults.magnifier,
      ...magnifier,
    },
    measurer: {
      ...defaults.measurer,
      ...measurer,
    },
  };
}
