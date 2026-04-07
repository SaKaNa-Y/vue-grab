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
          const resolved = p.isAbsolute(file) ? file : p.resolve(server.config.root, file);
          launchFn(resolved, editor);
          res.end();
        });
      });

      server.middlewares.use("/__vue-grab/update-style", (req: any, res: any) => {
        handleStyleUpdate(req, res, server).catch((err: any) => {
          res.statusCode = 500;
          res.end(err.message || "Internal Server Error");
        });
      });
    },
  };
}

async function handleStyleUpdate(req: any, res: any, server: any): Promise<void> {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  const body = await readBody(req);
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    res.statusCode = 400;
    res.end("Invalid JSON body");
    return;
  }
  const { file, selector, property, value, styleIndex } = parsed;

  if (!file || !selector || !property || value === undefined) {
    res.statusCode = 400;
    res.end("Missing required fields");
    return;
  }

  // Dynamic imports — these run only on Node.js (Vite dev server)
  // @ts-ignore — node:fs available at runtime in Vite dev server
  const fs: any = await import(/* @vite-ignore */ "node:fs");
  // @ts-ignore — node:path available at runtime in Vite dev server
  const path: any = await import(/* @vite-ignore */ "node:path");

  const root = server.config.root;
  const absPath = path.isAbsolute(file) ? file : path.resolve(root, file.replace(/^\//, ""));

  let content: string;
  try {
    content = fs.readFileSync(absPath, "utf-8");
  } catch (err: any) {
    if (err.code === "ENOENT") {
      res.statusCode = 404;
      res.end(`File not found: ${absPath}`);
      return;
    }
    throw err;
  }

  // Parse SFC to find <style> blocks
  // @ts-ignore — @vue/compiler-sfc available at runtime (transitive dep of Vue)
  const sfc: any = await import(/* @vite-ignore */ "@vue/compiler-sfc");
  const { descriptor } = sfc.parse(content, { filename: absPath });

  const styleBlock = descriptor.styles[styleIndex];
  if (!styleBlock) {
    res.statusCode = 400;
    res.end(`Style block at index ${styleIndex} not found`);
    return;
  }

  // Use postcss to parse and modify the style content
  const postcss: any = await import(/* @vite-ignore */ "postcss");
  const parseFn = postcss.default?.parse ?? postcss.parse;
  const root_ = parseFn(styleBlock.content);

  let found = false;
  root_.walkRules((rule: any) => {
    if (rule.selector === selector || normalizeSel(rule.selector) === normalizeSel(selector)) {
      rule.walkDecls(property, (decl: any) => {
        decl.value = value;
        found = true;
      });
    }
  });

  if (!found) {
    res.statusCode = 404;
    res.end(`Rule "${selector}" with property "${property}" not found`);
    return;
  }

  // Reconstruct SFC: replace the style block content
  const newStyleContent = root_.toString();
  const startOffset = styleBlock.loc.start.offset;
  const endOffset = styleBlock.loc.end.offset;
  const newContent = content.slice(0, startOffset) + newStyleContent + content.slice(endOffset);

  fs.writeFileSync(absPath, newContent, "utf-8");

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true }));
}

function readBody(req: any): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: any) => {
      body += chunk.toString();
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function normalizeSel(sel: string): string {
  return sel.replace(/\s+/g, " ").trim();
}
