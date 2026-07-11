import { database } from '../utils/Database'
import WEBDAV_PATHS from '../config/WebDAVPaths'
import appConfigService from './AppConfigService.js'

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
              provider: holding.provider || 'pingan',
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
    // 获取当前价格（从趋势数据）
    const currentPrice = trendData.currentPrice || null

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
      manualNotes: stock.notes || stock.manualNotes || '',
      currentPrice: currentPrice
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
    // 获取当前价格（从趋势数据，优先于策略中保存的价格）
    const currentPrice = trendData.currentPrice || advanced.currentPrice || advanced.price || null
    // 获取15日平均波动率（从趋势数据）
    const volatility15d = trendData.volatility15d || advanced.volatility15d || null

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
      manualNotes: advanced.manualNotes || advanced.notes || '',
      currentPrice: currentPrice,
      volatility15d: volatility15d
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
    const configStr = localStorage.getItem('webDAVConfig');
    if (configStr) {
      try {
        const config = JSON.parse(configStr);
        const baseUrl = (config.url || '').replace(/\/+$/, '');
        this.webdavBaseUrl = baseUrl + WEBDAV_PATHS.STOCKS;
        this.holdingsBaseUrl = baseUrl + WEBDAV_PATHS.HOLDINGS;
        this.trendBaseUrl = baseUrl + WEBDAV_PATHS.TREND_JUDGMENTS;
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
    if (!this.isConfigured()) {
      console.log('WebDAV 未配置，跳过导入')
      return null
    }

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
        if (response.status === 404) {
          console.warn('WebDAV 上不存在数据文件:', url)
          return null
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('成功获取数据')
      return data
    } catch (error) {
      console.warn('从 WebDAV 获取数据失败:', error.message)
      return null
    }
  }
  
  async fetchHoldings() {
    try {
      // 先用 PROPFIND 获取目录下的文件列表（添加时间戳防止缓存）
      const timestamp = new Date().getTime()
      const propfindUrl = this.holdingsBaseUrl + '?_t=' + timestamp
      console.log('正在获取持仓目录文件列表:', propfindUrl)
      const propfindResponse = await fetch(propfindUrl, {
        method: 'PROPFIND',
        headers: {
          'Depth': '1',
          'Content-Type': 'application/xml',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
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
      
      // 添加时间戳防止缓存
      const fileUrl = this.holdingsBaseUrl + jsonFileName + '?_t=' + timestamp
      console.log('最终 URL:', fileUrl)
      
      const response = await fetch(fileUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          ...this.getAuthHeaders()
        }
      })
      
      console.log('获取持仓文件响应状态:', response.status)
      
      if (!response.ok) {
        console.warn('获取持仓数据失败:', response.status)
        return null
      }
      
      const data = await response.json()
      console.log('成功获取持仓数据，持仓数量:', data.holdings ? data.holdings.length : 0)
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
          const { stockCode, trendJudgment, autoTrendJudgment, trendJudgmentUpdatedAt, autoTrendJudgmentUpdatedAt, decreasePercentage, price_drop_ratio, volatilityMetrics, trendStrengthMetrics, stockAnalysis, stockAnalysisUpdatedAt } = content

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
                price_drop_ratio: actualPriceDropRatio,
                // 从波动率指标中获取当前价格
                currentPrice: volatilityMetrics?.current_price || null,
                // 从波动率指标中获取15日平均波动率
                volatility15d: volatilityMetrics?.volatility_15d_ma || null,
                // ADX 趋势强度指标
                adx: trendStrengthMetrics?.adx != null ? trendStrengthMetrics.adx : null,
                plusDi: trendStrengthMetrics?.plus_di != null ? trendStrengthMetrics.plus_di : null,
                minusDi: trendStrengthMetrics?.minus_di != null ? trendStrengthMetrics.minus_di : null,
                // 买卖建议分析数据
                stockAnalysis: stockAnalysis || null,
                stockAnalysisUpdatedAt: stockAnalysisUpdatedAt || null
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
      const [webdavData, holdingsData, trendJudgments, mqttConfig] = await Promise.all([
        this.fetchFromWebDAV(),
        this.fetchHoldings(),
        this.fetchTrendJudgments(),
        this.fetchMQTTConfig()
      ])

      if (!webdavData) {
        return {
          success: false,
          count: 0,
          message: 'WebDAV 未配置或数据文件不存在'
        }
      }

      if (holdingsData) {
        webdavData.holdingsData = holdingsData
      }

      if (trendJudgments) {
        webdavData.trendJudgments = trendJudgments
      }

      const result = await this.importFromData(webdavData, clearBeforeImport)
      
      // 如果获取到了 MQTT 配置，附加到结果中
      if (mqttConfig) {
        result.mqttConfig = mqttConfig
      }
      
      return result
    } catch (error) {
      console.error('从 WebDAV 导入数据失败:', error)
      return {
        success: false,
        count: 0,
        message: '从 WebDAV 导入数据失败: ' + error.message
      }
    }
  }

  // 保存 MQTT 配置到 WebDAV
  async saveMQTTConfig(config) {
    if (!this.isConfigured()) {
      console.warn('WebDAV 未配置，无法保存 MQTT 配置')
      return false
    }

    try {
      const configStr = localStorage.getItem('webDAVConfig');
      const webdavConfig = JSON.parse(configStr);
      const baseUrl = (webdavConfig.url || '').replace(/\/+$/, '');
      const url = baseUrl + WEBDAV_PATHS.MQTT_CONFIG

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify(config, null, 2)
      })

      if (response.ok) {
        console.log('MQTT 配置已保存到 WebDAV')
        return true
      } else {
        console.warn('保存 MQTT 配置到 WebDAV 失败:', response.status)
        return false
      }
    } catch (error) {
      console.warn('保存 MQTT 配置到 WebDAV 失败:', error)
      return false
    }
  }

  // 从 WebDAV 获取 MQTT 配置
  async fetchMQTTConfig() {
    if (!this.isConfigured()) {
      return null
    }

    try {
      const configStr = localStorage.getItem('webDAVConfig');
      const webdavConfig = JSON.parse(configStr);
      const baseUrl = (webdavConfig.url || '').replace(/\/+$/, '');
      const url = baseUrl + WEBDAV_PATHS.MQTT_CONFIG

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...this.getAuthHeaders()
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('成功从 WebDAV 获取 MQTT 配置')
        return data
      } else if (response.status === 404) {
        console.log('WebDAV 上不存在 MQTT 配置文件')
        return null
      } else {
        console.warn('获取 MQTT 配置失败:', response.status)
        return null
      }
    } catch (error) {
      console.warn('获取 MQTT 配置失败:', error)
      return null
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

  // ========== 笔记文件（notes.json）上传/下载 ==========

  /**
   * 上传笔记到 WebDAV
   * @param {Object} noteData - 笔记数据对象 { content, visible, x, y, width, height }
   */
  async uploadNotes(noteData) {
    if (!this.isConfigured()) {
      console.warn('[WebDAV] 未配置 WebDAV，跳过上传笔记')
      return { ok: false, skipped: false, remote: null }
    }

    try {
      const configStr = localStorage.getItem('webDAVConfig')
      if (!configStr) {
        console.warn('[WebDAV] 未找到 WebDAV 配置，跳过上传笔记')
        return { ok: false, skipped: false, remote: null }
      }

      const webdavConfig = JSON.parse(configStr)
      const baseUrl = (webdavConfig.url || '').replace(/\/+$/, '')
      const url = baseUrl + WEBDAV_PATHS.NOTES

      // 冲突检测：先读取远端，比较 updatedAt
      try {
        const getResp = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            ...this.getAuthHeaders()
          }
        })
        if (getResp.ok) {
          const remote = await getResp.json()
          const remoteTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0
          const localTime = noteData.updatedAt ? new Date(noteData.updatedAt).getTime() : 0
          // 远端更新时间更新 → 不覆盖，返回远端数据供调用方采用
          if (remoteTime > localTime) {
            console.log('[WebDAV] 远端笔记更新(updatedAt 较新)，跳过上传以免覆盖本地内容')
            return { ok: false, skipped: true, remote }
          }
        }
      } catch (e) {
        // 远端不存在(404)或无内容：继续上传
      }

      // 确保目录存在
      const dirUrl = baseUrl + '/app_data/my-quant/'
      await this.ensureDirectoryExists(dirUrl)

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify({
          ...noteData,
          updatedAt: noteData.updatedAt || new Date().toISOString()
        }, null, 2)
      })

      if (response.ok) {
        console.log('[WebDAV] 笔记上传成功')
        return { ok: true, skipped: false, remote: null }
      } else {
        console.warn('[WebDAV] 笔记上传失败:', response.status)
        return { ok: false, skipped: false, remote: null }
      }
    } catch (error) {
      console.warn('[WebDAV] 笔记上传失败:', error)
      return { ok: false, skipped: false, remote: null }
    }
  }

  /**
   * 从 WebDAV 下载笔记
   * @returns {Object|null} 笔记数据对象
   */
  async downloadNotes() {
    if (!this.isConfigured()) {
      console.log('[WebDAV] 未配置 WebDAV，跳过下载笔记')
      return null
    }

    try {
      const configStr = localStorage.getItem('webDAVConfig')
      if (!configStr) {
        console.warn('[WebDAV] 未找到 WebDAV 配置，跳过下载笔记')
        return null
      }

      const webdavConfig = JSON.parse(configStr)
      const baseUrl = (webdavConfig.url || '').replace(/\/+$/, '')
      const url = baseUrl + WEBDAV_PATHS.NOTES

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...this.getAuthHeaders()
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[WebDAV] 笔记下载成功')
        return data
      } else if (response.status === 404) {
        console.log('[WebDAV] 远程不存在笔记文件')
        return null
      } else {
        console.warn('[WebDAV] 笔记下载失败:', response.status)
        return null
      }
    } catch (error) {
      console.warn('[WebDAV] 笔记下载失败:', error)
      return null
    }
  }

  // ========== 应用配置文件（config.json）上传/下载 ==========

  /**
   * 上传应用配置到 WebDAV
   */
  async uploadAppConfig() {
    if (!this.webdavBaseUrl) {
      console.warn('[WebDAV] 未配置 WebDAV，跳过上传应用配置')
      return false
    }

    try {
      const configStr = localStorage.getItem('webDAVConfig')
      if (!configStr) {
        console.warn('[WebDAV] 未找到 WebDAV 配置，跳过上传应用配置')
        return false
      }

      const webdavConfig = JSON.parse(configStr)
      const baseUrl = (webdavConfig.url || '').replace(/\/+$/, '')
      const url = baseUrl + WEBDAV_PATHS.APP_CONFIG

      // 重新从 localStorage 加载最新配置，确保内存数据同步
      appConfigService.loadFromLocalStorage()
      const configData = appConfigService.exportConfig()

      // 附加策略模板数据
      const templatesStr = localStorage.getItem('orderStrategyTemplates')
      if (templatesStr) {
        try {
          configData.orderStrategyTemplates = JSON.parse(templatesStr)
          console.log('[WebDAV] 已附加策略模板数据，共', configData.orderStrategyTemplates.length, '个模板')
          // 打印每个模板的趋势匹配
          configData.orderStrategyTemplates.forEach((t, i) => {
            console.log(`[WebDAV] 模板${i}: ${t.name}, trendMatches:`, t.trendMatches)
          })
        } catch (e) {
          console.warn('[WebDAV] 解析策略模板失败:', e)
        }
      } else {
        console.warn('[WebDAV] localStorage 中未找到 orderStrategyTemplates')
      }

      // 打印完整上传数据用于调试
      console.log('[WebDAV] 上传配置数据:', JSON.stringify(configData, null, 2))
      // 再次确认 orderStrategyTemplates 是否存在
      console.log('[WebDAV] 确认 orderStrategyTemplates:', configData.orderStrategyTemplates ? `存在，${configData.orderStrategyTemplates.length}个模板` : '不存在')

      // 确保目录存在
      const dirUrl = baseUrl + '/app_data/my-quant/'
      await this.ensureDirectoryExists(dirUrl)

      // 重新构建 body 确保数据正确
      const bodyData = {
        ...configData,
        orderStrategyTemplates: configData.orderStrategyTemplates || []
      }
      console.log('[WebDAV] 最终上传 body 包含 orderStrategyTemplates:', !!bodyData.orderStrategyTemplates)

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify(bodyData, null, 2)
      })

      if (response.ok) {
        console.log('[WebDAV] 应用配置上传成功')
        return true
      } else {
        console.warn('[WebDAV] 应用配置上传失败:', response.status)
        return false
      }
    } catch (error) {
      console.error('[WebDAV] 应用配置上传失败:', error)
      return false
    }
  }

  /**
   * 确保 WebDAV 目录存在，不存在则创建
   */
  async ensureDirectoryExists(dirUrl) {
    try {
      // 检查目录是否存在
      const checkResponse = await fetch(dirUrl, {
        method: 'PROPFIND',
        headers: {
          'Depth': '0',
          ...this.getAuthHeaders()
        }
      })

      if (checkResponse.ok) {
        console.log('[WebDAV] 目录已存在:', dirUrl)
        return true
      }

      // 目录不存在，创建它
      console.log('[WebDAV] 目录不存在，正在创建:', dirUrl)
      const createResponse = await fetch(dirUrl, {
        method: 'MKCOL',
        headers: this.getAuthHeaders()
      })

      if (createResponse.ok || createResponse.status === 201) {
        console.log('[WebDAV] 目录创建成功:', dirUrl)
        return true
      } else {
        console.warn('[WebDAV] 目录创建失败:', createResponse.status)
        return false
      }
    } catch (error) {
      console.error('[WebDAV] 检查/创建目录失败:', error)
      return false
    }
  }

  /**
   * 从 WebDAV 下载应用配置
   */
  async downloadAppConfig() {
    if (!this.webdavBaseUrl) {
      console.warn('[WebDAV] 未配置 WebDAV，跳过下载应用配置')
      return false
    }

    try {
      const configStr = localStorage.getItem('webDAVConfig')
      if (!configStr) {
        console.warn('[WebDAV] 未找到 WebDAV 配置，跳过下载应用配置')
        return false
      }

      const webdavConfig = JSON.parse(configStr)
      const baseUrl = (webdavConfig.url || '').replace(/\/+$/, '')
      const url = baseUrl + WEBDAV_PATHS.APP_CONFIG

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...this.getAuthHeaders()
        }
      })

      if (response.ok) {
        const data = await response.json()
        appConfigService.mergeFromRemote(data)

        // 恢复策略模板数据
        if (data.orderStrategyTemplates && Array.isArray(data.orderStrategyTemplates)) {
          localStorage.setItem('orderStrategyTemplates', JSON.stringify(data.orderStrategyTemplates))
          console.log('[WebDAV] 已恢复策略模板数据，共', data.orderStrategyTemplates.length, '个模板')
        }

        console.log('[WebDAV] 应用配置下载成功')
        return true
      } else if (response.status === 404) {
        console.log('[WebDAV] 远程不存在应用配置文件')
        return false
      } else {
        console.warn('[WebDAV] 应用配置下载失败:', response.status)
        return false
      }
    } catch (error) {
      console.error('[WebDAV] 应用配置下载失败:', error)
      return false
    }
  }
}

export const webdavImportService = new WebDAVImportService()
export { DataConverter }
