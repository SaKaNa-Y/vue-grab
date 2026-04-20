export function stringifyCircularSafe(
  value: unknown,
  replacer?: (key: string, val: unknown) => unknown,
): string {
  try {
    const seen = new WeakSet<object>();
    const json = JSON.stringify(value, (key, val) => {
      if (typeof val === "object" && val !== null) {
        if (seen.has(val as object)) return "[Circular]";
        seen.add(val as object);
      }
      return replacer ? replacer(key, val) : val;
    });
    return json === undefined ? String(value) : json;
  } catch {
    return "[Unserializable]";
  }
}
