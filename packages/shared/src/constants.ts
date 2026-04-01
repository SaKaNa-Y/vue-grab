import type { GrabConfig } from "./types";

export const DEFAULT_HIGHLIGHT_COLOR = "#4f46e5";
export const DEFAULT_LABEL_TEXT_COLOR = "#ffffff";
export const DEFAULT_HOTKEY = "Alt+Shift+G";

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
};

/**
 * Deep-merge user config with defaults, properly handling nested `filter` object.
 */
export function mergeConfig(defaults: GrabConfig, options: Partial<GrabConfig>): GrabConfig {
  const { filter, ...rest } = options;
  return {
    ...defaults,
    ...rest,
    filter: {
      ...defaults.filter,
      ...filter,
    },
  };
}
