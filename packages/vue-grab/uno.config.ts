import { presetAnthonyDesign } from "@antfu/design/unocss";
import { defineConfig, presetWind4 } from "unocss";

/**
 * UnoCSS config for the vue-grab shipped UI (Shadow-DOM dev tool).
 *
 * The generated stylesheet is compiled at library build time and injected as a
 * string into each Shadow root (see src/styles/*). It is NOT a global sheet — the
 * consuming app needs nothing. presetWind4 defaults to class-based dark mode, so
 * wrapping the UI in `.dark` forces the dark palette regardless of the host OS.
 *
 * The `shortcuts` map aliases vue-grab's existing semantic class hooks
 * (`.toolbar`, `.toolbar-btn`, …) onto antfu/design token recipes, so the DOM
 * templates and their class/`data-*` hooks stay untouched (tests keep passing)
 * while their appearance comes from the real antfu design system.
 */
export default defineConfig({
  presets: [
    // Default primary = antfu green; darkBackground defaults to #111.
    presetAnthonyDesign(),
    // Disable Wind4's global reset — we inject into shadow roots with existing
    // hand-tuned layout and `:host { all: initial }`, so a reset would shift it.
    // We only need the emitted theme variables + utilities.
    presetWind4({ preflights: { reset: false } }),
  ],
  // Scan TS + Vue sources for any utility classes used in templates (never the
  // generated sheet itself — that would feed output back as input). The antfu
  // component SFCs live in node_modules and carry their own utility classes, so
  // they must be scanned too or those classes never generate (ADR 0002).
  content: {
    filesystem: ["src/**/*.{ts,vue}", "node_modules/@antfu/design/components/**/*.vue"],
  },
  // Named z-layers the preset requires the app to own (it blocks plain z-<n>).
  // vue-grab uses very high stacking values to sit above host app UI.
  shortcuts: {
    "z-vg-overlay": "z-[2147483640]",
    "z-vg-fab": "z-[2147483646]",
    "z-vg-panel": "z-[2147483647]",
  },
  // Force emission of the antfu palette theme variables onto `:root, :host` so
  // the `--vg-*` semantic token layer in src/styles/base.css can reference them
  // (making the antfu preset the source of truth for the palette). Also emit the
  // whole-element antfu recipes we apply directly to DOM hooks.
  safelist: [
    "text-neutral-200",
    "text-neutral-400",
    "text-neutral-500",
    "text-primary-300",
    "text-primary-500",
    "text-primary-600",
    "text-success-400",
    "text-warning-400",
    "text-error-400",
    "font-sans",
    "font-mono",
  ],
});
