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

        // 尝试提取数值进行比较（支持"1.23万"、"4.56亿"等格式）
        const parseValue = (val) => {
          const str = String(val).trim()
          if (!str) return 0
          const match = str.match(/^([\d.]+)\s*(万|亿)?$/)
          if (!match) return parseFloat(str) || 0
          let num = parseFloat(match[1]) || 0
          if (match[2] === '万') num *= 10000
          if (match[2] === '亿') num *= 100000000
          return num
        }

        const numA = parseValue(aVal)
        const numB = parseValue(bVal)

        // 如果两个值都能解析为非零数字，用数字比较
        if (numA !== 0 || numB !== 0) {
          return (numA - numB) * order
        }

        // 否则回退到字符串比较
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return aVal.localeCompare(bVal, 'zh-CN') * order
        }

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
