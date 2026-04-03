# Vue Grab

[![npm version](https://img.shields.io/npm/v/@sakana-y/vue-grab)](https://www.npmjs.com/package/@sakana-y/vue-grab)
[![CI](https://github.com/SaKaNa-Y/vue-grab/actions/workflows/ci.yml/badge.svg)](https://github.com/SaKaNa-Y/vue-grab/actions/workflows/ci.yml)
[![license](https://img.shields.io/github/license/SaKaNa-Y/vue-grab)](./LICENSE)

Grab UI context from Vue apps for AI coding agents.

Point at any element, click, and get its HTML, CSS selector, and Vue component hierarchy — ready to paste into an AI chat.

## Features

- **Interactive element selection** — hover to highlight, click to capture
- **Vue component stack** — extracts component names, file paths, and line numbers
- **CSS selector generation** — unique selector for the selected element
- **HTML capture** — outerHTML with configurable max length
- **Floating action button** — optional draggable FAB with hotkey settings panel
- **Hotkey support** — default `Alt+Shift+G`, fully customizable and persistable
- **Shadow DOM isolation** — overlay styles never conflict with your app
- **Works with or without Vue** — use as a Vue plugin or standalone `init()`

## Quick Start

```bash
npm install @sakana-y/vue-grab
```

### Vue Plugin

```ts
// main.ts
import { createApp } from "vue";
import { createVueGrab } from "@sakana-y/vue-grab";
import App from "./App.vue";

const app = createApp(App);
app.use(createVueGrab());
app.mount("#app");
```

Then use the composable in any component:

```vue
<script setup lang="ts">
import { useGrab } from "@sakana-y/vue-grab";

const { isActive, lastResult, toggle } = useGrab();
</script>

<template>
  <button @click="toggle">
    {{ isActive ? "Grabbing..." : "Grab" }}
  </button>
  <pre v-if="lastResult">{{ lastResult.selector }}</pre>
</template>
```

### Standalone (no Vue plugin)

```ts
import { init } from "@sakana-y/vue-grab";

const grabber = init({ floatingButton: { enabled: true } });

grabber.onGrab((result) => {
  console.log(result.selector);
  console.log(result.html);
  console.log(result.componentStack);
});

// later
grabber.destroy();
```

## Configuration

All options are optional. Pass them to `createVueGrab()` or `init()`:

```ts
createVueGrab({
  highlightColor: "#4f46e5",   // highlight border/background color
  labelTextColor: "#ffffff",   // tag label text color
  showTagHint: true,           // show component tag on hover
  maxHtmlLength: 10000,        // 0 = unlimited
  filter: {
    ignoreSelectors: [],       // CSS selectors to skip
    ignoreTags: [],            // HTML tags to skip
    skipCommonComponents: false // skip header, nav, footer, sidebar, etc.
  },
  floatingButton: {
    enabled: false,            // show draggable FAB
    initialPosition: "bottom-right",
    storageKey: "vue-grab-fab-pos",
    hotkeyStorageKey: "vue-grab-hotkey",
  },
});
```

## `useGrab()` API

| Property | Type | Description |
|---|---|---|
| `config` | `GrabConfig` | Resolved configuration |
| `isActive` | `Readonly<Ref<boolean>>` | Whether grab mode is active |
| `lastResult` | `DeepReadonly<Ref<GrabResult \| null>>` | Last captured result |
| `activate()` | `() => void` | Enter grab mode |
| `deactivate()` | `() => void` | Exit grab mode |
| `toggle()` | `() => void` | Toggle grab mode |

### `GrabResult`

```ts
interface GrabResult {
  element: Element;
  html: string;
  componentStack: ComponentInfo[];
  selector: string;
}

interface ComponentInfo {
  name: string;
  filePath?: string;
  line?: number;
}
```

## Packages

| Package | Description |
|---|---|
| [`@sakana-y/vue-grab`](./packages/vue-grab) | Core library — plugin, composable, engine |
| [`@sakana-y/vue-grab-shared`](./packages/shared) | Shared types and constants |
| [`@sakana-y/vue-grab-cli`](./packages/cli) | CLI tool (`vue-grab init`) |

## Development

```bash
pnpm install
pnpm dev:playground   # run demo app
pnpm test             # run all tests
pnpm build            # build all packages
pnpm lint && pnpm format:check
```

## License

[MIT](./LICENSE)

---

<p align="center"><a href="#vue-grab-中文">中文文档</a></p>

---

<h1 id="vue-grab-中文">Vue Grab</h1>

从 Vue 应用中抓取 UI 上下文，为 AI 编程助手提供信息。

指向任意元素，点击即可获取其 HTML、CSS 选择器和 Vue 组件层级 —— 可直接粘贴到 AI 对话中。

## 功能特性

- **交互式元素选择** — 悬停高亮，点击捕获
- **Vue 组件栈** — 提取组件名、文件路径和行号
- **CSS 选择器生成** — 为选中元素生成唯一选择器
- **HTML 捕获** — outerHTML，可配置最大长度
- **悬浮操作按钮** — 可选的可拖拽 FAB，带快捷键设置面板
- **快捷键支持** — 默认 `Alt+Shift+G`，完全可自定义且可持久化
- **Shadow DOM 隔离** — 覆盖层样式不会影响你的应用
- **支持非 Vue 环境** — 既可作为 Vue 插件使用，也可独立调用 `init()`

## 快速开始

```bash
npm install @sakana-y/vue-grab
```

### Vue 插件方式

```ts
// main.ts
import { createApp } from "vue";
import { createVueGrab } from "@sakana-y/vue-grab";
import App from "./App.vue";

const app = createApp(App);
app.use(createVueGrab());
app.mount("#app");
```

在任意组件中使用 composable：

```vue
<script setup lang="ts">
import { useGrab } from "@sakana-y/vue-grab";

const { isActive, lastResult, toggle } = useGrab();
</script>

<template>
  <button @click="toggle">
    {{ isActive ? "抓取中..." : "抓取" }}
  </button>
  <pre v-if="lastResult">{{ lastResult.selector }}</pre>
</template>
```

### 独立使用（无需 Vue 插件）

```ts
import { init } from "@sakana-y/vue-grab";

const grabber = init({ floatingButton: { enabled: true } });

grabber.onGrab((result) => {
  console.log(result.selector);
  console.log(result.html);
  console.log(result.componentStack);
});

// 销毁
grabber.destroy();
```

## 配置项

所有选项均为可选，传入 `createVueGrab()` 或 `init()`：

```ts
createVueGrab({
  highlightColor: "#4f46e5",   // 高亮边框/背景色
  labelTextColor: "#ffffff",   // 标签文字颜色
  showTagHint: true,           // 悬停时显示组件标签
  maxHtmlLength: 10000,        // 0 = 不限制
  filter: {
    ignoreSelectors: [],       // 需跳过的 CSS 选择器
    ignoreTags: [],            // 需跳过的 HTML 标签
    skipCommonComponents: false // 跳过 header、nav、footer、sidebar 等
  },
  floatingButton: {
    enabled: false,            // 显示可拖拽悬浮按钮
    initialPosition: "bottom-right",
    storageKey: "vue-grab-fab-pos",
    hotkeyStorageKey: "vue-grab-hotkey",
  },
});
```

## 许可证

[MIT](./LICENSE)
