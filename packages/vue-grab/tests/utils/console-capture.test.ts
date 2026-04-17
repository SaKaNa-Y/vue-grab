import { describe, it, expect, afterEach, vi } from "vitest";
import type { ConsoleCaptureConfig } from "@sakana-y/vue-grab-shared";
import { ALL_LOG_LEVELS, VUE_ERROR_EVENT } from "@sakana-y/vue-grab-shared";
import { ConsoleCapture, resolveLogSource } from "../../src/utils/console-capture";

const ALL_LEVELS = ALL_LOG_LEVELS;

const fullConfig: ConsoleCaptureConfig = {
  enabled: true,
  maxEntries: 200,
  levels: [...ALL_LEVELS],
  captureUnhandled: true,
  captureVueErrors: true,
};

describe("ConsoleCapture", () => {
  let capture: ConsoleCapture;

  afterEach(() => {
    capture?.destroy();
    vi.restoreAllMocks();
  });

  describe("per-level console patching", () => {
    for (const level of ALL_LEVELS) {
      it(`captures console.${level} with source "console" and matching level`, () => {
        capture = new ConsoleCapture({ ...fullConfig, captureUnhandled: false });
        capture.start();
        console[level]("hello");
        const entries = capture.getEntries();
        expect(entries).toHaveLength(1);
        expect(entries[0].level).toBe(level);
        expect(entries[0].source).toBe("console");
        expect(entries[0].message).toContain("hello");
      });

      it(`still calls the original console.${level}`, () => {
        const original = console[level];
        const spy = vi.fn<() => void>();
        (console as Record<string, unknown>)[level] = spy;
        capture = new ConsoleCapture({
          ...fullConfig,
          levels: [level],
          captureUnhandled: false,
          captureVueErrors: false,
        });
        capture.start();
        console[level]("relay");
        expect(spy).toHaveBeenCalledWith("relay");
        capture.destroy();
        (console as Record<string, unknown>)[level] = original;
      });
    }

    it("restores all five originals on destroy", () => {
      const originals = Object.fromEntries(ALL_LEVELS.map((l) => [l, console[l]]));
      capture = new ConsoleCapture({ ...fullConfig, captureUnhandled: false });
      capture.start();
      for (const l of ALL_LEVELS) {
        expect(console[l]).not.toBe(originals[l]);
      }
      capture.destroy();
      for (const l of ALL_LEVELS) {
        expect(console[l]).toBe(originals[l]);
      }
    });

    it("double-start is a no-op (originals preserved)", () => {
      const original = console.error;
      capture = new ConsoleCapture({ ...fullConfig, captureUnhandled: false });
      capture.start();
      const afterFirst = console.error;
      capture.start();
      expect(console.error).toBe(afterFirst);
      capture.destroy();
      expect(console.error).toBe(original);
    });
  });

  describe("levels config toggle", () => {
    it("only patches listed levels", () => {
      const originalLog = console.log;
      capture = new ConsoleCapture({
        ...fullConfig,
        levels: ["warn", "error"],
        captureUnhandled: false,
        captureVueErrors: false,
      });
      capture.start();
      expect(console.log).toBe(originalLog);
      console.log("untouched");
      expect(capture.getEntries()).toHaveLength(0);
      console.warn("caught");
      expect(capture.getEntries()).toHaveLength(1);
      expect(capture.getEntries()[0].level).toBe("warn");
    });

    it("empty levels array leaves console untouched", () => {
      const originals = ALL_LEVELS.map((l) => console[l]);
      capture = new ConsoleCapture({
        ...fullConfig,
        levels: [],
        captureUnhandled: false,
        captureVueErrors: false,
      });
      capture.start();
      ALL_LEVELS.forEach((l, i) => {
        expect(console[l]).toBe(originals[i]);
      });
    });
  });

  describe("arg stringification", () => {
    it("extracts Error.message and stack", () => {
      capture = new ConsoleCapture({
        ...fullConfig,
        levels: ["error"],
        captureUnhandled: false,
        captureVueErrors: false,
      });
      capture.start();
      const err = new Error("boom");
      console.error(err);
      const entries = capture.getEntries();
      expect(entries[0].message).toContain("boom");
      expect(entries[0].stack).toBeDefined();
    });

    it("JSON-stringifies plain objects", () => {
      capture = new ConsoleCapture({
        ...fullConfig,
        levels: ["error"],
        captureUnhandled: false,
        captureVueErrors: false,
      });
      capture.start();
      console.error("ctx", { a: 1, b: "x" });
      const msg = capture.getEntries()[0].message;
      expect(msg).toContain("ctx");
      expect(msg).toContain('"a":1');
      expect(msg).toContain('"b":"x"');
    });

    it("handles circular references without throwing", () => {
      capture = new ConsoleCapture({
        ...fullConfig,
        levels: ["error"],
        captureUnhandled: false,
        captureVueErrors: false,
      });
      capture.start();
      const obj: Record<string, unknown> = { name: "root" };
      obj.self = obj;
      expect(() => console.error(obj)).not.toThrow();
      const msg = capture.getEntries()[0].message;
      expect(msg).toContain("[Circular]");
    });

    it("joins multiple args with spaces", () => {
      capture = new ConsoleCapture({
        ...fullConfig,
        levels: ["log"],
        captureUnhandled: false,
        captureVueErrors: false,
      });
      capture.start();
      console.log("a", "b", "c");
      expect(capture.getEntries()[0].message).toBe("a b c");
    });
  });

  describe("unhandled + vue capture paths", () => {
    it("registers error event listener when captureUnhandled is true", () => {
      const addSpy = vi.spyOn(window, "addEventListener");
      capture = new ConsoleCapture({ ...fullConfig, levels: [], captureVueErrors: false });
      capture.start();
      expect(addSpy).toHaveBeenCalledWith("error", expect.any(Function));
      expect(addSpy).toHaveBeenCalledWith("unhandledrejection", expect.any(Function));
    });

    it("does not register unhandled listeners when captureUnhandled is false", () => {
      const addSpy = vi.spyOn(window, "addEventListener");
      capture = new ConsoleCapture({
        ...fullConfig,
        levels: [],
        captureUnhandled: false,
        captureVueErrors: false,
      });
      capture.start();
      const errorCalls = addSpy.mock.calls.filter((c) => c[0] === "error");
      expect(errorCalls).toHaveLength(0);
    });

    it("removes event listeners on destroy", () => {
      const removeSpy = vi.spyOn(window, "removeEventListener");
      capture = new ConsoleCapture({ ...fullConfig, levels: [], captureVueErrors: false });
      capture.start();
      capture.destroy();
      expect(removeSpy).toHaveBeenCalledWith("error", expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith("unhandledrejection", expect.any(Function));
    });

    it("Vue error events produce level=error, source=vue entries", () => {
      capture = new ConsoleCapture({
        ...fullConfig,
        levels: [],
        captureUnhandled: false,
      });
      capture.start();
      window.dispatchEvent(
        new CustomEvent(VUE_ERROR_EVENT, {
          detail: { err: new Error("vue err"), info: "mounted hook", componentStack: [] },
        }),
      );
      const entries = capture.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].level).toBe("error");
      expect(entries[0].source).toBe("vue");
      expect(entries[0].message).toBe("vue err");
    });

    it("includes vueInfo and componentStack in vue entries", () => {
      capture = new ConsoleCapture({
        ...fullConfig,
        levels: [],
        captureUnhandled: false,
      });
      capture.start();
      const stack = [{ name: "App", filePath: "App.vue" }];
      window.dispatchEvent(
        new CustomEvent(VUE_ERROR_EVENT, {
          detail: { err: new Error("x"), info: "setup", componentStack: stack },
        }),
      );
      const entry = capture.getEntries()[0];
      expect(entry.vueInfo).toBe("setup");
      expect(entry.componentStack).toEqual(stack);
    });

    it("does not capture Vue events when captureVueErrors is false", () => {
      capture = new ConsoleCapture({
        ...fullConfig,
        levels: [],
        captureUnhandled: false,
        captureVueErrors: false,
      });
      capture.start();
      window.dispatchEvent(
        new CustomEvent(VUE_ERROR_EVENT, {
          detail: { err: new Error("no"), info: "hook" },
        }),
      );
      expect(capture.getEntries()).toHaveLength(0);
    });
  });

  describe("deduplication (fingerprint = source+level+message)", () => {
    it("increments count for same source+level+message", () => {
      capture = new ConsoleCapture({
        ...fullConfig,
        levels: ["warn"],
        captureUnhandled: false,
        captureVueErrors: false,
      });
      capture.start();
      console.warn("dup");
      console.warn("dup");
      const entries = capture.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].count).toBe(2);
    });

    it("same message at different levels produces distinct entries", () => {
      capture = new ConsoleCapture({
        ...fullConfig,
        levels: ["warn", "error"],
        captureUnhandled: false,
        captureVueErrors: false,
      });
      capture.start();
      console.warn("x");
      console.error("x");
      expect(capture.getEntries()).toHaveLength(2);
    });

    it("console.error vs runtime error with same message produce distinct entries", () => {
      capture = new ConsoleCapture({
        ...fullConfig,
        levels: ["error"],
        captureVueErrors: false,
      });
      capture.start();
      console.error("same");
      window.dispatchEvent(new ErrorEvent("error", { error: new Error("same"), message: "same" }));
      const entries = capture.getEntries();
      expect(entries).toHaveLength(2);
      const sources = entries.map((e) => e.source).toSorted();
      expect(sources).toEqual(["console", "runtime"]);
    });

    it("updates timestamp on duplicate", () => {
      capture = new ConsoleCapture({
        ...fullConfig,
        levels: ["error"],
        captureUnhandled: false,
        captureVueErrors: false,
      });
      capture.start();
      console.error("t");
      const t1 = capture.getEntries()[0].timestamp;
      vi.spyOn(Date, "now").mockReturnValue(t1 + 1000);
      console.error("t");
      expect(capture.getEntries()[0].timestamp).toBe(t1 + 1000);
    });
  });

  describe("maxEntries ring buffer", () => {
    it("evicts oldest entry when maxEntries is exceeded", () => {
      capture = new ConsoleCapture({
        ...fullConfig,
        levels: ["error"],
        maxEntries: 2,
        captureUnhandled: false,
        captureVueErrors: false,
      });
      capture.start();
      console.error("first");
      console.error("second");
      console.error("third");
      const entries = capture.getEntries();
      expect(entries).toHaveLength(2);
      expect(entries[0].message).toContain("second");
      expect(entries[1].message).toContain("third");
    });
  });

  describe("onChange listener", () => {
    it("notifies listener when entry is added", () => {
      capture = new ConsoleCapture({
        ...fullConfig,
        levels: ["error"],
        captureUnhandled: false,
        captureVueErrors: false,
      });
      const cb = vi.fn<() => void>();
      capture.onChange(cb);
      capture.start();
      console.error("notify");
      expect(cb).toHaveBeenCalledOnce();
      expect(cb.mock.calls[0][0]).toHaveLength(1);
    });

    it("provides snapshot (copy) of entries array", () => {
      capture = new ConsoleCapture({
        ...fullConfig,
        levels: ["error"],
        captureUnhandled: false,
        captureVueErrors: false,
      });
      let snapshot: unknown[] = [];
      capture.onChange((entries) => {
        snapshot = entries;
      });
      capture.start();
      console.error("snap");
      snapshot.length = 0;
      expect(capture.getEntries()).toHaveLength(1);
    });

    it("unsubscribe function removes listener", () => {
      capture = new ConsoleCapture({
        ...fullConfig,
        levels: ["error"],
        captureUnhandled: false,
        captureVueErrors: false,
      });
      const cb = vi.fn<() => void>();
      const unsub = capture.onChange(cb);
      unsub();
      capture.start();
      console.error("no-notify");
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe("clear", () => {
    it("removes all entries and notifies listeners", () => {
      capture = new ConsoleCapture({
        ...fullConfig,
        levels: ["error"],
        captureUnhandled: false,
        captureVueErrors: false,
      });
      const cb = vi.fn<() => void>();
      capture.onChange(cb);
      capture.start();
      console.error("to-clear");
      cb.mockClear();
      capture.clear();
      expect(capture.getEntries()).toHaveLength(0);
      expect(cb).toHaveBeenCalledWith([]);
    });
  });

  describe("getEntries", () => {
    it("returns a copy of the entries array", () => {
      capture = new ConsoleCapture({
        ...fullConfig,
        levels: ["error"],
        captureUnhandled: false,
        captureVueErrors: false,
      });
      capture.start();
      console.error("copy");
      const a = capture.getEntries();
      const b = capture.getEntries();
      expect(a).toEqual(b);
      expect(a).not.toBe(b);
    });
  });
});

describe("resolveLogSource", () => {
  it("returns componentStack[0] filePath and line when available", () => {
    const result = resolveLogSource({
      id: 1,
      level: "error",
      source: "vue",
      message: "err",
      count: 1,
      timestamp: 0,
      componentStack: [{ name: "App", filePath: "App.vue", line: 10 }],
    });
    expect(result).toEqual({ file: "App.vue", line: 10 });
  });

  it("returns sourceFile with URL path extraction when no componentStack", () => {
    const result = resolveLogSource({
      id: 1,
      level: "error",
      source: "runtime",
      message: "err",
      count: 1,
      timestamp: 0,
      sourceFile: "http://localhost:3000/src/main.ts?t=123",
      sourceLine: 5,
    });
    expect(result).not.toBeNull();
    expect(result!.file).toContain("main.ts");
    expect(result!.file).not.toContain("?");
  });

  it("returns null when no sourceFile and no componentStack", () => {
    const result = resolveLogSource({
      id: 1,
      level: "error",
      source: "runtime",
      message: "err",
      count: 1,
      timestamp: 0,
    });
    expect(result).toBeNull();
  });
});
