import type {
  A11yInfo,
  ComponentInfo,
  GrabResult,
  MatchedCSSRule,
  StyleUpdateRequest,
} from "@sakana-y/vue-grab-shared";
import { esc, escAttr } from "./html";

export const OPEN_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;

export interface RuleGroup {
  sourceFile: string | null;
  rules: MatchedCSSRule[];
}

export function groupRulesBySource(rules: MatchedCSSRule[]): RuleGroup[] {
  const map = new Map<string, RuleGroup>();
  for (const rule of rules) {
    const key = rule.sourceFile ?? "__external__";
    let group = map.get(key);
    if (!group) {
      group = { sourceFile: rule.sourceFile, rules: [] };
      map.set(key, group);
    }
    group.rules.push(rule);
  }
  return Array.from(map.values());
}

export function renderRule(rule: MatchedCSSRule): string {
  let html = `<div class="dt-rule">`;
  html += `<div class="dt-rule-selector">${esc(rule.selectorText)} {</div>`;
  for (const prop of rule.properties) {
    const readonly = !rule.editable;
    html += `<div class="dt-prop-row">`;
    html += `<span class="dt-prop-name">${esc(prop.property)}</span>`;
    html += `<span class="dt-prop-colon">:</span>`;
    html += `<span class="dt-prop-value">`;
    html += `<input class="dt-prop-input" value="${escAttr(prop.value)}"${readonly ? " readonly" : ""}`;
    if (!readonly && rule.sourceFile) {
      html += ` data-file="${escAttr(rule.sourceFile)}"`;
      html += ` data-selector="${escAttr(rule.originalSelectorText)}"`;
      html += ` data-property="${escAttr(prop.property)}"`;
      html += ` data-style-index="${rule.styleIndex}"`;
    }
    html += ` />`;
    html += `</span>`;
    if (prop.priority) {
      html += `<span class="dt-prop-priority">!${esc(prop.priority)}</span>`;
    }
    html += `<span class="dt-prop-semi">;</span>`;
    html += `</div>`;
  }
  html += `<div style="color:#555;padding-left:0;">}</div>`;
  html += `</div>`;
  return html;
}

export function renderComponentStack(stack: ComponentInfo[]): string {
  if (stack.length > 0) {
    return [...stack]
      .toReversed()
      .map((c) => `<span class="dt-stack-item">${esc(c.name)}</span>`)
      .join('<span class="dt-stack-sep"> &gt; </span>');
  }
  return '<span style="color:#555">No Vue components</span>';
}

export function renderA11ySection(a11y: A11yInfo): string {
  let html = '<div class="dt-section">';
  html += '<div class="dt-section-title">Accessibility</div>';

  if (a11y.attributes.length === 0 && a11y.audit.length === 0) {
    html += '<div class="dt-a11y-none">No accessibility attributes detected</div>';
    return html + "</div>";
  }

  if (a11y.attributes.length > 0) {
    html += '<div class="dt-a11y-attrs">';
    for (const attr of a11y.attributes) {
      html += '<div class="dt-a11y-attr">';
      html += `<span class="dt-a11y-attr-name">${esc(attr.name)}</span>`;
      html += '<span class="dt-a11y-attr-eq">=</span>';
      html += `<span class="dt-a11y-attr-value">"${esc(attr.value)}"</span>`;
      html += "</div>";
    }
    html += "</div>";
  }

  if (a11y.audit.length > 0) {
    html += '<div class="dt-a11y-audit">';
    for (const item of a11y.audit) {
      const icon = item.severity === "warning" ? "\u26A0" : "\u2139";
      const cls = item.severity === "warning" ? "dt-a11y-warning" : "dt-a11y-info";
      html += `<div class="${cls}">${icon} ${esc(item.message)}</div>`;
    }
    html += "</div>";
  }

  html += "</div>";
  return html;
}

/**
 * Renders the shared inspector HTML for a grab result and its matched CSS rules.
 * Returns the inner HTML (four dt-section divs) without any wrapper element.
 */
export function renderInspectorHTML(result: GrabResult, rules: MatchedCSSRule[]): string {
  const comp = result.componentStack[0];
  const compName = comp
    ? `&lt;${esc(comp.name)}&gt;`
    : `&lt;${esc(result.element.tagName.toLowerCase())}&gt;`;
  const filePath = comp?.filePath ?? "";

  const stackHtml = renderComponentStack(result.componentStack);

  const grouped = groupRulesBySource(rules);

  let rulesHtml = "";
  if (grouped.length === 0) {
    rulesHtml = '<div class="dt-empty">No matched CSS rules</div>';
  } else {
    for (const group of grouped) {
      const sourceLabel = group.sourceFile
        ? `${esc(group.sourceFile)} &lt;style&gt;`
        : "External / inline";
      rulesHtml += `<div class="dt-rule-group">`;
      rulesHtml += `<div class="dt-rule-source"><span class="dt-rule-source-file">${sourceLabel}</span>`;
      if (group.sourceFile) {
        rulesHtml += `<button class="dt-open-btn" data-open-file="${escAttr(group.sourceFile)}">${OPEN_SVG}</button>`;
      }
      rulesHtml += `</div>`;
      for (const rule of group.rules) {
        rulesHtml += renderRule(rule);
      }
      rulesHtml += `</div>`;
    }
  }

  return `
    <div class="dt-section">
      <div class="dt-component-name">${compName}</div>
      ${
        filePath
          ? `<div class="dt-file-row">
              <span class="dt-file-path">${esc(filePath)}</span>
              <button class="dt-open-btn" data-open-file="${escAttr(filePath)}"${comp?.line ? ` data-line="${comp.line}"` : ""}>
                ${OPEN_SVG} Open
              </button>
            </div>`
          : ""
      }
      <div class="dt-selector">${esc(result.selector)}</div>
    </div>

    <div class="dt-section">
      <div class="dt-section-title">Component Stack</div>
      <div class="dt-stack">${stackHtml}</div>
    </div>

    ${renderA11ySection(result.a11y)}

    <div class="dt-section">
      <div class="dt-section-title">CSS Rules</div>
      ${rulesHtml}
    </div>
  `;
}

export interface InspectorEventCallbacks {
  onOpenFile: (filePath: string, line?: number) => void;
  onStyleChange?: (update: StyleUpdateRequest) => void;
}

/**
 * Wires click handlers for [data-open-file] buttons and blur/keydown handlers
 * for editable CSS property inputs inside the given container.
 */
export function wireInspectorEvents(container: Element, callbacks: InspectorEventCallbacks): void {
  for (const btn of Array.from(container.querySelectorAll("[data-open-file]"))) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const file = (btn as HTMLElement).dataset.openFile!;
      const line = (btn as HTMLElement).dataset.line;
      callbacks.onOpenFile(file, line ? Number(line) : undefined);
    });
  }

  if (!callbacks.onStyleChange) return;
  const onStyleChange = callbacks.onStyleChange;

  for (const input of Array.from(
    container.querySelectorAll<HTMLInputElement>("input.dt-prop-input:not([readonly])"),
  )) {
    const original = input.value;
    const handler = () => {
      const newValue = input.value.trim();
      if (newValue === original || newValue === "") return;
      const file = input.dataset.file!;
      const selector = input.dataset.selector!;
      const property = input.dataset.property!;
      const styleIndex = Number(input.dataset.styleIndex ?? "0");
      onStyleChange({ file, selector, property, value: newValue, styleIndex });
    };
    input.addEventListener("blur", handler);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        (e.target as HTMLInputElement).blur();
      }
    });
  }
}
