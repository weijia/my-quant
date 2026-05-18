import { database } from '../utils/Database'

class DataConverter {
  static convertStockData(webdavData) {
    const convertedStrategies = []
    const processedKeys = new Set()
    const trendJudgments = webdavData.trendJudgments || {}

    console.log('开始转换数据，原始数据结构:', Object.keys(webdavData))
    console.log('趋势判断数据:', Object.keys(trendJudgments).length, '条')

    if (webdavData.stockData && Array.isArray(webdavData.stockData)) {
      console.log('stockData 数量:', webdavData.stockData.length)
      for (const stock of webdavData.stockData) {
        const strategy = this.convertStockToStrategy(stock, webdavData, trendJudgments)
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
        const strategy = this.convertAdvancedStrategy(advanced, trendJudgments)
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
    
    // 将持仓数据作为独立的策略添加（不同 provider，不覆盖原策略）
    if (webdavData.holdingsData && webdavData.holdingsData.holdings) {
      console.log('添加持仓数据为独立策略')
      for (const holding of webdavData.holdingsData.holdings) {
        // 过滤股数为0的持仓
        if (holding && holding.secuCode && (holding.mktQty || 0) !== 0) {
          const key = `${holding.secuCode}-${holding.accountType || 'default'}-${holding.provider || ''}`
          if (!processedKeys.has(key)) {
            processedKeys.add(key)
            const strategy = {
              name: holding.secuName || '',
              stockCode: holding.secuCode,
              accountType: 'default',
              provider: 'pingan',
              isMarginAccount: false,
              netPosition: this.parseNumber(holding.mktQty || 0),
              marketValue: this.formatMarketValue(holding.mktVal || ''),
              fiveYearAvgDividendYield: '',
              trendJudgment: 'unset',
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
            convertedStrategies.push(strategy)
            console.log('添加持仓策略:', strategy.name, strategy.stockCode, strategy.provider)
          }
        }
      }
    }
    
    console.log('转换完成，共获得策略数量:', convertedStrategies.length)
    return convertedStrategies
  }
  
  static convertStockToStrategy(stock, webdavData, trendJudgments = {}) {
    const conditionalStrategies = webdavData.conditionalStrategies || []
    const gridStrategies = webdavData.gridStrategies || []
    const advancedStrategies = webdavData.advancedStrategies || []

    const name = stock.stockName || stock.name || ''
    const stockCode = stock.stockCode || ''

    if (!stockCode) {
      console.log('跳过无股票代码:', stock)
      return null
    }

    // 获取该股票的趋势判断数据
    const trendData = trendJudgments[stockCode] || {}
    // 优先使用自动趋势判断，否则使用手动趋势判断
    const trendValue = trendData.autoTrendJudgment || trendData.trendJudgment || 'unset'

    const accountType = this.normalizeAccountType(stock.accountType)
    const provider = stock.provider || ''

    const existingAdvanced = advancedStrategies.find(a => {
      return a.stockCode === stockCode && a.accountType === stock.accountType
    })

    if (existingAdvanced) {
      return this.convertAdvancedStrategy(existingAdvanced, trendJudgments)
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
      profitLoss: stock.profitLoss || stock.profit || '',
      changePercent: stock.changePercent || stock.change || '',
      decreasePercentage: this.parseNumber(stock.decreasePercentage || ''),
      decreaseAmount: this.parseNumber(stock.decreaseAmount || ''),
      increasePercentage: this.parseNumber(stock.increasePercentage || ''),
      increaseAmount: this.parseNumber(stock.increaseAmount || ''),
      trendJudgment: trendValue,
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
  
  static convertAdvancedStrategy(advanced, trendJudgments = {}) {
    const name = advanced.stockName || advanced.name || ''
    const stockCode = advanced.stockCode || ''

    if (!stockCode) {
      console.log('跳过无股票代码高级策略:', advanced)
      return null
    }

    // 获取该股票的趋势判断数据
    const trendData = trendJudgments[stockCode] || {}
    // 优先使用 WebDAV 趋势数据中的自动趋势判断，其次手动趋势判断，最后使用高级策略本身的趋势判断
    const trendValue = trendData.autoTrendJudgment || trendData.trendJudgment || advanced.trendJudgment || 'unset'

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
      trendJudgment: trendValue,
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
    this.loadConfig();
  }

  loadConfig() {
    const configStr = localStorage.getItem('webDavConfig');
    if (configStr) {
      try {
        const config = JSON.parse(configStr);
        const baseUrl = (config.url || '').replace(/\/+$/, '');
        this.webdavBaseUrl = baseUrl + '/app_data/stocks/';
        this.holdingsBaseUrl = baseUrl + '/app_data/holdings/pingan/';
        this.trendBaseUrl = baseUrl + '/app_data/stocks/trend_judgments/';
        this.authHeader = 'Basic ' + btoa((config.username || '') + ':' + (config.password || ''));
      } catch (e) {
        console.error('解析 WebDAV 配置失败:', e);
        this.setDefaultUrls();
      }
    } else {
      this.setDefaultUrls();
    }
  }

  setDefaultUrls() {
    this.webdavBaseUrl = '';
    this.holdingsBaseUrl = '';
    this.trendBaseUrl = '';
    this.authHeader = null;
  }

  getAuthHeaders() {
    const headers = {};
    if (this.authHeader) {
      headers['Authorization'] = this.authHeader;
    }
    return headers;
  }

  isConfigured() {
    return !!this.webdavBaseUrl;
  }
  
  async fetchFromWebDAV(filename = 'all_strategies.json') {
    const url = this.webdavBaseUrl + filename
    
    try {
      console.log('正在获取 WebDAV 数据:', url)
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...this.getAuthHeaders()
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
          'Content-Type': 'application/xml',
          ...this.getAuthHeaders()
        }
      })
      
      console.log('PROPFIND 响应状态:', propfindResponse.status)
      
      if (!propfindResponse.ok) {
        console.warn('获取持仓目录列表失败:', propfindResponse.status)
        return null
      }
      
      const text = await propfindResponse.text()
      console.log('PROPFIND 响应内容:', text.substring(0, 500))
      
      // 使用 DOMParser 解析 XML 响应
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(text, 'text/xml')
      
      // 获取所有 response 元素
      const responses = xmlDoc.getElementsByTagNameNS('DAV:', 'response')
      console.log('找到的响应数量:', responses.length)
      
      // 提取 JSON 文件名
      let jsonFileName = null
      for (let i = 0; i < responses.length; i++) {
        const hrefElements = responses[i].getElementsByTagNameNS('DAV:', 'href')
        if (hrefElements.length > 0) {
          const href = hrefElements[0].textContent
          const pathParts = href.split('/')
          const fileName = pathParts[pathParts.length - 1]
          if (fileName && fileName.endsWith('.json')) {
            jsonFileName = fileName
            break
          }
        }
      }
      
      if (!jsonFileName) {
        console.log('持仓目录中没有找到 JSON 文件')
        return null
      }
      
      const fileUrl = this.holdingsBaseUrl + jsonFileName
      console.log('最终 URL:', fileUrl)
      
      const response = await fetch(fileUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...this.getAuthHeaders()
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

  async fetchTrendJudgments() {
    try {
      console.log('正在获取趋势判断目录文件列表:', this.trendBaseUrl)
      const propfindResponse = await fetch(this.trendBaseUrl, {
        method: 'PROPFIND',
        headers: {
          'Depth': '1',
          'Content-Type': 'application/xml',
          ...this.getAuthHeaders()
        }
      })

      console.log('趋势判断 PROPFIND 响应状态:', propfindResponse.status)

      if (!propfindResponse.ok) {
        console.warn('获取趋势判断目录列表失败:', propfindResponse.status)
        return null
      }

      const text = await propfindResponse.text()
      console.log('PROPFIND 响应内容:', text.substring(0, 500))

      // 使用 DOMParser 解析 XML 响应
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(text, 'text/xml')
      
      // 获取所有 response 元素
      const responses = xmlDoc.getElementsByTagNameNS('DAV:', 'response')
      console.log('找到的响应数量:', responses.length)
      
      // 提取文件名
      const jsonFiles = []
      for (let i = 0; i < responses.length; i++) {
        const hrefElements = responses[i].getElementsByTagNameNS('DAV:', 'href')
        if (hrefElements.length > 0) {
          const href = hrefElements[0].textContent
          const pathParts = href.split('/')
          const fileName = pathParts[pathParts.length - 1]
          if (fileName && fileName.startsWith('trend_judgment_') && fileName.endsWith('.json')) {
            jsonFiles.push(fileName)
          }
        }
      }
      
      console.log('匹配到的趋势判断文件:', jsonFiles)

      if (jsonFiles.length === 0) {
        console.log('趋势判断目录中没有找到 JSON 文件')
        return null
      }

      // 创建一个映射来存储每个股票的最新趋势判断
      const trendJudgmentsMap = {}
      let validCount = 0

      // 遍历所有趋势判断文件
      for (const fileName of jsonFiles) {
        const fileUrl = this.trendBaseUrl + fileName

        try {
          const response = await fetch(fileUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              ...this.getAuthHeaders()
            }
          })

          if (!response.ok) continue

          const content = await response.json()
          const { stockCode, trendJudgment, autoTrendJudgment, trendJudgmentUpdatedAt, autoTrendJudgmentUpdatedAt, decreasePercentage, price_drop_ratio, volatilityMetrics } = content

          // 根据最新文档格式，price_drop_ratio 位于 volatilityMetrics 对象内
          // 且 price_drop_ratio 已经是百分比格式（如 19.77），不需要再乘以 100
          const actualPriceDropRatio = volatilityMetrics?.price_drop_ratio != null 
            ? volatilityMetrics.price_drop_ratio 
            : (price_drop_ratio != null ? price_drop_ratio : null)

          const key = stockCode
          if (key && (trendJudgment || autoTrendJudgment || decreasePercentage != null || actualPriceDropRatio != null)) {
            // 检查是否已有更新的数据
            const existing = trendJudgmentsMap[key]
            const currentUpdateTime = trendJudgmentUpdatedAt || autoTrendJudgmentUpdatedAt
            const existingUpdateTime = existing ? (existing.trendJudgmentUpdatedAt || existing.autoTrendJudgmentUpdatedAt) : null

            const shouldUpdate = !existing ||
              !existingUpdateTime ||
              !currentUpdateTime ||
              new Date(currentUpdateTime) > new Date(existingUpdateTime)

            if (shouldUpdate) {
              trendJudgmentsMap[key] = {
                trendJudgment: trendJudgment || null,
                trendJudgmentUpdatedAt: trendJudgmentUpdatedAt || null,
                autoTrendJudgment: autoTrendJudgment || null,
                autoTrendJudgmentUpdatedAt: autoTrendJudgmentUpdatedAt || null,
                // decreasePercentage 已废弃，优先使用 volatilityMetrics.price_drop_ratio
                decreasePercentage: decreasePercentage != null ? decreasePercentage : null,
                // price_drop_ratio 从 volatilityMetrics 获取，已经是百分比格式
                price_drop_ratio: actualPriceDropRatio
              }
              validCount++
            }
          }
        } catch (e) {
          console.warn('获取趋势文件失败:', fileName, e)
        }
      }

      console.log(`成功获取 ${validCount} 条趋势判断数据`)
      return validCount > 0 ? trendJudgmentsMap : null
    } catch (error) {
      console.warn('获取趋势判断数据失败:', error)
      return null
    }
  }

  async importFromWebDAV(clearBeforeImport = true) {
    try {
      const [webdavData, holdingsData, trendJudgments] = await Promise.all([
        this.fetchFromWebDAV(),
        this.fetchHoldings(),
        this.fetchTrendJudgments()
      ])

      if (holdingsData) {
        webdavData.holdingsData = holdingsData
      }

      if (trendJudgments) {
        webdavData.trendJudgments = trendJudgments
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
