import { database } from '../utils/Database'

class DataConverter {
  static convertStockData(webdavData) {
    const convertedStrategies = []
    const processedNames = new Set()
    
    console.log('开始转换数据，原始数据结构:', Object.keys(webdavData))
    
    if (webdavData.stockData && Array.isArray(webdavData.stockData)) {
      console.log('stockData 数量:', webdavData.stockData.length)
      for (const stock of webdavData.stockData) {
        const strategy = this.convertStockToStrategy(stock, webdavData)
        if (strategy && strategy.name) {
          const key = `${strategy.name}-${strategy.accountType}`
          if (!processedNames.has(key)) {
            processedNames.add(key)
            convertedStrategies.push(strategy)
            console.log('添加策略:', strategy.name, strategy.accountType)
          }
        }
      }
    }
    
    if (webdavData.advancedStrategies && Array.isArray(webdavData.advancedStrategies)) {
      console.log('advancedStrategies 数量:', webdavData.advancedStrategies.length)
      for (const advanced of webdavData.advancedStrategies) {
        const strategy = this.convertAdvancedStrategy(advanced)
        if (strategy && strategy.name) {
          const key = `${strategy.name}-${strategy.accountType}`
          if (!processedNames.has(key)) {
            processedNames.add(key)
            convertedStrategies.push(strategy)
            console.log('添加高级策略:', strategy.name, strategy.accountType)
          }
        }
      }
    }
    
    if (webdavData.conditionalStrategies && Array.isArray(webdavData.conditionalStrategies)) {
      console.log('conditionalStrategies 数量:', webdavData.conditionalStrategies.length)
      const stockMap = {}
      for (const cond of webdavData.conditionalStrategies) {
        const name = cond.stockName || cond.name || ''
        if (name) {
          if (!stockMap[name]) {
            stockMap[name] = {
              name: name,
              stockCode: cond.stockCode || '',
              accountType: this.normalizeAccountType(cond.accountType),
              decreaseStrategies: [],
              increaseStrategies: []
            }
          }
          const converted = this.convertConditionStrategy(cond)
          if (converted.side === 'SELL' || converted.side === 'COLLSELL' || converted.side === 'SELL_SHORT') {
            stockMap[name].decreaseStrategies.push(converted)
          } else {
            stockMap[name].increaseStrategies.push(converted)
          }
        }
      }
      for (const name in stockMap) {
        const key = `${name}-${stockMap[name].accountType}`
        if (!processedNames.has(key)) {
          const strategy = {
            name: stockMap[name].name,
            stockCode: stockMap[name].stockCode,
            accountType: stockMap[name].accountType,
            isMarginAccount: stockMap[name].accountType === 'credit',
            netPosition: 0,
            marketValue: '',
            fiveYearAvgDividendYield: '',
            trendJudgment: 'unset',
            oscillationGridSize: '',
            oscillationTradeAmount: '',
            breakoutGridSize: '',
            breakoutTradeAmount: '',
            decreaseSide: 'COLLSELL',
            decreaseStrategies: stockMap[name].decreaseStrategies,
            increaseStrategies: stockMap[name].increaseStrategies,
            notes: '',
            manualNotes: ''
          }
          processedNames.add(key)
          convertedStrategies.push(strategy)
          console.log('添加条件单策略:', strategy.name, strategy.accountType)
        }
      }
    }
    
    console.log('转换完成，共获得策略数量:', convertedStrategies.length)
    return convertedStrategies
  }
  
