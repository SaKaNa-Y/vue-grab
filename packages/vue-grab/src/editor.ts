/**
 * Opens a file in the user's editor via the Vite dev server middleware.
 * Requires the `vueGrabPlugin()` Vite plugin to be configured.
 */
export async function openInEditor(
  filePath: string,
  line?: number,
  editor?: string,
): Promise<void> {
  try {
    const res = await fetch("/__open-in-editor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ file: filePath, line, editor }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`[vue-grab] Open in Editor failed (${res.status}): ${body}`);
    }
  } catch (err) {
    console.warn("[vue-grab] Open in Editor request failed:", err);
  }
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
