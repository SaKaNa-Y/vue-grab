import type {
  A11yAttribute,
  A11yAuditItem,
  A11yInfo,
  ComponentA11ySummary,
  ElementA11yDetail,
} from "@sakana-y/vue-grab-shared";

const A11Y_ATTRIBUTES = [
  "role",
  "aria-label",
  "aria-labelledby",
  "aria-describedby",
  "aria-hidden",
  "tabindex",
];

type AuditRule = (el: Element, attrs: A11yAttribute[]) => A11yAuditItem[];

function has(attrs: A11yAttribute[], name: string): boolean {
  return attrs.some((a) => a.name === name);
}

const AUDIT_RULES: AuditRule[] = [
  // img without alt
  (el, attrs) => {
    if (el.tagName.toLowerCase() === "img" && !has(attrs, "alt")) {
      return [{ severity: "warning", message: "<img> is missing alt attribute" }];
    }
    return [];
  },

  // button/a without accessible name
  (el, attrs) => {
    const tag = el.tagName.toLowerCase();
    if (
      (tag === "button" || tag === "a") &&
      !has(attrs, "aria-label") &&
      !has(attrs, "aria-labelledby") &&
      !el.textContent?.trim()
    ) {
      return [
        {
          severity: "warning",
          message: `<${tag}> has no accessible name (no text, aria-label, or aria-labelledby)`,
        },
      ];
    }
    return [];
  },

  // input/textarea/select without label
  (el, attrs) => {
    const tag = el.tagName.toLowerCase();
    if (
      (tag === "input" || tag === "textarea" || tag === "select") &&
      !has(attrs, "aria-label") &&
      !has(attrs, "aria-labelledby")
    ) {
      const id = el.getAttribute("id");
      const hasAssociatedLabel =
        id && el.ownerDocument.querySelector(`label[for="${CSS.escape(id)}"]`);
      if (!hasAssociatedLabel) {
        return [{ severity: "warning", message: `<${tag}> has no associated label or aria-label` }];
      }
    }
    return [];
  },

  // Custom element with interactive role but no tabindex
  (el, attrs) => {
    if (has(attrs, "role")) {
      const role = attrs.find((a) => a.name === "role")!.value;
      if (["button", "link", "tab", "menuitem"].includes(role) && !has(attrs, "tabindex")) {
        const tag = el.tagName.toLowerCase();
        if (!["button", "a", "input", "select", "textarea"].includes(tag)) {
          return [
            {
              severity: "info",
              message: `Element with role="${role}" may need tabindex for keyboard access`,
            },
          ];
        }
      }
    }
    return [];
  },

  // aria-hidden="true" on focusable element
  (el, attrs) => {
    const ariaHidden = attrs.find((a) => a.name === "aria-hidden");
    if (ariaHidden?.value === "true") {
      const tag = el.tagName.toLowerCase();
      if (["button", "a", "input", "select", "textarea"].includes(tag) || has(attrs, "tabindex")) {
        return [
          {
            severity: "warning",
            message: 'aria-hidden="true" on a focusable element hides it from assistive technology',
          },
        ];
      }
    }
    return [];
  },
];

function runA11yAudit(el: Element, attrs: A11yAttribute[]): A11yAuditItem[] {
  const results: A11yAuditItem[] = [];
  for (const rule of AUDIT_RULES) {
    results.push(...rule(el, attrs));
  }
  return results;
}

/** Lightweight check for mousemove (no allocations when false). */
export function hasA11yAttributes(el: Element): boolean {
  for (const attr of A11Y_ATTRIBUTES) {
    if (el.hasAttribute(attr)) return true;
  }
  if (el.tagName.toLowerCase() === "img" && el.hasAttribute("alt")) return true;
  return false;
}

/** Full extraction with audit (called on click/grab). */
export function extractA11yInfo(el: Element): A11yInfo {
  const attributes: A11yAttribute[] = [];

  for (const attr of A11Y_ATTRIBUTES) {
    if (el.hasAttribute(attr)) {
      attributes.push({ name: attr, value: el.getAttribute(attr)! });
    }
  }

  if (el.tagName.toLowerCase() === "img" && el.hasAttribute("alt")) {
    attributes.push({ name: "alt", value: el.getAttribute("alt")! });
  }

  const audit = runA11yAudit(el, attributes);

  return {
    attributes,
    audit,
    hasA11y: attributes.length > 0,
  };
}

/** Tags that are always collected as notable for a11y — interactive and media elements. */
const NOTABLE_TAGS = new Set([
  "button",
  "a",
  "input",
  "select",
  "textarea",
  "img",
  "video",
  "audio",
]);

/** Build a brief selector string for an element (e.g. "img.hero", "button#submit"). */
function briefSelector(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const id = el.getAttribute("id");
  if (id) return `${tag}#${CSS.escape(id)}`;
  const cls =
    el.className && typeof el.className === "string"
      ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".")
      : "";
  return tag + cls;
}

/** Scan all Vue components on the page and return a11y info for each. */
export function scanPageA11y(): ComponentA11ySummary[] {
  const results: ComponentA11ySummary[] = [];
  const seen = new Set<any>();

  for (const el of document.querySelectorAll("*")) {
    const instance = (el as any).__vueParentComponent;
    if (!instance || seen.has(instance)) continue;
    seen.add(instance);

    const name = instance.type?.name || instance.type?.__name;
    if (!name) continue;

    const rootEl = instance.subTree?.el;
    if (!rootEl || !(rootEl instanceof Element)) continue;

    const rootA11y = extractA11yInfo(rootEl);

    // Walk descendants to find notable child elements
    const childElements: ElementA11yDetail[] = [];
    // Aggregate root + descendant audits so the component is flagged if any child has issues
    const aggregatedAudit = [...rootA11y.audit];
    let anyHasA11y = rootA11y.hasA11y;

    for (const child of rootEl.querySelectorAll("*")) {
      const childInstance = (child as any).__vueParentComponent;
      if (childInstance && childInstance !== instance) continue;

      const tag = child.tagName.toLowerCase();
      const childA11y = extractA11yInfo(child);
      if (childA11y.hasA11y) anyHasA11y = true;
      if (childA11y.audit.length > 0) aggregatedAudit.push(...childA11y.audit);

      // Collect interactive/media elements, elements with a11y attrs, or elements with issues
      if (childA11y.audit.length > 0 || NOTABLE_TAGS.has(tag) || childA11y.hasA11y) {
        childElements.push({
          element: child,
          tagName: tag,
          selector: briefSelector(child),
          a11y: childA11y,
        });
      }
    }

    results.push({
      componentName: name,
      filePath: instance.type?.__file,
      element: rootEl,
      a11y: {
        attributes: rootA11y.attributes,
        audit: aggregatedAudit,
        hasA11y: anyHasA11y,
      },
      childElements,
    });
  }
  return results;
}

/** Small accessibility icon SVG for overlay label and toolbar. */
export const A11Y_ICON_SVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4.5" r="2.5"/><path d="M12 7v5"/><path d="M5 9h14"/><path d="M8 21l4-9 4 9"/></svg>`;
