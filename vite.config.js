const { execSync } = require('child_process')
const vue = require('@vitejs/plugin-vue')
const path = require('path')
const fs = require('fs')

// 直接在 vite.config.js 中计算版本信息，不依赖外部脚本
function getVersionInfo() {
  // 尝试读取 package.json
  let pkgVersion = '1.0.0'
  try {
    pkgVersion = require(path.resolve(__dirname, 'package.json')).version || '1.0.0'
  } catch (e) {
    console.warn('[vite.config] 读取 package.json 失败:', e.message)
  }

  // 尝试获取 git 信息
  function runGit(cmd) {
    try {
      return execSync(cmd, { encoding: 'utf-8', cwd: __dirname }).trim()
    } catch {
      return ''
    }
  }

  const sha = runGit('git rev-parse --short HEAD') || 'unknown'
  const tag = runGit('git describe --tags --exact-match 2>/dev/null') || ''
  const commitCount = runGit('git rev-list --count HEAD') || '0'

  const version = tag ? tag : `${pkgVersion}-dev.${commitCount}`

  const buildTime = new Date().toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  return { version, buildTime, sha }
}

// 先尝试运行外部脚本（如果有的话），否则直接计算
let versionData = getVersionInfo()
try {
  const scriptPath = path.resolve(__dirname, 'scripts', 'generate-version.js')
  if (fs.existsSync(scriptPath)) {
    execSync('node scripts/generate-version.js', {
      cwd: __dirname,
      stdio: 'inherit',
      timeout: 10000
    })
    // 读取生成的文件
    const genPath = path.resolve(__dirname, 'src', 'version.gen.js')
    if (fs.existsSync(genPath)) {
      delete require.cache[require.resolve(genPath)]
      const gen = require(genPath)
      versionData = {
        version: gen.VERSION || versionData.version,
        buildTime: gen.BUILD_TIME || versionData.buildTime,
        sha: gen.COMMIT_SHA || versionData.sha
      }
    }
  }
} catch (err) {
  console.warn('[vite.config] 外部版本脚本失败，使用内置计算:', err.message)
}

console.log(`[vite.config] 版本: ${versionData.version} (${versionData.sha}) @ ${versionData.buildTime}`)

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
