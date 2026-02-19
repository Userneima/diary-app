import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  server: {
    port: 5177,
    strictPort: true, // 如果端口被占用则报错，而不是自动切换到其他端口
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Diary App',
        short_name: 'Diary',
        description: 'A simple local-first diary app',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'vite.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
})
