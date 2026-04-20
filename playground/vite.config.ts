import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { vueGrabPlugin } from "@sakana-y/vue-grab/vite";

// Vite 8 SPA-fallbacks every unknown path to 200 index.html, so we need
// dedicated middleware routes for the playground's network-capture demos.
const demoEndpoints = () => ({
  name: "playground:demo-endpoints",
  configureServer(server: any) {
    server.middlewares.use("/__vg_demo/404", (_req: any, res: any) => {
      res.statusCode = 404;
      res.setHeader("content-type", "text/plain");
      res.end("Not Found (playground demo)");
    });
    server.middlewares.use("/__vg_demo/500", (_req: any, res: any) => {
      res.statusCode = 500;
      res.setHeader("content-type", "text/plain");
      res.end("Internal Server Error (playground demo)");
    });
    server.middlewares.use("/__vg_demo/ok", (_req: any, res: any) => {
      res.statusCode = 200;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ ok: true, t: Date.now() }));
    });
  },
});

export default defineConfig({
  plugins: [vue(), vueGrabPlugin(), demoEndpoints()],
});
