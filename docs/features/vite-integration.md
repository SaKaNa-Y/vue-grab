# Vite Integration

`@sakana-y/vue-grab/vite` is the companion Vite dev-server plugin. It turns captured source file paths into "open this in my editor" actions.

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

Pass a default editor command when you want to avoid launch-editor autodetection:

```ts
vueGrabPlugin({ editor: "code" });
```

## `/__open-in-editor`

The plugin adds a dev-server-only endpoint at `/__open-in-editor`. `openInEditor()` sends a same-origin JSON `POST` with this shape:

```ts
interface OpenInEditorRequest {
  file: string;
  line?: number;
  editor?: string;
}
```

```ts
import { openInEditor } from "@sakana-y/vue-grab";

openInEditor("src/components/StatCard.vue", 12);
```

## Security checks

The endpoint is intentionally narrow:

- Accepts only `POST`.
- Requires `content-type` containing `application/json`.
- Rejects cross-origin requests.
- Rejects request bodies larger than 8192 bytes.
- Requires a non-empty `file`.
- Resolves files inside the Vite project root and rejects paths outside it.
- Rejects unsupported editor commands.

Allowed editor commands are exactly: `atom`, `code`, `cursor`, `emacs`, `idea`, `nvim`, `phpstorm`, `sublime`, `vim`, `visualstudio`, `webstorm`.

## Editor precedence

The editor is picked in this order:

1. User preference stored in localStorage (`vue-grab-editor`, set from the floating button settings panel).
2. The default editor passed to `vueGrabPlugin({ editor })`.
3. `launch-editor` autodetection.

## Production

The plugin only attaches during Vite `serve`; nothing ships to your production bundle. `openInEditor()` is safe to leave in application code because it becomes a no-op when `/__open-in-editor` is unreachable.

## Without the Vite plugin

You can still use Vue Grab without the companion plugin. You just will not get editor-opening actions. `componentStack` entries can still carry `filePath` from Vue's dev build, and related capture utilities may still provide source lines.
