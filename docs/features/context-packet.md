# Context Packet

The Context panel creates a compact Markdown packet for Claude Code or another agent. It is designed for moments when a chat has been compacted, a fresh agent needs the current UI evidence, or you want to paste a deterministic bug report into another tool.

## What it includes

- **Selected element** - selector, first component, full component stack, a11y attributes, a11y audit notes, and bounded HTML.
- **Console summary** - newest captured console/runtime/promise/Vue entries, including dedup counts and source hints when available.
- **Network summary** - newest captured fetch/XHR entries with method, URL, status or failure, duration, dedup count, and initiator source when available.

The packet is built from existing runtime state. It does not change `GrabResult`, persist history, or generate an LLM summary.

## Using it

1. Enable the floating button with `floatingButton.enabled: true`.
2. Grab an element with `Alt+Shift+G` or the Grab toolbar entry.
3. Open the Context toolbar entry.
4. Choose **Copy** or **Open in Claude Code**.

If no element has been grabbed yet, the Context panel still copies diagnostics and clearly notes that element-specific context is missing.

## Toolbar configuration

The Context entry id is `"context"`. It is visible by default, appears after `"grab"` in the default toolbar order, and is labeled Beta in Settings > Dock.

```ts
createVueGrab({
  floatingButton: {
    enabled: true,
    dockEntries: {
      order: ["grab", "context", "settings", "logs", "network"],
      hidden: [],
    },
  },
});
```
