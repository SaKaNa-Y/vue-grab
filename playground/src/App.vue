<script setup lang="ts">
import Toolbar from "./sections/Toolbar.vue";
import FormShowcase from "./sections/FormShowcase.vue";
import DashboardShowcase from "./sections/DashboardShowcase.vue";
import ListShowcase from "./sections/ListShowcase.vue";
import NestedComponents from "./sections/NestedComponents.vue";
import ResultPanel from "./sections/ResultPanel.vue";
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div>
        <h1>Vue Grab Playground</h1>
        <p>A showcase surface for every feature — grab, measure, console capture, a11y audit.</p>
      </div>
    </header>

    <nav class="anchor-nav" aria-label="Section navigation">
      <a href="#toolbar">Toolbar</a>
      <a href="#forms">Forms &amp; a11y</a>
      <a href="#dashboard">Dashboard</a>
      <a href="#list">Event log</a>
      <a href="#nested">Nested components</a>
      <a href="#result">Last result</a>
    </nav>

    <Toolbar />
    <FormShowcase />
    <DashboardShowcase />
    <ListShowcase />
    <NestedComponents />
    <ResultPanel />
  </div>
</template>
