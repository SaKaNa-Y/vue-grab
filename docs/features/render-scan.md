# Render Scan

Render Scan is a local Vue update activity view. Turn it on from the floating button and Vue Grab opens a panel while it flashes components as they update, with warmer colors when a component updates repeatedly within the rolling window.

It does not call an AI service, upload data, or require an API key.

## Quick Start

Install Vue Grab, register it in development, and enable the floating button:

```ts
createVueGrab({
  floatingButton: { enabled: true },
});
```

Reload your app and click the Render Scan toolbar button. The button starts the heatmap and opens the Render Scan panel so you can inspect component update counts immediately.

## Activation

- **Floating button** - click the Render Scan button to start scanning and open the activity panel.
- **Shortcuts** - add a custom shortcut from Settings > Shortcuts.

Render Scan is available when Vue Grab is installed through `createVueGrab()`. The standalone `init()` entry does not register Vue app update hooks, so the toolbar button is shown as unavailable there.

## Panel

The panel lists components that updated while Render Scan was active. It includes:

- summary counts for tracked, hot, and peak update activity.
- search by component name or file path.
- a selected component detail view with update count, severity, file path, and editor handoff.
- a Reset action that clears the current activity window.

Render Scan v1 reports update frequency only. Prop, state, and context cause analysis is not captured yet.

## What It Shows

Each Vue component update produces a short-lived overlay on the component root element:

- cyan for normal update activity.
- amber after `warningThreshold` updates in the current window.
- red after `dangerThreshold` updates in the current window.

The label shows the component name and rolling count, for example `UserCard · 12/2s`.

## Configuration

```ts
createVueGrab({
  renderScan: {
    enabled: true,
    windowMs: 2000,
    warningThreshold: 8,
    dangerThreshold: 20,
    flashDurationMs: 700,
    maxRecords: 200,
  },
});
```

See the full [`RenderScanConfig`](../guide/configuration#renderscan) table for defaults.

## Scope

Render Scan v1 detects update frequency only. It does not measure component render duration or explain why a component updated.

Grab, magnifier, and measurer modes deactivate Render Scan so their overlays do not compete on the page.
