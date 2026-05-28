/**
 * 收市买入定时任务服务
 * 在每天交易日的 2:45 左右执行已标记的收市买入条件单
 */

import mqttConditionService from './MQTTConditionService.js'
import appConfigService from './AppConfigService.js'

class MarketCloseBuyService {
  constructor() {
    this.checkInterval = null
    this.lastExecutedDate = null
    this.isRunning = false
  }

  // 启动定时检查
  start() {
    if (this.checkInterval) {
      console.log('[收市买入服务] 已经在运行中')
      return
    }

    console.log('[收市买入服务] 启动定时检查')
    // 每分钟检查一次
    this.checkInterval = setInterval(() => {
      this.checkAndExecute()
    }, 60000)

    // 立即检查一次
    this.checkAndExecute()
  }

  // 停止定时检查
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
      console.log('[收市买入服务] 已停止')
    }
  }

  // 检查并执行收市买入
  async checkAndExecute() {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const currentDate = now.toDateString()

    // 检查是否在 14:45 - 14:50 之间
    if (hours !== 14 || minutes < 45 || minutes > 50) {
      return
    }

    // 检查今天是否已经执行过
    if (this.lastExecutedDate === currentDate) {
      return
    }

    // 检查是否是交易日（简化：周一到周五）
    const dayOfWeek = now.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      console.log('[收市买入服务] 周末不执行')
      this.lastExecutedDate = currentDate
      return
    }

    console.log('[收市买入服务] 到达执行时间，开始处理收市买入任务')
    this.lastExecutedDate = currentDate

    await this.executeAllMarketCloseBuys()
  }

  // 执行所有标记的收市买入（按账户类型分组，同账户一起下，不同账户间隔1秒）
  async executeAllMarketCloseBuys() {
    // 从 localStorage 获取所有收市买入配置
    const configs = this.getAllMarketCloseBuyConfigs()

    if (configs.length === 0) {
      console.log('[收市买入服务] 没有待执行的收市买入任务')
      return
    }

    console.log(`[收市买入服务] 发现 ${configs.length} 个收市买入任务`)

    // 按账户类型分组（provider + accountType 作为分组 key）
    const groups = {}
    for (const config of configs) {
      const groupKey = `${config.provider || ''}_${config.accountType || ''}`
      if (!groups[groupKey]) {
        groups[groupKey] = {
          provider: config.provider || '',
          accountType: config.accountType || '',
          configs: []
        }
      }
      groups[groupKey].configs.push(config)
    }

    // 按固定顺序执行：融资 → 普通 → 平安
    const order = ['_margin', '_cash', 'pingan_margin']
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const indexA = order.indexOf(a)
      const indexB = order.indexOf(b)
      return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB)
    })

    console.log(`[收市买入服务] 分为 ${sortedKeys.length} 个账户组:`, sortedKeys)

    // 按组执行，不同组之间间隔1秒
    for (let i = 0; i < sortedKeys.length; i++) {
      const groupKey = sortedKeys[i]
      const group = groups[groupKey]
      const accountLabel = group.provider === 'pingan' ? '平安' : (group.accountType === 'margin' ? '融资' : '普通')
      console.log(`[收市买入服务] 执行第 ${i + 1}/${sortedKeys.length} 组: ${accountLabel} (${group.configs.length} 个订单)`)

      // 同一账户组的订单一起下发
      for (const config of group.configs) {
        await this.executeMarketCloseBuy(config)
      }

      // 不同组之间间隔1秒（最后一组不需要等待）
      if (i < sortedKeys.length - 1) {
        console.log(`[收市买入服务] 等待1秒后切换下一组...`)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log('[收市买入服务] 所有收市买入任务执行完毕')
  }

  // 获取所有收市买入配置（从统一配置）
  getAllMarketCloseBuyConfigs() {
    const configs = []
    const allConfigs = appConfigService.getMarketCloseBuyConfig()

    for (const strategyId in allConfigs) {
      const config = allConfigs[strategyId]
      if (config) {
        configs.push({ ...config, strategyId })
      }
    }

    return configs
  }

  // 执行单个收市买入
  async executeMarketCloseBuy(config) {
    try {
      console.log(`[收市买入服务] 执行: ${config.stockCode}, 数量:${config.tradeVolume}, 上涨0.1%买入`)

      await mqttConditionService.sendBuyOrder({
        stockCode: config.stockCode,
        stockName: config.stockName,
        tradeVolume: config.tradeVolume,
        percentage: 0.1,  // 上涨0.1%
        provider: config.provider,
        accountType: config.accountType,
        side: config.side
      })

      console.log(`[收市买入服务] 成功: ${config.stockCode}`)

      // 执行后清除配置
      appConfigService.clearMarketCloseBuyForStrategy(config.strategyId)

      // 触发事件通知 UI 更新
      window.dispatchEvent(new CustomEvent('marketCloseBuyExecuted', {
        detail: { strategyId: config.strategyId, stockCode: config.stockCode }
      }))
    } catch (error) {
      console.error(`[收市买入服务] 失败: ${config.stockCode}`, error)
    }
  }

  // 手动触发执行（用于测试）
  async manualExecute() {
    console.log('[收市买入服务] 手动触发执行')
    await this.executeAllMarketCloseBuys()
  }

  // 获取待执行的任务数量
  getPendingCount() {
    return this.getAllMarketCloseBuyConfigs().length
  }
}

// 导出单例
const marketCloseBuyService = new MarketCloseBuyService()

export default marketCloseBuyService
export { MarketCloseBuyService }
