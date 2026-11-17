import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// `npm run dev:phone` serves HTTPS on the LAN so a phone gets gyro + camera access (both need a secure context).
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'phone' ? [basicSsl()] : [])],
  build: { chunkSizeWarningLimit: 1400 },
}))
