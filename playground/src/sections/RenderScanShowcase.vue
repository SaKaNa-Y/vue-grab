<script setup lang="ts">
import { computed, onMounted, onUnmounted, shallowRef } from "vue";
import { useGrab } from "@sakana-y/vue-grab";

const { isRenderScanActive, toggleRenderScan } = useGrab();
const tick = shallowRef(0);
const manualBursts = shallowRef(0);
const latency = shallowRef(94);
const queueDepth = shallowRef(18);
const conversion = shallowRef(6.8);
let intervalId: number | null = null;

const heartbeatLabel = computed(() => `${tick.value.toString().padStart(3, "0")} frames`);
const statusTone = computed(() => (tick.value % 5 === 0 ? "Warm" : "Steady"));
const metricCards = computed(() => [
  {
    label: "Latency",
    value: `${latency.value}ms`,
    tone: latency.value > 135 ? "danger" : "normal",
  },
  {
    label: "Queue",
    value: queueDepth.value.toString(),
    tone: queueDepth.value > 30 ? "warn" : "normal",
  },
  { label: "Conversion", value: `${conversion.value.toFixed(1)}%`, tone: "normal" },
]);

function advanceDemo() {
  tick.value += 1;
  latency.value = 82 + ((tick.value * 17) % 82);
  queueDepth.value = 12 + ((tick.value * 7 + manualBursts.value) % 34);
  conversion.value = 5.8 + ((tick.value + manualBursts.value) % 18) / 10;
}

function burst() {
  for (let i = 0; i < 4; i++) advanceDemo();
  manualBursts.value += 1;
}

onMounted(() => {
  intervalId = window.setInterval(advanceDemo, 900);
});

onUnmounted(() => {
  if (intervalId != null) window.clearInterval(intervalId);
});
</script>

<template>
  <section id="render-scan" class="section render-scan-demo">
    <div class="render-scan-heading">
      <div>
        <h2>Render Scan</h2>
        <p class="section-sub">
          Toggle the toolbar's Render Scan button, then interact with this section to inspect update
          activity in the panel and heatmap.
        </p>
      </div>
      <button class="btn btn-primary" @click="toggleRenderScan">
        {{ isRenderScanActive ? "Pause Render Scan" : "Start Render Scan" }}
      </button>
    </div>

    <div class="render-scan-grid">
      <div class="scan-console">
        <span class="console-kicker">Live update surface</span>
        <strong>{{ heartbeatLabel }}</strong>
        <span>{{ statusTone }} component traffic</span>
        <button class="btn btn-accent" @click="burst">Trigger burst</button>
      </div>

      <div class="scan-metrics">
        <div
          v-for="metric in metricCards"
          :key="metric.label"
          class="scan-metric"
          :class="`tone-${metric.tone}`"
        >
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
        </div>
      </div>
    </div>

    <pre class="scan-snippet"><code>createVueGrab({
  floatingButton: { enabled: true },
});</code></pre>
  </section>
</template>

<style scoped>
.render-scan-demo {
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(34, 211, 238, 0.08), transparent 32%),
    linear-gradient(315deg, rgba(79, 70, 229, 0.08), transparent 34%), var(--bg);
}

.render-scan-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.render-scan-heading h2 {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 600;
}

.render-scan-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  gap: 14px;
  margin-bottom: 14px;
}

.scan-console,
.scan-metric,
.scan-snippet {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 1px 0 rgba(17, 24, 39, 0.04);
}

.scan-console {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 180px;
  padding: 18px;
}

.console-kicker {
  color: var(--accent);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.scan-console strong {
  color: var(--text);
  font-size: 30px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.scan-console > span:last-of-type {
  color: var(--text-muted);
  font-size: 13px;
}

.scan-console .btn {
  align-self: flex-start;
  margin-top: auto;
}

.scan-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.scan-metric {
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
}

.scan-metric span {
  color: var(--text-muted);
  font-size: 12px;
}

.scan-metric strong {
  font-size: 26px;
  font-variant-numeric: tabular-nums;
}

.scan-metric.tone-warn {
  border-color: rgba(245, 158, 11, 0.45);
  background: rgba(255, 251, 235, 0.88);
}

.scan-metric.tone-danger {
  border-color: rgba(239, 68, 68, 0.38);
  background: rgba(254, 242, 242, 0.9);
}

.scan-snippet {
  margin: 0;
  padding: 12px 14px;
  overflow-x: auto;
}

.scan-snippet code {
  background: transparent;
  padding: 0;
  color: var(--text);
  font-size: 12px;
}

@media (max-width: 720px) {
  .render-scan-heading,
  .render-scan-grid {
    grid-template-columns: 1fr;
  }

  .render-scan-heading {
    flex-direction: column;
  }

  .scan-metrics {
    grid-template-columns: 1fr;
  }

  .scan-console,
  .scan-metric {
    min-height: 130px;
  }
}
</style>
