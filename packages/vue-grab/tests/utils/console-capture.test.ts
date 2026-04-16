import { describe, it, expect, afterEach, vi } from "vitest";
import type { ErrorCaptureConfig } from "@sakana-y/vue-grab-shared";
import { VUE_ERROR_EVENT } from "@sakana-y/vue-grab-shared";
import { ConsoleCapture, resolveErrorSource } from "../../src/utils/console-capture";

const fullConfig: ErrorCaptureConfig = {
  enabled: true,
  maxErrors: 50,
  captureConsoleError: true,
  captureUnhandled: true,
  captureVueErrors: true,
};

describe("ConsoleCapture", () => {
  let capture: ConsoleCapture;

  afterEach(() => {
    capture?.destroy();
  });

  describe("console.error capture", () => {
    it("captures console.error calls as console.error type", () => {
      capture = new ConsoleCapture({ ...fullConfig, captureUnhandled: false });
      capture.start();
      console.error("test message");
      const errors = capture.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("console.error");
      expect(errors[0].message).toContain("test message");
    });

    it("still calls original console.error", () => {
      const originalError = console.error;
      const spy = vi.fn<() => void>();
      console.error = spy;

      capture = new ConsoleCapture({ ...fullConfig, captureUnhandled: false });
      capture.start();
      console.error("hello");

      expect(spy).toHaveBeenCalledWith("hello");
      console.error = originalError;
    });

    it("does not capture console.error when captureConsoleError is false", () => {
      capture = new ConsoleCapture({
        ...fullConfig,
        captureConsoleError: false,
        captureUnhandled: false,
      });
      capture.start();
      console.error("should not capture");
      expect(capture.getErrors()).toHaveLength(0);
    });

    it("restores console.error on destroy", () => {
      const original = console.error;
      capture = new ConsoleCapture({ ...fullConfig, captureUnhandled: false });
      capture.start();
      expect(console.error).not.toBe(original);
      capture.destroy();
      expect(console.error).toBe(original);
    });
  });

  describe("unhandled error capture", () => {
    it("registers error event listener on start", () => {
      const addSpy = vi.spyOn(window, "addEventListener");
      capture = new ConsoleCapture({ ...fullConfig, captureConsoleError: false });
      capture.start();
      expect(addSpy).toHaveBeenCalledWith("error", expect.any(Function));
      vi.restoreAllMocks();
    });

    it("does not register when captureUnhandled is false", () => {
      const addSpy = vi.spyOn(window, "addEventListener");
      capture = new ConsoleCapture({
        ...fullConfig,
        captureUnhandled: false,
        captureConsoleError: false,
      });
      capture.start();
      const errorCalls = addSpy.mock.calls.filter((c) => c[0] === "error");
      expect(errorCalls).toHaveLength(0);
      vi.restoreAllMocks();
    });

    it("removes event listeners on destroy", () => {
      const removeSpy = vi.spyOn(window, "removeEventListener");
      capture = new ConsoleCapture({ ...fullConfig, captureConsoleError: false });
      capture.start();
      capture.destroy();
      expect(removeSpy).toHaveBeenCalledWith("error", expect.any(Function));
      vi.restoreAllMocks();
    });
  });

  describe("Vue error capture", () => {
    it("captures VUE_ERROR_EVENT custom events as vue type", () => {
      capture = new ConsoleCapture({
        ...fullConfig,
        captureConsoleError: false,
        captureUnhandled: false,
      });
      capture.start();
      window.dispatchEvent(
        new CustomEvent(VUE_ERROR_EVENT, {
          detail: { err: new Error("vue err"), info: "mounted hook", componentStack: [] },
        }),
      );
      const errors = capture.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("vue");
      expect(errors[0].message).toBe("vue err");
    });

    it("includes vueInfo and componentStack in captured error", () => {
      capture = new ConsoleCapture({
        ...fullConfig,
        captureConsoleError: false,
        captureUnhandled: false,
      });
      capture.start();
      const stack = [{ name: "App", filePath: "App.vue" }];
      window.dispatchEvent(
        new CustomEvent(VUE_ERROR_EVENT, {
          detail: { err: new Error("test"), info: "setup", componentStack: stack },
        }),
      );
      const errors = capture.getErrors();
      expect(errors[0].vueInfo).toBe("setup");
      expect(errors[0].componentStack).toEqual(stack);
    });

    it("does not capture when captureVueErrors is false", () => {
      capture = new ConsoleCapture({
        ...fullConfig,
        captureVueErrors: false,
        captureConsoleError: false,
        captureUnhandled: false,
      });
      capture.start();
      window.dispatchEvent(
        new CustomEvent(VUE_ERROR_EVENT, {
          detail: { err: new Error("no"), info: "mounted hook" },
        }),
      );
      expect(capture.getErrors()).toHaveLength(0);
    });
  });

  describe("deduplication", () => {
    it("increments count for duplicate errors with same type+message", () => {
      capture = new ConsoleCapture({ ...fullConfig, captureUnhandled: false });
      capture.start();
      console.error("dup");
      console.error("dup");
      const errors = capture.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].count).toBe(2);
    });

    it("updates timestamp on duplicate", () => {
      capture = new ConsoleCapture({ ...fullConfig, captureUnhandled: false });
      capture.start();
      console.error("dup-ts");
      const ts1 = capture.getErrors()[0].timestamp;
      vi.spyOn(Date, "now").mockReturnValue(ts1 + 1000);
      console.error("dup-ts");
      expect(capture.getErrors()[0].timestamp).toBe(ts1 + 1000);
      vi.restoreAllMocks();
    });

    it("treats different messages as different fingerprints", () => {
      capture = new ConsoleCapture({ ...fullConfig, captureUnhandled: false });
      capture.start();
      console.error("msg-a");
      console.error("msg-b");
      expect(capture.getErrors()).toHaveLength(2);
    });
  });

  describe("maxErrors ring buffer", () => {
    it("evicts oldest error when maxErrors is exceeded", () => {
      capture = new ConsoleCapture({ ...fullConfig, maxErrors: 2, captureUnhandled: false });
      capture.start();
      console.error("first");
      console.error("second");
      console.error("third");
      const errors = capture.getErrors();
      expect(errors).toHaveLength(2);
      expect(errors[0].message).toContain("second");
      expect(errors[1].message).toContain("third");
    });
  });

  describe("onChange listener", () => {
    it("notifies listener when error is added", () => {
      capture = new ConsoleCapture({ ...fullConfig, captureUnhandled: false });
      const cb = vi.fn<() => void>();
      capture.onChange(cb);
      capture.start();
      console.error("notify");
      expect(cb).toHaveBeenCalledOnce();
      expect(cb.mock.calls[0][0]).toHaveLength(1);
    });

    it("provides snapshot (copy) of errors array", () => {
      capture = new ConsoleCapture({ ...fullConfig, captureUnhandled: false });
      let snapshot: any[] = [];
      capture.onChange((errors) => {
        snapshot = errors;
      });
      capture.start();
      console.error("snap");
      snapshot.length = 0;
      expect(capture.getErrors()).toHaveLength(1);
    });

    it("unsubscribe function removes listener", () => {
      capture = new ConsoleCapture({ ...fullConfig, captureUnhandled: false });
      const cb = vi.fn<() => void>();
      const unsub = capture.onChange(cb);
      unsub();
      capture.start();
      console.error("no-notify");
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe("clear", () => {
    it("removes all errors and notifies listeners", () => {
      capture = new ConsoleCapture({ ...fullConfig, captureUnhandled: false });
      const cb = vi.fn<() => void>();
      capture.onChange(cb);
      capture.start();
      console.error("to-clear");
      cb.mockClear();
      capture.clear();
      expect(capture.getErrors()).toHaveLength(0);
      expect(cb).toHaveBeenCalledWith([]);
    });
  });

  describe("getErrors", () => {
    it("returns a copy of the errors array", () => {
      capture = new ConsoleCapture({ ...fullConfig, captureUnhandled: false });
      capture.start();
      console.error("copy");
      const a = capture.getErrors();
      const b = capture.getErrors();
      expect(a).toEqual(b);
      expect(a).not.toBe(b);
    });
  });
});

describe("resolveErrorSource", () => {
  it("returns componentStack[0] filePath and line when available", () => {
    const result = resolveErrorSource({
      id: 1,
      type: "vue",
      message: "err",
      count: 1,
      timestamp: 0,
      componentStack: [{ name: "App", filePath: "App.vue", line: 10 }],
    });
    expect(result).toEqual({ file: "App.vue", line: 10 });
  });

  it("returns sourceFile with URL path extraction when no componentStack", () => {
    const result = resolveErrorSource({
      id: 1,
      type: "runtime",
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
    const result = resolveErrorSource({
      id: 1,
      type: "runtime",
      message: "err",
      count: 1,
      timestamp: 0,
    });
    expect(result).toBeNull();
  });
});
