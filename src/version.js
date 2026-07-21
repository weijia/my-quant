// 版本信息模块
// 优先读取构建时生成的 version.json，其次 fallback 到环境变量

import versionData from './version.json'

export const VERSION = versionData?.version
  || import.meta.env.VITE_APP_VERSION
  || 'dev'

export const BUILD_TIME = versionData?.buildTime
  || import.meta.env.VITE_APP_BUILD_TIME
  || new Date().toISOString()

export const COMMIT_SHA = versionData?.sha
  || import.meta.env.VITE_APP_COMMIT_SHA
  || 'unknown'

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
