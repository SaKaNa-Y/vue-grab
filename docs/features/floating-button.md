# Floating Button

The optional floating action button (FAB) is a persistent developer toolbar that unifies grab, measure, magnifier, console, network, a11y, editor, and settings workflows.

It is off by default. Opt in with:

```ts
createVueGrab({
  floatingButton: { enabled: true },
});
```

## What it offers

- **Grab** button - same as `Alt+Shift+G`.
- **Measure** button - same as `Alt+Shift+M` when the measurer is enabled.
- **Magnifier** button - toggles the loupe when the magnifier is enabled.
- **Logs panel** - reads the console capture buffer with level filters and message search.
- **Network panel** - reads the network capture buffer with status filters, URL search, expandable headers/bodies, and copy/editor actions.
- **A11y panel** - runs `scanPageA11y()` and groups findings by component.
- **Settings panel** - controls appearance, dock mode, outside-click closing, hotkeys, editor choice, and magnifier settings.

## Float and Edge modes

The Appearance tab lets users choose between two panel modes:

| Mode    | Behavior                                                                 |
| ------- | ------------------------------------------------------------------------ |
| `float` | Keeps the toolbar draggable and opens panels beside the current toolbar. |
| `edge`  | Docks the toolbar to the nearest viewport edge as a full-edge rail.      |

Dragging the toolbar snaps it to the nearest edge. Switching back from Edge mode restores a floating position near that edge.

## Outside-click close

`closeOnOutsideClick` defaults to `true`, so clicking outside the active FAB panel closes it. Users can disable this from Appearance settings. `Escape` still closes an open panel.

```ts
createVueGrab({
  floatingButton: {
    enabled: true,
    closeOnOutsideClick: false,
  },
});
```

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
