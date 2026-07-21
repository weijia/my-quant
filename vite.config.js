const { execSync } = require('child_process')
const vue = require('@vitejs/plugin-vue')
const path = require('path')

// 构建前自动生成版本信息
// 生成 src/version.gen.js，包含 VERSION / BUILD_TIME / COMMIT_SHA
try {
  execSync('node scripts/generate-version.js', {
    cwd: __dirname,
    stdio: 'inherit',
    timeout: 10000
  })
} catch (err) {
  console.warn('[vite.config] 版本生成失败，使用默认值')
}

// 读取生成的版本信息（清除 require 缓存确保读到最新内容）
let versionData = { version: 'dev', buildTime: '', sha: 'unknown' }
try {
  const genPath = path.resolve(__dirname, 'src', 'version.gen.js')
  delete require.cache[require.resolve(genPath)]
  const gen = require(genPath)
  versionData = {
    version: gen.VERSION || 'dev',
    buildTime: gen.BUILD_TIME || '',
    sha: gen.COMMIT_SHA || 'unknown'
  }
} catch {
  // fallback
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
    __APP_VERSION__: JSON.stringify(versionData.version),
    __APP_BUILD_TIME__: JSON.stringify(versionData.buildTime),
    __APP_COMMIT_SHA__: JSON.stringify(versionData.sha)
  }
})
