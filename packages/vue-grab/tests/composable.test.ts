import { describe, it, expect, afterEach } from "vitest";
import { defineComponent, h } from "vue";
import { mount, type VueWrapper } from "@vue/test-utils";
import { DEFAULT_HIGHLIGHT_COLOR } from "@sakana-y/vue-grab-shared";
import { createVueGrab } from "../src";
import { useGrab, type UseGrabReturn } from "../src/composables";
import { OVERLAY_HOST_ID } from "../src/overlay";
import { FAB_HOST_ID } from "../src/floating-button";
import { cleanupDOM } from "./helpers/setup";

function mountWithGrab(pluginOptions = {}) {
  let grab!: UseGrabReturn;

  const Comp = defineComponent({
    setup() {
      grab = useGrab();
      return () => null;
    },
  });

  const wrapper = mount(Comp, {
    global: { plugins: [createVueGrab(pluginOptions)] },
  });

  return { wrapper, grab };
}

function mountGrabPair(pluginOptions?: Parameters<typeof createVueGrab>[0]) {
  const grabs: UseGrabReturn[] = [];

  const Child = defineComponent({
    setup() {
      grabs.push(useGrab());
      return () => null;
    },
  });

  const Parent = defineComponent({
    setup() {
      return () => h("div", [h(Child), h(Child)]);
    },
  });

  const wrapper = mount(
    Parent,
    pluginOptions ? { global: { plugins: [createVueGrab(pluginOptions)] } } : {},
  );

  return { wrapper, grabs };
}

describe("useGrab", () => {
  let wrapper: VueWrapper | undefined;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    cleanupDOM();
  });

  it("returns config, isActive, lastResult, activate, deactivate, toggle", () => {
    const result = mountWithGrab();
    wrapper = result.wrapper;
    expect(result.grab.config).toBeDefined();
    expect(result.grab.isActive).toBeDefined();
    expect(result.grab.lastResult).toBeDefined();
    expect(typeof result.grab.activate).toBe("function");
    expect(typeof result.grab.deactivate).toBe("function");
    expect(typeof result.grab.toggle).toBe("function");
  });

  it("isActive is initially false", () => {
    const result = mountWithGrab();
    wrapper = result.wrapper;
    expect(result.grab.isActive.value).toBe(false);
  });

  it("lastResult is initially null", () => {
    const result = mountWithGrab();
    wrapper = result.wrapper;
    expect(result.grab.lastResult.value).toBeNull();
  });

  it("activate makes isActive true", () => {
    const result = mountWithGrab();
    wrapper = result.wrapper;
    result.grab.activate();
    expect(result.grab.isActive.value).toBe(true);
  });

  it("deactivate makes isActive false", () => {
    const result = mountWithGrab();
    wrapper = result.wrapper;
    result.grab.activate();
    result.grab.deactivate();
    expect(result.grab.isActive.value).toBe(false);
  });

  it("toggle toggles isActive", () => {
    const result = mountWithGrab();
    wrapper = result.wrapper;
    result.grab.toggle();
    expect(result.grab.isActive.value).toBe(true);
    result.grab.toggle();
    expect(result.grab.isActive.value).toBe(false);
  });

  it("uses injected config when plugin is installed", () => {
    const result = mountWithGrab({ highlightColor: "#ff0000" });
    wrapper = result.wrapper;
    expect(result.grab.config.highlightColor).toBe("#ff0000");
  });

  it("uses DEFAULT_CONFIG when no plugin is installed", () => {
    let grab!: UseGrabReturn;

    const Comp = defineComponent({
      setup() {
        grab = useGrab();
        return () => null;
      },
    });

    // Mount WITHOUT the plugin
    wrapper = mount(Comp);
    expect(grab.config.highlightColor).toBe(DEFAULT_HIGHLIGHT_COLOR);
  });

  it("shares plugin state across multiple useGrab calls", () => {
    const result = mountGrabPair({
      floatingButton: { enabled: true },
      consoleCapture: { enabled: false },
      networkCapture: { enabled: false },
      magnifier: { enabled: false },
      measurer: { enabled: false },
    });
    wrapper = result.wrapper;

    expect(result.grabs).toHaveLength(2);
    expect(document.querySelectorAll(`#${FAB_HOST_ID}`)).toHaveLength(1);

    result.grabs[0].activate();
    expect(result.grabs[0].isActive.value).toBe(true);
    expect(result.grabs[1].isActive.value).toBe(true);

    result.grabs[1].deactivate();
    expect(result.grabs[0].isActive.value).toBe(false);
    expect(result.grabs[1].isActive.value).toBe(false);
  });

  it("shares the fallback context when no plugin is installed", () => {
    const result = mountGrabPair();
    wrapper = result.wrapper;

    result.grabs[0].activate();
    expect(result.grabs[1].isActive.value).toBe(true);

    wrapper.unmount();
    expect(document.getElementById(OVERLAY_HOST_ID)).toBeNull();
    wrapper = undefined;
  });

  it("cleans up on unmount", () => {
    const result = mountWithGrab();
    wrapper = result.wrapper;
    result.grab.activate();
    expect(document.getElementById(OVERLAY_HOST_ID)).not.toBeNull();

    wrapper.unmount();
    expect(document.getElementById(OVERLAY_HOST_ID)).toBeNull();
    wrapper = undefined;
  });
});
