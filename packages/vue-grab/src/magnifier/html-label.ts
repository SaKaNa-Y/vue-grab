export function buildCompactTag(el: Element, maxLen: number): string {
  const tag = el.tagName.toLowerCase();

  let attrs = "";
  if (el.id) attrs += ` id="${el.id}"`;
  if (el.className && typeof el.className === "string") {
    const cls = el.className.trim();
    if (cls) attrs += ` class="${cls}"`;
  }

  const fullText = el.textContent?.trim() ?? "";
  const text = fullText.slice(0, 40);
  const inner = text ? text + (fullText.length > 40 ? "..." : "") : "";

  let result = `<${tag}${attrs}>${inner}</${tag}>`;
  if (result.length > maxLen) {
    result = result.slice(0, maxLen) + "...";
  }
  return result;
}
