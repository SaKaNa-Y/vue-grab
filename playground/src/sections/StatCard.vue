<script setup lang="ts">
defineProps<{
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
}>();
</script>

<template>
  <div class="stat-card">
    <div class="stat-label">{{ label }}</div>
    <div class="stat-value">{{ value }}</div>
    <div class="stat-delta" :class="trend">
      <span>{{ trend === "up" ? "↑" : "↓" }}</span>
      {{ delta }}
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-soft);
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  margin: 6px 0 2px;
}

.stat-delta {
  font-size: 12px;
  font-weight: 500;
}

.stat-delta.up {
  color: var(--success);
}

.stat-delta.down {
  color: var(--danger);
}
</style>
