import type { Plugin } from "vite";

export interface VueGrabPluginOptions {
  /** Default editor command. e.g. "code", "cursor", "webstorm". Auto-detected if omitted. */
  editor?: string;
}

export function vueGrabPlugin(options: VueGrabPluginOptions = {}): Plugin {
  return {
    name: "vue-grab:open-in-editor",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__open-in-editor", (req: any, res: any) => {
        const url = new URL(req.url!, "http://localhost");
        const file = url.searchParams.get("file");
        if (!file) {
          res.statusCode = 400;
          res.end('Missing required query param "file"');
          return;
        }
        const editor = url.searchParams.get("editor") || options.editor;
        Promise.all([
          // @ts-ignore — node:path available at runtime in Vite dev server
          import(/* @vite-ignore */ "node:path"),
          // @ts-ignore — launch-editor available at runtime
          import(/* @vite-ignore */ "launch-editor"),
        ]).then(([pathMod, launchMod]: any[]) => {
          const p = pathMod.default ?? pathMod;
          const launchFn = launchMod.default ?? launchMod;
          const root = server.config.root;
          const resolved = p.resolve(root, file);
          if (!isWithinRoot(resolved, root, p.sep)) {
            res.statusCode = 403;
            res.end("Path outside project root");
            return;
          }
          launchFn(resolved, editor);
          res.end();
        });
      });
    },
  };
}

function isWithinRoot(absPath: string, root: string, sep: string): boolean {
  return absPath === root || absPath.startsWith(root + sep);
}
