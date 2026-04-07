import type { MatchedCSSRule, CSSPropertyEntry } from "@sakana-y/vue-grab-shared";

/**
 * Extracts all CSS rules that match the given element from document.styleSheets.
 * Uses the browser's native CSSOM API — works only in a live DOM context.
 */
export function matchCSSRules(element: Element): MatchedCSSRule[] {
  const results: MatchedCSSRule[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      // Cross-origin stylesheet — skip
      continue;
    }

    const ownerNode = sheet.ownerNode as HTMLElement | null;
    const viteDevId = ownerNode?.getAttribute("data-vite-dev-id") ?? null;

    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSStyleRule)) continue;

      let matches = false;
      try {
        matches = element.matches(rule.selectorText);
      } catch {
        continue;
      }
      if (!matches) continue;

      const sourceFile = extractSourceFile(viteDevId);
      const styleIndex = extractStyleIndex(viteDevId);
      const editable = viteDevId != null && viteDevId.includes("?vue&type=style");

      const properties: CSSPropertyEntry[] = [];
      const style = rule.style;
      for (let i = 0; i < style.length; i++) {
        const prop = style[i];
        properties.push({
          property: prop,
          value: style.getPropertyValue(prop),
          priority: style.getPropertyPriority(prop),
        });
      }

      const selectorText = stripScopedAttrs(rule.selectorText);

      results.push({
        selectorText,
        originalSelectorText: rule.selectorText,
        sourceFile,
        styleIndex,
        properties,
        editable,
      });
    }
  }

  return results;
}

/**
 * Strips Vue scoped data attributes from a selector string.
 * e.g. ".foo[data-v-abc123]" → ".foo"
 */
function stripScopedAttrs(selector: string): string {
  return selector.replace(/\[data-v-[a-f0-9]+\]/g, "").trim();
}

/**
 * Extracts the file path from a Vite dev ID.
 * e.g. "/src/App.vue?vue&type=style&index=0&scoped=true&lang.css" → "/src/App.vue"
 */
function extractSourceFile(viteDevId: string | null): string | null {
  if (!viteDevId) return null;
  const qIdx = viteDevId.indexOf("?");
  return qIdx >= 0 ? viteDevId.slice(0, qIdx) : viteDevId;
}

/**
 * Extracts the style block index from a Vite dev ID query string.
 */
function extractStyleIndex(viteDevId: string | null): number {
  if (!viteDevId) return 0;
  const match = viteDevId.match(/index=(\d+)/);
  return match ? Number(match[1]) : 0;
}
