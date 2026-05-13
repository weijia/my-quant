import { database } from '../utils/Database'

class ConditionService {
  async addCondition(condition) {
    const defaultCondition = {
      strategyId: '',
      deltaPercentage: '',
      deltaAmount: '',
      tradeVolume: '',
      side: 'BUY',
      createDate: new Date().toISOString().split('T')[0],
      expiredTime: '',
      status: 'active'
    }
    
    const newCondition = { ...defaultCondition, ...condition }
    return await database.addCondition(newCondition)
  }

  async updateCondition(id, data) {
    return await database.updateCondition(id, data)
  }

  async deleteCondition(id) {
    return await database.deleteCondition(id)
  }

  async getConditionsByStrategyId(strategyId) {
    return await database.getConditionsByStrategyId(strategyId)
  }

  async stopCondition(id) {
    return await database.updateCondition(id, { status: 'stopped' })
  }
}

export const conditionService = new ConditionService()
