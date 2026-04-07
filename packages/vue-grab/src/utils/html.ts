/** Escape a string for safe use in HTML text content or attribute values. */
export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Alias for `esc` — both text and attribute escaping use the same replacements. */
export const escAttr = esc;
