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
}

export const trendService = new TrendService()
