/**
 * 监控视图单元格格式化（纯函数）
 * 涨红跌绿沿用 A 股习惯：正数为红，负数为绿。
 */

const TREND_LABELS = {
  up: '上涨',
  trend_up: '上涨',
  down: '下跌',
  trend_down: '下跌',
  oscillation: '震荡',
  trend_oscillation: '震荡',
  pullback: '回踩',
  trend_pullback: '回踩',
  breakdown: '破位',
  trend_breakdown: '破位',
  unknown: '未知',
  trend_unknown: '未知',
  unset: '未设置'
}

const GRID_STATUS_LABELS = {
  running: '运行中',
  paused: '已暂停',
  expired: '已过期'
}

const PLACEHOLDER = '-'

export function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || value === '') return PLACEHOLDER
  const num = Number(value)
  return Number.isFinite(num) ? num.toFixed(digits) : String(value)
}

export function formatSignedNumber(value, digits = 0) {
  if (value === null || value === undefined || value === '') return PLACEHOLDER
  const num = Number(value)
  if (!Number.isFinite(num)) return String(value)
  const prefix = num >= 0 ? '+' : ''
  return prefix + num.toFixed(digits)
}

export function formatPercent(value) {
  if (value === null || value === undefined || value === '') return PLACEHOLDER
  const num = Number(value)
  return Number.isFinite(num) ? `${num.toFixed(2)}%` : String(value)
}

export function formatMarketValue(value) {
  if (value === null || value === undefined || value === '') return PLACEHOLDER
  const num = Number(String(value).replace(/,/g, ''))
  if (!Number.isFinite(num)) return String(value)
  return num >= 10000 ? `${(num / 10000).toFixed(1)}万` : num.toFixed(0)
}

export function formatTrend(value) {
  if (!value) return PLACEHOLDER
  return TREND_LABELS[value] || value
}

export function formatGridStatus(value) {
  if (!value) return PLACEHOLDER
  return GRID_STATUS_LABELS[value] || value
}

export function formatDateOnly(value) {
  if (!value) return PLACEHOLDER
  return String(value).slice(0, 10)
}

/** 列 key → 行数据取值器 */
const ACCESSORS = {
  price: (row) => row.price,
  today: (row) => row.today,
  qty: (row) => row.qty,
  hold_amt: (row) => row.hold_amt,
  profit: (row) => row.profit,
  trend: (row) => row.trend,
  grid_status: (row) => row.grid?.status,
  grid_mid: (row) => row.grid?.basicPrice,
  grid_range: (row) => row.grid?.priceRange,
  grid_step: (row) => row.grid?.gridSpacing,
  grid_now: (row) => row.grid?.nowPrice,
  grid_netpos: (row) => row.grid?.netPosition,
  grid_profit: (row) => row.grid?.profit,
  grid_expiry: (row) => row.grid?.expiredTime
}

/** 列 key → 格式化函数 */
const FORMATTERS = {
  today: formatPercent,
  profit: (v) => formatSignedNumber(v, 0),
  hold_amt: formatMarketValue,
  grid_profit: (v) => formatSignedNumber(v, 0),
  grid_expiry: formatDateOnly,
  grid_status: formatGridStatus,
  trend: formatTrend
}

/** 取该列的原始值 */
export function cellValue(row, key) {
  const accessor = ACCESSORS[key]
  return accessor ? accessor(row) : null
}

/** 渲染该列单元格文本 */
export function formatMonitorCell(row, key) {
  const value = cellValue(row, key)
  const formatter = FORMATTERS[key] || ((v) => formatNumber(v, 2))
  return formatter(value)
}

/** 该列是否按涨跌染色 */
const COLORED_KEYS = new Set(['today', 'profit', 'grid_profit'])

/** 单元格颜色类名（红涨绿跌） */
export function cellColorClass(row, key) {
  if (!COLORED_KEYS.has(key)) return ''
  const value = Number(cellValue(row, key))
  if (!Number.isFinite(value) || value === 0) return ''
  return value > 0 ? 'value-up' : 'value-down'
}
