/**
 * 「上一次条件单卖出成交价」聚合（纯函数 + 共享响应式状态）。
 *
 * 数据源：WebDAV app_data/stocks/orders/{YYYY-MM}.json 中的 orders[].entrusts[]，
 * 由用户脚本 OrderCreateSaver 调方正 todayEntrust 归档而来。
 *
 * 口径（两端必须一致）：
 *   1. 只取 order.type === 'condition'（排除网格单成交）
 *   2. 只取卖出：entrust.side === 'sell'，旧数据 side 为空时用方向码 2/102 兜底
 *   3. 只取成交状态：statusName ∈ {已成, 部成, 部分成交}（与 price monitor /api/trades 一致）
 *   4. 按 stockCode + accountType 分组，取 time 最新的一条
 *   5. price 来自今日委托记录（price_type 多为「限价」），系统一直把它当成交价使用
 *
 * 限制：todayEntrust 只返回当日委托，跨天靠每天「自动同步全部」累积归档，
 * 所以「上一次」等于「归档里最近一次」，未同步的日期会缺失。平安侧无成交接口，不产出数据。
 *
 * ⚠️ 本文件在 vue-dialog-userscript 与 my-quant 中各有一份，逻辑必须保持同步。
 */

import { ref } from 'vue'

export const ORDERS_DIR = 'app_data/stocks/orders'
export const MONTH_FILE_PATTERN = /^(\d{4}-\d{2})\.json$/
export const FILLED_STATUS_NAMES = ['已成', '部成', '部分成交']

const SELL_DIRECTIONS = new Set([2, 102])
const BUY_DIRECTIONS = new Set([1, 75, 101])

