import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Vue Grab",
  description: "Grab UI context from Vue apps for AI coding agents",
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/", activeMatch: "^/guide/" },
      { text: "Features", link: "/features/grab", activeMatch: "^/features/" },
      { text: "API", link: "/api/", activeMatch: "^/api/" },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Getting Started",
          items: [
            { text: "Introduction", link: "/guide/" },
            { text: "Installation", link: "/guide/installation" },
            { text: "Quick Start", link: "/guide/quick-start" },
            { text: "Configuration", link: "/guide/configuration" },
          ],
        },
      ],
      "/features/": [
        {
          text: "Features",
          items: [
            { text: "Interactive Grab", link: "/features/grab" },
            { text: "Element Measurer", link: "/features/measurer" },
            { text: "Console Capture", link: "/features/console-capture" },
            { text: "Network Capture", link: "/features/network-capture" },
            { text: "Accessibility Audit", link: "/features/a11y" },
            { text: "Floating Button", link: "/features/floating-button" },
            { text: "Vite Integration", link: "/features/vite-integration" },
          ],
        },
      ],
      "/api/": [
        {
          text: "API Reference",
          items: [{ text: "Overview", link: "/api/" }],
        },
      ],
    },
    socialLinks: [{ icon: "github", link: "https://github.com/SaKaNa-Y/vue-grab" }],
    editLink: {
      pattern: "https://github.com/SaKaNa-Y/vue-grab/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2025-present SaKaNa-Y",
    },
    search: {
      provider: "local",
    },
  },
});
