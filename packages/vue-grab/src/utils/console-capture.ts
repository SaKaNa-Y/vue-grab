import type {
  CapturedLog,
  ComponentInfo,
  ConsoleCaptureConfig,
  LogLevel,
  LogSource,
} from "@sakana-y/vue-grab-shared";
import { VUE_ERROR_EVENT } from "@sakana-y/vue-grab-shared";

const STRINGIFY_MAX_LEN = 500;

const SOURCE_RE = /at\s+.*?\((.+?):(\d+):\d+\)|at\s+(.+?):(\d+):\d+$/;

function extractSource(stack?: string): { file?: string; line?: number } {
  if (!stack) return {};
  for (const line of stack.split("\n")) {
    const m = line.match(SOURCE_RE);
    if (m) {
      return { file: m[1] ?? m[3], line: Number(m[2] ?? m[4]) };
    }
  }
  return {};
}

export function resolveLogSource(log: CapturedLog): { file: string; line?: number } | null {
  const comp = log.componentStack?.[0];
  if (comp?.filePath) return { file: comp.filePath, line: comp.line };
  if (!log.sourceFile) return null;
  let file = log.sourceFile;
  try {
    file = new URL(file).pathname;
    file = file.replace(/^\//, "");
  } catch {}
  file = file.replace(/\?.*$/, "");
  return { file, line: log.sourceLine };
}

function fingerprint(source: LogSource, level: LogLevel, message: string): string {
  return `${source}::${level}::${message}`;
}

export function truncate(s: string, max: number = STRINGIFY_MAX_LEN): string {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function safeStringify(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  const t = typeof value;
  if (t === "string") return truncate(value as string);
  if (t === "number" || t === "boolean") return String(value);
  if (t === "bigint") return `${String(value)}n`;
  if (t === "symbol") return (value as symbol).toString();
  if (t === "function") return `[Function ${(value as { name?: string }).name || "anonymous"}]`;
  if (value instanceof Error) return value.message || value.name || "Error";
  try {
    const seen = new WeakSet<object>();
    const json = JSON.stringify(value, (_key, val) => {
      if (typeof val === "object" && val !== null) {
        if (seen.has(val as object)) return "[Circular]";
        seen.add(val as object);
      }
      if (typeof val === "function") {
        return `[Function ${(val as { name?: string }).name || "anonymous"}]`;
      }
      if (typeof val === "bigint") return `${String(val)}n`;
      if (typeof val === "symbol") return (val as symbol).toString();
      return val;
    });
    if (json === undefined) return String(value);
    return truncate(json);
  } catch {
    return "[Unserializable]";
  }
}

function formatArgs(args: unknown[]): { message: string; stack?: string } {
  const parts: string[] = [];
  let stack: string | undefined;
  for (const a of args) {
    if (a instanceof Error) {
      parts.push(a.message || a.name);
      if (!stack && a.stack) stack = a.stack;
    } else if (typeof a === "string") {
      parts.push(truncate(a));
    } else {
      parts.push(safeStringify(a));
    }
  }
  return { message: parts.join(" "), stack };
}

type ConsoleMethod = (...args: unknown[]) => void;

export class ConsoleCapture {
  private entries: CapturedLog[] = [];
  private fpIndex = new Map<string, CapturedLog>();
  private nextId = 1;
  private config: ConsoleCaptureConfig;
  private listeners: Array<(entries: CapturedLog[]) => void> = [];
  private originals: Partial<Record<LogLevel, ConsoleMethod>> = {};
  private patchedLevels: LogLevel[] = [];
  private boundOnError: ((e: ErrorEvent) => void) | null = null;
  private boundOnRejection: ((e: PromiseRejectionEvent) => void) | null = null;
  private boundOnVueError: ((e: Event) => void) | null = null;

  constructor(config: ConsoleCaptureConfig) {
    this.config = config;
  }

  start(): void {
    if (this.patchedLevels.length > 0) return;

    if (typeof console !== "undefined") {
      for (const level of this.config.levels) {
        const original = console[level] as ConsoleMethod | undefined;
        if (typeof original !== "function") continue;
        this.originals[level] = original;
        this.patchedLevels.push(level);
        (console as unknown as Record<LogLevel, ConsoleMethod>)[level] = (...args: unknown[]) => {
          original.apply(console, args);
          const { message, stack } = formatArgs(args);
          this.addEntry({ level, source: "console", message, stack });
        };
      }
    }

    if (this.config.captureUnhandled && typeof window !== "undefined") {
      this.boundOnError = (e: ErrorEvent) => {
        const err = e.error ?? e.message;
        this.addEntry({
          level: "error",
          source: "runtime",
          message: err instanceof Error ? err.message : safeStringify(err),
          stack: err instanceof Error ? err.stack : undefined,
        });
      };
      window.addEventListener("error", this.boundOnError);

      this.boundOnRejection = (e: PromiseRejectionEvent) => {
        const reason = e.reason;
        this.addEntry({
          level: "error",
          source: "promise",
          message: reason instanceof Error ? reason.message : safeStringify(reason),
          stack: reason instanceof Error ? reason.stack : undefined,
        });
      };
      window.addEventListener("unhandledrejection", this.boundOnRejection);
    }

    if (this.config.captureVueErrors && typeof window !== "undefined") {
      this.boundOnVueError = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (!detail) return;
        this.captureVueError(detail.err, detail.info, detail.componentStack);
      };
      window.addEventListener(VUE_ERROR_EVENT, this.boundOnVueError);
    }
  }

  captureVueError(err: unknown, info: string, componentStack?: ComponentInfo[]): void {
    this.addEntry({
      level: "error",
      source: "vue",
      message: err instanceof Error ? err.message : safeStringify(err),
      stack: err instanceof Error ? err.stack : undefined,
      vueInfo: info,
      componentStack,
    });
  }

  private addEntry(entry: Omit<CapturedLog, "id" | "count" | "timestamp">): void {
    const fp = fingerprint(entry.source, entry.level, entry.message);
    const existing = this.fpIndex.get(fp);

    if (existing) {
      existing.count++;
      existing.timestamp = Date.now();
      this.notify();
      return;
    }

    const src = extractSource(entry.stack);
    const log: CapturedLog = {
      ...entry,
      id: this.nextId++,
      count: 1,
      timestamp: Date.now(),
      sourceFile: entry.sourceFile ?? src.file,
      sourceLine: entry.sourceLine ?? src.line,
    };

    this.entries.push(log);
    this.fpIndex.set(fp, log);
    if (this.entries.length > this.config.maxEntries) {
      const evicted = this.entries.shift()!;
      this.fpIndex.delete(fingerprint(evicted.source, evicted.level, evicted.message));
    }
    this.notify();
  }

  private notify(): void {
    if (this.listeners.length === 0) return;
    const snapshot = [...this.entries];
    for (const cb of this.listeners) cb(snapshot);
  }

  onChange(cb: (entries: CapturedLog[]) => void): () => void {
    this.listeners.push(cb);
    return () => {
      const idx = this.listeners.indexOf(cb);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  getEntries(): CapturedLog[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
    this.fpIndex.clear();
    this.notify();
  }

  destroy(): void {
    for (const level of this.patchedLevels) {
      const original = this.originals[level];
      if (original && typeof console !== "undefined") {
        (console as unknown as Record<LogLevel, ConsoleMethod>)[level] = original;
      }
    }
    this.originals = {};
    this.patchedLevels = [];
    if (this.boundOnError) {
      window.removeEventListener("error", this.boundOnError);
      this.boundOnError = null;
    }
    if (this.boundOnRejection) {
      window.removeEventListener("unhandledrejection", this.boundOnRejection);
      this.boundOnRejection = null;
    }
    if (this.boundOnVueError) {
      window.removeEventListener(VUE_ERROR_EVENT, this.boundOnVueError);
      this.boundOnVueError = null;
    }
    this.listeners = [];
  }
}
