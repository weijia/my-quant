import { database } from '../utils/Database'

class StrategyService {
  async addStrategy(strategy) {
    const defaultStrategy = {
      name: '',
      stockCode: '',
      accountType: 'default',
      isMarginAccount: false,
      netPosition: 0,
      marketValue: '',
      fiveYearAvgDividendYield: '',
      trendJudgment: 'unset',
      expiryDate: '',
      oscillationGridSize: '',
      oscillationTradeAmount: '',
      breakoutGridSize: '',
      breakoutTradeAmount: '',
      decreaseSide: 'COLLSELL',
      decreaseStrategies: [],
      increaseStrategies: [],
      notes: '',
      manualNotes: ''
    }
    
    const newStrategy = { ...defaultStrategy, ...strategy }
    return await database.addStrategy(newStrategy)
  }

  async updateStrategy(id, data) {
    return await database.updateStrategy(id, data)
  }

  async deleteStrategy(id) {
    return await database.deleteStrategy(id)
  }

  async getStrategyById(id) {
    return await database.getStrategyById(id)
  }

  async getAllStrategies(filter = {}) {
    let strategies = await database.getAllStrategies()
    
    if (filter.accountType && filter.accountType !== 'all') {
      strategies = strategies.filter(s => s.accountType === filter.accountType)
    }
    
    if (filter.trend && filter.trend !== 'all') {
      strategies = strategies.filter(s => s.trendJudgment === filter.trend)
    }
    
    if (filter.sortBy) {
      strategies.sort((a, b) => {
        const order = filter.sortOrder === 'desc' ? -1 : 1
        const aVal = a[filter.sortBy] || ''
        const bVal = b[filter.sortBy] || ''
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return aVal.localeCompare(bVal, 'zh-CN') * order
        }
        
        const numA = parseFloat(aVal) || 0
        const numB = parseFloat(bVal) || 0
        return (numA - numB) * order
      })
    }
    
    return strategies
  }

  async getStrategiesByAccountType(accountType) {
    return await database.getStrategiesByAccountType(accountType)
  }

  async getStrategiesByTrend(trend) {
    return await database.getStrategiesByTrend(trend)
  }
}

export const strategyService = new StrategyService()
