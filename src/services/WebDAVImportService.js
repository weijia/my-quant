import { database } from '../utils/Database'

class DataConverter {
  static convertStockData(webdavData) {
    const convertedStrategies = []
    const processedKeys = new Set()
    
    console.log('开始转换数据，原始数据结构:', Object.keys(webdavData))
    
    // 处理持仓数据，构建以 secuCode 为 key 的映射
    const holdingsMap = {}
    if (webdavData.holdingsData && webdavData.holdingsData.holdings) {
      console.log('处理持仓数据, 共', webdavData.holdingsData.holdings.length, '条')
      
      for (const holding of webdavData.holdingsData.holdings) {
        if (holding && holding.secuCode) {
          const key = `${holding.secuCode}`
          holdingsMap[key] = holding
          console.log('持仓映射:', key, holding.secuName, holding.mktQty)
        }
      }
    }
    
    if (webdavData.stockData && Array.isArray(webdavData.stockData)) {
      console.log('stockData 数量:', webdavData.stockData.length)
      for (const stock of webdavData.stockData) {
        const strategy = this.convertStockToStrategy(stock, webdavData)
        if (strategy && strategy.stockCode) {
          const key = `${strategy.stockCode}-${strategy.accountType}-${strategy.provider || ''}`
          if (!processedKeys.has(key)) {
            processedKeys.add(key)
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
        if (strategy && strategy.stockCode) {
          const key = `${strategy.stockCode}-${strategy.accountType}-${strategy.provider || ''}`
          if (!processedKeys.has(key)) {
            processedKeys.add(key)
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
        const stockCode = cond.stockCode || ''
        const accountType = this.normalizeAccountType(cond.accountType)
        const provider = cond.provider || ''
        if (stockCode) {
          const mapKey = `${stockCode}-${accountType}-${provider}`
          if (!stockMap[mapKey]) {
            stockMap[mapKey] = {
              name: cond.stockName || cond.name || '',
              stockCode: stockCode,
              accountType: accountType,
              provider: provider,
              decreaseStrategies: [],
              increaseStrategies: []
            }
          }
          const converted = this.convertConditionStrategy(cond)
          if (converted.side === 'SELL' || converted.side === 'COLLSELL' || converted.side === 'SELL_SHORT') {
            stockMap[mapKey].decreaseStrategies.push(converted)
          } else {
            stockMap[mapKey].increaseStrategies.push(converted)
          }
        }
      }
      for (const mapKey in stockMap) {
        if (!processedKeys.has(mapKey)) {
          const item = stockMap[mapKey]
          const strategy = {
            name: item.name,
            stockCode: item.stockCode,
            accountType: item.accountType,
            provider: item.provider,
            isMarginAccount: item.accountType === 'credit',
            netPosition: 0,
            marketValue: '',
            fiveYearAvgDividendYield: '',
            trendJudgment: 'unset',
            oscillationGridSize: '',
            oscillationTradeAmount: '',
            breakoutGridSize: '',
            breakoutTradeAmount: '',
            decreaseSide: 'COLLSELL',
            decreaseStrategies: item.decreaseStrategies,
            increaseStrategies: item.increaseStrategies,
            notes: '',
            manualNotes: ''
          }
          processedKeys.add(mapKey)
          convertedStrategies.push(strategy)
          console.log('添加条件单策略:', strategy.name, strategy.accountType)
        }
      }
    }
    
    // 将持仓数据合并到策略中
    if (Object.keys(holdingsMap).length > 0) {
      console.log('合并持仓数据到策略')
      for (const strategy of convertedStrategies) {
        const holding = holdingsMap[strategy.stockCode]
        if (holding) {
          strategy.netPosition = this.parseNumber(holding.mktQty || strategy.netPosition)
          strategy.marketValue = this.formatMarketValue(holding.mktVal || strategy.marketValue)
          strategy.name = strategy.name || holding.secuName || strategy.name
          console.log('合并持仓:', strategy.stockCode, '数量:', strategy.netPosition, '市值:', strategy.marketValue)
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
    const stockCode = stock.stockCode || ''
    
    if (!stockCode) {
      console.log('跳过无股票代码:', stock)
      return null
    }
    
    const accountType = this.normalizeAccountType(stock.accountType)
    const provider = stock.provider || ''
    
    const existingAdvanced = advancedStrategies.find(a => {
      return a.stockCode === stockCode && a.accountType === stock.accountType
    })
    
    if (existingAdvanced) {
      return this.convertAdvancedStrategy(existingAdvanced)
    }
    
    const decreaseStrategies = conditionalStrategies
      .filter(c => {
        return c.stockCode === stockCode && 
               (c.side === 'SELL' || c.side === 'COLLSELL' || c.side === 'SELL_SHORT')
      })
      .map(c => this.convertConditionStrategy(c))
    
    const increaseStrategies = conditionalStrategies
      .filter(c => {
        return c.stockCode === stockCode && 
               (c.side === 'BUY' || c.side === 'BUY_COVER')
      })
      .map(c => this.convertConditionStrategy(c))
    
    const gridData = gridStrategies.filter(g => {
      return g.stockCode === stockCode
    })
    
    return {
      name: name,
      stockCode: stockCode,
      accountType: accountType,
      provider: provider,
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
    const stockCode = advanced.stockCode || ''
    
    if (!stockCode) {
      console.log('跳过无股票代码高级策略:', advanced)
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
      stockCode: stockCode,
      accountType: this.normalizeAccountType(advanced.accountType),
      provider: advanced.provider || '',
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
    this.holdingsBaseUrl = 'https://your-webdav-server.com/dav/app_data/holdings/pingan/'
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
  
  async fetchHoldings() {
    try {
      // 先用 PROPFIND 获取目录下的文件列表
      console.log('正在获取持仓目录文件列表:', this.holdingsBaseUrl)
      const propfindResponse = await fetch(this.holdingsBaseUrl, {
        method: 'PROPFIND',
        headers: {
          'Depth': '1',
          'Content-Type': 'application/xml'
        }
      })
      
      console.log('PROPFIND 响应状态:', propfindResponse.status)
      console.log('PROPFIND 响应头:', JSON.stringify(Object.fromEntries(propfindResponse.headers.entries())))
      
      if (!propfindResponse.ok) {
        console.warn('获取持仓目录列表失败:', propfindResponse.status)
        return null
      }
      
      const text = await propfindResponse.text()
      console.log('PROPFIND 响应内容:', text)
      
      // 解析 XML 响应，提取文件名
      const jsonFiles = text.match(/<d:href>([^<]+\.json)<\/d:href>/g) || []
      console.log('匹配到的 JSON 文件:', jsonFiles)
      
      if (jsonFiles.length === 0) {
        console.log('持仓目录中没有找到 JSON 文件')
        return null
      }
      
      // 提取文件名并获取第一个 JSON 文件
      const jsonFile = jsonFiles[0].replace('<d:href>', '').replace('</d:href>', '')
      const fileUrl = this.holdingsBaseUrl + jsonFile.split('/').pop()
      
      console.log('找到持仓文件:', fileUrl)
      
      const response = await fetch(fileUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })
      
      console.log('获取持仓文件响应状态:', response.status)
      
      if (!response.ok) {
        console.warn('获取持仓数据失败:', response.status)
        return null
      }
      
      const data = await response.json()
      console.log('成功获取持仓数据')
      return data
    } catch (error) {
      console.warn('获取持仓数据失败:', error)
      return null
    }
  }
  
  async importFromWebDAV(clearBeforeImport = true) {
    try {
      const [webdavData, holdingsData] = await Promise.all([
        this.fetchFromWebDAV(),
        this.fetchHoldings()
      ])
      
      if (holdingsData) {
        webdavData.holdingsData = holdingsData
      }
      
      return await this.importFromData(webdavData, clearBeforeImport)
    } catch (error) {
      console.error('从 WebDAV 导入数据失败:', error)
      return {
        success: false,
        count: 0,
        message: '从 WebDAV 导入数据失败: ' + error.message
      }
    }
  }
  
  async importFromData(webdavData, clearBeforeImport = true) {
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
      
      if (clearBeforeImport) {
        const deletedCount = await database.clearAllStrategies()
        console.log(`已清空 ${deletedCount} 条原有策略`)
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
