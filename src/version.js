// 版本信息模块
// 由 vite.config.js 通过 define 注入全局变量

/* eslint-disable no-undef */
export const VERSION = __APP_VERSION__ || 'dev'
export const BUILD_TIME = __APP_BUILD_TIME__ || ''
export const COMMIT_SHA = __APP_COMMIT_SHA__ || 'unknown'
/* eslint-enable no-undef */

// 格式化显示
export const versionDisplay = `${VERSION} (${COMMIT_SHA})`
export const buildTimeDisplay = BUILD_TIME
  ? new Date(BUILD_TIME).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  : '未知'

// 完整版本信息对象
export const versionInfo = {
  version: VERSION,
  buildTime: BUILD_TIME,
  commitSha: COMMIT_SHA,
  display: versionDisplay,
  buildTimeFormatted: buildTimeDisplay
}

export default versionInfo
