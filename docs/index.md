---
layout: home
hero:
  name: Vue Grab
  text: UI context for AI coding agents
  tagline: Point at any element in your Vue app, click, and capture its HTML, CSS selector, component hierarchy, a11y context, and recent network activity.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: CLI Setup
      link: /guide/quick-start
    - theme: alt
      text: View on GitHub
      link: https://github.com/SaKaNa-Y/vue-grab

features:
  - icon: 🎯
    title: Interactive Grab
    details: Hover to highlight, click to capture. Extracts CSS selector, outerHTML, a11y info, and the Vue component stack with file paths when Vue exposes them.
    link: /features/grab
    linkText: Learn more
  - icon: 📏
    title: Element Measurer
    details: Alt+Shift+M toggles a spacing inspector. Click one element, hover another, and read pixel distances plus alignment guides.
    link: /features/measurer
    linkText: Learn more
  - icon: 🧾
    title: Console Capture
    details: Ring-buffered capture of console output, runtime errors, promise rejections, and Vue errorHandler entries. Filter by level and search in the floating button.
    link: /features/console-capture
    linkText: Learn more
  - icon: 🌐
    title: Network Capture
    details: Capture fetch/XHR metadata, redact sensitive headers, opt into body capture, and attach recent request snapshots to grab results.
    link: /features/network-capture
    linkText: Learn more
  - icon: ♿
    title: Accessibility Audit
    details: Page-wide scan with built-in rules surfaces missing labels, alt text, ARIA issues, and per-element a11y context on every grab.
    link: /features/a11y
    linkText: Learn more
  - icon: 🧰
    title: Floating Button
    details: Optional draggable toolbar with Float and Edge dock modes, settings, logs, network, a11y, magnifier, and measurer controls.
    link: /features/floating-button
    linkText: Learn more
  - icon: ⚡
    title: Vite Integration
    details: Companion Vite plugin exposes a hardened dev-only /__open-in-editor endpoint so captured file paths can open in your editor.
    link: /features/vite-integration
    linkText: Learn more
---
