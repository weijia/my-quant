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
        console.log('TrendService: 未获取到趋势判断数据')
        return false
      }

      console.log('TrendService: 获取到的趋势数据键:', Object.keys(trendData))

      // 获取所有策略
      const strategies = await strategyService.getAllStrategies()
      console.log('TrendService: 数据库中的策略数量:', strategies.length)
      
      let updatedCount = 0
      let matchedCount = 0

      for (const strategy of strategies) {
        const stockCode = strategy.stockCode
        // 尝试直接匹配 stockCode
        let trendInfo = trendData[stockCode]
        
        // 如果直接匹配失败，尝试标准化后匹配（如去掉 .SH/.SZ 后缀）
        if (!trendInfo && stockCode) {
          const normalizedCode = stockCode.replace(/\.(SH|SZ)$/i, '')
          trendInfo = trendData[normalizedCode]
          console.log(`TrendService: 标准化匹配 ${stockCode} -> ${normalizedCode}:`, trendInfo ? '成功' : '失败')
        }

        if (trendInfo) {
          matchedCount++
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
            console.log(`TrendService: 更新策略 ${strategy.name}(${stockCode}) 的趋势: ${updateData.trendJudgment}`)
          }
        }
      }

      console.log(`TrendService: 趋势同步完成，匹配 ${matchedCount} 条，更新 ${updatedCount} 条策略`)
      
      // 如果没有匹配到任何策略，提示用户可能需要先同步 WebDAV
      if (matchedCount === 0 && strategies.length > 0) {
        console.warn('TrendService: 未匹配到任何策略，可能需要先点击"同步WebDAV"按钮导入策略数据')
      }
      
      return true
    } catch (error) {
      console.error('TrendService: 同步趋势数据失败:', error)
      return false
    }
  }
}

export const trendService = new TrendService()
