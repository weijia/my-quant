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
    // 保留原始上下限，供「当前价是否越界（破网）」判断使用
    priceLowLimit: raw.priceLowLimit ?? null,
    priceHighLimit: raw.priceHighLimit ?? null,
    gridSpacing: spacing,
    netPosition: raw.netPosition ?? null,
    profit: raw.profit ?? null,
    expiredTime: raw.expiredTime ?? null,
    // ===== 容量参数（券商 taskInfo.params / extra 经 GridStrategyService 派生）=====
    // 卖出侧：qtyCanSell 当前可卖股数，maxQtyCanSell 建网格时设定的最大可卖股数
    qtyCanSell: raw.qtyCanSell ?? null,
    maxQtyCanSell: raw.maxQtyCanSell ?? null,
    quantityBuy: raw.quantityBuy ?? raw.quantity ?? null,
    quantitySell: raw.quantitySell ?? raw.quantity ?? null,
    // 资金侧：investedAmount = costFunds（可为负，表示卖出回笼已超过买入投入）
    // remainingFund / availableToBuy 在油猴脚本里是同一个公式 max(0, maxFund - costFunds)
    maxFund: raw.maxFund ?? raw.totalAmount ?? null,
    investedAmount: raw.investedAmount ?? raw.costFunds ?? null,
    remainingFund: raw.remainingFund ?? null,
    availableToBuy: raw.availableToBuy ?? null,
    gridCount: raw.gridCount ?? null,
    nowPrice: raw.nowPrice ?? null,
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

// ===== 当前价是否超出网格区间（破网） =====
// 规则与 vue-dialog-userscript 的 isOscillationGridOutOfRange 一致：
// 取网格单的价格上下限，currentPrice < low || currentPrice > high 即越界；
// 上下限缺失/非法、或当前价无效时不做判断。

/** 解析 "9.5-11.58" / "30.000-43.000" 这类区间文本 */
export function parseGridRange(priceRange) {
  const text = String(priceRange ?? '').trim()
  if (!text) return null
  const matched = text.match(/^(\d+(?:\.\d+)?)\s*[-~～至]\s*(\d+(?:\.\d+)?)$/)
  if (!matched) return null
  const low = Number(matched[1])
  const high = Number(matched[2])
  return Number.isFinite(low) && Number.isFinite(high) && low > 0 && high > low
    ? { low, high }
    : null
}

/** 取网格价格边界：优先显式上下限字段，其次解析 priceRange（MQTT 远程策略常用） */
export function getGridPriceBounds(grid) {
  if (!grid) return null
  const low = Number(grid.priceLowLimit ?? grid.priceLow ?? grid.low)
  const high = Number(grid.priceHighLimit ?? grid.priceHigh ?? grid.high)
  if (Number.isFinite(low) && Number.isFinite(high) && low > 0 && high > low) {
    return { low, high }
  }
  return parseGridRange(grid.priceRange)
}

/**
 * 判定当前价相对网格区间的位置。
 * @returns {'in'|'out_low'|'out_high'|'unknown'} out_low=跌破下限，out_high=突破上限
 */
export function getGridPriceState(grid, price) {
  const bounds = getGridPriceBounds(grid)
  const current = Number(price)
  if (!bounds || !Number.isFinite(current) || current <= 0) return 'unknown'
  if (current < bounds.low) return 'out_low'
  if (current > bounds.high) return 'out_high'
  return 'in'
}

// ===== 网格容量状态（可卖量 / 可用资金） =====
// 价格破网之外，网格还会因为「券卖光」或「钱用光」而单边停摆；反过来，
// 卖出回笼超过初始额度（costFunds 为负 → remainingFund > maxFund）、
// 或可卖量超过建网格时设定的 maxQtyCanSell，也属于需要提示的越界状态。
// 券商字段见 GridStrategyService.js:492-552 与 http-interface.md 的 params/extra 说明。

/** 宽松数值解析：兼容 "1,200" / "1200 股" / 数字字符串 */
function toNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const num = Number(String(value).replace(/[,，\s]/g, ''))
  return Number.isFinite(num) ? num : null
}

function pushIssue(issues, code, label, detail) {
  issues.push({ code, label, detail })
}

/**
 * 判定网格的容量类异常，返回按严重程度排序的提示数组。
 * 数据缺失时对应项跳过，不误报。
 * @param {object} grid 网格对象（all_strategies.json 或 MQTT 远程策略）
 * @param {number} price 当前价，用于估算一格买入所需金额
 * @returns {Array<{code:string,label:string,detail:string}>}
 */
