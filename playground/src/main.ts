import { createApp } from "vue";
import { createVueGrab } from "@sakana-y/vue-grab";
import App from "./App.vue";
import "./style.css";

const app = createApp(App);
app.use(
  createVueGrab({
    floatingButton: { enabled: true },
    consoleCapture: { enabled: true },
  }),
);
app.mount("#app");
