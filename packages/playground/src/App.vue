<script setup lang="ts">
import HelloWorld from "./components/HelloWorld.vue";
import { useGrab, openInEditor } from "@sakana-y/vue-grab";

const { isActive, lastResult, toggle } = useGrab();
</script>

<template>
  <div style="padding: 20px; font-family: sans-serif; max-width: 800px; margin: 0 auto">
    <h1>Vue Grab Playground</h1>

    <div style="margin: 16px 0; display: flex; align-items: center; gap: 8px">
      <button
        @click="toggle"
        style="
          padding: 8px 16px;
          border: 1px solid #4f46e5;
          border-radius: 6px;
          background: #4f46e5;
          color: white;
          cursor: pointer;
          font-size: 14px;
        "
      >
        {{ isActive ? "Cancel Grab" : "Start Grab" }}
      </button>
      <kbd style="font-size: 12px; color: #6b7280">Alt+Shift+G</kbd>
      <span v-if="isActive" style="color: #4f46e5; font-size: 14px">
        Hover over elements and click to grab...
      </span>
    </div>

    <HelloWorld msg="Test component for vue-grab" />

    <section style="margin-top: 24px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px">
      <h2>Nested Elements</h2>
      <div class="card" style="padding: 12px; background: #f9fafb; border-radius: 6px">
        <p>A paragraph inside a card</p>
        <ul>
          <li>List item 1</li>
          <li>List item 2</li>
          <li>List item 3</li>
        </ul>
        <button style="padding: 4px 12px; border: 1px solid #d1d5db; border-radius: 4px">
          A nested button
        </button>
      </div>
    </section>

    <div
      v-if="lastResult"
      style="
        margin-top: 24px;
        padding: 16px;
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 8px;
      "
    >
      <h3 style="margin-top: 0">Grab Result</h3>
      <p>
        <strong>Selector:</strong> <code>{{ lastResult.selector }}</code>
      </p>
      <p><strong>Tag:</strong> {{ lastResult.element.tagName.toLowerCase() }}</p>
      <div v-if="lastResult.componentStack.length">
        <p><strong>Component Stack:</strong></p>
        <ul>
          <li v-for="comp in lastResult.componentStack" :key="comp.name">
            {{ comp.name }}
            <span
              v-if="comp.filePath"
              style="color: #4f46e5; font-size: 12px; cursor: pointer; text-decoration: underline"
              @click="openInEditor(comp.filePath!, comp.line)"
            >
              ({{ comp.filePath }})
            </span>
          </li>
        </ul>
      </div>
      <details>
        <summary style="cursor: pointer">HTML</summary>
        <pre
          style="
            max-height: 200px;
            overflow: auto;
            background: #f9fafb;
            padding: 8px;
            border-radius: 4px;
            font-size: 12px;
          "
          >{{ lastResult.html }}</pre
        >
      </details>
    </div>
  </div>
</template>
