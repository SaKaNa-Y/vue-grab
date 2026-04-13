import type {
  CapturedError,
  CapturedErrorType,
  ComponentInfo,
  ErrorCaptureConfig,
} from "@sakana-y/vue-grab-shared";
import { VUE_ERROR_EVENT } from "@sakana-y/vue-grab-shared";

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

export function resolveErrorSource(err: CapturedError): { file: string; line?: number } | null {
  const comp = err.componentStack?.[0];
  if (comp?.filePath) return { file: comp.filePath, line: comp.line };
  if (!err.sourceFile) return null;
  let file = err.sourceFile;
  try {
    file = new URL(file).pathname;
    file = file.replace(/^\//, "");
  } catch {}
  file = file.replace(/\?.*$/, "");
  return { file, line: err.sourceLine };
}

function fingerprint(type: CapturedErrorType, message: string): string {
  return `${type}::${message}`;
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return String(err);
  } catch {
    return "Unknown error";
  }
}

function errorStack(err: unknown): string | undefined {
  if (err instanceof Error) return err.stack;
  return undefined;
}

export class ConsoleCapture {
  private errors: CapturedError[] = [];
  private fpIndex = new Map<string, CapturedError>();
  private nextId = 1;
  private config: ErrorCaptureConfig;
  private listeners: Array<(errors: CapturedError[]) => void> = [];
  private originalConsoleError: typeof console.error | null = null;
  private boundOnError: ((e: ErrorEvent) => void) | null = null;
  private boundOnRejection: ((e: PromiseRejectionEvent) => void) | null = null;
  private boundOnVueError: ((e: Event) => void) | null = null;

  constructor(config: ErrorCaptureConfig) {
    this.config = config;
  }

  start(): void {
    if (this.config.captureConsoleError) {
      this.originalConsoleError = console.error;
      console.error = (...args: unknown[]) => {
        this.originalConsoleError!.apply(console, args);
        const message = args.map((a) => (typeof a === "string" ? a : String(a))).join(" ");
        const stack = args.find((a) => a instanceof Error) as Error | undefined;
        this.addError({
          type: "console.error",
          message,
          stack: stack?.stack,
        });
      };
    }

    if (this.config.captureUnhandled) {
      this.boundOnError = (e: ErrorEvent) => {
        this.addError({
          type: "runtime",
          message: errorMessage(e.error ?? e.message),
          stack: errorStack(e.error),
        });
      };
      window.addEventListener("error", this.boundOnError);

      this.boundOnRejection = (e: PromiseRejectionEvent) => {
        this.addError({
          type: "promise",
          message: errorMessage(e.reason),
          stack: errorStack(e.reason),
        });
      };
      window.addEventListener("unhandledrejection", this.boundOnRejection);
    }

    if (this.config.captureVueErrors) {
      this.boundOnVueError = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (!detail) return;
        this.captureVueError(detail.err, detail.info, detail.componentStack);
      };
      window.addEventListener(VUE_ERROR_EVENT, this.boundOnVueError);
    }
  }

  captureVueError(err: unknown, info: string, componentStack?: ComponentInfo[]): void {
    this.addError({
      type: "vue",
      message: errorMessage(err),
      stack: errorStack(err),
      vueInfo: info,
      componentStack,
    });
  }

  private addError(entry: Omit<CapturedError, "id" | "count" | "timestamp">): void {
    const fp = fingerprint(entry.type, entry.message);
    const existing = this.fpIndex.get(fp);

    if (existing) {
      existing.count++;
      existing.timestamp = Date.now();
      this.notify();
      return;
    }

    const source = extractSource(entry.stack);
    const error: CapturedError = {
      ...entry,
      id: this.nextId++,
      count: 1,
      timestamp: Date.now(),
      sourceFile: entry.sourceFile ?? source.file,
      sourceLine: entry.sourceLine ?? source.line,
    };

    this.errors.push(error);
    this.fpIndex.set(fp, error);
    if (this.errors.length > this.config.maxErrors) {
      const evicted = this.errors.shift()!;
      this.fpIndex.delete(fingerprint(evicted.type, evicted.message));
    }
    this.notify();
  }

  private notify(): void {
    const snapshot = [...this.errors];
    for (const cb of this.listeners) cb(snapshot);
  }

  onChange(cb: (errors: CapturedError[]) => void): () => void {
    this.listeners.push(cb);
    return () => {
      const idx = this.listeners.indexOf(cb);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  getErrors(): CapturedError[] {
    return [...this.errors];
  }

  clear(): void {
    this.errors = [];
    this.fpIndex.clear();
    this.notify();
  }

  destroy(): void {
    if (this.originalConsoleError) {
      console.error = this.originalConsoleError;
      this.originalConsoleError = null;
    }
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
