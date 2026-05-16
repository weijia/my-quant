class Database {
  constructor() {
    const PouchDB = window.PouchDB || require('pouchdb').default || require('pouchdb')
    this.db = new PouchDB('my_quant_strategies')
    this.strategyPrefix = 'strategy_'
    this.conditionPrefix = 'condition_'
    this.trendPrefix = 'trend_'
  }

  generateId(prefix) {
    return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async addStrategy(strategy) {
    const doc = {
      _id: this.generateId(this.strategyPrefix),
      ...strategy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const result = await this.db.put(doc)
    return { ...doc, id: result.id, _id: result.id, _rev: result.rev }
  }

  async updateStrategy(id, data) {
    const doc = await this.db.get(id)
    const updatedDoc = {
      ...doc,
      ...data,
      updatedAt: new Date().toISOString()
    }
    const result = await this.db.put(updatedDoc)
    return { ...updatedDoc, id: result.id, _rev: result.rev }
  }

  async deleteStrategy(id) {
    const doc = await this.db.get(id)
    await this.db.remove(doc)
    return true
  }

  async getStrategyById(id) {
    try {
      const doc = await this.db.get(id)
      return { ...doc, id: doc._id }
    } catch (error) {
      if (error.status === 404) {
        return null
      }
      throw error
    }
  }

  async getAllStrategies() {
    const result = await this.db.allDocs({
      include_docs: true,
      startkey: this.strategyPrefix,
      endkey: this.strategyPrefix + '\uffff'
    })
    return result.rows.map(row => ({ ...row.doc, id: row.id }))
  }

  async getStrategiesByAccountType(accountType) {
    const allStrategies = await this.getAllStrategies()
    return allStrategies.filter(s => s.accountType === accountType)
  }

  async getStrategiesByTrend(trend) {
    const allStrategies = await this.getAllStrategies()
    if (trend === 'all') return allStrategies
    return allStrategies.filter(s => s.trendJudgment === trend)
  }

  async addCondition(condition) {
    const doc = {
      _id: this.generateId(this.conditionPrefix),
      ...condition,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const result = await this.db.put(doc)
    return { ...doc, id: result.id, _id: result.id, _rev: result.rev }
  }

  async updateCondition(id, data) {
    const doc = await this.db.get(id)
    const updatedDoc = {
      ...doc,
      ...data,
      updatedAt: new Date().toISOString()
    }
    const result = await this.db.put(updatedDoc)
    return { ...updatedDoc, id: result.id, _rev: result.rev }
  }

  async deleteCondition(id) {
    const doc = await this.db.get(id)
    await this.db.remove(doc)
    return true
  }

  async getConditionsByStrategyId(strategyId) {
    const result = await this.db.allDocs({
      include_docs: true,
      startkey: this.conditionPrefix,
      endkey: this.conditionPrefix + '\uffff'
    })
    return result.rows
      .map(row => ({ ...row.doc, id: row.id }))
      .filter(c => c.strategyId === strategyId)
  }

  async addTrendHistory(trendData) {
    const doc = {
      _id: this.generateId(this.trendPrefix),
      ...trendData,
      createdAt: new Date().toISOString()
    }
    const result = await this.db.put(doc)
    return { ...doc, id: result.id, _id: result.id, _rev: result.rev }
  }

  async getTrendHistory(strategyId) {
    const result = await this.db.allDocs({
      include_docs: true,
      startkey: this.trendPrefix,
      endkey: this.trendPrefix + '\uffff'
    })
    return result.rows
      .map(row => ({ ...row.doc, id: row.id }))
      .filter(t => t.strategyId === strategyId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  async exportData() {
    const result = await this.db.allDocs({ include_docs: true })
    return JSON.stringify(result.rows.map(row => row.doc), null, 2)
  }

  async importData(jsonString) {
    const docs = JSON.parse(jsonString)
    for (const doc of docs) {
      delete doc._rev
      await this.db.put(doc)
    }
    return docs.length
  }

  async clearAllStrategies() {
    const result = await this.db.allDocs({
      include_docs: true,
      startkey: this.strategyPrefix,
      endkey: this.strategyPrefix + '\uffff'
    })

    const deletePromises = result.rows.map(row => {
      return this.db.remove(row.doc._id, row.doc._rev)
    })

    await Promise.all(deletePromises)
    return result.rows.length
  }

  async clearAllData() {
    const result = await this.db.allDocs({ include_docs: true })

    const deletePromises = result.rows.map(row => {
      return this.db.remove(row.doc._id, row.doc._rev)
    })

    await Promise.all(deletePromises)
    return result.rows.length
  }
}

export const database = new Database()
