import { afterEach, describe, expect, it, vi } from "vitest";
import type { NetworkCaptureConfig } from "@sakana-y/vue-grab-shared";
import { DEFAULT_NETWORK_CAPTURE } from "@sakana-y/vue-grab-shared";
import { NetworkCapture } from "../../src/utils/network-capture";

function makeConfig(overrides: Partial<NetworkCaptureConfig> = {}): NetworkCaptureConfig {
  return {
    ...DEFAULT_NETWORK_CAPTURE,
    redactHeaders: [...DEFAULT_NETWORK_CAPTURE.redactHeaders],
    urlDenyList: [...DEFAULT_NETWORK_CAPTURE.urlDenyList],
    grabSnapshot: { ...DEFAULT_NETWORK_CAPTURE.grabSnapshot },
    ...overrides,
  };
}

const originalFetch = window.fetch;

function mockFetch(
  response: (url: string, init?: RequestInit) => Response | Promise<Response>,
): void {
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    return Promise.resolve(response(url, init));
  }) as typeof window.fetch;
}

function restoreFetch(): void {
  window.fetch = originalFetch;
}

describe("NetworkCapture", () => {
  let capture: NetworkCapture;

  afterEach(() => {
    capture?.destroy();
    restoreFetch();
    vi.restoreAllMocks();
  });

  describe("fetch patching", () => {
    it("captures a successful JSON response with status 2xx", async () => {
      mockFetch(
        () =>
          new Response(JSON.stringify({ hi: 1 }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
      );
      capture = new NetworkCapture(makeConfig({ captureBodies: true }));
      capture.start();

      await fetch("/api/ok");
      const entries = capture.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].initiator).toBe("fetch");
      expect(entries[0].method).toBe("GET");
      expect(entries[0].url).toBe("/api/ok");
      expect(entries[0].status).toBe(200);
      expect(entries[0].statusClass).toBe("2xx");
      expect(entries[0].responseBody).toContain("hi");
    });

    it("classifies 4xx and 5xx correctly", async () => {
      mockFetch((url) => {
        const status = url.includes("404") ? 404 : 500;
        return new Response("oops", { status });
      });
      capture = new NetworkCapture(makeConfig());
      capture.start();

      await fetch("/api/404");
      await fetch("/api/500");
      const entries = capture.getEntries();
      const classes = entries.map((e) => e.statusClass);
      expect(classes).toContain("4xx");
      expect(classes).toContain("5xx");
    });

    it("classifies a rejected fetch as failed and rethrows", async () => {
      window.fetch = (() => Promise.reject(new Error("net down"))) as typeof window.fetch;
      capture = new NetworkCapture(makeConfig());
      capture.start();

      await expect(fetch("/api/gone")).rejects.toThrow("net down");
      const entries = capture.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].statusClass).toBe("failed");
      expect(entries[0].error).toBe("net down");
    });

    it("does not consume the caller's response body", async () => {
      mockFetch(
        () =>
          new Response("payload", {
            status: 200,
            headers: { "content-type": "text/plain" },
          }),
      );
      capture = new NetworkCapture(makeConfig());
      capture.start();

      const res = await fetch("/api/text");
      const body = await res.text();
      expect(body).toBe("payload");
    });
  });

  describe("body handling", () => {
    it("truncates large response bodies at bodyMaxBytes", async () => {
      const big = "x".repeat(5000);
      mockFetch(
        () =>
          new Response(big, {
            status: 200,
            headers: { "content-type": "text/plain" },
          }),
      );
      capture = new NetworkCapture(makeConfig({ captureBodies: true, bodyMaxBytes: 100 }));
      capture.start();

      await fetch("/api/big");
      const entries = capture.getEntries();
      expect(entries[0].responseBody!.length).toBeLessThanOrEqual(101);
    });

    it("skips response body for binary content types", async () => {
      mockFetch(
        () =>
          new Response(new Uint8Array([1, 2, 3]), {
            status: 200,
            headers: { "content-type": "application/octet-stream" },
          }),
      );
      capture = new NetworkCapture(makeConfig());
      capture.start();

      await fetch("/api/bin");
      const entries = capture.getEntries();
      expect(entries[0].responseBody).toBeUndefined();
    });

    it("captures request body when captureBodies is true", async () => {
      mockFetch(() => new Response("ok", { status: 200 }));
      capture = new NetworkCapture(makeConfig({ captureBodies: true }));
      capture.start();

      await fetch("/api/post", { method: "POST", body: JSON.stringify({ a: 1 }) });
      const entries = capture.getEntries();
      expect(entries[0].requestBody).toContain("a");
    });

    it("omits bodies when captureBodies is false", async () => {
      mockFetch(
        () =>
          new Response("text", {
            status: 200,
            headers: { "content-type": "text/plain" },
          }),
      );
      capture = new NetworkCapture(makeConfig({ captureBodies: false }));
      capture.start();

      await fetch("/api/nobody", { method: "POST", body: "hidden" });
      const entries = capture.getEntries();
      expect(entries[0].requestBody).toBeUndefined();
      expect(entries[0].responseBody).toBeUndefined();
    });
  });

  describe("header redaction", () => {
    it("redacts configured request headers (case-insensitive)", async () => {
      mockFetch(() => new Response("", { status: 200 }));
      capture = new NetworkCapture(makeConfig());
      capture.start();

      await fetch("/api/auth", {
        headers: { Authorization: "Bearer secret", "X-API-KEY": "abc" },
      });
      const entries = capture.getEntries();
      expect(entries[0].requestHeaders!.Authorization).toBe("[redacted]");
      expect(entries[0].requestHeaders!["X-API-KEY"]).toBe("[redacted]");
    });

    it("redacts a custom configured response header", async () => {
      mockFetch(
        () =>
          new Response("", {
            status: 200,
            headers: { "x-api-key": "leak", "content-type": "text/plain" },
          }),
      );
      capture = new NetworkCapture(makeConfig({ redactHeaders: ["x-api-key"] }));
      capture.start();

      await fetch("/api/respheaders");
      const entries = capture.getEntries();
      expect(entries[0].responseHeaders?.["x-api-key"]).toBe("[redacted]");
    });
  });

  describe("URL deny list", () => {
    it("skips URLs matching deny list entries", async () => {
      const spy = vi.fn<() => Response>(() => new Response("", { status: 200 }));
      mockFetch(spy);
      capture = new NetworkCapture(makeConfig({ urlDenyList: ["/__open-in-editor", "/private"] }));
      capture.start();

      await fetch("/__open-in-editor?file=x");
      await fetch("/private/data");
      await fetch("/api/public");

      expect(spy).toHaveBeenCalledTimes(3); // all requests still go through
      const entries = capture.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].url).toBe("/api/public");
    });
  });

  describe("deduplication", () => {
    it("increments count for identical method+url+statusClass", async () => {
      mockFetch(() => new Response("", { status: 200 }));
      capture = new NetworkCapture(makeConfig());
      capture.start();

      await fetch("/api/poll");
      await fetch("/api/poll");
      await fetch("/api/poll");

      const entries = capture.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].count).toBe(3);
    });

    it("treats different status classes as separate entries", async () => {
      let count = 0;
      mockFetch(() => new Response("", { status: count++ === 0 ? 200 : 500 }));
      capture = new NetworkCapture(makeConfig());
      capture.start();

      await fetch("/api/flap");
      await fetch("/api/flap");

      const entries = capture.getEntries();
      expect(entries).toHaveLength(2);
    });
  });

  describe("ring buffer", () => {
    it("evicts oldest when exceeding maxEntries", async () => {
      mockFetch(() => new Response("", { status: 200 }));
      capture = new NetworkCapture(makeConfig({ maxEntries: 3 }));
      capture.start();

      // Distinct URLs to avoid dedup — sequential so insertion order is deterministic
      await fetch("/api/n/0");
      await fetch("/api/n/1");
      await fetch("/api/n/2");
      await fetch("/api/n/3");
      await fetch("/api/n/4");

      const entries = capture.getEntries();
      expect(entries).toHaveLength(3);
      expect(entries[0].url).toBe("/api/n/2");
      expect(entries[2].url).toBe("/api/n/4");
    });
  });

  describe("snapshot for grab", () => {
    it("returns only entries within windowMs, capped at maxEntries", async () => {
      mockFetch(() => new Response("", { status: 200 }));
      capture = new NetworkCapture(
        makeConfig({ grabSnapshot: { enabled: true, maxEntries: 2, windowMs: 10_000 } }),
      );
      capture.start();

      await fetch("/api/s/0");
      await fetch("/api/s/1");
      await fetch("/api/s/2");
      await fetch("/api/s/3");
      await fetch("/api/s/4");
      const snap = capture.getSnapshotForGrab();
      expect(snap).toHaveLength(2);
      expect(snap[1].url).toBe("/api/s/4");
    });

    it("returns empty when grabSnapshot is disabled", async () => {
      mockFetch(() => new Response("", { status: 200 }));
      capture = new NetworkCapture(
        makeConfig({ grabSnapshot: { enabled: false, maxEntries: 20, windowMs: 10_000 } }),
      );
      capture.start();

      await fetch("/api/any");
      expect(capture.getSnapshotForGrab()).toEqual([]);
    });
  });

  describe("listeners", () => {
    it("notifies onChange subscribers and unsubscribes on cleanup", async () => {
      mockFetch(() => new Response("", { status: 200 }));
      capture = new NetworkCapture(makeConfig());
      capture.start();

      const cb = vi.fn<() => void>();
      const unsub = capture.onChange(cb);
      await fetch("/api/a");
      expect(cb).toHaveBeenCalledTimes(1);

      unsub();
      await fetch("/api/b");
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it("clear() empties entries and notifies", async () => {
      mockFetch(() => new Response("", { status: 200 }));
      capture = new NetworkCapture(makeConfig());
      capture.start();
      const cb = vi.fn<() => void>();
      capture.onChange(cb);

      await fetch("/api/z");
      capture.clear();
      expect(capture.getEntries()).toHaveLength(0);
      expect(cb).toHaveBeenLastCalledWith([]);
    });
  });

  describe("lifecycle", () => {
    it("destroy() restores window.fetch", async () => {
      const marker = originalFetch;
      mockFetch(() => new Response("", { status: 200 }));
      const sinceMock = window.fetch;
      capture = new NetworkCapture(makeConfig());
      capture.start();
      expect(window.fetch).not.toBe(sinceMock);
      capture.destroy();
      expect(window.fetch).toBe(sinceMock);
      // Ensure the original is still reachable via restoreFetch
      window.fetch = marker;
    });

    it("double-start is a no-op", () => {
      mockFetch(() => new Response("", { status: 200 }));
      capture = new NetworkCapture(makeConfig());
      capture.start();
      const wrapped = window.fetch;
      capture.start();
      expect(window.fetch).toBe(wrapped);
    });
  });

  describe("XHR capture (smoke)", () => {
    it("records an entry with correct method/url/initiator for an XHR", async () => {
      capture = new NetworkCapture(makeConfig({ captureFetch: false }));
      capture.start();

      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve) => {
        xhr.addEventListener("loadend", () => resolve());
        xhr.open("GET", "/__vg_nonexistent_probe");
        xhr.send();
      });

      const entries = capture.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].initiator).toBe("xhr");
      expect(entries[0].method).toBe("GET");
      expect(entries[0].url).toBe("/__vg_nonexistent_probe");
    });
  });
});
