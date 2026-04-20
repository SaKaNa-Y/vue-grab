import type {
  CapturedRequest,
  NetworkCaptureConfig,
  NetworkStatusClass,
} from "@sakana-y/vue-grab-shared";
import { truncate } from "./console-capture";
import { stringifyCircularSafe } from "./serialize";
import { extractSource, firstFrameFile, normalizeSourceFile } from "./stack";

// Filter own frames so the reported initiator is the caller, not our wrapper.
// captureStackTrace covers V8; OWN_URL is the Firefox/Safari fallback.
const OWN_URL: string | undefined = firstFrameFile(new Error().stack);
const skipOwnFrames = (frame: string): boolean => {
  if (OWN_URL && frame.includes(OWN_URL)) return true;
  return frame.includes("network-capture");
};

type CaptureStackTrace = (target: object, ctor: Function) => void;
const captureStackTrace = (Error as unknown as { captureStackTrace?: CaptureStackTrace })
  .captureStackTrace;

function captureCallerStack(ctor: Function): string | undefined {
  const holder: { stack?: string } = {};
  if (captureStackTrace) {
    captureStackTrace(holder, ctor);
    return holder.stack;
  }
  return new Error().stack;
}

export function resolveRequestSource(req: CapturedRequest): { file: string; line?: number } | null {
  if (!req.sourceFile) return null;
  return { file: normalizeSourceFile(req.sourceFile), line: req.sourceLine };
}

function classifyStatus(status: number | undefined, failed: boolean): NetworkStatusClass {
  if (failed || status == null) return "failed";
  if (status >= 500) return "5xx";
  if (status >= 400) return "4xx";
  if (status >= 300) return "3xx";
  return "2xx";
}

function fingerprint(method: string, url: string, cls: NetworkStatusClass): string {
  return `${method}::${url}::${cls}`;
}

function safeStringifyBody(value: unknown, max: number): string {
  if (value == null) return "";
  if (typeof value === "string") return truncate(value, max);
  if (value instanceof ArrayBuffer) return `[ArrayBuffer ${value.byteLength} bytes]`;
  if (ArrayBuffer.isView(value)) {
    return `[${value.constructor.name} ${value.byteLength} bytes]`;
  }
  if (typeof Blob !== "undefined" && value instanceof Blob) {
    return `[Blob ${value.size} bytes${value.type ? ` ${value.type}` : ""}]`;
  }
  if (typeof FormData !== "undefined" && value instanceof FormData) {
    const parts: string[] = [];
    try {
      value.forEach((v, k) => {
        parts.push(`${k}=${typeof v === "string" ? v : `[${(v as File).name ?? "File"}]`}`);
      });
    } catch {}
    return truncate(parts.join("&"), max);
  }
  if (typeof URLSearchParams !== "undefined" && value instanceof URLSearchParams) {
    return truncate(value.toString(), max);
  }
  return truncate(stringifyCircularSafe(value), max);
}

const REDACTED = "[redacted]";

export function formatNetworkStatusLabel(req: CapturedRequest): string {
  if (req.statusClass === "failed") return "FAIL";
  return req.status != null ? String(req.status) : "\u2014";
}

function makeRedactSet(list: readonly string[]): Set<string> {
  return new Set(list.map((h) => h.toLowerCase()));
}

const BODY_TEXT_CT_RE = /(^text\/)|(json)|(^application\/(x-www-form-urlencoded|xml|javascript))/i;

function isTextualContentType(ct: string | null | undefined): boolean {
  if (!ct) return false;
  return BODY_TEXT_CT_RE.test(ct);
}

function isDenyListed(url: string, denyList: readonly string[]): boolean {
  for (const needle of denyList) {
    if (needle && url.includes(needle)) return true;
  }
  return false;
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  if (input instanceof Request) return input.url;
  return String(input);
}

