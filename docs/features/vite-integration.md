# Vite Integration

`@sakana-y/vue-grab/vite` is the companion Vite dev-server plugin. It's what turns "here's a file path" into "your editor just opened at the right line."

## Install

`@sakana-y/vue-grab` ships the plugin as a secondary entry point — no extra dependency to install.

```ts
// vite.config.ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { vueGrabPlugin } from "@sakana-y/vue-grab/vite";

export default defineConfig({
  plugins: [vue(), vueGrabPlugin()],
});
```

## What it adds

### `/__open-in-editor`

A dev-server endpoint that accepts `{ file, line, column }` and hands off to [`launch-editor`](https://github.com/yyx990803/launch-editor). `openInEditor()` on the client side `POST`s here.

```ts
import { openInEditor } from "@sakana-y/vue-grab";

openInEditor("/src/components/StatCard.vue", 12);
```

The editor is picked in this order:

1. User preference stored in `localStorage` (`vue-grab-editor`, set via the FAB settings panel)
2. `$EDITOR` / `$VISUAL` environment variables
3. `launch-editor`'s own autodetection (VS Code, WebStorm, Sublime, etc.)

## Production

The plugin only attaches during `serve` — nothing ships to your production bundle. The `openInEditor` call is a no-op if `/__open-in-editor` isn't reachable, so leaving it in shipped code is safe.

## Without the Vite plugin

You can still use Vue Grab without the companion plugin — you just won't get clickable file paths. `componentStack` entries will still carry `filePath` and `line` (Vue's dev build emits them) — you can copy-paste those into your terminal.
