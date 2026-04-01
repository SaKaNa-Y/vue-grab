import { OVERLAY_HOST_ID } from "../../src/overlay";

const TARGET_ATTR = "data-testid";
const TARGET_VALUE = "grab-target";

/**
 * Create an absolutely-positioned DOM element with known dimensions.
 * Appends to document.body and marks it for cleanup.
 */
export function createTargetElement(
  tag = "div",
  attrs: Record<string, string> = {},
  style: Partial<CSSStyleDeclaration> = {},
): HTMLElement {
  const el = document.createElement(tag);
  el.setAttribute(TARGET_ATTR, TARGET_VALUE);

  // Default: visible box at a known position
  Object.assign(el.style, {
    position: "absolute",
    top: "100px",
    left: "100px",
    width: "200px",
    height: "80px",
    ...style,
  });

  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }

  document.body.appendChild(el);
  return el;
}

/**
 * Remove overlay host and all test target elements.
 */
export function cleanupDOM(): void {
  document.getElementById(OVERLAY_HOST_ID)?.remove();
  document
    .querySelectorAll(`[${TARGET_ATTR}="${TARGET_VALUE}"]`)
    .forEach((el) => el.remove());
  // Restore cursor
  document.body.style.cursor = "";
}

/**
 * Dispatch a MouseEvent at the center of the given element.
 */
export function fireMouseEvent(type: string, el: Element): MouseEvent {
  const rect = el.getBoundingClientRect();
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
    view: window,
  });
  el.dispatchEvent(event);
  return event;
}

/**
 * Dispatch a click MouseEvent on document at the center of the given element.
 * Useful for GrabEngine tests where capture-phase listeners are on document.
 */
export function fireClickAtCenter(el: Element): MouseEvent {
  const rect = el.getBoundingClientRect();
  const event = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
    view: window,
  });
  document.dispatchEvent(event);
  return event;
}

/**
 * Dispatch a KeyboardEvent on document.
 */
export function fireKey(
  key: string,
  modifiers: {
    altKey?: boolean;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    metaKey?: boolean;
  } = {},
): KeyboardEvent {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    altKey: modifiers.altKey ?? false,
    ctrlKey: modifiers.ctrlKey ?? false,
    shiftKey: modifiers.shiftKey ?? false,
    metaKey: modifiers.metaKey ?? false,
  });
  document.dispatchEvent(event);
  return event;
}
