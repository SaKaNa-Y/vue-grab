# Context glossary

Canonical vocabulary for the vue-grab UI. These terms have precise meanings here;
use them verbatim in code, comments, and discussion.

## Design language

- **Design language** — the single, unified visual style the whole shipped UI follows,
  inspired by [antfu/design](https://github.com/antfu/design). It is adopted as a
  *language* (palette, type scale, tokens, philosophy), not as a runtime dependency.

- **Primary accent** — the one accent color used throughout the UI. Antfu primary green
  by default, configurable through a single knob (the `highlightColor` config →
  `--grab-color` CSS variable → `--vg-accent` token). Every feature's active/selected
  state uses this one accent. There is exactly one accent.

- **Feature identity** — the (now removed) practice of giving each feature its own brand
  color (a11y green, render-scan cyan, logs amber, magnifier purple, …). Rejected:
  color no longer signals *which feature* you are looking at.

- **Severity** — color used to convey *state or meaning* (success / warning / error /
  info, and the render-frequency ramp normal → warning → danger). Severity is the only
  reason a surface may diverge from the primary accent. "Severity, not identity."

## Surfaces & hierarchy

- **Surface** — a background layer. `--vg-surface` (raised: toolbar, panels),
  `--vg-surface-sunken` (recessed areas), `--vg-bg` (opaque base).

- **Text hierarchy** — three text emphasis levels: `--vg-text` (base, reserved for what
  matters), `--vg-muted` (the default for most text), `--vg-faint` (least emphasis).
  Most text is muted.

## Tokens & mechanism

- **Token** — a semantic CSS custom property (`--vg-*`) that names a design decision
  (accent, surface, muted text, border). Tokens are sourced from the antfu palette and
  are the vocabulary the per-surface CSS consumes. Distinct from raw color literals,
  which the UI no longer uses.

- **Palette variable** — a raw antfu ramp value (`--colors-primary-300`, …) emitted by
  UnoCSS onto `:root, :host`. Tokens are defined in terms of palette variables, making
  the antfu preset the single source of truth for color.

- **Structural CSS** — layout/positioning/sizing/animation/SVG-geometry rules that carry
  no design-language meaning and are kept as-is. The opposite of token-driven appearance.

- **Foundation** — the injected bundle of bundled fonts + palette variables + token layer
  (`VG_FOUNDATION_CSS`) prepended to a shadow root's structural CSS.

- **Shadow root surface** — one of the isolated Shadow-DOM UIs: the floating button,
  the grab overlay, the magnifier, the measurer, and the render-scan flash overlay.
