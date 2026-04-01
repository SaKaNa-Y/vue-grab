import { describe, it, expect, afterEach } from "vitest";
import { defineComponent, inject } from "vue";
import { mount } from "@vue/test-utils";
import { DEFAULT_CONFIG, DEFAULT_HIGHLIGHT_COLOR } from "@sakana/vue-grab-shared";
import { createVueGrab, VUE_GRAB_CONFIG_KEY } from "../src";
import type { GrabConfig } from "@sakana/vue-grab-shared";
import { cleanupDOM } from "./helpers/setup";

function mountAndInject(pluginOptions = {}): GrabConfig | undefined {
  let injected: GrabConfig | undefined;

  const Comp = defineComponent({
    setup() {
      injected = inject(VUE_GRAB_CONFIG_KEY);
      return () => null;
    },
  });

  mount(Comp, {
    global: { plugins: [createVueGrab(pluginOptions)] },
  });

  return injected;
}

describe("createVueGrab", () => {
  afterEach(() => {
    cleanupDOM();
  });

  it("returns an object with an install function", () => {
    const plugin = createVueGrab();
    expect(plugin).toHaveProperty("install");
    expect(typeof plugin.install).toBe("function");
  });

  it("provides config via VUE_GRAB_CONFIG_KEY injection", () => {
    const injected = mountAndInject();
    expect(injected).toBeDefined();
    expect(injected!.highlightColor).toBe(DEFAULT_HIGHLIGHT_COLOR);
  });

  it("merges user options with DEFAULT_CONFIG", () => {
    const injected = mountAndInject({ highlightColor: "#ff0000" });
    expect(injected!.highlightColor).toBe("#ff0000");
    // Other defaults preserved
    expect(injected!.showTagHint).toBe(DEFAULT_CONFIG.showTagHint);
  });

  it("deep-merges filter options", () => {
    const injected = mountAndInject({
      filter: { ignoreSelectors: [".ignore"], ignoreTags: [], skipCommonComponents: false },
    });
    expect(injected!.filter.ignoreSelectors).toEqual([".ignore"]);
  });

  it("uses DEFAULT_CONFIG when no options provided", () => {
    const injected = mountAndInject();
    expect(injected).toEqual(DEFAULT_CONFIG);
  });
});
