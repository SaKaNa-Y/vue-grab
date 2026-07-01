import { mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import type { CapturedLog, LogLevel } from "@sakana-y/vue-grab-shared";

import { createFabStore, FAB_STORE_KEY, type FabStore } from "../src/floating-button/app/store";
import LogsPanel from "../src/floating-button/panels/LogsPanel.vue";

function makeLog(
  level: LogLevel,
  message: string,
  overrides: Partial<CapturedLog> = {},
): CapturedLog {
  return {
    id: Math.floor(Math.random() * 1e9),
    level,
    message,
    source: "console",
    timestamp: Date.now(),
    count: 1,
    ...overrides,
  } as CapturedLog;
}

let wrapper: VueWrapper | null = null;

function mountPanel(store: FabStore): VueWrapper {
  wrapper = mount(LogsPanel, {
    global: { provide: { [FAB_STORE_KEY as symbol]: store } },
  });
  return wrapper;
}

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
});

const rows = (w: VueWrapper) => w.findAll('[data-testid="log-row"]');

describe("LogsPanel.vue", () => {
  it("shows an empty state and hides search when no logs are captured", () => {
    const store = createFabStore("");
    const w = mountPanel(store);

    expect(w.find('[data-testid="logs-empty"]').exists()).toBe(true);
    expect(w.find('[data-testid="logs-search"]').exists()).toBe(false);
    expect(w.find('[data-testid="logs-meta"]').text()).toContain("No entries yet");
  });

  it("renders one row per captured log with the message", () => {
    const store = createFabStore("");
    store.logs.value = [makeLog("warn", "hello world", { count: 4 })];
    const w = mountPanel(store);

    expect(rows(w)).toHaveLength(1);
    expect(w.find('[data-testid="log-row"]').text()).toContain("hello world");
    expect(w.find('[data-testid="log-row"]').text()).toContain("×4");
  });

  it("filters rows by search substring", async () => {
    const store = createFabStore("");
    store.logs.value = [makeLog("log", "foo bar"), makeLog("log", "baz qux")];
    const w = mountPanel(store);

    await w.find('[data-testid="logs-search"] input').setValue("foo");
    expect(rows(w)).toHaveLength(1);
    expect(w.find('[data-testid="log-row"]').text()).toContain("foo bar");
  });

  it("expands only the clicked row's details", async () => {
    const store = createFabStore("");
    store.logs.value = [
      makeLog("error", "first", { stack: "Error: first", timestamp: 2 }),
      makeLog("error", "second", { stack: "Error: second", timestamp: 1 }),
    ];
    const w = mountPanel(store);

    expect(w.findAll('[data-testid="log-row-details"]')).toHaveLength(0);
    await rows(w)[0].find('[data-testid="log-row-header"]').trigger("click");
    await nextTick();

    const details = w.findAll('[data-testid="log-row-details"]');
    expect(details).toHaveLength(1);
    expect(details[0].text()).toContain("Error: first");
  });

  it("invokes the clear handler registered on the store", async () => {
    const store = createFabStore("");
    const spy = vi.fn<() => void>();
    store.onClearLogs(spy);
    store.logs.value = [makeLog("error", "x")];
    const w = mountPanel(store);

    await w.find('[data-testid="logs-clear"]').trigger("click");
    expect(spy).toHaveBeenCalledOnce();
  });
});
