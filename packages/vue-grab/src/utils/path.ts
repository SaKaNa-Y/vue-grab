declare const __VUE_GRAB_ROOT__: string | undefined;

function readInjectedRoot(): string | undefined {
  // Runtime global takes precedence so tests can override without rebuilding.
  const g = (globalThis as { __VUE_GRAB_ROOT__?: unknown }).__VUE_GRAB_ROOT__;
  if (typeof g === "string" && g.length > 0) return g;
  try {
    return typeof __VUE_GRAB_ROOT__ === "string" && __VUE_GRAB_ROOT__.length > 0
      ? __VUE_GRAB_ROOT__
      : undefined;
  } catch {
    return undefined;
  }
}

function toPosix(p: string): string {
  return p.replace(/\\/g, "/");
}

function stripTrailingSlash(p: string): string {
  return p.endsWith("/") ? p.slice(0, -1) : p;
}

function isCaseInsensitiveRoot(root: string): boolean {
  return /^[a-z]:\//i.test(root) || root.startsWith("//");
}

/**
 * Normalize a project root to a posix path without trailing slash.
 * Exported so the Vite plugin can use the same rules as the runtime.
 */
export function normalizeRoot(root: string): string {
  return stripTrailingSlash(toPosix(root));
}

/**
 * Convert an absolute `__file` path to a project-relative path like `src/App.vue`.
 *
 * Falls back to the input unchanged when:
 * - `__VUE_GRAB_ROOT__` is not injected (consumer didn't install the Vite plugin)
 * - the path doesn't start with the project root
 */
export function toRelativePath(absPath: string | undefined): string {
  if (!absPath) return "";
  const root = readInjectedRoot();
  if (!root) return absPath;

  const posixPath = toPosix(absPath);
  const posixRoot = normalizeRoot(root);
  const caseInsensitive = isCaseInsensitiveRoot(posixRoot);

  const comparablePath = caseInsensitive ? posixPath.toLowerCase() : posixPath;
  const comparableRoot = caseInsensitive ? posixRoot.toLowerCase() : posixRoot;

  if (comparablePath === comparableRoot) return "";
  const prefix = comparableRoot + "/";
  if (comparablePath.startsWith(prefix)) {
    return posixPath.slice(prefix.length);
  }
  return absPath;
}
