import {
  OPEN_IN_EDITOR_CONTENT_TYPE,
  OPEN_IN_EDITOR_REQUEST_MAX_BYTES,
  isOpenInEditorAllowedEditor,
} from "@sakana-y/vue-grab-shared";

export interface OpenInEditorPayload {
  file: string;
  line?: number;
  editor?: string;
}

export function readBody(req: any): Promise<string> {
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

export function isSameOriginRequest(req: any): boolean {
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

export function writeError(res: any, status: number, message: string): void {
  res.statusCode = status;
  res.end(message);
}

export function hasEditorContentType(req: any): boolean {
  const contentType = req.headers?.["content-type"];
  return typeof contentType === "string" && contentType.includes(OPEN_IN_EDITOR_CONTENT_TYPE);
}

export function normalizePositiveInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : undefined;
}

export function normalizeEditor(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  if (!isOpenInEditorAllowedEditor(value)) {
    throw new Error("Unsupported editor");
  }
  return value;
}

function isObjectPayload(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseOpenInEditorPayload(value: unknown): OpenInEditorPayload {
  if (!isObjectPayload(value)) {
    throw new Error("Invalid request body");
  }

  const file = typeof value.file === "string" ? value.file : "";
  if (!file) {
    throw new Error('Missing required field "file"');
  }

  return {
    file,
    line: normalizePositiveInteger(value.line),
    editor: normalizeEditor(value.editor),
  };
}
