const { execSync } = require('child_process')
const vue = require('@vitejs/plugin-vue')

// 构建时运行 generate-version.js，捕获 stdout 的 JSON
let versionData = {}
try {
  const raw = execSync('node scripts/generate-version.js', {
    encoding: 'utf-8',
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'inherit'] // stderr 直接输出日志
  })
  versionData = JSON.parse(raw)
} catch {
  // fallback 静默处理
}

module.exports = require('vite').defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  base: './',
  build: {
    outDir: './dist',
    emptyOutDir: true
  },
  define: {
    __APP_VERSION__: JSON.stringify(versionData.version || 'dev'),
    __APP_BUILD_TIME__: JSON.stringify(versionData.buildTime || ''),
    __APP_COMMIT_SHA__: JSON.stringify(versionData.sha || 'unknown'),
    __APP_VERSION_FULL__: JSON.stringify(versionData)
  }
})