import type { Plugin } from "vite";
import {
  OPEN_IN_EDITOR_CONTENT_TYPE,
  OPEN_IN_EDITOR_ENDPOINT,
  OPEN_IN_EDITOR_REQUEST_MAX_BYTES,
  VUE_GRAB_ROOT_GLOBAL,
  isOpenInEditorAllowedEditor,
} from "@sakana-y/vue-grab-shared";
import { normalizeRoot } from "./utils/path";

export interface VueGrabPluginOptions {
  /** Default editor command. e.g. "code", "cursor", "webstorm". Auto-detected if omitted. */
  editor?: string;
}

function readBody(req: any): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    let settled = false;

    const fail = (err: Error): void => {
      if (settled) return;
      settled = true;
      reject(err);
      req.destroy?.();
    };

    req.setEncoding?.("utf8");
    req.on("data", (chunk: string) => {
      if (settled) return;
      body += chunk;
      if (body.length > OPEN_IN_EDITOR_REQUEST_MAX_BYTES) {
        fail(new Error("Request body too large"));
      }
    });
    req.on("end", () => {
      if (settled) return;
      settled = true;
      resolve(body);
    });
    req.on("error", fail);
  });
}

function isSameOriginRequest(req: any): boolean {
  const origin = req.headers?.origin;
  const host = req.headers?.host;
  if (typeof origin === "string" && typeof host === "string") {
    try {
      if (new URL(origin).host !== host) return false;
    } catch {
      return false;
    }
  }

  const fetchSite = req.headers?.["sec-fetch-site"];
  if (typeof fetchSite === "string" && !["same-origin", "none"].includes(fetchSite)) {
    return false;
  }

  return true;
}

function writeError(res: any, status: number, message: string): void {
  res.statusCode = status;
  res.end(message);
}

function normalizePositiveInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : undefined;
}

function normalizeEditor(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  if (!isOpenInEditorAllowedEditor(value)) {
    throw new Error("Unsupported editor");
  }
  return value;
}

function isObjectPayload(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
      server.middlewares.use(OPEN_IN_EDITOR_ENDPOINT, (req: any, res: any) => {
        void (async () => {
          if (req.method !== "POST") {
            res.setHeader("allow", "POST");
            writeError(res, 405, "Method Not Allowed");
            return;
          }

          if (!isSameOriginRequest(req)) {
            writeError(res, 403, "Cross-origin editor requests are not allowed");
            return;
          }

          const contentType = req.headers?.["content-type"];
          if (
            typeof contentType !== "string" ||
            !contentType.includes(OPEN_IN_EDITOR_CONTENT_TYPE)
          ) {
            writeError(res, 415, `Expected ${OPEN_IN_EDITOR_CONTENT_TYPE}`);
            return;
          }

          let payload: Record<string, unknown>;
          try {
            const parsed: unknown = JSON.parse(await readBody(req));
            if (!isObjectPayload(parsed)) {
              throw new Error("Invalid request body");
            }
            payload = parsed;
          } catch (err) {
            writeError(res, 400, err instanceof Error ? err.message : "Invalid request body");
            return;
          }

          const pureFile = typeof payload.file === "string" ? payload.file : "";
          if (!pureFile) {
            writeError(res, 400, 'Missing required field "file"');
            return;
          }

          let editor: string | undefined;
          try {
            editor = normalizeEditor(payload.editor) ?? options.editor;
          } catch (err) {
            writeError(res, 400, err instanceof Error ? err.message : "Invalid editor");
            return;
          }

          const line = normalizePositiveInteger(payload.line);
          const loc = line ? `:${line}` : "";

          try {
            const [pathMod, launchMod]: any[] = await Promise.all([
              // @ts-ignore node:path is available at runtime in the Vite dev server.
              import(/* @vite-ignore */ "node:path"),
              // @ts-ignore launch-editor is available at runtime in the Vite dev server.
              import(/* @vite-ignore */ "launch-editor"),
            ]);
            const path = pathMod.default ?? pathMod;
            const launchFn = launchMod.default ?? launchMod;
            const root = server.config.root;
            const resolved = path.resolve(root, pureFile);
            const rel = path.relative(root, resolved);
            if (rel.startsWith("..") || path.isAbsolute(rel)) {
              writeError(res, 403, "Path outside project root");
              return;
            }

            launchFn(`${resolved}${loc}`, editor);
            res.statusCode = 200;
            res.end();
          } catch (err: unknown) {
            writeError(
              res,
              500,
              `Failed to launch editor: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        })().catch((err: unknown) => {
          if (res.writableEnded) return;
          writeError(
            res,
            500,
            `Failed to launch editor: ${err instanceof Error ? err.message : String(err)}`,
          );
        });
      });
    },
  };
}
