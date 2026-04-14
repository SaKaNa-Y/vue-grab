export function getComponentName(instance: any, fallback = ""): string {
  return instance?.type?.name || instance?.type?.__name || fallback;
}
