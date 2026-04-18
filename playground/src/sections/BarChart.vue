<script setup lang="ts">
const bars = [
  { label: "Mon", value: 42 },
  { label: "Tue", value: 68 },
  { label: "Wed", value: 55 },
  { label: "Thu", value: 81 },
  { label: "Fri", value: 73 },
  { label: "Sat", value: 34 },
  { label: "Sun", value: 49 },
];
const max = Math.max(...bars.map((b) => b.value));
</script>

<template>
  <div class="bar-chart">
    <div class="bar-chart-title">Weekly visits</div>
    <div class="bars">
      <div v-for="bar in bars" :key="bar.label" class="bar-slot">
        <div class="bar" :style="{ height: (bar.value / max) * 100 + '%' }">
          <span class="bar-value">{{ bar.value }}</span>
        </div>
        <div class="bar-label">{{ bar.label }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bar-chart {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-soft);
}

.bar-chart-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-muted);
}

.bars {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  height: 140px;
}

.bar-slot {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  height: 100%;
}

.bar {
  width: 100%;
  background: linear-gradient(180deg, var(--primary), #8b5cf6);
  border-radius: 4px 4px 0 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 4px;
  min-height: 8px;
}

.bar-value {
  color: white;
  font-size: 10px;
  font-weight: 600;
}

.bar-label {
  font-size: 11px;
  color: var(--text-muted);
}
</style>
