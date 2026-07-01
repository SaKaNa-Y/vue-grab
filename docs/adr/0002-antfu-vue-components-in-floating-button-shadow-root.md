# 2. Adopt antfu/design Vue components inside the FloatingButton shadow root

Date: 2026-07-01

## Status

Accepted

Supersedes [0001](0001-antfu-design-via-unocss-in-shadow-dom.md) in part: 0001's
"UnoCSS layer only / no DOM / no interaction change" constraint no longer holds for the
FloatingButton surface. The token layer and the vanilla approach for the other three
shadow surfaces (grab overlay, magnifier, measurer) remain as 0001 described.

## Context

ADR 0001 adopted only antfu/design's UnoCSS layer and deliberately froze DOM structure
and interaction logic, so the migration was colors/tokens only. That left the
2,703-line hand-written `styles.ts` and years of per-panel structural drift in place:
three different search-input styles, divergent expand-row patterns (logs/network use a
`<button>`, a11y uses a `<div>` + toggle wrapper), mismatched button heights, and
inconsistent spacing. We now want to redesign each FloatingButton panel for consistency
and usability, which requires new DOM and reactive state — exactly what 0001 forbade.

Two facts that shaped 0001's rejection of the Vue component library turned out to be
weaker than assumed:

1. **Vue bundle cost is zero.** `vue` is already a `peerDependency` of
   `@sakana-y/vue-grab` — it is a Vue 3 plugin, so every host app already ships Vue.
   Adopting antfu's Vue components adds no Vue runtime; only reka-ui (and, where needed,
   splitpanes/floating-vue) add weight, tree-shaken to what is used.
2. **Shadow isolation is configurable, not lost.** reka-ui's `ConfigProvider` exposes a
   `teleportTo` prop (and each Portal a `to` prop) that points teleported overlays at a
   container _inside_ the shadow root instead of `document.body`, preserving isolation.

The build is already Vue-capable: `vite.config.ts` runs `@vitejs/plugin-vue`, `vue` is
externalized, and `@vue/test-utils` is a dev dependency.

## Decision

Mount a single Vue app inside the **FloatingButton** shadow root and rebuild its toolbar
and panels as antfu/design Vue components (`@antfu/design/components/*`).

- `FloatingButton.mount()` creates the Vue app on the shadow root and `destroy()` unmounts
  it. The `FloatingButton` class stays the public boundary the session wires to; it
  forwards into reactive stores instead of calling `renderExpandBody()` (`innerHTML =`
  - re-`wire()`).
- A reka-ui `ConfigProvider` wraps the app with `teleportTo` set to an in-shadow container,
  so dropdowns/tooltips/menus render inside the shadow root.
- Session callbacks (`setLogs`, `setNetwork`, `setA11y`, grab result, …) push into
  `shallowRef`/`reactive` stores that panel components consume — replacing manual re-render.
- `VG_FOUNDATION_CSS` is still injected into the shadow root; SFC `<style>` blocks live
  within it. UnoCSS content globs extend from `src/**/*.ts` to `src/**/*.{ts,vue}`.
- **Scope is the FloatingButton only.** The grab overlay, magnifier, and measurer stay
  vanilla — they are geometry/canvas on the mousemove hot path with no panel UX to gain.
  Only their _settings controls_ (sliders/toggles) become Vue.
- Migration is incremental behind a transition bridge: `PanelHost` renders a migrated Vue
  panel when available, else mounts the legacy panel's `render()`/`wire()` output into a
  vanilla slot. The bridge is removed once every panel is migrated.

## Rejected alternatives

- **Hand-rolled vanilla mirror of antfu components.** Keep `render()`/`wire()` and
  re-create antfu's look with UnoCSS utilities + a shared vanilla primitives module. Avoids
  reka-ui, but re-implements (and will drift from) a component library we can consume
  directly, and keeps the imperative re-render model that caused the inconsistency.
- **All four shadow surfaces to Vue.** Converting the grab/magnifier/measurer geometry adds
  large churn and a reactivity layer on a per-mousemove hot path for no panel-UX benefit.

## Consequences

- The FloatingButton is a Vue app; the other three shadow surfaces remain vanilla. The
  divergent per-panel structural CSS collapses into shared antfu components.
- `reka-ui` becomes a dependency (bundled so host apps need no extra install); `vue` stays
  external. splitpanes/floating-vue are added lazily only if a chosen component needs them.
- Tests split: new Vue Test Utils component tests per panel, plus the existing
  Vitest+Playwright browser tests (selectors updated) for session/E2E flows. New components
  carry stable `data-testid` hooks so tests do not couple to antfu internals.
- The grab/magnifier/measurer overlays, their structural CSS, and their mousemove perf are
  unchanged.
