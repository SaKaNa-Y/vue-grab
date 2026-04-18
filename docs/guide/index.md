# Introduction

**Vue Grab** is a developer tool that lets you _grab_ UI elements from a running Vue app and feed their context — component stack, CSS selector, HTML, accessibility info — straight into an AI coding agent.

It ships as a Vue 3 plugin, but also works with any page via a standalone `init()` entry point.

## Why

When you're iterating on UI with an AI agent, the agent needs context that usually lives only in your head: _which_ component rendered this button, where its file lives, what ARIA attributes it has. Copy-pasting that by hand is slow and lossy. Vue Grab collects it all with a click.

## What you get on every grab

- **CSS selector** — unique, stable for the element
- **outerHTML** — truncated at `maxHtmlLength` (default 10,000 chars)
- **Component stack** — walked via `__vueParentComponent`, with file paths and line numbers when available
- **Accessibility info** — ARIA attributes, role, accessible name/description, computed label

## How activation works

- **Hotkey**: `Alt+Shift+G` (configurable and persisted to localStorage) toggles grab mode
- **Measurer**: `Alt+Shift+M` toggles the spacing inspector
- **Floating button** (opt-in): a draggable FAB with logs, a11y, and settings panels
- **Programmatic**: `useGrab()` composable inside any component, or the `init()` API outside Vue

## Requirements

- Vue **3.5+** for the plugin entry point (`@sakana-y/vue-grab`)
- Any framework or none for the standalone `init()` entry point
- Vite (any version supported by `@sakana-y/vue-grab/vite`) for the "open in editor" feature

Next: **[Installation →](./installation)**
