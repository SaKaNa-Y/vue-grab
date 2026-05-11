import type { ComponentInfo } from "@sakana-y/vue-grab-shared";
import { getComponentName, toRelativePath } from "../utils";

export type VueComponentInstance = any;

const shortPathCache = new WeakMap<object, string>();

export function getVueComponent(el: Element): VueComponentInstance | null {
  let node: Element | null = el;
  while (node) {
    const instance = getVueComponentOnElement(node);
    if (instance) return instance;
    node = node.parentElement;
  }
  return null;
}

function getVueComponentOnElement(el: Element): VueComponentInstance | null {
  return (el as any).__vueParentComponent || (el as any).__vue_app__?._instance || null;
}

export function getComponentLabelFromInstance(
  el: Element,
  instance: VueComponentInstance | null,
): string {
  const tag = getComponentName(instance, el.tagName.toLowerCase());
  let label = `<${tag}>`;
  if (instance) {
    const type = instance.type;
    if (type?.__file) {
      if (!shortPathCache.has(type)) {
        shortPathCache.set(type, toRelativePath(type.__file));
      }
      label += ` ${shortPathCache.get(type)}`;
    }
  }
  return label;
}

export function getComponentStack(el: Element): ComponentInfo[] {
  const stack: ComponentInfo[] = [];
  let node: Element | null = el;

  while (node) {
    const instance = getVueComponentOnElement(node);
    if (instance) {
      const name = getComponentName(instance, "Anonymous");
      const filePath = instance.type?.__file;
      const info: ComponentInfo = { name };
      if (filePath) info.filePath = filePath;
      stack.push(info);
    }
    node = node.parentElement;
  }

  return stack;
}
