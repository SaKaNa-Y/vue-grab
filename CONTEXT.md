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
  the grab overlay, the magnifier, the measurer, and the render-scan flash overlay. The
  floating button surface is now a **Vue shell** (see below); the other surfaces remain
  vanilla `createElement`/`innerHTML` + `wire()` structural DOM.

## FloatingButton Vue surface

- **Vue shell** — the single Vue app mounted inside the FloatingButton shadow root
  (`FloatingButtonApp`), housing the toolbar and the active panel. Introduced by
  [ADR 0002](docs/adr/0002-antfu-vue-components-in-floating-button-shadow-root.md); the
  toolbar and panels are antfu/design Vue components. Distinct from the vanilla structural
  DOM of the other shadow root surfaces.

- **Panel component** — a Vue single-file component rendering one FloatingButton panel
  (logs, network, a11y, context, render-scan, settings). Replaces the former
  `render()`-string + `wire()` panel classes. Composed from antfu/design components.

- **In-shadow teleport container** — the element inside the FloatingButton shadow root that
  reka-ui teleports overlays (dropdowns, tooltips, menus) into, via `ConfigProvider`'s
  `teleportTo`. Keeps overlay content within the shadow root instead of escaping to
  `document.body`, preserving shadow isolation.

- **State bridge** — the reactive layer (`shallowRef`/`reactive` stores) that session
  callbacks (`setLogs`, `setNetwork`, `setA11y`, grab result) write to and panel components
  read from. Replaces the imperative `innerHTML =` + re-`wire()` re-render cycle. The
  `FloatingButton` class stays the public boundary and forwards into the bridge.