export function getGridCapacityIssues(grid, price) {
  if (!grid) return []
  const issues = []

  const qtyCanSell = toNumber(grid.qtyCanSell ?? grid.enableAmount)
  // 注意：gridAmount 在部分数据是「每格金额（元）」而非股数，不能当数量用
  const qtySell = toNumber(grid.quantitySell ?? grid.quantity)
  const maxQtyCanSell = toNumber(grid.maxQtyCanSell)
  const qtyBuy = toNumber(grid.quantityBuy ?? grid.quantity)
  const maxFund = toNumber(grid.maxFund ?? grid.totalAmount)
  const invested = toNumber(grid.investedAmount ?? grid.costFunds)
  const current = toNumber(price ?? grid.nowPrice)
  // 优先用现成的可用资金；缺失时按油猴脚本公式由 总额度 - 已投入 推导
  const fund = toNumber(grid.availableToBuy ?? grid.remainingFund)
    ?? (maxFund !== null && invested !== null ? Math.max(0, maxFund - invested) : null)

  // —— 卖出侧：下一格是否还卖得动 / 可卖量是否超过设定上限 ——
  if (qtyCanSell !== null && qtySell !== null && qtySell > 0 && qtyCanSell < qtySell) {
    const netPos = toNumber(grid.netPosition)
    // 油猴脚本用 `extra.qtyCanSell || 0` 赋值：详情接口未返回该字段时也会落成 0，
    // 与「确实无券可卖」无法区分。有净持仓却报 0 时用存疑文案，避免武断结论。
    const uncertain = qtyCanSell === 0 && netPos !== null && netPos > 0
    pushIssue(issues, uncertain ? 'sell_unknown' : 'sell_exhausted',
      uncertain ? '可卖待核' : '卖空',
      uncertain
        ? `可卖量为 0，但净持仓 ${netPos} 股：可能确实无券可卖，也可能是详情接口未返回该字段，请核对`
        : `可卖 ${qtyCanSell} 股 < 每格卖出 ${qtySell} 股，下一格无法成交`)
  }
  if (qtyCanSell !== null && maxQtyCanSell !== null && maxQtyCanSell > 0
      && qtyCanSell > maxQtyCanSell) {
    pushIssue(issues, 'qty_overflow', '持仓超限',
      `可卖 ${qtyCanSell} 股 > 设定最大可卖 ${maxQtyCanSell} 股`)
  }

  // —— 买入侧：下一格是否还买得动 / 可用资金是否超过设定额度 ——
  const oneGridCost = qtyBuy !== null && qtyBuy > 0 && current !== null && current > 0
    ? qtyBuy * current
    : null
  if (fund !== null && oneGridCost !== null && fund < oneGridCost) {
    pushIssue(issues, 'buy_exhausted', '买满',
      `可用资金 ${fund.toFixed(0)} 元 < 一格买入约 ${oneGridCost.toFixed(0)} 元`
      + `（${qtyBuy} 股 × ${current}）`)
  }
  if (fund !== null && maxFund !== null && maxFund > 0 && fund > maxFund) {
    pushIssue(issues, 'fund_overflow', '额度超额',
      `可用资金 ${fund.toFixed(0)} 元 > 设定总额度 ${maxFund.toFixed(0)} 元`
      + (invested !== null && invested < 0
        ? `（已投入 ${invested.toFixed(0)} 元为负，说明卖出回笼已超过初始额度）`
        : ''))
  }

  return issues
}

/** tooltip 用的容量参数明细（无有效参数时返回空数组） */
export function getGridCapacityDetails(grid, price) {
  if (!grid) return []
  const lines = []
  const show = (label, value, unit = '') => {
    if (value !== null && value !== undefined && value !== '') lines.push(`${label}: ${value}${unit}`)
  }
  show('净持仓', grid.netPosition, ' 股')
  show('可卖量', grid.qtyCanSell, ' 股')
  show('最大可卖', grid.maxQtyCanSell, ' 股')
  show('每格买/卖', grid.quantityBuy != null && grid.quantitySell != null
    ? `${grid.quantityBuy} / ${grid.quantitySell}` : (grid.quantityBuy ?? grid.quantitySell), ' 股')
  show('已投入', grid.investedAmount, ' 元')
  show('可用资金', grid.availableToBuy ?? grid.remainingFund, ' 元')
  show('总额度', grid.maxFund, ' 元')
  const qtyBuy = toNumber(grid.quantityBuy ?? grid.quantity)
  const current = toNumber(price ?? grid.nowPrice)
  if (qtyBuy !== null && qtyBuy > 0 && current !== null && current > 0) {
    lines.push(`一格买入约需: ${(qtyBuy * current).toFixed(0)} 元`)
  }
  return lines
}
