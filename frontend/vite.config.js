import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Dateien/Ordner die NICHT ins dist/api kopiert werden
const EXCLUDE = new Set(['.env.local', '.env', '.env.local.example', 'vendor', '.git', '.gitignore', 'node_modules'])

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true })
  for (const entry of readdirSync(src)) {
    if (EXCLUDE.has(entry)) continue
    const srcPath = join(src, entry)
    const destPath = join(dest, entry)
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      copyFileSync(srcPath, destPath)
    }
  }
}

/**
 * Vite-Plugin: Kopiert backend/ nach dist/api/ nach dem Build.
 * Ergebnis: dist/ kann 1:1 als httpdocs/ hochgeladen werden.
 */
function deployBackendPlugin() {
  return {
    name: 'petra-deploy-backend',
    apply: 'build',            // nur beim `npm run build`, nicht im Dev-Server
    closeBundle() {
      const src  = join(__dirname, '..', 'backend')
      const dest = join(__dirname, 'dist', 'api')
      console.log('\n[deploy] Kopiere backend → dist/api/ ...')
      copyDir(src, dest)
      console.log('[deploy] Struktur bereit:')
      console.log('  dist/')
      console.log('  ├── index.html + assets/   <- Frontend (SPA)')
      console.log('  └── api/                   <- Backend PHP')
      console.log('\n  Hochladen: dist/* -> httpdocs/')
      console.log('  Dann auf Server: httpdocs/api/.env.local mit DB-Zugangsdaten erstellen.\n')
    },
  }
}

export default defineConfig({
  plugins: [react(), deployBackendPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:8082',
        changeOrigin: true,
      },
    },
  },
})
