<script setup lang="ts">
import ActionButton from "@antfu/design/components/Action/ActionButton.vue";
import ActionToggleGroup from "@antfu/design/components/Action/ActionToggleGroup.vue";
import DisplayStatusPill from "@antfu/design/components/Display/DisplayStatusPill.vue";
import FeedbackEmptyState from "@antfu/design/components/Feedback/FeedbackEmptyState.vue";
import FormSearchField from "@antfu/design/components/Form/FormSearchField.vue";
import { computed, inject, ref } from "vue";

import type { CapturedLog, LogLevel } from "@sakana-y/vue-grab-shared";

import { ALL_LOG_LEVELS } from "@sakana-y/vue-grab-shared";

import { openInClaudeCode, openInEditor } from "../../editor";
import { buildLogPrompt, resolveLogSource, truncate } from "../../utils";
import { FAB_STORE_KEY } from "../app/store";

const store = inject(FAB_STORE_KEY)!;
const { logs, editorChoice } = store;

const activeLevels = ref<LogLevel[]>([...ALL_LOG_LEVELS]);
const search = ref("");
const expanded = ref<Set<string>>(new Set());

const rowKey = (log: CapturedLog): string => `${log.timestamp}::${log.source}::${log.message}`;

const countsByLevel = computed<Record<LogLevel, number>>(() => {
  const out: Record<LogLevel, number> = { log: 0, info: 0, warn: 0, error: 0, debug: 0 };
  for (const e of logs.value) out[e.level]++;
  return out;
});

const levelOptions = computed(() =>
  ALL_LOG_LEVELS.map((lvl) => ({ value: lvl, label: `${lvl} ${countsByLevel.value[lvl]}` })),
);

const visible = computed<CapturedLog[]>(() => {
  const needle = search.value.trim().toLowerCase();
  const active = new Set(activeLevels.value);
  return logs.value
    .filter(
      (e) => active.has(e.level) && (needle === "" || e.message.toLowerCase().includes(needle)),
    )
    .toSorted((a, b) => b.timestamp - a.timestamp);
});

const totalCount = computed(() => logs.value.length);
const isEmpty = computed(() => totalCount.value === 0);

const STATUS: Record<LogLevel, "error" | "warning" | "info" | "neutral"> = {
  error: "error",
  warn: "warning",
  info: "info",
  log: "neutral",
  debug: "neutral",
};

function toggleRow(log: CapturedLog): void {
  const key = rowKey(log);
  const next = new Set(expanded.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  expanded.value = next;
}

function timeOf(log: CapturedLog): string {
  return new Date(log.timestamp).toLocaleTimeString();
}

const copied = ref<string | null>(null);
function copy(log: CapturedLog): void {
  const prompt = buildLogPrompt(log);
  void navigator.clipboard.writeText(prompt).then(() => {
    copied.value = rowKey(log);
    setTimeout(() => {
      if (copied.value === rowKey(log)) copied.value = null;
    }, 1500);
  });
}

function toClaude(log: CapturedLog): void {
  openInClaudeCode(buildLogPrompt(log));
}

function canOpen(log: CapturedLog): boolean {
  return resolveLogSource(log) != null;
}

function openEditor(log: CapturedLog): void {
  const source = resolveLogSource(log);
  if (!source) return;
  openInEditor(source.file, source.line, editorChoice.value || undefined);
}
</script>

<template>
  <div class="logs-panel flex flex-col gap-3 p-3.5 text-sm flex-1 min-h-0" data-testid="logs-panel">
    <!-- Overview -->
    <div class="flex items-center justify-between gap-2">
      <div class="flex flex-col">
        <span class="color-base font-medium">Console</span>
        <span class="op-fade text-xs" data-testid="logs-meta">
          {{
            isEmpty
              ? "No entries yet"
              : `${visible.length} of ${totalCount} ${totalCount === 1 ? "entry" : "entries"}`
          }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <span class="op-fade text-xs" data-testid="logs-shown-count"
          >{{ visible.length }} shown</span
        >
        <ActionButton
          size="sm"
          variant="action"
          data-testid="logs-clear"
          @click="store.clearLogs()"
        >
          Clear
        </ActionButton>
      </div>
    </div>

    <!-- Level filters -->
    <ActionToggleGroup
      v-model="activeLevels"
      multiple
      :options="levelOptions"
      data-testid="logs-levels"
    />

    <!-- Search -->
    <FormSearchField
      v-if="!isEmpty"
      v-model="search"
      size="sm"
      placeholder="Filter messages…"
      data-testid="logs-search"
    />

    <!-- Entries (scroll container keeps large sets contained; ADR 0002) -->
    <div class="flex-1 min-h-0 overflow-y-auto" data-testid="logs-scroll">
      <FeedbackEmptyState
        v-if="visible.length === 0"
        data-testid="logs-empty"
        :title="isEmpty ? 'No logs captured yet' : 'No logs match the current filter'"
      />
      <div v-else class="flex flex-col gap-1" data-testid="logs-list">
        <div
          v-for="log in visible"
          :key="rowKey(log)"
          class="border border-base rounded-lg overflow-hidden bg-secondary"
          :data-level="log.level"
          data-testid="log-row"
        >
          <button
            type="button"
            class="w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-active transition"
            data-testid="log-row-header"
            @click="toggleRow(log)"
          >
            <DisplayStatusPill :status="STATUS[log.level]" :color="`var(--lvl-${log.level})`" />
            <span class="flex-1 min-w-0 flex flex-col">
              <span class="truncate color-base" :title="log.message">{{
                truncate(log.message, 120)
              }}</span>
              <span class="op-fade text-xs flex gap-2">
                <span>{{ log.level }}</span>
                <span v-if="log.source !== 'console'">{{ log.source }}</span>
              </span>
            </span>
            <span v-if="log.count > 1" class="op-mute text-xs">×{{ log.count }}</span>
            <span class="op-fade text-xs tabular-nums">{{ timeOf(log) }}</span>
            <span
              class="op-fade text-xs transition-transform"
              :class="expanded.has(rowKey(log)) ? 'rotate-90' : ''"
              aria-hidden="true"
              >▶</span
            >
          </button>
          <div
            v-if="expanded.has(rowKey(log))"
            class="px-2.5 py-2 border-t border-base flex flex-col gap-2"
            data-testid="log-row-details"
          >
            <div v-if="log.vueInfo" class="op-mute text-xs">Vue: {{ log.vueInfo }}</div>
            <pre
              v-if="log.stack"
              class="op-mute text-xs whitespace-pre-wrap font-mono max-h-40 overflow-auto"
              >{{ log.stack }}</pre
            >
            <div class="flex gap-2">
              <ActionButton size="sm" variant="action" data-testid="log-copy" @click="copy(log)">
                {{ copied === rowKey(log) ? "Copied!" : "Copy" }}
              </ActionButton>
              <ActionButton
                size="sm"
                variant="primary"
                data-testid="log-claude"
                @click="toClaude(log)"
              >
                Open in Claude Code
              </ActionButton>
              <ActionButton
                v-if="canOpen(log)"
                size="sm"
                variant="action"
                data-testid="log-open"
                @click="openEditor(log)"
              >
                Open in Editor
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
