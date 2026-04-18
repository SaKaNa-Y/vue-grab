# Interactive Grab

The core feature: point at an element, click, and get its context.

## Activation

Three ways to enter grab mode — pick whichever fits your app:

- **Hotkey** — default `Alt+Shift+G`, toggles on/off. Registered at the **capture phase** so it wins against app-level handlers.
- **Floating button** — click the "Grab" button in the FAB (opt in with `floatingButton.enabled`).
- **Programmatic** — `useGrab().toggle()` inside a component, or `init().activate()` outside Vue.

```ts
import { useGrab } from "@sakana-y/vue-grab";

const { isActive, toggle, activate, deactivate, lastResult } = useGrab();
```

## What a grab captures

A `GrabResult` carries everything needed to describe the element to an agent:

```ts
interface GrabResult {
  selector: string; // unique CSS selector
  html: string; // outerHTML, truncated to maxHtmlLength
  element: HTMLElement; // the raw DOM reference
  componentStack: ComponentInfo[]; // walked via __vueParentComponent
  a11y?: A11yInfo; // ARIA + computed label
  timestamp: number;
}
```

### Component stack

The engine walks `__vueParentComponent` from the target element up to the root, producing a `ComponentInfo[]` with each entry's `name`, `filePath`, and `line`. If you pair it with `@sakana-y/vue-grab/vite`, the file paths are absolute and clickable — see [Vite Integration](./vite-integration).

### CSS selector

Selectors are built to be unique within the current document, favoring `id` and stable class names over positional `:nth-child()` when possible.

### HTML

`outerHTML` truncated at `maxHtmlLength` (default `10_000`). Truncated results end with `<!-- truncated -->`.

## Filtering what can be grabbed

```ts
createVueGrab({
  filter: {
    ignoreSelectors: [".tooltip", "[data-internal]"],
    ignoreTags: ["script", "style"],
    skipCommonComponents: true, // skip Fragment, Transition, etc.
  },
});
```

## Overlay isolation

The highlight/label and magnifier render inside a **Shadow DOM** host — your app's styles cannot bleed in, and Vue Grab's styles cannot bleed out. See `GrabOverlay` in the source if you want to know how the host is created.

## Opening the matched file

```ts
import { openInEditor } from "@sakana-y/vue-grab";

const first = lastResult.value?.componentStack[0];
if (first?.filePath) {
  openInEditor(first.filePath, first.line);
}
```

This `POST`s to `/__open-in-editor`, which only exists when the Vite plugin is wired up.
