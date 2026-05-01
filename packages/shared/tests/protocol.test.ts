import { describe, expect, it } from "vitest";
import {
  DEFAULT_URL_DENY_LIST,
  OPEN_IN_EDITOR_ALLOWED_EDITORS,
  OPEN_IN_EDITOR_CONTENT_TYPE,
  OPEN_IN_EDITOR_ENDPOINT,
  OPEN_IN_EDITOR_REQUEST_MAX_BYTES,
  VUE_GRAB_ROOT_GLOBAL,
  isOpenInEditorAllowedEditor,
} from "../src";

describe("protocol constants", () => {
  it("exports open-in-editor protocol values", () => {
    expect(OPEN_IN_EDITOR_ENDPOINT).toBe("/__open-in-editor");
    expect(OPEN_IN_EDITOR_CONTENT_TYPE).toBe("application/json");
    expect(OPEN_IN_EDITOR_REQUEST_MAX_BYTES).toBe(8192);
  });

  it("exports injected root protocol values", () => {
    expect(VUE_GRAB_ROOT_GLOBAL).toBe("__VUE_GRAB_ROOT__");
  });

  it("uses the open-in-editor endpoint in the default URL deny list", () => {
    expect(DEFAULT_URL_DENY_LIST).toContain(OPEN_IN_EDITOR_ENDPOINT);
  });
});

describe("isOpenInEditorAllowedEditor", () => {
  it("accepts every configured editor id", () => {
    for (const editor of OPEN_IN_EDITOR_ALLOWED_EDITORS) {
      expect(isOpenInEditorAllowedEditor(editor)).toBe(true);
    }
  });

  it("rejects unsupported or non-string editor values", () => {
    expect(isOpenInEditorAllowedEditor("notepad")).toBe(false);
    expect(isOpenInEditorAllowedEditor("")).toBe(false);
    expect(isOpenInEditorAllowedEditor(undefined)).toBe(false);
    expect(isOpenInEditorAllowedEditor(42)).toBe(false);
  });
});
