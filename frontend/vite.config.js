import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // push-sw.js is pulled in by importScripts below, and registerSW.js is
        // the registration shim — neither is an app asset worth precaching.
        globIgnores: ['push-sw.js', 'registerSW.js'],
        // Web Push lives in its own file so it survives the build. Without
        // this the generated worker replaces public/sw.js and the push and
        // notificationclick handlers never reach production.
        importScripts: ['/push-sw.js'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      manifest: {
        name: 'OpenPrep AI',
        short_name: 'OpenPrep',
        description: 'AI-Powered study platform for offline flashcard review and exam preparation',
        theme_color: '#4f46e5',
        background_color: '#0f0f11',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: '/vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('react-quill') || id.includes('react-markdown') || id.includes('@tiptap')) {
              return 'vendor-editor';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('@reduxjs/toolkit') || id.includes('react-redux')) {
              return 'vendor-core';
            }
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
