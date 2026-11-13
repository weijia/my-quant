/**
 * 「上一次条件单卖出成交价」加载服务（my-quant 侧）。
 *
 * 与用户脚本读同一批 WebDAV orders 月文件，但用本项目自己的 WebDAV 配置
 * （localStorage.webDAVConfig）与 request 封装，不依赖 price monitor 服务在线。
 * 只读，不写回 WebDAV，避免与用户脚本的多端写入冲突。
 */

import { request } from '../utils/http.js'
import WEBDAV_PATHS from '../config/WebDAVPaths'
import {
  MONTH_FILE_PATTERN,
  listRecentMonths,
  aggregateLastConditionSellPrice,
  lastConditionSellMap,
  lastConditionSellStatus,
  setLastConditionSellMap,
  setLastConditionSellError
} from '../utils/LastConditionSell.js'

function readConfig() {
  try {
    const raw = localStorage.getItem('webDAVConfig')
    if (!raw) return null
    const config = JSON.parse(raw)
    const base = String(config.url || '').replace(/\/+$/, '')
    if (!base) return null
    return {
      dirUrl: base + WEBDAV_PATHS.ORDERS,
      authHeaders: {
        Authorization: 'Basic ' + btoa((config.username || '') + ':' + (config.password || ''))
      }
    }
  } catch (error) {
    console.warn('[LastConditionSellService] 读取 WebDAV 配置失败:', error)
    return null
  }
}

/** 优先 PROPFIND 列目录；失败时退化为近 24 个月穷举（与 price monitor 兜底口径一致） */
async function listOrderMonths(config, options = {}) {
  const fallback = () => listRecentMonths(options.months || 24, options.now || new Date())
  if (typeof DOMParser === 'undefined') return fallback()
  try {
    const response = await request(config.dirUrl + '?_t=' + Date.now(), {
      method: 'PROPFIND',
      headers: { Depth: '1', ...config.authHeaders }
    })
    if (!response.ok) return fallback()
    const xml = new DOMParser().parseFromString(await response.text(), 'text/xml')
    const nodes = xml.getElementsByTagNameNS('DAV:', 'response')
    const months = []
    for (let i = 0; i < nodes.length; i++) {
      const hrefs = nodes[i].getElementsByTagNameNS('DAV:', 'href')
      if (!hrefs.length) continue
      const name = String(hrefs[0].textContent || '').split('/').pop()
      const match = MONTH_FILE_PATTERN.exec(name.trim())
      if (match) months.push(match[1])
    }
    return months.length ? [...new Set(months)].sort() : fallback()
  } catch (error) {
    console.warn('[LastConditionSellService] PROPFIND 失败，按月穷举:', error)
    return fallback()
  }
}

async function fetchOrderMonthFiles(config, options = {}) {
  const months = await listOrderMonths(config, options)
  const files = []
  for (const month of months) {
    try {
      const response = await request(`${config.dirUrl}${month}.json?_t=${Date.now()}`, {
        method: 'GET',
        headers: { Accept: 'application/json', ...config.authHeaders }
      })
      if (!response.ok) continue
      const data = await response.json()
      if (data && Array.isArray(data.orders)) files.push(data)
    } catch (error) {
      console.warn(`[LastConditionSellService] 读取 orders/${month}.json 失败，跳过:`, error)
    }
  }
  return files
}

let inFlight = null
let lastRefreshAt = 0
const MIN_REFRESH_INTERVAL_MS = 60 * 1000

/**
 * 刷新共享的成交价 Map；重复调用会复用同一个请求，60 秒内不重复读盘。
 * @param {object} [options] { force: true } 跳过节流
 * @returns {Promise<Map>}
 */
export function refreshLastConditionSellPrice(options = {}) {
  if (inFlight) return inFlight
  // 只有成功读过归档才节流；未配置 / 读取失败时每次调用都重试
  if (!options.force && lastConditionSellStatus.value.ok && Date.now() - lastRefreshAt < MIN_REFRESH_INTERVAL_MS) {
    return Promise.resolve(lastConditionSellMap.value)
  }
  inFlight = (async () => {
    const config = readConfig()
    if (!config) {
      setLastConditionSellError('WEBDAV_NOT_CONFIGURED', 'WebDAV 未配置')
      return new Map()
    }
    try {
      const files = await fetchOrderMonthFiles(config, options)
      const map = aggregateLastConditionSellPrice(files)
      setLastConditionSellMap(map, {
        files: files.length,
        ...(files.length === 0 ? { reason: 'NO_ORDER_FILES', message: '未找到 orders 月文件' } : {})
      })
      lastRefreshAt = Date.now()
      console.log(`[LastConditionSellService] 已加载 ${files.length} 个 orders 月文件，${map.size} 只股票有上次条件单卖出成交价`)
      return map
    } catch (error) {
      console.warn('[LastConditionSellService] 加载条件单卖出成交价失败:', error)
      setLastConditionSellError('LOAD_FAILED', error && error.message ? error.message : '读取成交归档失败')
      return new Map()
    }
  })().finally(() => { inFlight = null })
  return inFlight
}
