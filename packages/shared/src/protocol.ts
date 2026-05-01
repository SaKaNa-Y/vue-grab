export const OPEN_IN_EDITOR_ENDPOINT = "/__open-in-editor";
export const OPEN_IN_EDITOR_CONTENT_TYPE = "application/json";
export const OPEN_IN_EDITOR_REQUEST_MAX_BYTES = 8192;

export const VUE_GRAB_ROOT_GLOBAL = "__VUE_GRAB_ROOT__";

export const OPEN_IN_EDITOR_ALLOWED_EDITORS = [
  "atom",
  "code",
  "cursor",
  "emacs",
  "idea",
  "nvim",
  "phpstorm",
  "sublime",
  "vim",
  "visualstudio",
  "webstorm",
] as const;

export type OpenInEditorAllowedEditor = (typeof OPEN_IN_EDITOR_ALLOWED_EDITORS)[number];

export interface OpenInEditorRequest {
  file: string;
  line?: number;
  editor?: string;
}

export function isOpenInEditorAllowedEditor(value: unknown): value is OpenInEditorAllowedEditor {
  return (
    typeof value === "string" &&
    (OPEN_IN_EDITOR_ALLOWED_EDITORS as readonly string[]).includes(value)
  );
}
