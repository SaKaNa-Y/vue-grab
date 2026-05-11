export function generateSelector(el: Element): string {
  if (el.id) return `#${CSS.escape(el.id)}`;

  const parts: string[] = [];
  let current: Element | null = el;

  while (current && current !== document.body && current !== document.documentElement) {
    let segment = current.tagName.toLowerCase();

    if (current.id) {
      parts.unshift(`#${CSS.escape(current.id)}`);
      break;
    }

    if (current.className && typeof current.className === "string") {
      const classes = current.className.trim().split(/\s+/).filter(Boolean);
      if (classes.length > 0) {
        segment += `.${classes
          .slice(0, 2)
          .map((c) => CSS.escape(c))
          .join(".")}`;
      }
    }

    parts.unshift(segment);
    current = current.parentElement;
  }

  return parts.join(" > ");
}
