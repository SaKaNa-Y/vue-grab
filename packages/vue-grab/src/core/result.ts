import type { GrabConfig, GrabResult } from "@sakana-y/vue-grab-shared";

import { extractA11yInfo } from "../utils";
import { generateSelector } from "./selector";
import { getComponentStack } from "./vue-component";

export function createGrabResult(el: Element, config: GrabConfig): GrabResult {
  let html = el.outerHTML;
  if (config.maxHtmlLength > 0 && html.length > config.maxHtmlLength) {
    html = html.slice(0, config.maxHtmlLength) + "<!-- truncated -->";
  }

  return {
    element: el,
    html,
    componentStack: getComponentStack(el),
    selector: generateSelector(el),
    a11y: extractA11yInfo(el),
  };
}
