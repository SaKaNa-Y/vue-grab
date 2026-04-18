<script setup lang="ts">
const rows = Array.from({ length: 20 }, (_, i) => ({
  id: 1000 + i,
  user: ["alice", "bob", "charlie", "dana", "eli"][i % 5],
  action: ["login", "purchase", "signup", "logout"][i % 4],
  amount: (Math.round(Math.random() * 9000) / 100).toFixed(2),
  status: i % 3 === 0 ? "pending" : i % 3 === 1 ? "success" : "failed",
}));
</script>

<template>
  <section id="list" class="section">
    <h2>Event log</h2>
    <p class="section-sub">
      20 rows with identical spacing — handy for testing the measurer across repeated layouts.
    </p>

    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>User</th>
          <th>Action</th>
          <th>Amount</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <td>
            <code>#{{ row.id }}</code>
          </td>
          <td>{{ row.user }}</td>
          <td>{{ row.action }}</td>
          <td>${{ row.amount }}</td>
          <td>
            <span class="pill" :class="row.status">{{ row.status }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.table th,
.table td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--border);
  text-align: left;
}

.table th {
  background: var(--bg-soft);
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.05em;
}

.pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.pill.pending {
  background: #fef3c7;
  color: #92400e;
}

.pill.success {
  background: #d1fae5;
  color: #065f46;
}

.pill.failed {
  background: #fee2e2;
  color: #991b1b;
}

code {
  font-size: 12px;
  color: var(--text-muted);
}
</style>
