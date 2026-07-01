import {
  ConfigProvider,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from "reka-ui";
import { afterEach, describe, expect, it } from "vitest";
import { createApp, defineComponent, h, ref } from "vue";

// Spike: prove antfu/reka-ui components can mount inside a shadow root and that
// portalled overlay content is teleported INTO the shadow root (via ConfigProvider
// teleportTo) rather than escaping to document.body. This gates ADR 0002's whole
// approach. If this fails, the architecture must change.

let host: HTMLElement | null = null;
let app: ReturnType<typeof createApp> | null = null;

afterEach(() => {
  app?.unmount();
  app = null;
  host?.remove();
  host = null;
});

describe("Vue + reka-ui inside a shadow root", () => {
  it("teleports portalled overlay content into the shadow root, not document.body", async () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });

    const mountEl = document.createElement("div");
    const teleportEl = document.createElement("div");
    teleportEl.id = "spike-teleport";
    shadow.appendChild(mountEl);
    shadow.appendChild(teleportEl);

    const Spike = defineComponent({
      setup() {
        const to = ref<HTMLElement>(teleportEl);
        return () =>
          h(ConfigProvider, { teleportTo: to.value }, () =>
            h(DropdownMenuRoot, { defaultOpen: true }, () => [
              h(DropdownMenuTrigger, () => "open"),
              h(DropdownMenuPortal, () =>
                h(DropdownMenuContent, () => [
                  h(DropdownMenuItem, { "data-testid": "spike-item" }, () => "hello"),
                ]),
              ),
            ]),
          );
      },
    });

    app = createApp(Spike);
    app.mount(mountEl);

    await new Promise((r) => requestAnimationFrame(() => r(null)));

    const inShadow = shadow.querySelector('[data-testid="spike-item"]');
    const inBody = document.body.querySelector('[data-testid="spike-item"]');

    // overlay content should render inside the shadow root, not escape to document.body
    expect(inShadow).not.toBeNull();
    expect(inBody).toBeNull();
  });
});