  static convertStockToStrategy(stock, webdavData) {
    const conditionalStrategies = webdavData.conditionalStrategies || []
    const gridStrategies = webdavData.gridStrategies || []
    const advancedStrategies = webdavData.advancedStrategies || []
    
    const name = stock.stockName || stock.name || ''
    if (!name) {
      console.log('跳过无名称股票:', stock)
      return null
    }
    
    const stockCode = stock.stockCode || ''
    const accountType = this.normalizeAccountType(stock.accountType)
    
    const existingAdvanced = advancedStrategies.find(a => {
      const aName = a.stockName || a.name || ''
      return aName === name && a.accountType === stock.accountType
    })
    
    if (existingAdvanced) {
      return this.convertAdvancedStrategy(existingAdvanced)
    }
    
    const decreaseStrategies = conditionalStrategies
      .filter(c => {
        const cName = c.stockName || c.name || ''
        return cName === name && 
               (c.side === 'SELL' || c.side === 'COLLSELL' || c.side === 'SELL_SHORT')
      })
      .map(c => this.convertConditionStrategy(c))
    
    const increaseStrategies = conditionalStrategies
      .filter(c => {
        const cName = c.stockName || c.name || ''
        return cName === name && 
               (c.side === 'BUY' || c.side === 'BUY_COVER')
      })
      .map(c => this.convertConditionStrategy(c))
    
    const gridData = gridStrategies.filter(g => {
      const gName = g.stockName || g.name || ''
      return gName === name
    })
    
    return {
      name: name,
      stockCode: stockCode,
      accountType: accountType,
      isMarginAccount: accountType === 'credit',
      netPosition: this.parseNumber(stock.currentAmount || stock.quantity || stock.enableAmount || 0),
      marketValue: this.formatMarketValue(stock.marketValue),
      fiveYearAvgDividendYield: this.parseNumber(stock.dividendYield || stock.fiveYearAvgDividendYield || ''),
      trendJudgment: 'unset',
      oscillationGridSize: gridData.length > 0 ? this.parseNumber(gridData[0].gridSize || gridData[0].oscillationGridSize || '') : '',
      oscillationTradeAmount: gridData.length > 0 ? this.parseNumber(gridData[0].tradeAmount || gridData[0].oscillationTradeAmount || '') : '',
      breakoutGridSize: gridData.length > 1 ? this.parseNumber(gridData[1].gridSize || gridData[1].breakoutGridSize || '') : '',
      breakoutTradeAmount: gridData.length > 1 ? this.parseNumber(gridData[1].tradeAmount || gridData[1].breakoutTradeAmount || '') : '',
      decreaseSide: 'COLLSELL',
      decreaseStrategies: decreaseStrategies,
      increaseStrategies: increaseStrategies,
      notes: '',
      manualNotes: stock.notes || stock.manualNotes || ''
    }
  }
  
  static convertAdvancedStrategy(advanced) {
    const name = advanced.stockName || advanced.name || ''
    if (!name) {
      console.log('跳过无名称高级策略:', advanced)
      return null
    }
    
    const decreaseStrategies = (advanced.decreaseStrategies || [])
      .map(c => ({
        deltaPercentage: c.deltaPercentage || c.delta || '',
        tradeVolume: c.tradeVolume || c.volume || c.tradeAmount || '',
        side: c.side || 'SELL'
      }))
    
    const increaseStrategies = (advanced.increaseStrategies || [])
      .map(c => ({
        deltaPercentage: c.deltaPercentage || c.delta || '',
        tradeVolume: c.tradeVolume || c.volume || c.tradeAmount || '',
        side: c.side || 'BUY'
      }))
    
    return {
      name: name,
      stockCode: advanced.stockCode || '',
      accountType: this.normalizeAccountType(advanced.accountType),
      isMarginAccount: advanced.accountType === 'credit' || advanced.isMarginAccount === true,
      netPosition: this.parseNumber(advanced.quantity || advanced.netPosition || advanced.currentAmount || 0),
      marketValue: this.formatMarketValue(advanced.marketValue),
      fiveYearAvgDividendYield: this.parseNumber(advanced.fiveYearAvgDividendYield || advanced.dividendYield || ''),
      profitLoss: advanced.profitLoss || advanced.profit || '',
      changePercent: advanced.changePercent || advanced.change || '',
      decreasePercentage: this.parseNumber(advanced.decreasePercentage || ''),
      decreaseAmount: this.parseNumber(advanced.decreaseAmount || ''),
      increasePercentage: this.parseNumber(advanced.increasePercentage || ''),
      increaseAmount: this.parseNumber(advanced.increaseAmount || ''),
      trendJudgment: advanced.trendJudgment || 'unset',
      expiryDate: advanced.expiryDate || '',
      oscillationGridSize: this.parseNumber(advanced.oscillationGridSize || ''),
      oscillationTradeAmount: this.parseNumber(advanced.oscillationTradeAmount || ''),
      breakoutGridSize: this.parseNumber(advanced.breakoutGridSize || ''),
      breakoutTradeAmount: this.parseNumber(advanced.breakoutTradeAmount || ''),
      decreaseSide: advanced.decreaseSide || 'COLLSELL',
      decreaseStrategies: decreaseStrategies,
      increaseStrategies: increaseStrategies,
      notes: advanced.notes || '',
      manualNotes: advanced.manualNotes || advanced.notes || ''
    }
  }
  
