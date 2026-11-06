import { defineConfig, transformWithOxc } from 'vite'
import react from '@vitejs/plugin-react'

const transformJsxInJs = () => ({
  name: 'transform-jsx-in-js',
  enforce: 'pre',
  async transform(code, id) {
    if (!id.endsWith('.js')) {
      return null
    }
    return await transformWithOxc(code, id, {
      lang: 'jsx',
    })
  },
})

export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  plugins: [
    react(),
    transformJsxInJs()
  ],
})