<script setup lang="ts">
defineProps<{ depth: number; label: string }>();
</script>

<template>
  <div class="layer" :data-depth="depth">
    <span class="tag">{{ label }}</span>
    <slot />
  </div>
</template>

<style scoped>
.layer {
  padding: 12px;
  border: 1px dashed var(--border);
  border-radius: 6px;
  background: color-mix(in srgb, var(--primary) calc(var(--d, 0) * 8%), white);
}

.layer[data-depth="1"] {
  --d: 1;
}
.layer[data-depth="2"] {
  --d: 2;
}
.layer[data-depth="3"] {
  --d: 3;
}

.tag {
  display: inline-block;
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 11px;
  color: var(--primary);
  margin-bottom: 8px;
}
</style>
