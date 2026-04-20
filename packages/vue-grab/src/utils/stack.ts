const SOURCE_RE = /at\s+.*?\((.+?):(\d+):\d+\)|at\s+(.+?):(\d+):\d+$/;

export function extractSource(
  stack?: string,
  skip?: (frame: string) => boolean,
): { file?: string; line?: number } {
  if (!stack) return {};
  for (const line of stack.split("\n")) {
    if (skip?.(line)) continue;
    const m = line.match(SOURCE_RE);
    if (m) {
      return { file: m[1] ?? m[3], line: Number(m[2] ?? m[4]) };
    }
  }
  return {};
}

/**
 * Return the first parseable file URL from a stack trace, with any query
 * string stripped. Used at module-load time by callers that want to know
 * their own script URL so stack frames inside the same script can be
 * filtered out at runtime.
 */
export function firstFrameFile(stack?: string): string | undefined {
  if (!stack) return undefined;
  for (const line of stack.split("\n")) {
    const m = line.match(SOURCE_RE);
    if (m) {
      const file = m[1] ?? m[3];
      return file?.replace(/\?.*$/, "");
    }
  }
  return undefined;
}

/**
 * Normalize a URL-ish source file (e.g. "http://localhost/src/foo.ts?v=1")
 * to a repo-relative path for editor open.
 */
export function normalizeSourceFile(sourceFile: string): string {
  try {
    return new URL(sourceFile).pathname.replace(/^\//, "");
  } catch {
    return sourceFile.replace(/\?.*$/, "");
  }
}