export class NetworkCapture {
  private entries: CapturedRequest[] = [];
  private fpIndex = new Map<string, CapturedRequest>();
  private nextId = 1;
  private config: NetworkCaptureConfig;
  private listeners: Array<(entries: CapturedRequest[]) => void> = [];
  private redactSet: Set<string> = new Set();

  private originalFetch: typeof window.fetch | null = null;
  private originalXhrOpen: typeof XMLHttpRequest.prototype.open | null = null;
  private originalXhrSend: typeof XMLHttpRequest.prototype.send | null = null;
  private originalXhrSetHeader: typeof XMLHttpRequest.prototype.setRequestHeader | null = null;

  private patched = false;

  constructor(config: NetworkCaptureConfig) {
    this.config = config;
    this.redactSet = makeRedactSet(config.redactHeaders);
  }

  start(): void {
    if (this.patched) return;
    if (typeof window === "undefined") return;

    if (this.config.captureFetch && typeof window.fetch === "function") {
      this.patchFetch();
    }
    if (this.config.captureXhr && typeof XMLHttpRequest !== "undefined") {
      this.patchXhr();
    }
    this.patched = true;
  }

  private redactValue(key: string, value: string): string {
    return this.redactSet.has(key.toLowerCase()) ? REDACTED : value;
  }

  private headersToRecord(input: HeadersInit | undefined): Record<string, string> | undefined {
    if (!input) return undefined;
    const out: Record<string, string> = {};
    const push = (k: string, v: string) => {
      out[k] = this.redactValue(k, v);
    };
    if (input instanceof Headers) {
      input.forEach((v, k) => push(k, v));
    } else if (Array.isArray(input)) {
      for (const [k, v] of input) push(k, v);
    } else {
      for (const [k, v] of Object.entries(input)) push(k, String(v));
    }
    return Object.keys(out).length > 0 ? out : undefined;
  }

