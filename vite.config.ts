import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

function adminSecretsGuard(): Plugin {
  return {
    name: 'admin-secrets-guard',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('node_modules')) return null
      if (code.includes('ADMIN_PASSWORD') || code.includes('process.env.ADMIN_PASSWORD')) {
        throw new Error(
          `[SECURITY VIOLATION] Client bundle attempted to reference or import ADMIN_PASSWORD in: ${id}`
        )
      }
      return null
    },
  }
}

export default defineConfig({
  root: './client',
  plugins: [adminSecretsGuard(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@server': path.resolve(__dirname, './server'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/trpc': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query', '@trpc/client', '@trpc/react-query', 'superjson'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
})