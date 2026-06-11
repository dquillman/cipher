import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Emits web/stats.json on every build (kept OUT of dist so it never
    // deploys to hosting) — chunk composition data for bundle debugging.
    visualizer({ filename: 'stats.json', template: 'raw-data', gzipSize: true }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Long-term-cacheable vendor chunks. The entry chunk changes every
        // deploy; these don't — repeat visitors skip re-downloading ~400KB.
        // Firestore is split out because it alone is the largest module in
        // the app and only /app routes exercise it meaningfully.
        manualChunks(id: string) {
          const p = id.replace(/\\/g, '/')
          if (!p.includes('node_modules')) return
          // 'firebase/firestore' (no @) also catches the firebase/firestore
          // re-export wrapper — leaving it in fb-core creates a circular chunk.
          if (p.includes('firebase/firestore') || p.includes('@firebase/webchannel-wrapper')) return 'fb-firestore'
          if (p.includes('@firebase/') || p.includes('node_modules/firebase/')) return 'fb-core'
          if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(p)) return 'react-vendor'
        },
      },
    },
  },
})
