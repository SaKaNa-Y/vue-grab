<script setup lang="ts">
import StatCard from "./StatCard.vue";
import BarChart from "./BarChart.vue";
</script>

<template>
  <section id="dashboard" class="section">
    <h2>Dashboard</h2>
    <p class="section-sub">
      Nested components (<code>Dashboard → StatCard</code>, <code>Dashboard → BarChart</code>) —
      grab any cell to see the component stack walk up through <code>__vueParentComponent</code>.
    </p>

    <div class="dash-grid">
      <StatCard label="Active users" value="12,483" delta="+4.2%" trend="up" />
      <StatCard label="Revenue" value="$48,210" delta="+12.6%" trend="up" />
      <StatCard label="Error rate" value="0.82%" delta="-0.3%" trend="down" />
      <StatCard label="Avg latency" value="142ms" delta="+8ms" trend="down" />
    </div>

    <div style="margin-top: 16px">
      <BarChart />
    </div>
  </section>
</template>

<style scoped>
.dash-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 640px) {
  .dash-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
