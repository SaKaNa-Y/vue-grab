<script setup lang="ts">
import { ref } from "vue";

const name = ref("");
const email = ref("");
const subscribed = ref(false);
</script>

<template>
  <section id="forms" class="section">
    <h2>Forms &amp; a11y</h2>
    <p class="section-sub">
      Deliberately mixes good and broken accessibility patterns — open the FAB's a11y panel to see
      the violations picked up by <code>scanPageA11y()</code>.
    </p>

    <form class="form-grid" @submit.prevent>
      <!-- properly labeled -->
      <label class="field">
        <span>Name</span>
        <input v-model="name" type="text" placeholder="Jane Doe" />
      </label>

      <label class="field">
        <span>Email</span>
        <input v-model="email" type="email" placeholder="jane@example.com" />
      </label>

      <!-- unlabeled input (a11y violation) -->
      <div class="field">
        <input type="text" placeholder="Phone (unlabeled — intentional)" />
      </div>

      <!-- checkbox with aria -->
      <label class="field checkbox">
        <input v-model="subscribed" type="checkbox" />
        <span>Subscribe to updates</span>
      </label>

      <!-- icon button with no aria-label (a11y violation) -->
      <button type="button" class="icon-btn">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path fill="currentColor" d="M12 2 2 7v10l10 5 10-5V7zM4 8.24l8 4 8-4v7.52l-8 4-8-4z" />
        </svg>
      </button>

      <!-- image with no alt (a11y violation) -->
      <img
        src="data:image/svg+xml;utf8,&lt;svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'&gt;&lt;rect width='60' height='60' fill='%234f46e5'/&gt;&lt;/svg&gt;"
        width="60"
        height="60"
      />

      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Submit</button>
        <button type="reset" class="btn">Reset</button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
  align-items: end;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}

.field > span {
  color: var(--text-muted);
}

.field input[type="text"],
.field input[type="email"] {
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font: inherit;
}

.field.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: white;
  cursor: pointer;
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.form-actions {
  grid-column: 1 / -1;
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
</style>
