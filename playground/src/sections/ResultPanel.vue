<script setup lang="ts">
import { useGrab, openInEditor } from "@sakana-y/vue-grab";

const { lastResult } = useGrab();
</script>

<template>
  <section v-if="lastResult" id="result" class="section result">
    <h2>Last grab result</h2>

    <dl class="kv">
      <dt>Selector</dt>
      <dd>
        <code>{{ lastResult.selector }}</code>
      </dd>

      <dt>Tag</dt>
      <dd>
        <code>&lt;{{ lastResult.element.tagName.toLowerCase() }}&gt;</code>
      </dd>

      <dt v-if="lastResult.componentStack.length">Component stack</dt>
      <dd v-if="lastResult.componentStack.length">
        <ul class="stack">
          <li v-for="comp in lastResult.componentStack" :key="comp.name + (comp.filePath ?? '')">
            <strong>{{ comp.name }}</strong>
            <button
              v-if="comp.filePath"
              class="editor-link"
              @click="openInEditor(comp.filePath!, comp.line)"
            >
              {{ comp.filePath }}{{ comp.line ? `:${comp.line}` : "" }}
            </button>
          </li>
        </ul>
      </dd>
    </dl>

    <details>
      <summary>HTML</summary>
      <pre>{{ lastResult.html }}</pre>
    </details>
  </section>
</template>

<style scoped>
.result {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.kv {
  display: grid;
  grid-template-columns: max-content 1fr;
  column-gap: 16px;
  row-gap: 6px;
  margin: 0 0 12px;
  font-size: 13px;
}

.kv dt {
  color: var(--text-muted);
  font-weight: 600;
}

.kv dd {
  margin: 0;
}

.stack {
  margin: 0;
  padding-left: 18px;
}

.stack li {
  margin-bottom: 4px;
}

.editor-link {
  border: 0;
  background: none;
  color: var(--primary);
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
  font-family: "SFMono-Regular", Consolas, monospace;
  padding: 0;
  margin-left: 8px;
}

pre {
  max-height: 240px;
  overflow: auto;
  background: white;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid var(--border);
  font-size: 12px;
}

summary {
  cursor: pointer;
  font-size: 13px;
  color: var(--text-muted);
}
</style>
