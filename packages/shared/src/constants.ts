export const DEFAULT_HIGHLIGHT_COLOR = '#4f46e5'
export const DEFAULT_LABEL_TEXT_COLOR = '#ffffff'

export const DEFAULT_CONFIG: GrabConfig = {
  highlightColor: DEFAULT_HIGHLIGHT_COLOR,
  labelTextColor: DEFAULT_LABEL_TEXT_COLOR,
  showTagHint: true,
  filter: {
    ignoreSelectors: [],
    ignoreTags: [],
    skipCommonComponents: false,
  },
}

import type { GrabConfig } from './types'
