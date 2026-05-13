const { defineConfig } = require('vite')
const vue = require('@vitejs/plugin-vue')

module.exports = defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  base: '/my-quant/',
  build: {
    outDir: './dist',
    emptyOutDir: true
  }
})
