# 1. Adopt antfu/design via UnoCSS compiled into Shadow DOM

Date: 2026-07-01

## Status

Accepted

## Context

The vue-grab UI had grown into a 2,728-line `styles.ts` of hand-written CSS-in-JS
strings: scattered hardcoded colors, dark-only surfaces, an indigo accent, and a
rainbow of per-feature accent colors. We wanted the whole shipped UI to follow one
unified design language, inspired by [antfu/design](https://github.com/antfu/design).

Two facts shaped the decision:

1. **antfu/design is a UnoCSS preset + a Vue/reka-ui component library.** Its full
   value has two independently-adoptable layers: the UnoCSS design tokens, and the
   Vue components (built on reka-ui / floating-vue / splitpanes).
2. **vue-grab's UI is vanilla DOM in four isolated Shadow roots** — `createElement`
   - `innerHTML` templates + manual `wire()`, styled by injecting CSS strings. There
     are no `.vue` components, and ~6,500 lines of tests query that DOM by class / `data-*`.

## Decision

Adopt antfu/design's **UnoCSS layer only**, compiled at library build time and injected
into each shadow root:

- A `uno.config.ts` uses the real `presetAnthonyDesign` preset. `@unocss/cli` compiles
  `src/styles/uno.generated.css`, whose `:root, :host` theme block carries the antfu
  palette into the shadow roots.
- A `--vg-*` semantic token layer (`src/styles/base.css`) is defined in terms of those
  palette variables and consumed by the existing per-surface CSS. Values are substituted
  in place; the DOM structure and its class / `data-*` hooks are left untouched.
- Dark-only: the tokens pick antfu's dark ramp stops directly, so no `.dark` wrapper or
  `dark:` variant is needed. Wind4's global reset is disabled to protect existing layout.
- One configurable accent replaces indigo + all per-feature colors; color otherwise
  conveys severity only. DM Sans / DM Mono are bundled as base64 woff2.

## Rejected alternatives

- **Full Vue + reka-ui component rewrite.** Rebuilding every panel as antfu SFCs would
  mount Vue apps inside each shadow root, defeat the Shadow-DOM isolation that is a core
  design property (reka-ui / floating-vue Teleport to `document.body`), churn ~6,500
  lines of tests, and bundle heavy deps into a tool injected into arbitrary pages. It
  also contradicts the "no architecture / no interaction-logic change" constraint.
- **Hand-copied token values, no UnoCSS.** Lighter, but a copy of the design language
  rather than the actual antfu/design system; the palette would drift from upstream.

## Consequences

- The whole UI shares one antfu-sourced design language; the antfu preset is the source
  of truth for the palette. Changing `primary` in `uno.config.ts` retints everything.
- `build` now runs `build:css` first; `uno.generated.css` is a build artifact (committed,
  excluded from format/lint). `unocss`, `@unocss/cli`, `@antfu/design`, `colorjs.io` are
  **dev-only** — no runtime dependency is added and Vue stays externalized.
- Bundle grows mainly from the bundled base64 fonts (a deliberate choice).
- Rendering architecture, interaction logic, and the test suite are unchanged.
