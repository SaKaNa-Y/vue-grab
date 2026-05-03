# Floating Button

An optional draggable FAB that unifies grab, measure, console, and a11y into one persistent UI.

Off by default — opt in with:

```ts
createVueGrab({
  floatingButton: { enabled: true },
});
```

## What it offers

- **Grab** button — same as `Alt+Shift+G`
- **Measure** button — same as `Alt+Shift+M`
- **Logs panel** — read the console capture buffer, filter by level, search by message
- **A11y panel** — run `scanPageA11y()` and browse findings grouped by component
- **Settings panel** — set appearance preferences, rebind the grab and measurer hotkeys, pick your editor

## Behavior

- Rendered inside its own **Shadow DOM host** (`FAB_HOST_ID`), so the page cannot style it and it cannot style the page.
- **Draggable** — grab the handle to move it anywhere on screen.
- **Snap to edge** — release near a viewport edge and it snaps to the closest corner/edge.
- **Dock modes** — choose Float or Edge in settings. Float keeps the draggable panel, and Edge docks the toolbar as a full-edge rail with the panel attached to the nearest viewport edge.
- **Outside-click close** — enabled by default and can be disabled from Appearance settings. Escape still closes an open panel.
- **Badge** — a red dot counts `warn + error` entries in the capture buffer (ignores the noisier levels).

## Persistence

State survives reloads via localStorage. Default keys:

| State               | Key                               |
| ------------------- | --------------------------------- |
| FAB position        | `vue-grab-fab-pos`                |
| Dock mode           | `vue-grab-dock-mode`              |
| Outside-click close | `vue-grab-close-on-outside-click` |
| Grab hotkey         | `vue-grab-hotkey`                 |
| Measurer hotkey     | `vue-grab-measurer-hotkey`        |
| Editor preference   | `vue-grab-editor`                 |

Override any of them via `floatingButton.storageKey` etc. — see [Configuration](../guide/configuration#floatingbutton).

## Initial position

```ts
createVueGrab({
  floatingButton: {
    enabled: true,
    initialPosition: "top-right", // before the user drags it
  },
});
```
