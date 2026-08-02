import { defineConfig, loadEnv } from 'vite'
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
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiServerUrl = env.API_SERVER_URL || 'http://127.0.0.1:5000'
  const apiPrefix = env.API_PREFIX || '/api'
  const uploadsPrefix = env.UPLOADS_PREFIX || '/uploads'

  return {
    plugins: [portalAlias(), react()],
    resolve: {
      dedupe: ['react', 'react-dom', 'react-router-dom'],
    },
    server: {
      port: Number(env.CLIENT_PORT || 5172),
      strictPort: true,
      proxy: {
        [apiPrefix]: {
          target: apiServerUrl,
          changeOrigin: true,
        },
        [uploadsPrefix]: {
          target: apiServerUrl,
          changeOrigin: true,
        },
      },
    },
  }
})
