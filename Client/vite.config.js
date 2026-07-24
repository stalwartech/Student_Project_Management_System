import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const portalNames = ['coordinator', 'student', 'supervisor']

const portalAlias = () => ({
  name: 'portal-alias',
  enforce: 'pre',
  async resolveId(source, importer) {
    if (!importer || (!source.startsWith('@/') && source !== '@')) return null

    const portal = portalNames.find((name) => importer.includes(`/src/${name}/`))
    if (!portal) return null

    const target = path.resolve(process.cwd(), 'src', portal, 'src', source.slice(2))
    const resolved = await this.resolve(target, importer, { skipSelf: true })
    return resolved?.id ?? target
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [portalAlias(), react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  server: {
    port: 5172,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3021',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3021',
        changeOrigin: true,
      },
    },
  },
})
