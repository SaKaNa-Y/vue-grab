import type { Plugin } from "vite";

import { OPEN_IN_EDITOR_ENDPOINT, VUE_GRAB_ROOT_GLOBAL } from "@sakana-y/vue-grab-shared";

import { normalizeRoot } from "./utils/path";
import { createOpenInEditorMiddleware } from "./vite/open-in-editor-middleware";

export interface VueGrabPluginOptions {
  /** Default editor command. e.g. "code", "cursor", "webstorm". Auto-detected if omitted. */
  editor?: string;
}

export function vueGrabPlugin(options: VueGrabPluginOptions = {}): Plugin {
  let resolvedRoot = "";

  return {
    name: "vue-grab:open-in-editor",
    apply: "serve",
    async config(userConfig) {
      // @ts-ignore node:path is available at runtime in the Vite dev server.
      const pathMod: any = await import(/* @vite-ignore */ "node:path");
      const path = pathMod.default ?? pathMod;
      // @ts-ignore node:process is available at runtime in the Vite dev server.
      const procMod: any = await import(/* @vite-ignore */ "node:process");
      const proc = procMod.default ?? procMod;
      const rawRoot = userConfig.root ? path.resolve(proc.cwd(), userConfig.root) : proc.cwd();
      resolvedRoot = normalizeRoot(rawRoot);
      return {
        define: {
          [VUE_GRAB_ROOT_GLOBAL]: JSON.stringify(resolvedRoot),
        },
      };
    },
    transformIndexHtml: {
      order: "pre",
      handler() {
        if (!resolvedRoot) return;
        return [
          {
            tag: "script",
            attrs: { "data-vue-grab": "root" },
            children: `globalThis[${JSON.stringify(VUE_GRAB_ROOT_GLOBAL)}]=${JSON.stringify(resolvedRoot)};`,
            injectTo: "head-prepend",
          },
        ];
      },
    },
    configureServer(server) {
      server.middlewares.use(
        OPEN_IN_EDITOR_ENDPOINT,
        createOpenInEditorMiddleware(server, options),
      );
    },
  };
}
