/**
 * 监控视图行数据构建器。
 *
 * 行 = 一只股票。来源取「本地策略」与「MQTT 远程网格策略」的并集，
 * 持仓数据从 holdingsMap（按 券商:账户类型 分组）回填。
 */

import { computed, unref } from 'vue'

const FOUNDER_ACCOUNT_TYPES = ['default', 'credit']

/** 报价 map 的 key，与 MQTTPriceService 的归一化规则保持一致 */
function codeKey(code) {
  const text = String(code == null ? '' : code).trim()
  return /^\d+$/.test(text) ? text.padStart(6, '0') : text
}

/** 拆解远程策略结构 → 各分组的策略数组 */
function providerBuckets(remoteStrategies) {
  if (!remoteStrategies) return []
  const buckets = []
  const founder = remoteStrategies.founder
  if (founder) {
    FOUNDER_ACCOUNT_TYPES.forEach((type) => {
      const strategies = founder[type]?.strategies
      if (strategies?.length) buckets.push(strategies)
    })
  }
  if (remoteStrategies.pingan?.strategies?.length) {
    buckets.push(remoteStrategies.pingan.strategies)
  }
  return buckets
}

/** 股票代码 → 网格策略（同一股票多张网格时优先取「运行中」那张） */
function buildGridMap(remoteStrategies) {
  const map = new Map()
  providerBuckets(remoteStrategies)
    .flat()
    .forEach((item) => {
      if (!item?.stockCode || item.strategyType !== 'grid') return
      const key = String(item.stockCode)
      const current = map.get(key)
      if (!current || (current.status !== 'running' && item.status === 'running')) {
        map.set(key, item)
      }
    })
  return map
}

/** 精确分组优先，找不到时退化为全分组查找 */
function findHolding(holdingsMap, provider, accountType, stockCode) {
  if (!holdingsMap || !stockCode) return null
  if (provider) {
    const group = holdingsMap.get(`${provider}:${accountType || 'default'}`)
    const exact = group?.get(stockCode)
    if (exact) return exact
  }
  for (const group of holdingsMap.values()) {
    const hit = group?.get(stockCode)
    if (hit) return hit
  }
  return null
}

function buildBaseRow({ key, stockCode, name, price, today, trend, grid, holding }) {
  return {
    key,
    stockCode,
    name,
    price: price ?? null,
    today: today ?? null,
    trend: trend || 'unset',
    qty: holding?.quantity ?? null,
    hold_amt: holding?.marketValue ?? null,
    profit: holding?.profit ?? null,
    grid: grid || null
  }
}

function rowFromStrategy(strategy, holdingsMap, gridMap, quotes) {
  const provider = strategy.provider || 'founder'
  const accountType = strategy.accountType || 'default'
  const holding = findHolding(holdingsMap, provider, accountType, strategy.stockCode)
  // 实时报价优先，缺失时退回策略自身携带的价格
  const quote = quotes?.get(codeKey(strategy.stockCode))
  return buildBaseRow({
    key: `${provider}:${accountType}:${strategy.stockCode}`,
    stockCode: strategy.stockCode,
    name: strategy.name || quote?.name,
    price: quote?.price ?? strategy.currentPrice,
    today: quote?.changePct ?? strategy.changePercent,
    trend: strategy.trendJudgment,
    grid: gridMap.get(String(strategy.stockCode)),
    holding
  })
}

function rowFromGrid(grid, holdingsMap, quotes) {
  const holding = findHolding(holdingsMap, null, null, grid.stockCode)
  const quote = quotes?.get(codeKey(grid.stockCode))
  return buildBaseRow({
    key: `remote:${grid.stockCode}`,
    stockCode: grid.stockCode,
    name: grid.stockName || quote?.name,
    price: quote?.price ?? grid.nowPrice,
    today: quote?.changePct,
    trend: 'unset',
    grid,
    holding
  })
}

/**
 * 构建监控行列表（本地策略行在前，纯远程行在后）
 *
 * @param {Ref<Array>} strategies 本地策略
 * @param {Ref<Map>} holdingsMap  持仓（按 券商:账户类型 分组）
 * @param {Ref<Object>} remoteStrategies  MQTT 远程策略
 * @param {Ref<Map>} [quotes] 实时报价（来自 MQTTPriceService）
 */
export function useMonitorRows(strategies, holdingsMap, remoteStrategies, quotes) {
  const rows = computed(() => {
    const list = unref(strategies) || []
    const map = unref(holdingsMap)
    const quoteMap = unref(quotes)
    const gridMap = buildGridMap(unref(remoteStrategies))

    const rows = []
    const seenCodes = new Set()

    list.forEach((strategy) => {
      if (!strategy?.stockCode) return
      seenCodes.add(String(strategy.stockCode))
      rows.push(rowFromStrategy(strategy, map, gridMap, quoteMap))
    })

    gridMap.forEach((grid, code) => {
      if (seenCodes.has(code)) return
      rows.push(rowFromGrid(grid, map, quoteMap))
    })

    return rows
  })

  return { rows }
}