/** 近 count 个月的 YYYY-MM 列表（含当月），PROPFIND 不可用时按月穷举兜底 */
export function listRecentMonths(count = 24, now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  const months = []
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`)
  }
  return months
}

/** 把股票代码归一为 6 位数字，去掉 sh/sz 前缀与空格 */
export function normalizeStockCode(value) {
  if (value === null || value === undefined) return ''
  let code = String(value).trim().toLowerCase()
  if (code.startsWith('sh') || code.startsWith('sz')) code = code.slice(2)
  code = code.replace(/\D/g, '')
  return /^\d{6}$/.test(code) ? code : ''
}

/** 账户归一：平安 → pingan（无成交数据），信用 → credit，其余 → default */
export function normalizeAccountType(value) {
  const v = String(value || '').toLowerCase()
  if (v === 'pingan' || v.includes('平安')) return 'pingan'
  if (v === 'credit' || v === 'margin' || v.includes('信用')) return 'credit'
  return 'default'
}

/** 是否成交状态 */
export function isFilledEntrust(entrust) {
  if (!entrust || typeof entrust !== 'object') return false
  return FILLED_STATUS_NAMES.includes(String(entrust.statusName || '').trim())
}

/** 是否卖出委托；side 缺失时用方向码兜底（普通 2 / 信用 102） */
export function isSellEntrust(entrust) {
  if (!entrust || typeof entrust !== 'object') return false
  const side = String(entrust.side || '').toLowerCase()
  if (side === 'sell') return true
  if (side === 'buy') return false
  const direction = Number(entrust.direction)
  if (SELL_DIRECTIONS.has(direction)) return true
  if (BUY_DIRECTIONS.has(direction)) return false
  // 兼容旧数据里用中文方向描述的情况
  const text = String(entrust.directionName || entrust.sideName || '')
  return text.includes('卖')
}

/** 取可用时间戳：ISO 字符串 / epoch 毫秒 / epoch 字符串 */
function toTimestamp(...values) {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue
    const n = Number(value)
    if (Number.isFinite(n) && n > 0) return n
    const parsed = Date.parse(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

function formatTradeTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/**
 * 聚合出每只股票（按账户隔离）最近一次条件单卖出成交价。
 * @param {Array<{orders: Array}>} monthFiles orders 月文件内容数组
 * @returns {Map<string, object>} key = `${stockCode}|${accountType}`
 */
export function aggregateLastConditionSellPrice(monthFiles) {
  const result = new Map()
  const files = Array.isArray(monthFiles) ? monthFiles : []

  for (const file of files) {
    const orders = file && Array.isArray(file.orders) ? file.orders : []
    for (const order of orders) {
      if (!order || order.type !== 'condition') continue
      if (String(order.provider || 'founder').toLowerCase() !== 'founder') continue
      const accountType = normalizeAccountType(order.accountType)
      const entrusts = Array.isArray(order.entrusts) ? order.entrusts : []

      for (const entrust of entrusts) {
        if (!isFilledEntrust(entrust) || !isSellEntrust(entrust)) continue
        const stockCode = normalizeStockCode(entrust.stockCode || order.stockCode)
        if (!stockCode) continue
        const price = Number(entrust.price)
        if (!Number.isFinite(price) || price <= 0) continue

        const timestamp = toTimestamp(entrust.time, order.createTime)
        const key = `${stockCode}|${accountType}`
        const previous = result.get(key)
        if (previous && previous.timestamp >= timestamp) continue

        result.set(key, {
          stockCode,
          accountType,
          price,
          time: entrust.time || order.createTime || null,
          timestamp,
          statusName: String(entrust.statusName || '').trim() || null,
          entrustId: entrust.id != null ? String(entrust.id) : null,
          taskId: entrust.taskId != null ? String(entrust.taskId) : (order.id != null ? String(order.id) : null),
          month: file.month || null
        })
      }
    }
  }
  return result
}

/**
 * 从聚合结果中查一只股票（按账户隔离）。
 * 平安侧没有成交接口：provider / accountType 标识为平安时直接返回 null，避免串到方正数据。
 * 其余 provider 一律放行（方正归档里只有方正数据）。
 */
export function lookupLastConditionSell(map, stockCode, accountType, provider) {
  if (!map || typeof map.get !== 'function') return null
  const p = String(provider || '').toLowerCase()
  if (p.includes('pingan') || p.includes('平安')) return null
  const code = normalizeStockCode(stockCode)
  if (!code) return null
  return map.get(`${code}|${normalizeAccountType(accountType)}`) || null
}

// ==================== 共享响应式状态（同一页面内所有行共用） ====================

export const lastConditionSellMap = ref(new Map())
export const lastConditionSellUpdatedAt = ref(null)
export const lastConditionSellStatus = ref({
  ok: false,
  reason: 'NOT_LOADED',
  message: '尚未读取成交归档',
  files: 0,
  records: 0
})

export function setLastConditionSellMap(map, meta = {}) {
  const next = map instanceof Map ? map : new Map()
  lastConditionSellMap.value = next
  lastConditionSellUpdatedAt.value = Date.now()
  lastConditionSellStatus.value = {
    ok: true,
    reason: meta.reason || (next.size === 0 ? 'NO_DATA' : 'OK'),
    message: meta.message || (next.size === 0 ? '归档中没有条件单卖出成交记录' : '已加载成交归档'),
    files: Number(meta.files) || 0,
    records: next.size
  }
  return next
}

/** 读取失败时保留上一次的聚合结果，仅标记状态，避免界面闪烁 */
export function setLastConditionSellError(reason, message) {
  lastConditionSellStatus.value = {
    ...lastConditionSellStatus.value,
    ok: false,
    reason: reason || 'LOAD_FAILED',
    message: message || '读取成交归档失败'
  }
}

/**
 * 生成单元格显示文本与悬浮提示（两端展示口径一致）。
 * @returns {{text: string, title: string, hasData: boolean}}
 */
export function describeLastConditionSell(info, status = lastConditionSellStatus.value) {
  const sourceLines = [
    '来源: WebDAV app_data/stocks/orders/（方正今日委托归档）',
    '仅覆盖已执行「自动同步全部」的日期；平安账户无成交数据',
    '限价单取委托记录价格，非逐笔成交均价'
  ]
  if (!info) {
    const reasonText = {
      NOT_LOADED: '尚未读取成交归档',
      WEBDAV_NOT_CONFIGURED: 'WebDAV 未配置',
      NO_DATA: '归档中没有条件单卖出成交记录',
      LOAD_FAILED: '读取成交归档失败',
      NO_ORDER_FILES: '未找到 orders 月文件'
    }[status && status.reason] || (status && status.message) || ''
    return {
      text: '-',
      title: `未同步到条件单卖出成交数据${reasonText ? `（${reasonText}）` : ''}\n${sourceLines.join('\n')}`,
      hasData: false
    }
  }
  const price = Number(info.price)
  const text = Number.isFinite(price) ? price.toFixed(2) : '-'
  return {
    text,
    title: [
      `上次条件单卖出成交价: ${text}`,
      `成交时间: ${formatTradeTime(info.time) || '-'}`,
      `状态: ${info.statusName || '-'}`,
      `账户: ${info.accountType === 'credit' ? '信用' : '普通'}`,
      `股票代码: ${info.stockCode}`,
      `委托号: ${info.entrustId || info.taskId || '-'}`,
      '',
      ...sourceLines
    ].join('\n'),
    hasData: true
  }
}
