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
  // Strip debug logging from production bundles. `pure` marks these calls
  // side-effect-free so minification drops them (and their argument
  // expressions) from the build; dev server and console.warn/error are
  // untouched. Complements the eslint no-console rule.
  esbuild: {
    // Vite 8: `pure` dropped from the ESBuildOptions type but still honored by
    // esbuild at transform time. Keep it (surgical — preserves console.warn/error,
    // unlike `drop: ['console']`) and silence the stale type.
    // @ts-expect-error pure is a valid esbuild transform option
    pure: ['console.log', 'console.debug', 'console.info', 'console.trace'],
  },
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
          // WebGL hero deps. Only reached via React.lazy / dynamic import on the
          // landing + /lp heroes, so these stay async-loaded — naming them just
          // gives one stable, cacheable chunk shared across those routes.
          if (p.includes('node_modules/three/')) return 'three-vendor'
          if (p.includes('node_modules/gsap/')) return 'gsap-vendor'
        },
      },
    },
  },
})
