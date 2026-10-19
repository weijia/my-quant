/**
 * 远程网格策略匹配。
 * 远程策略结构：{ founder: { default|credit: { strategies } }, pingan: { strategies } }
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
