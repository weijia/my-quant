import { database } from '../utils/Database'
import { strategyService } from './StrategyService'

class TrendService {
  async updateTrendJudgment(strategyId, trend) {
    await strategyService.updateStrategy(strategyId, {
      trendJudgment: trend,
      trendJudgmentUpdatedAt: new Date().toISOString()
    })

    await database.addTrendHistory({
      strategyId,
      trend,
      updatedAt: new Date().toISOString()
    })

    return true
  }

  async getTrendHistory(strategyId) {
    return await database.getTrendHistory(strategyId)
  }

  // 页面加载时同步趋势数据到本地数据库
  async syncTrendJudgmentsFromWebDAV() {
    try {
      const { webdavImportService } = await import('./WebDAVImportService')
      const trendData = await webdavImportService.fetchTrendJudgments()
      
      if (!trendData) {
        console.log('未获取到趋势判断数据')
        return false
      }

      // 获取所有策略，按股票代码索引
      const strategies = await strategyService.getAllStrategies()
      let updatedCount = 0

      for (const strategy of strategies) {
        const stockCode = strategy.stockCode
        const trendInfo = trendData[stockCode]
        
        if (trendInfo) {
          const updateData = {}
          
          // 优先使用自动趋势判断
          if (trendInfo.autoTrendJudgment) {
            updateData.trendJudgment = trendInfo.autoTrendJudgment
            updateData.trendJudgmentUpdatedAt = trendInfo.autoTrendJudgmentUpdatedAt || new Date().toISOString()
          } else if (trendInfo.trendJudgment) {
            updateData.trendJudgment = trendInfo.trendJudgment
            updateData.trendJudgmentUpdatedAt = trendInfo.trendJudgmentUpdatedAt || new Date().toISOString()
          }

          // 如果有更新数据，则更新策略
          if (updateData.trendJudgment) {
            await strategyService.updateStrategy(strategy.id, updateData)
            updatedCount++
            console.log(`更新策略 ${strategy.name} 的趋势: ${updateData.trendJudgment}`)
          }
        }
      }

      console.log(`趋势同步完成，共更新 ${updatedCount} 条策略`)
      return true
    } catch (error) {
      console.error('同步趋势数据失败:', error)
      return false
    }
  }
}

export const trendService = new TrendService()
