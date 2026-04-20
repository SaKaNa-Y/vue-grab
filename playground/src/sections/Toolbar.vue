<script setup lang="ts">
import { useGrab } from "@sakana-y/vue-grab";

const { isActive, toggle, isMeasurerActive, toggleMeasurer } = useGrab();

function emitLog() {
  console.log("Playground log at", new Date().toISOString());
}
function emitInfo() {
  console.info("Info message: user clicked the info button");
}
function emitWarn() {
  console.warn("Deprecated API call — please migrate");
}
function emitError() {
  console.error(new Error("Simulated error from playground"));
}
function throwRuntime() {
  setTimeout(() => {
    throw new Error("Uncaught runtime error (window.onerror)");
  }, 0);
}
function rejectPromise() {
  void Promise.reject(new Error("Unhandled promise rejection"));
}

function netFetch200() {
  void fetch("/__vg_demo/ok");
}
function netFetch404() {
  void fetch("/__vg_demo/404");
}
function netFetch500() {
  void fetch("/__vg_demo/500");
}
function netFetchFail() {
  void fetch("https://vg-unreachable.invalid/").catch(() => {});
}
function netFetchPostJson() {
  void fetch("/__vg_demo/ok", {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: "Bearer demo-secret" },
    body: JSON.stringify({ click: Date.now() }),
  });
}
function netXhr() {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "/__vg_demo/ok");
  xhr.send();
}
</script>

<template>
  <section id="toolbar" class="section">
    <h2>Toolbar</h2>
    <p class="section-sub">
      Grab elements, measure spacing, and exercise the console capture buffer.
    </p>

    <div class="toolbar-row">
      <button class="btn btn-primary" @click="toggle">
        {{ isActive ? "Cancel Grab" : "Start Grab" }}
      </button>
      <kbd>Alt+Shift+G</kbd>

      <button class="btn btn-accent" @click="toggleMeasurer">
        {{ isMeasurerActive ? "Stop Measuring" : "Start Measure" }}
      </button>
      <kbd>Alt+Shift+M</kbd>
    </div>

    <div v-if="isActive" class="hint hint-primary">Hover any element, click to grab.</div>
    <div v-else-if="isMeasurerActive" class="hint hint-accent">
      Click one element, then hover another to measure spacing.
    </div>

    <h3>Exercise console capture</h3>
    <p class="section-sub">
      Each button pushes to the FAB logs panel — open the floating button to inspect.
    </p>
    <div class="toolbar-row">
      <button class="btn" @click="emitLog">console.log</button>
      <button class="btn" @click="emitInfo">console.info</button>
      <button class="btn btn-warn" @click="emitWarn">console.warn</button>
      <button class="btn btn-danger" @click="emitError">console.error</button>
      <button class="btn btn-danger" @click="throwRuntime">Throw runtime error</button>
      <button class="btn btn-danger" @click="rejectPromise">Unhandled rejection</button>
    </div>

    <h3>Exercise network capture</h3>
    <p class="section-sub">
      Each button triggers a request — open the floating button's network panel to inspect.
    </p>
    <div class="toolbar-row">
      <button class="btn" @click="netFetch200">fetch 200</button>
      <button class="btn btn-warn" @click="netFetch404">fetch 404</button>
      <button class="btn btn-danger" @click="netFetch500">fetch 500</button>
      <button class="btn btn-danger" @click="netFetchFail">fetch (network error)</button>
      <button class="btn" @click="netFetchPostJson">POST JSON (auth redacted)</button>
      <button class="btn" @click="netXhr">XHR GET</button>
    </div>
  </section>
</template>

<style scoped>
.toolbar-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}

h3 {
  margin: 20px 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.hint {
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 12px;
}

.hint-primary {
  background: #eef2ff;
  color: var(--primary);
}

.hint-accent {
  background: #ecfeff;
  color: var(--accent);
}
</style>
