<script setup lang="ts">
import NestedLayer from "./NestedLayer.vue";
</script>

<template>
  <section id="nested" class="section">
    <h2>Nested components</h2>
    <p class="section-sub">
      Three <code>NestedLayer</code> instances nested via slots — grab the innermost text to see the
      full component stack (<code>NestedComponents → NestedLayer → NestedLayer → NestedLayer</code
      >).
    </p>

    <NestedLayer :depth="1" label="NestedLayer #1">
      <NestedLayer :depth="2" label="NestedLayer #2">
        <NestedLayer :depth="3" label="NestedLayer #3">
          <p>Deepest content — grab me.</p>
        </NestedLayer>
      </NestedLayer>
    </NestedLayer>
  </section>
</template>