  static convertConditionStrategy(cond) {
    return {
      deltaPercentage: cond.deltaPercentage || cond.delta || cond.percentage || '',
      tradeVolume: cond.tradeVolume || cond.volume || cond.tradeAmount || cond.amount || '',
      side: cond.side || (cond.tradingDirection === 'buy' ? 'BUY' : 'SELL')
    }
  }
  
  static normalizeAccountType(accountType) {
    if (!accountType) return 'default'
    
    const typeStr = String(accountType).toLowerCase()
    
    if (typeStr.includes('credit') || typeStr.includes('融资')) {
      return 'credit'
    }
    
    return 'default'
  }
  
  static parseNumber(value) {
    if (value === null || value === undefined || value === '') {
      return ''
    }
    
    const str = String(value).replace(/[,\s¥￥]/g, '')
    const num = parseFloat(str)
    
    return isNaN(num) ? String(value) : num
  }
  
  static formatMarketValue(value) {
    if (!value) return ''
    
    const str = String(value)
    if (str.includes('¥') || str.includes('￥') || str.includes(',')) {
      return str
    }
    
    const num = this.parseNumber(value)
    if (typeof num === 'number') {
      return num.toLocaleString('zh-CN')
    }
    return str
  }
}

class WebDAVImportService {
  constructor() {
    this.webdavBaseUrl = 'https://your-webdav-server.com/dav/app_data/stocks/'
  }
  
  async fetchFromWebDAV(filename = 'all_strategies.json') {
    const url = this.webdavBaseUrl + filename
    
    try {
      console.log('正在获取 WebDAV 数据:', url)
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('成功获取数据')
      return data
    } catch (error) {
      console.error('从 WebDAV 获取数据失败:', error)
      throw error
    }
  }
  
  async importFromWebDAV() {
    try {
      const webdavData = await this.fetchFromWebDAV()
      return await this.importFromData(webdavData)
    } catch (error) {
      console.error('从 WebDAV 导入数据失败:', error)
      return {
        success: false,
        count: 0,
        message: '从 WebDAV 导入数据失败: ' + error.message
      }
    }
  }
  
  async importFromData(webdavData) {
    try {
      console.log('开始转换数据...')
      const strategies = DataConverter.convertStockData(webdavData)
      
      if (strategies.length === 0) {
        return {
          success: false,
          count: 0,
          message: '没有找到任何可导入的策略数据'
        }
      }
      
      let importedCount = 0
      for (const strategy of strategies) {
        try {
          await database.addStrategy(strategy)
          importedCount++
        } catch (err) {
          console.error('保存策略失败:', strategy.name, err)
        }
      }
      
      console.log(`成功导入 ${importedCount} 条策略`)
      
      return {
        success: true,
        count: importedCount,
        message: `成功导入了 ${importedCount} 条策略`
      }
    } catch (error) {
      console.error('导入数据失败:', error)
      return {
        success: false,
        count: 0,
        message: '导入数据失败: ' + error.message
      }
    }
  }
  
  async importFromJSON(jsonData) {
    try {
      const webdavData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
      return await this.importFromData(webdavData)
    } catch (error) {
      console.error('解析 JSON 数据失败:', error)
      return {
        success: false,
        count: 0,
        message: '解析 JSON 数据失败: ' + error.message
      }
    }
  }
}

export const webdavImportService = new WebDAVImportService()
export { DataConverter }
