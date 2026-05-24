# Introduction

**Vue Grab** is a developer tool that lets you grab UI elements from a running Vue app and feed their context directly into an AI coding agent.

It ships as a Vue 3 plugin, a standalone `init()` entry point, a Vite companion plugin for editor handoff, and a CLI that can wire the common Vite + Vue setup for you.

## Why

When you are iterating on UI with an AI agent, the agent needs context that usually lives only in your head: which component rendered this button, where its file lives, which ARIA attributes it has, and what console or network failures happened nearby. Vue Grab collects that with a click.

When an agent session gets compacted or you start a fresh chat, the floating button's Context panel can copy a compact recovery packet with the last grab, console summary, and recent network summary.

## What you get on every grab

- **CSS selector** - useful locator for the element.
- **outerHTML** - truncated at `maxHtmlLength` by default.
- **Component stack** - walked via Vue internals, with file paths when Vue exposes them.
- **Accessibility info** - ARIA attributes and audit findings for the grabbed element.
- **Recent network snapshot** - optional `result.network` entries from the configured fetch/XHR capture window.

## How activation works

- **Hotkey**: `Alt+Shift+G` toggles grab mode.
- **Measurer**: `Alt+Shift+M` toggles the spacing inspector when enabled.
- **Floating button**: opt-in toolbar with Float and Edge dock modes, context, logs, network, a11y, magnifier, measurer, and settings panels.
- **Programmatic**: `useGrab()` inside Vue components, or `init()` outside Vue.

## Requirements

- Vue **3.5+** for the plugin entry point.
- Any framework or none for the standalone `init()` entry point.
- Vite for the optional "open in editor" feature.

Next: **[Installation](./installation)**
