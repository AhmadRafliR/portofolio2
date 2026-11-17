import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

/**
 * Dev-only: lets the asset tools in tools/*.html (run in a browser) write their output into assets/models-src.
 * Never part of a production build.
 */
function devAssetSave(): Plugin {
  return {
    name: 'dev-asset-save',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__save-asset', (req, res) => {
        const name = new URL(req.url ?? '', 'http://x').searchParams.get('name') ?? ''
        if (req.method !== 'POST' || !/^[a-z0-9-]+\.glb$/.test(name)) {
          res.statusCode = 400
          return res.end('bad request')
        }
        const chunks: Buffer[] = []
        req.on('data', (c: Buffer) => chunks.push(c))
        req.on('end', () => {
          const out = resolve('assets/models-src', name)
          mkdirSync(dirname(out), { recursive: true })
          writeFileSync(out, Buffer.concat(chunks))
          res.end(`saved ${out}`)
        })
      })
    },
  }
}

// `npm run dev:phone` serves HTTPS on the LAN so a phone gets gyro + camera access (both need a secure context).
export default defineConfig(({ mode }) => ({
  plugins: [react(), devAssetSave(), ...(mode === 'phone' ? [basicSsl()] : [])],
  build: { chunkSizeWarningLimit: 1400 },
}))
