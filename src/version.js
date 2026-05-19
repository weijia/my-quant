// 版本信息模块
// 从环境变量读取构建时注入的版本信息

export const VERSION = import.meta.env.VITE_APP_VERSION || 'dev'
export const BUILD_TIME = import.meta.env.VITE_APP_BUILD_TIME || new Date().toISOString()
export const COMMIT_SHA = import.meta.env.VITE_APP_COMMIT_SHA || 'unknown'

// 格式化显示
export const versionDisplay = `${VERSION} (${COMMIT_SHA})`
export const buildTimeDisplay = new Date(BUILD_TIME).toLocaleString('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
})

// 完整版本信息对象
export const versionInfo = {
  version: VERSION,
  buildTime: BUILD_TIME,
  commitSha: COMMIT_SHA,
  display: versionDisplay,
  buildTimeFormatted: buildTimeDisplay
}

export default versionInfo
