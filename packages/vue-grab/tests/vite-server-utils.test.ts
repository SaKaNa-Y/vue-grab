import { describe, expect, it } from "vitest";

import { OPEN_IN_EDITOR_CONTENT_TYPE } from "@sakana-y/vue-grab-shared";

import {
  hasEditorContentType,
  isSameOriginRequest,
  normalizeEditor,
  parseOpenInEditorPayload,
} from "../src/vite/server-utils";

describe("vite server utils", () => {
  it("accepts same-origin editor requests", () => {
    expect(
      isSameOriginRequest({
        headers: {
          origin: "http://localhost:5173",
          host: "localhost:5173",
          "sec-fetch-site": "same-origin",
        },
      }),
    ).toBe(true);
  });

  it("rejects cross-origin editor requests", () => {
    expect(
      isSameOriginRequest({
        headers: {
          origin: "http://evil.test",
          host: "localhost:5173",
          "sec-fetch-site": "cross-site",
        },
      }),
    ).toBe(false);
  });

  it("validates editor content type", () => {
    expect(
      hasEditorContentType({
        headers: { "content-type": `${OPEN_IN_EDITOR_CONTENT_TYPE}; charset=utf-8` },
      }),
    ).toBe(true);
  });

  it("parses open-in-editor payloads", () => {
    expect(parseOpenInEditorPayload({ file: "src/App.vue", line: 12, editor: "code" })).toEqual({
      file: "src/App.vue",
      line: 12,
      editor: "code",
    });
  });

  it("rejects unsupported editors", () => {
    expect(() => normalizeEditor("unsupported-editor")).toThrow("Unsupported editor");
  });
});
