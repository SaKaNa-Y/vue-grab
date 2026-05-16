import type { GrabConfig } from "@sakana-y/vue-grab-shared";

import { FAB_HOST_ID } from "../floating-button";
import { MAGNIFIER_HOST_ID } from "../magnifier";
import { MEASURER_HOST_ID } from "../measurer";
import { OVERLAY_HOST_ID } from "../overlay";
import { getComponentName } from "../utils";
import { getVueComponent } from "./vue-component";

const COMMON_LAYOUT_NAMES = new Set([
  "header",
  "nav",
  "footer",
  "aside",
  "main",
  "layout",
  "sidebar",
]);

export function shouldIgnoreElement(el: Element, config: GrabConfig): boolean {
  if (
    el.closest(`#${OVERLAY_HOST_ID}, #${FAB_HOST_ID}, #${MAGNIFIER_HOST_ID}, #${MEASURER_HOST_ID}`)
  )
    return true;

  const tag = el.tagName.toLowerCase();
  if (config.filter.ignoreTags.includes(tag)) return true;

  for (const selector of config.filter.ignoreSelectors) {
    try {
      if (el.matches(selector)) return true;
    } catch {
      // Invalid selectors are ignored so one bad override does not break grabbing.
    }
  }

  if (config.filter.skipCommonComponents) {
    const comp = getVueComponent(el);
    if (comp && COMMON_LAYOUT_NAMES.has(getComponentName(comp).toLowerCase())) return true;
  }

  return false;
}
