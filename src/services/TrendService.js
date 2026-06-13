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

      const trendKeys = Object.keys(trendData)
      console.log('TrendService: 获取到的趋势数据键:', trendKeys)
      console.log('TrendService: 趋势数据示例:', JSON.stringify(Object.entries(trendData).slice(0, 2)))

      // 获取所有策略
      const strategies = await strategyService.getAllStrategies()
      console.log('TrendService: 数据库中的策略数量:', strategies.length)
      console.log('TrendService: 数据库中的策略股票代码:', strategies.map(s => s.stockCode))
      
      let updatedCount = 0
      let matchedCount = 0

      // 将简化的趋势值转换为带前缀的格式
      // WebDAV: 'up' -> 'trend_up', 'down' -> 'trend_down', 'oscillation' -> 'trend_oscillation'
      const normalizeTrendValue = (value) => {
        if (!value) return null
        // 如果已经有前缀，直接返回
        if (value.startsWith('trend_') || value === 'unset' || value === 'high_volatility' || value === 'medium_volatility' || value === 'low_volatility' || value === 'trend_breakdown') {
          return value
        }
        // 否则添加前缀
        return `trend_${value}`
      }

      for (const strategy of strategies) {
        const stockCode = strategy.stockCode
        if (!stockCode) continue
        
        // 尝试多种匹配方式
        let trendInfo = null
        
        // 1. 直接匹配
        if (trendData[stockCode]) {
          trendInfo = trendData[stockCode]
        }
        
        // 2. 去掉 .SH/.SZ 后缀
        if (!trendInfo && stockCode.includes('.')) {
          const normalizedCode = stockCode.split('.')[0]
          if (trendData[normalizedCode]) {
            trendInfo = trendData[normalizedCode]
          }
        }
        
        // 3. 加上 .SH 后缀
        if (!trendInfo) {
          const shCode = stockCode + '.SH'
          if (trendData[shCode]) {
            trendInfo = trendData[shCode]
          }
        }
        
        // 4. 加上 .SZ 后缀
        if (!trendInfo) {
          const szCode = stockCode + '.SZ'
          if (trendData[szCode]) {
            trendInfo = trendData[szCode]
          }
        }
        
        // 5. 如果 stockCode 包含后缀，尝试纯数字匹配
        if (!trendInfo && /\.\w+$/.test(stockCode)) {
          const pureCode = stockCode.replace(/\.\w+$/, '')
          if (trendData[pureCode]) {
            trendInfo = trendData[pureCode]
          }
        }

        if (trendInfo) {
          matchedCount++
          const updateData = {}
          
          // 优先使用自动趋势判断，并转换为带前缀的格式
          if (trendInfo.autoTrendJudgment) {
            updateData.trendJudgment = normalizeTrendValue(trendInfo.autoTrendJudgment)
            updateData.trendJudgmentUpdatedAt = trendInfo.autoTrendJudgmentUpdatedAt || new Date().toISOString()
          } else if (trendInfo.trendJudgment) {
            updateData.trendJudgment = normalizeTrendValue(trendInfo.trendJudgment)
            updateData.trendJudgmentUpdatedAt = trendInfo.trendJudgmentUpdatedAt || new Date().toISOString()
          }

          // 如果有更新数据，则更新策略
          if (updateData.trendJudgment) {
            await strategyService.updateStrategy(strategy.id, updateData)
            updatedCount++
            console.debug(`TrendService: 更新策略 ${strategy.name}(${stockCode}) 的趋势: ${updateData.trendJudgment}`)
          }
        }
      }

      console.log(`TrendService: 趋势同步完成，匹配 ${matchedCount} 条，更新 ${updatedCount} 条策略`)
      
      // 如果没有匹配到任何策略，提示用户可能需要先同步 WebDAV
      if (matchedCount === 0 && strategies.length > 0) {
        console.warn('TrendService: 未匹配到任何策略，可能需要先点击"同步WebDAV"按钮导入策略数据')
        console.warn('TrendService: 请检查控制台日志，确认 stockCode 格式是否匹配')
      }
      
      return true
    } catch (error) {
      console.error('TrendService: 同步趋势数据失败:', error)
      return false
    }
  }
}

export const trendService = new TrendService()
