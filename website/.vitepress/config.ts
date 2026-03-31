import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Vue Grab',
  description: 'Grab UI context from Vue apps for AI coding agents',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Installation', link: '/guide/installation' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [{ text: 'Overview', link: '/api/' }],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/sakana/vue-grab' },
    ],
  },
})
