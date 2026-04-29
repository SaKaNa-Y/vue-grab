# Vite Integration

`@sakana-y/vue-grab/vite` is the companion Vite dev-server plugin. It turns a captured source file path into an "open this in my editor" action.

## Install

`@sakana-y/vue-grab` ships the plugin as a secondary entry point; no extra dependency is needed.

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

A dev-server endpoint that accepts a same-origin `POST` with JSON `{ file, line, editor }` and hands off to [`launch-editor`](https://github.com/yyx990803/launch-editor). Files are resolved inside the Vite project root; paths outside the root are rejected.

```ts
import { openInEditor } from "@sakana-y/vue-grab";

openInEditor("src/components/StatCard.vue", 12);
```

The editor is picked in this order:

1. User preference stored in `localStorage` (`vue-grab-editor`, set via the FAB settings panel)
2. The default editor passed to `vueGrabPlugin({ editor })`
3. `launch-editor`'s own autodetection (VS Code, WebStorm, Sublime, etc.)

## Production

The plugin only attaches during `serve`; nothing ships to your production bundle. The `openInEditor` call is a no-op if `/__open-in-editor` is not reachable, so leaving it in shipped code is safe.

## Without the Vite plugin

You can still use Vue Grab without the companion plugin. You just will not get clickable file paths. `componentStack` entries can still carry `filePath` from Vue's dev build, and `line` is used when a source line is available from related capture utilities.
