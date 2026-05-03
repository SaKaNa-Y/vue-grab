# Interactive Grab

The core feature: point at an element, click, and get its context.

## Activation

Three ways to enter grab mode:

- **Hotkey** - default `Alt+Shift+G`, toggles on/off. Registered at the capture phase so it wins against app-level handlers.
- **Floating button** - click the "Grab" button in the floating button (opt in with `floatingButton.enabled`).
- **Programmatic** - `useGrab().toggle()` inside a component, or `init().activate()` outside Vue.

```ts
import { useGrab } from "@sakana-y/vue-grab";

const { isActive, toggle, activate, deactivate, lastResult } = useGrab();
```

## What a grab captures

A `GrabResult` carries the element context used by the floating button and agent prompts:

```ts
interface GrabResult {
  selector: string;
  html: string;
  element: Element;
  componentStack: ComponentInfo[];
  a11y: A11yInfo;
  network?: CapturedRequest[];
}
```

### Component stack

The engine walks `__vueParentComponent` from the target element up to the root, producing a `ComponentInfo[]` with each entry's `name` and `filePath` when Vue exposes it. Source line numbers are optional and are currently populated by capture utilities when they can extract one from a stack trace.

If you pair Vue Grab with `@sakana-y/vue-grab/vite`, available file paths become clickable - see [Vite Integration](./vite-integration).

### CSS selector

Selectors favor `id` and stable class names over positional selectors. They are intended as a useful locator for the current document, not a permanent test selector contract.

### HTML

`outerHTML` is truncated at `maxHtmlLength` (default `10_000`). Truncated results end with `<!-- truncated -->`.

## Filtering what can be grabbed

```ts
createVueGrab({
  filter: {
    ignoreSelectors: [".tooltip", "[data-internal]"],
    ignoreTags: ["script", "style"],
    skipCommonComponents: true,
  },
});
```

## Overlay isolation

The highlight/label and magnifier render inside Shadow DOM hosts. Your app's styles cannot bleed in, and Vue Grab's styles cannot bleed out.

## Opening the matched file

```ts
import { openInEditor } from "@sakana-y/vue-grab";

const first = lastResult.value?.componentStack[0];
if (first?.filePath) {
  openInEditor(first.filePath, first.line);
}
```

This `POST`s to `/__open-in-editor`, which only exists when the Vite plugin is wired up.
