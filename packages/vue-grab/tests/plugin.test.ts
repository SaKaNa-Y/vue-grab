import { describe, it, expect, afterEach, vi } from "vitest";
import { defineComponent, inject, nextTick, onUnmounted, ref } from "vue";
import { mount } from "@vue/test-utils";
import { DEFAULT_CONFIG, DEFAULT_HIGHLIGHT_COLOR } from "@sakana-y/vue-grab-shared";
import { createVueGrab, VUE_GRAB_CONFIG_KEY, VUE_GRAB_CONTEXT_KEY } from "../src";
import type { GrabConfig } from "@sakana-y/vue-grab-shared";
import { FAB_HOST_ID } from "../src/floating-button";
import { ConsoleCapture } from "../src/utils";
import { RenderScanCollector } from "../src/render-scan";
import type { VueGrabContext } from "../src/plugin";
import { cleanupDOM } from "./helpers/setup";

function mountAndInject(pluginOptions = {}): GrabConfig | undefined {
  let injected: GrabConfig | undefined;

  const Comp = defineComponent({
    setup() {
      injected = inject(VUE_GRAB_CONFIG_KEY);
      return () => null;
    },
  });

  const wrapper = mount(Comp, {
    global: { plugins: [createVueGrab(pluginOptions)] },
  });
  wrapper.unmount();

  return injected;
}

describe("createVueGrab", () => {
  afterEach(() => {
    vi.restoreAllMocks();
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

  it("captures console output during component mount lifecycle", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const Comp = defineComponent({
      setup() {
        console.warn("mount warning");
        return () => null;
      },
    });

    const wrapper = mount(Comp, {
      global: {
        plugins: [
          createVueGrab({
            floatingButton: {
              enabled: true,
              dockEntries: {
                order: [...DEFAULT_CONFIG.floatingButton.dockEntries.order],
                hidden: [],
              },
            },
            networkCapture: { enabled: false },
            magnifier: { enabled: false },
            measurer: { enabled: false },
          }),
        ],
      },
    });

    const badge = document
      .getElementById(FAB_HOST_ID)
      ?.shadowRoot?.querySelector<HTMLElement>(".logs-badge");
    expect(badge?.textContent).toBe("1");
    wrapper.unmount();
  });

  it("captures Vue errors during component unmount lifecycle", () => {
    const captureVueError = vi.spyOn(ConsoleCapture.prototype, "captureVueError");

    const Comp = defineComponent({
      setup() {
        onUnmounted(() => {
          throw new Error("unmount boom");
        });
        return () => null;
      },
    });

    const wrapper = mount(Comp, {
      global: {
        plugins: [
          createVueGrab({
            consoleCapture: { levels: [] },
            networkCapture: { enabled: false },
            magnifier: { enabled: false },
            measurer: { enabled: false },
          }),
        ],
      },
    });

    wrapper.unmount();

    expect(captureVueError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "unmount boom" }),
      expect.any(String),
      undefined,
    );
  });

  it("records component updates through the render scan mixin", async () => {
    const record = vi.spyOn(RenderScanCollector.prototype, "record");
    let toggleRenderScan!: () => void;

    const Comp = defineComponent({
      setup() {
        const count = ref(0);
        toggleRenderScan = inject(VUE_GRAB_CONTEXT_KEY)!.toggleRenderScan;
        return { count, increment: () => (count.value += 1) };
      },
      render() {
        return this.count;
      },
    });

    const wrapper = mount(Comp, {
      attachTo: document.body,
      global: {
        plugins: [
          createVueGrab({
            renderScan: { enabled: true },
            networkCapture: { enabled: false },
            magnifier: { enabled: false },
            measurer: { enabled: false },
          }),
        ],
      },
    });

    toggleRenderScan();
    (wrapper.vm as unknown as { increment: () => void }).increment();
    await nextTick();

    expect(record).toHaveBeenCalled();
    wrapper.unmount();
  });

  it("uses cached render scan references in the update mixin hot path", async () => {
    const record = vi.spyOn(RenderScanCollector.prototype, "record");
    let context!: VueGrabContext;

    const Comp = defineComponent({
      setup() {
        const count = ref(0);
        context = inject(VUE_GRAB_CONTEXT_KEY)!;
        return { count, increment: () => (count.value += 1) };
      },
      render() {
        return this.count;
      },
    });

    const wrapper = mount(Comp, {
      attachTo: document.body,
      global: {
        plugins: [
          createVueGrab({
            renderScan: { enabled: true },
            networkCapture: { enabled: false },
            magnifier: { enabled: false },
            measurer: { enabled: false },
          }),
        ],
      },
    });
    const ensureSession = vi.spyOn(context, "ensureSession");

    context.toggleRenderScan();
    ensureSession.mockClear();

    (wrapper.vm as unknown as { increment: () => void }).increment();
    await nextTick();

    expect(record).toHaveBeenCalled();
    expect(ensureSession).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("does not record render scan updates when disabled", async () => {
    const record = vi.spyOn(RenderScanCollector.prototype, "record");

    const Comp = defineComponent({
      setup() {
        const count = ref(0);
        return { count, increment: () => (count.value += 1) };
      },
      render() {
        return this.count;
      },
    });

    const wrapper = mount(Comp, {
      global: {
        plugins: [
          createVueGrab({
            renderScan: { enabled: false },
            networkCapture: { enabled: false },
            magnifier: { enabled: false },
            measurer: { enabled: false },
          }),
        ],
      },
    });

    (wrapper.vm as unknown as { increment: () => void }).increment();
    await nextTick();

    expect(record).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});
