import { OPEN_IN_EDITOR_CONTENT_TYPE } from "@sakana-y/vue-grab-shared";

import type { VueGrabPluginOptions } from "../vite";

import {
  hasEditorContentType,
  isSameOriginRequest,
  parseOpenInEditorPayload,
  readBody,
  writeError,
} from "./server-utils";

export function createOpenInEditorMiddleware(server: any, options: VueGrabPluginOptions) {
  return (req: any, res: any): void => {
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

      if (!hasEditorContentType(req)) {
        writeError(res, 415, `Expected ${OPEN_IN_EDITOR_CONTENT_TYPE}`);
        return;
      }

      let payload;
      try {
        payload = parseOpenInEditorPayload(JSON.parse(await readBody(req)));
      } catch (err) {
        writeError(res, 400, err instanceof Error ? err.message : "Invalid request body");
        return;
      }

      const editor = payload.editor ?? options.editor;
      const loc = payload.line ? `:${payload.line}` : "";

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
        const resolved = path.resolve(root, payload.file);
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
  };
}
