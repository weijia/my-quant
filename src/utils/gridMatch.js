/**
 * 网格策略匹配。
 *
 * 数据源优先级：
 * 1) all_strategies.json 的 gridStrategies（WebDAV 导入时经 attachGridsFromAllStrategies 挂到 strategy.grid）
 * 2) MQTT list_strategies 返回的远程策略（{ founder: { default|credit: { strategies } }, pingan: { strategies } }）
 */

import { normalizeCode } from './stockCode'

const FOUNDER_ACCOUNT_TYPES = ['default', 'credit']

/** 拆解远程策略结构 → 各分组的策略数组 */
function strategyBuckets(remoteStrategies) {
  if (!remoteStrategies) return []
  const buckets = []
  const founder = remoteStrategies.founder
  if (founder) {
    FOUNDER_ACCOUNT_TYPES.forEach((type) => {
      const list = founder[type]?.strategies
      if (list?.length) buckets.push(list)
    })
  }
  if (remoteStrategies.pingan?.strategies?.length) {
    buckets.push(remoteStrategies.pingan.strategies)
  }
  return buckets
}

/** 取该股票的网格策略；同一股票存在多张网格时优先「运行中」那张 */
export function findGridForStock(remoteStrategies, stockCode) {
  const code = normalizeCode(stockCode)
  if (!code) return null

  let matched = null
  strategyBuckets(remoteStrategies)
    .flat()
    .forEach((item) => {
      if (!item || item.strategyType !== 'grid') return
      if (normalizeCode(item.stockCode) !== code) return
      if (!matched || (matched.status !== 'running' && item.status === 'running')) {
        matched = item
      }
    })
  return matched
}

// ===== all_strategies.json（WebDAV）网格数据 =====

/** 券商页面解析出的状态文本 → 标准状态值；未识别的原样保留（中文可直接展示） */
const GRID_STATUS_ALIASES = {
  running: 'running', run: 'running', active: 'running', normal: 'running',
  '运行中': 'running', '正常': 'running', '已运行': 'running', '执行中': 'running',
  paused: 'paused', pause: 'paused', stopped: 'paused', stop: 'paused',
  '已暂停': 'paused', '暂停': 'paused', '已停止': 'paused', '停止': 'paused',
  expired: 'expired', '已过期': 'expired', '过期': 'expired', '已到期': 'expired'
}

export function normalizeGridStatus(value) {
  const text = String(value ?? '').trim()
  if (!text) return ''
  return GRID_STATUS_ALIASES[text] || GRID_STATUS_ALIASES[text.toLowerCase()] || text
}

/** 账户类型归一：非 credit 一律按 default 处理 */
function normalizeAccountType(value) {
  return String(value ?? '').trim().toLowerCase() === 'credit' ? 'credit' : 'default'
}

/**
 * 把 all_strategies.json 的一条 gridStrategies 转成网格列需要的结构。
 * 字段名对齐 monitorFormatters 的 ACCESSORS（status / basicPrice / priceRange /
 * gridSpacing / netPosition / profit / expiredTime）。
 */
export function toMonitorGrid(raw) {
  if (!raw) return null
  const low = raw.priceLowLimit
  const high = raw.priceHighLimit
  const range = raw.priceRange || (low != null && high != null ? `${low}-${high}` : '')
  const status = normalizeGridStatus(raw.status || (raw.expireStatus === 'expired' ? 'expired' : ''))
  // 信用账户的间距可能被写成「买入:0.11, 卖出:0.11」，取买入侧供数值列展示
  const rawSpacing = raw.gridSpacing ?? raw.offsetPriceBuy ?? raw.offsetPrice ?? null
  const spacing = typeof rawSpacing === 'string' && rawSpacing.includes('买入')
    ? (rawSpacing.match(/买入\s*[:：]\s*([\d.]+)/)?.[1] ?? rawSpacing)
    : rawSpacing

  return {
    status,
    statusText: String(raw.status ?? '').trim(),
    basicPrice: raw.basicPrice ?? null,
    priceRange: range || '',
    gridSpacing: spacing,
    netPosition: raw.netPosition ?? null,
    profit: raw.profit ?? null,
    expiredTime: raw.expiredTime ?? null,
    stockCode: raw.stockCode ?? '',
    stockName: raw.stockName ?? '',
    accountType: normalizeAccountType(raw.accountType),
    source: 'all_strategies.json'
  }
}

/** 同股票多张网格时优先「运行中」那张 */
function preferRunning(current, next) {
  return !current || (current.status !== 'running' && next.status === 'running')
}

/**
 * 把 all_strategies.json 的 gridStrategies 挂到导入后的每条策略上（strategy.grid）。
 * 先按 股票代码+账户类型 精确匹配，匹配不到再退化为按股票代码匹配。
 * 直接修改传入的策略对象（导入流程中它们是新建对象，随后写入 PouchDB）。
 */
export function attachGridsFromAllStrategies(strategies, gridStrategies) {
  if (!Array.isArray(strategies) || !strategies.length) return strategies
  if (!Array.isArray(gridStrategies) || !gridStrategies.length) return strategies

  const exact = new Map()
  const byCode = new Map()

  gridStrategies.forEach((raw) => {
    const code = normalizeCode(raw?.stockCode)
    if (!code) return
    const grid = toMonitorGrid(raw)
    const key = `${code}|${grid.accountType}`
    if (preferRunning(exact.get(key), grid)) exact.set(key, grid)
    if (preferRunning(byCode.get(code), grid)) byCode.set(code, grid)
  })

  strategies.forEach((strategy) => {
    const code = normalizeCode(strategy?.stockCode)
    if (!code) return
    const key = `${code}|${normalizeAccountType(strategy?.accountType)}`
    strategy.grid = exact.get(key) || byCode.get(code) || null
  })
  return strategies
}
