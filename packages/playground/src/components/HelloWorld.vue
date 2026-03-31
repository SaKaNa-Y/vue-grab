<script setup lang="ts">
const { msg } = defineProps<{ msg: string }>()
</script>

<template>
  <div>
    <p>{{ msg }}</p>
    <button>Click me</button>
  </div>
</template>
