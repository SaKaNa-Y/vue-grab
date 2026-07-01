import baseCss from "./base.css?raw";
import fontsCss from "./fonts.css?raw";
import unoCss from "./uno.generated.css?raw";

/**
 * The antfu-design foundation injected into every text-bearing shadow root:
 *   1. bundled DM Sans / DM Mono `@font-face` (self-contained, base64)
 *   2. UnoCSS-generated `--colors-*` theme variables (the antfu palette)
 *   3. the `--vg-*` semantic token layer that the per-surface CSS consumes
 *
 * Prepend this to a surface's own structural CSS before injecting it into the
 * shadow root. No global reset is included, so existing layout is unaffected.
 */
export const VG_FOUNDATION_CSS = `${fontsCss}\n${unoCss}\n${baseCss}`;
