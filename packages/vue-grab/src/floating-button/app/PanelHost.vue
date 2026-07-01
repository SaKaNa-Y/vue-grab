<script setup lang="ts">
import { inject } from "vue";

import LogsPanel from "../panels/LogsPanel.vue";
import { FAB_STORE_KEY } from "./store";

// Root of the FloatingButton Vue app (ADR 0002). Renders the migrated Vue panel
// for the active panel id; panels not yet migrated render nothing here and are
// drawn by the legacy `render()`/`wire()` bridge in FloatingButton.renderExpandBody.
const store = inject(FAB_STORE_KEY)!;
const { activePanel } = store;
</script>

<template>
  <LogsPanel v-if="activePanel === 'logs'" />
</template>
