import type { StyleUpdateRequest } from "@sakana-y/vue-grab-shared";

/**
 * Opens a file in the user's editor via the Vite dev server middleware.
 * Requires the `vueGrabPlugin()` Vite plugin to be configured.
 */
export function openInEditor(filePath: string, line?: number, editor?: string): void {
  const file = line ? `${filePath}:${line}` : filePath;
  const params = new URLSearchParams({ file });
  if (editor) params.set("editor", editor);
  fetch(`/__open-in-editor?${params}`);
}

/**
 * Sends a CSS property update to the Vite dev server,
 * which writes the change back to the Vue SFC source file.
 */
export function updateStyle(request: StyleUpdateRequest): Promise<boolean> {
  return fetch("/__vue-grab/update-style", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  }).then((r) => r.ok);
}

/**
 * Opens Claude Code in VS Code with the given prompt pre-filled via URI scheme.
 * Also copies the prompt to clipboard as a backup.
 */
export function openInClaudeCode(prompt: string): void {
  navigator.clipboard.writeText(prompt).catch(() => {});
  const uri = `vscode://anthropic.claude-code/open?prompt=${encodeURIComponent(prompt)}`;
  if (!window.open(uri, "_blank")) {
    location.href = uri;
  }
}