  private redactRecord(rec: Record<string, string>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(rec)) out[k] = this.redactValue(k, v);
    return out;
  }

  private parseResponseHeaders(
    headers: Headers | null | undefined,
  ): Record<string, string> | undefined {
    if (!headers) return undefined;
    const out: Record<string, string> = {};
    headers.forEach((v, k) => {
      out[k] = this.redactValue(k, v);
    });
    return Object.keys(out).length > 0 ? out : undefined;
  }

  private parseRawHeaders(raw: string): Record<string, string> | undefined {
    const out: Record<string, string> = {};
    for (const line of raw.trim().split(/\r?\n/)) {
      const idx = line.indexOf(":");
      if (idx <= 0) continue;
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim();
      out[k] = this.redactValue(k, v);
    }
    return Object.keys(out).length > 0 ? out : undefined;
  }

  private patchFetch(): void {
    this.originalFetch = window.fetch;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const callOriginal = (input: RequestInfo | URL, init?: RequestInit) =>
      (self.originalFetch as typeof window.fetch).call(window, input, init);

    window.fetch = async function patchedFetch(
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> {
      const url = resolveUrl(input);
      if (isDenyListed(url, self.config.urlDenyList)) {
        return callOriginal(input, init);
      }

      const method = (
        init?.method ??
        (input instanceof Request ? input.method : undefined) ??
        "GET"
      ).toUpperCase();
      const startTime = performance.now();
      const stack = captureCallerStack(patchedFetch);

      const requestHeaders = self.headersToRecord(
        init?.headers ?? (input instanceof Request ? input.headers : undefined),
      );

      let requestBody: string | undefined;
      if (self.config.captureBodies && init?.body != null) {
        requestBody = safeStringifyBody(init.body, self.config.bodyMaxBytes);
      }

      try {
        const response = await callOriginal(input, init);
        const duration = performance.now() - startTime;
        const responseHeaders = self.parseResponseHeaders(response.headers);
        const contentType = response.headers.get("content-type");
        const contentLength = response.headers.get("content-length");
        const responseSize = contentLength ? Number(contentLength) : undefined;

        let responseBody: string | undefined;
        if (self.config.captureBodies && isTextualContentType(contentType)) {
          try {
            const clone = response.clone();
            const text = await clone.text();
            responseBody = truncate(text, self.config.bodyMaxBytes);
          } catch {
            // swallow; body may not be cloneable (e.g. already consumed)
          }
        }

        self.record(
          {
            method,
            url,
            initiator: "fetch",
            status: response.status,
            statusText: response.statusText,
            statusClass: classifyStatus(response.status, false),
            startTime,
            duration,
            requestHeaders,
            requestBody,
            responseHeaders,
            responseBody,
            responseSize: Number.isFinite(responseSize) ? responseSize : undefined,
          },
          stack,
        );

        return response;
      } catch (err) {
        const duration = performance.now() - startTime;
        self.record(
          {
            method,
            url,
            initiator: "fetch",
            statusClass: "failed",
            startTime,
            duration,
            requestHeaders,
            requestBody,
            error: err instanceof Error ? err.message : String(err),
          },
          stack,
        );
        throw err;
      }
    };
  }

  private patchXhr(): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const proto = XMLHttpRequest.prototype;
    this.originalXhrOpen = proto.open;
    this.originalXhrSend = proto.send;
    this.originalXhrSetHeader = proto.setRequestHeader;

    type XhrState = {
      method: string;
      url: string;
      headers: Record<string, string>;
      startTime: number;
      denied: boolean;
      stack?: string;
    };
    const stateKey = Symbol("vue-grab-xhr-state");
    type XhrWithState = XMLHttpRequest & { [stateKey]?: XhrState };

    proto.open = function (
      this: XhrWithState,
      method: string,
      url: string | URL,
      ...rest: unknown[]
    ): void {
      const resolved = typeof url === "string" ? url : url.toString();
      this[stateKey] = {
        method: method.toUpperCase(),
        url: resolved,
        headers: {},
        startTime: 0,
        denied: isDenyListed(resolved, self.config.urlDenyList),
      };
      return (self.originalXhrOpen as typeof proto.open).call(
        this,
        method,
        url as string,
        ...(rest as [boolean, string?, string?]),
      );
    };

    proto.setRequestHeader = function (this: XhrWithState, name: string, value: string): void {
      const state = this[stateKey];
      if (state && !state.denied) {
        state.headers[name] = value;
      }
      return (self.originalXhrSetHeader as typeof proto.setRequestHeader).call(this, name, value);
    };

    proto.send = function patchedXhrSend(
      this: XhrWithState,
      body?: Document | XMLHttpRequestBodyInit | null,
    ): void {
      const state = this[stateKey];
      if (state && !state.denied) {
        state.startTime = performance.now();
        state.stack = captureCallerStack(patchedXhrSend);

        const requestHeaders = self.redactRecord(state.headers);
        const requestBody =
          self.config.captureBodies && body != null
            ? safeStringifyBody(body, self.config.bodyMaxBytes)
            : undefined;

        const finalize = (failed: boolean, errorMsg?: string) => {
          const duration = performance.now() - state.startTime;
          const status = failed ? undefined : this.status || undefined;
          const statusText = failed ? undefined : this.statusText || undefined;
          const responseHeaders = self.parseRawHeaders(this.getAllResponseHeaders());
          const contentType = this.getResponseHeader("content-type");
          const contentLength = this.getResponseHeader("content-length");
          const responseSize = contentLength ? Number(contentLength) : undefined;

          let responseBody: string | undefined;
          if (!failed && self.config.captureBodies && isTextualContentType(contentType)) {
            try {
              const text =
                this.responseType === "" || this.responseType === "text"
                  ? this.responseText
                  : safeStringifyBody(this.response, self.config.bodyMaxBytes);
              responseBody = truncate(text, self.config.bodyMaxBytes);
            } catch {}
          }

          self.record(
            {
              method: state.method,
              url: state.url,
              initiator: "xhr",
              status,
              statusText,
              statusClass: classifyStatus(status, failed),
              startTime: state.startTime,
              duration,
              requestHeaders: Object.keys(requestHeaders).length > 0 ? requestHeaders : undefined,
              requestBody,
              responseHeaders,
              responseBody,
              responseSize: Number.isFinite(responseSize) ? responseSize : undefined,
              error: errorMsg,
            },
            state.stack,
          );
        };

        this.addEventListener("load", () => finalize(false), { once: true });
        this.addEventListener("error", () => finalize(true, "Network error"), { once: true });
        this.addEventListener("abort", () => finalize(true, "Aborted"), { once: true });
        this.addEventListener("timeout", () => finalize(true, "Timeout"), { once: true });
      }
      return (self.originalXhrSend as typeof proto.send).call(this, body);
    };
  }

  private record(rest: Omit<CapturedRequest, "id" | "count" | "timestamp">, stack?: string): void {
    const fp = fingerprint(rest.method, rest.url, rest.statusClass);
    const existing = this.fpIndex.get(fp);

    if (existing) {
      existing.count++;
      existing.timestamp = Date.now();
      existing.duration = rest.duration ?? existing.duration;
      existing.status = rest.status ?? existing.status;
      existing.statusText = rest.statusText ?? existing.statusText;
      existing.responseHeaders = rest.responseHeaders ?? existing.responseHeaders;
      existing.responseBody = rest.responseBody ?? existing.responseBody;
      existing.responseSize = rest.responseSize ?? existing.responseSize;
      existing.error = rest.error ?? existing.error;
      this.notify();
      return;
    }

    const src = extractSource(stack, skipOwnFrames);
    const request: CapturedRequest = {
      ...rest,
      id: this.nextId++,
      count: 1,
      timestamp: Date.now(),
      sourceFile: rest.sourceFile ?? src.file,
      sourceLine: rest.sourceLine ?? src.line,
    };

    this.entries.push(request);
    this.fpIndex.set(fp, request);
    if (this.entries.length > this.config.maxEntries) {
      const evicted = this.entries.shift()!;
      this.fpIndex.delete(fingerprint(evicted.method, evicted.url, evicted.statusClass));
    }
    this.notify();
  }

  private notify(): void {
    if (this.listeners.length === 0) return;
    const snapshot = [...this.entries];
    for (const cb of this.listeners) cb(snapshot);
  }

  onChange(cb: (entries: CapturedRequest[]) => void): () => void {
    this.listeners.push(cb);
    return () => {
      const idx = this.listeners.indexOf(cb);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  getEntries(): CapturedRequest[] {
    return [...this.entries];
  }

  getSnapshotForGrab(): CapturedRequest[] {
    const { enabled, windowMs, maxEntries } = this.config.grabSnapshot;
    if (!enabled) return [];
    const now = Date.now();
    const cutoff = now - windowMs;
    const recent = this.entries.filter((e) => e.timestamp >= cutoff);
    return recent.slice(-maxEntries);
  }

  clear(): void {
    this.entries = [];
    this.fpIndex.clear();
    this.notify();
  }

  destroy(): void {
    if (!this.patched) return;
    if (this.originalFetch && typeof window !== "undefined") {
      window.fetch = this.originalFetch;
      this.originalFetch = null;
    }
    if (typeof XMLHttpRequest !== "undefined") {
      const proto = XMLHttpRequest.prototype;
      if (this.originalXhrOpen) proto.open = this.originalXhrOpen;
      if (this.originalXhrSend) proto.send = this.originalXhrSend;
      if (this.originalXhrSetHeader) proto.setRequestHeader = this.originalXhrSetHeader;
      this.originalXhrOpen = null;
      this.originalXhrSend = null;
      this.originalXhrSetHeader = null;
    }
    this.patched = false;
    this.listeners = [];
    this.entries = [];
    this.fpIndex.clear();
  }
}
