# Floating Button

The optional floating action button (FAB) is a persistent developer toolbar that unifies grab, render scan, measure, magnifier, console, network, a11y, editor, and settings workflows.

It is off by default. Opt in with:

```ts
createVueGrab({
  floatingButton: { enabled: true },
});
```

## What it offers

- **Grab** button - same as `Alt+Shift+G`.
- **Render Scan panel** - toggles the Vue component update heatmap and lists recent component update activity.
- **Measure** button - same as `Alt+Shift+M` when the measurer is enabled.
- **Magnifier** button - toggles the loupe when the magnifier is enabled.
- **Logs panel** - reads the console capture buffer with level filters and message search.
- **Network panel** - reads the network capture buffer with status filters, URL search, expandable headers/bodies, and copy/editor actions.
- **A11y panel** - runs `scanPageA11y()` and groups findings by component.
- **Settings panel** - controls dock layout, toolbar entries, shortcuts, and tool preferences.

## Float and Edge modes

The Dock tab lets users choose between two panel modes:

| Mode    | Behavior                                                                 |
| ------- | ------------------------------------------------------------------------ |
| `float` | Keeps the toolbar draggable and opens panels beside the current toolbar. |
| `edge`  | Docks the toolbar to the nearest viewport edge as a full-edge rail.      |

Dragging the toolbar snaps it to the nearest edge. Switching back from Edge mode restores a floating position near that edge.

## Outside-click close

`closeOnOutsideClick` defaults to `true`, so clicking outside the active FAB panel closes it. Users can disable this from Dock settings. `Escape` still closes an open panel.

```ts
createVueGrab({
  floatingButton: {
    enabled: true,
    closeOnOutsideClick: false,
  },
});
```

## Toolbar entries

The Dock tab also lets users hide and reorder toolbar entries by feature group. Hiding an entry removes it from the toolbar only; the underlying feature can still be used through hotkeys or programmatic APIs. Render Scan, Magnifier, Logs, and Network are labeled Beta in Settings. Magnifier, Logs, and Network are hidden by default while they are beta, but users can re-enable them from Settings > Dock. The Settings entry is always visible and cannot be hidden. Entries can be reordered within their feature group with the drag handle or arrow controls.

```ts
createVueGrab({
  floatingButton: {
    enabled: true,
    dockEntries: {
      order: [
        "grab",
        "render-scan",
        "settings",
        "logs",
        "network",
        "magnifier",
        "measurer",
        "accessibility",
      ],
      hidden: ["network"],
    },
  },
});
```

## Shortcuts

The Shortcuts tab lists every floating-bar feature: Grab, Settings, Render Scan, Magnifier, Measurer, Accessibility, Logs, and Network. Each row can hold multiple user-defined shortcuts. Defaults are intentionally limited to Grab (`Alt+Shift+G`) and Measurer (`Alt+Shift+M`) so Vue Grab does not claim common app or browser shortcuts.

## Tools

The Tools tab groups utility preferences that do not belong to keybindings. It includes the editor selector and "Open in Editor" action for the last grabbed source file, plus magnifier loupe size and zoom controls.

## Persistence

State survives reloads via localStorage. Default keys:

| State               | Key                               |
| ------------------- | --------------------------------- |
| FAB position        | `vue-grab-fab-pos`                |
| Dock mode           | `vue-grab-dock-mode`              |
| Toolbar entries     | `vue-grab-dock-entries`           |
| Outside-click close | `vue-grab-close-on-outside-click` |
| Feature shortcuts   | `vue-grab-shortcuts`              |
| Grab hotkey         | `vue-grab-hotkey`                 |
| Measurer hotkey     | `vue-grab-measurer-hotkey`        |
| Editor preference   | `vue-grab-editor`                 |

Override any key through `floatingButton.*StorageKey`. Set a storage key to `""` to disable persistence for that setting.

## Initial position

```ts
createVueGrab({
  floatingButton: {
    enabled: true,
    initialPosition: "top-right",
  },
});
```

Supported positions are `bottom-right`, `bottom-left`, `top-right`, `top-left`, and `top-center`.

## Shadow DOM isolation

The toolbar renders in its own Shadow DOM host (`FAB_HOST_ID`). Your app cannot accidentally style the toolbar, and the toolbar cannot leak styles into your app.
