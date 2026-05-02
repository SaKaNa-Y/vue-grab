---
layout: home
hero:
  name: Vue Grab
  text: UI context for AI coding agents
  tagline: Point at any element in your Vue app, click, and capture its HTML, CSS selector, and component hierarchy — paste it straight into Cursor, Claude Code, or any AI chat.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: Features
      link: /features/grab
    - theme: alt
      text: View on GitHub
      link: https://github.com/SaKaNa-Y/vue-grab

features:
  - icon: 🎯
    title: Interactive Grab
    details: Hover to highlight, click to capture. Extracts CSS selector, outerHTML (truncatable), and the Vue component stack with file paths when Vue exposes them.
    link: /features/grab
    linkText: Learn more
  - icon: 📏
    title: Element Measurer
    details: Alt+Shift+M toggles a spacing inspector. Click one element, hover another to see pixel distances and alignment guides.
    link: /features/measurer
    linkText: Learn more
  - icon: 📝
    title: Console Capture
    details: Ring-buffered capture of all 5 console levels plus window errors, promise rejections, and Vue errorHandler. Filter by level and search in the FAB.
    link: /features/console-capture
    linkText: Learn more
  - icon: ♿
    title: Accessibility Audit
    details: Page-wide scan with 5 built-in rules surfaces missing labels, alt text, and ARIA. Extracts per-element a11y info on every grab.
    link: /features/a11y
    linkText: Learn more
  - icon: 🎈
    title: Floating Button
    details: Optional draggable FAB with settings, logs, and a11y panels. Snaps to edges, persists appearance, position, and hotkey choices to localStorage.
    link: /features/floating-button
    linkText: Learn more
  - icon: ⚡
    title: Vite Integration
    details: Companion Vite plugin exposes /__open-in-editor so clicking a file path in a grab result opens your editor.
    link: /features/vite-integration
    linkText: Learn more
---
