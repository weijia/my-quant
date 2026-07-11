/**
 * 应用配置统一管理服务
 * 将除 WebDAV 以外的本地配置统一存储到 localStorage 和 WebDAV config.json
 */

const STORAGE_KEY = 'myQuantConfig'

// 默认配置
const DEFAULT_CONFIG = {
  mqtt: {
    serverType: 'emqx',
    serverUrl: 'wss://broker.emqx.io:8084/mqtt',
    serverName: 'EMQX 公共集群',
    topic: 'test/myquant/orders',
    password: 'testpass',
    encryptMessages: true,
    clientId: 'myquant_' + Math.random().toString(16).slice(2, 8)
  },
  window: {
    top: '50vh',
    left: '50vw',
    width: '600px',
    height: '200px'
  },
  ui: {
    hideZeroQuantity: false,
    useMarginTrade: true,
    mobileVisibleColumns: ['name', 'quantity', 'trendIcon', 'advancedOrder'],
    desktopVisibleColumns: ['name', 'quantity', 'trendIcon', 'conditionConfig', 'conditionOrder', 'quickOrder', 'advancedOrderSettings', 'advancedOrder'],
    sortBy: 'name',
    sortOrder: 'asc'
  },
  // 趋势与策略的匹配关系配置
  trendStrategyMapping: {
    // 趋势类型 -> 策略生成器名称
    trend_up: 'uptrend',
    high_volatility: 'uptrend',
    trend_down: 'downtrend',
    trend_breakdown: 'downtrend',
    trend_oscillation: 'normal',
    trend_pullback: 'normal',
    medium_volatility: 'normal',
    low_volatility: 'normal',
    trend_unknown: 'normal',
    unset: 'normal'
  },
  // 收市买入配置
  marketCloseBuy: {},
  // Banner 提醒配置
  banner: {
    text: ''
  },
  // 浮动笔记配置
  note: {
    content: '',
    visible: false,
    x: 20,
    y: 80,
    width: 280,
    height: 200,
    // 本地内容最后修改时间，用于 WebDAV 同步冲突检测
    updatedAt: ''
  }
}

class AppConfigService {
  constructor() {
    this.config = null
    this.loadFromLocalStorage()
  }

  // 从 localStorage 加载配置
  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        this.config = JSON.parse(saved)
      }
    } catch (e) {
      console.error('[AppConfig] 加载 localStorage 配置失败:', e)
    }
    if (!this.config) {
      this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG))
    }
    // 合并默认值（防止新增字段缺失）
    this.config = this.mergeWithDefaults(this.config)
  }

  // 保存配置到 localStorage
  saveToLocalStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config))
    } catch (e) {
      console.error('[AppConfig] 保存 localStorage 配置失败:', e)
    }
  }

  // 从远程数据合并配置（WebDAV 下载后调用）
  mergeFromRemote(remoteConfig) {
    if (!remoteConfig || typeof remoteConfig !== 'object') return
    console.log('[AppConfig] 合并前配置:', JSON.stringify(this.config?.trendStrategyMapping))
    console.log('[AppConfig] 远程配置:', JSON.stringify(remoteConfig.trendStrategyMapping))
    // 保存本地 UI 配置和收市买/卖配置（用户本地修改优先）
    const localUI = this.config?.ui ? JSON.parse(JSON.stringify(this.config.ui)) : null
    const localMarketCloseBuy = this.config?.marketCloseBuy ? JSON.parse(JSON.stringify(this.config.marketCloseBuy)) : null
    const localMarketCloseSell = this.config?.marketCloseSell ? JSON.parse(JSON.stringify(this.config.marketCloseSell)) : null
    // 保留本地 MQTT clientId（每个客户端必须唯一）
    const localMqttClientId = this.config?.mqtt?.clientId || null
    this.config = this.mergeWithDefaults(remoteConfig)
    // 恢复本地 UI 配置（如果存在）
    if (localUI) {
      this.config.ui = { ...this.config.ui, ...localUI }
    }
    // 恢复本地收市买/卖配置（如果存在）- 这些是按日更新的，不应被远程覆盖
    if (localMarketCloseBuy) {
      this.config.marketCloseBuy = localMarketCloseBuy
    }
    if (localMarketCloseSell) {
      this.config.marketCloseSell = localMarketCloseSell
    }
    // 恢复本地 MQTT clientId（每个客户端必须唯一，其余配置以远程为准）
    if (localMqttClientId) {
      this.config.mqtt.clientId = localMqttClientId
    }
    this.saveToLocalStorage()
    console.log('[AppConfig] 已从远程合并配置:', JSON.stringify(this.config.trendStrategyMapping))
    // 触发配置更新事件
    window.dispatchEvent(new CustomEvent('appConfigUpdated', { detail: this.config }))
  }

  // 导出完整配置（用于上传到 WebDAV）
  exportConfig() {
    return JSON.parse(JSON.stringify(this.config))
  }

  // 合并默认值
  mergeWithDefaults(config) {
    const result = JSON.parse(JSON.stringify(DEFAULT_CONFIG))
    if (!config) return result
    // 深度合并各子配置
    if (config.mqtt) Object.assign(result.mqtt, config.mqtt)
    if (config.window) Object.assign(result.window, config.window)
    if (config.ui) Object.assign(result.ui, config.ui)
    if (config.trendStrategyMapping) Object.assign(result.trendStrategyMapping, config.trendStrategyMapping)
    if (config.marketCloseBuy) result.marketCloseBuy = { ...config.marketCloseBuy }
    if (config.banner) result.banner = { ...config.banner }
    if (config.note) result.note = { ...result.note, ...config.note }
    return result
  }

  // ========== MQTT 配置 ==========

  getMqttConfig() {
    return this.config.mqtt || {}
  }

  updateMqttConfig(mqttConfig) {
    this.config.mqtt = { ...this.config.mqtt, ...mqttConfig }
    this.saveToLocalStorage()
  }

  // ========== 窗口配置 ==========

  getWindowConfig() {
    return this.config.window || {}
  }

  updateWindowConfig(windowConfig) {
    this.config.window = { ...this.config.window, ...windowConfig }
    this.saveToLocalStorage()
  }

  // ========== UI 配置 ==========

  getUIConfig() {
    return this.config.ui || {}
  }

  updateUIConfig(uiConfig) {
    this.config.ui = { ...this.config.ui, ...uiConfig }
    this.saveToLocalStorage()
  }

  // 便捷方法：UI 子项
  get hideZeroQuantity() { return this.config.ui?.hideZeroQuantity ?? false }
  set hideZeroQuantity(val) { this.updateUIConfig({ hideZeroQuantity: val }) }

  get useMarginTrade() { return this.config.ui?.useMarginTrade ?? true }
  set useMarginTrade(val) { this.updateUIConfig({ useMarginTrade: val }) }

  get mobileVisibleColumns() { return this.config.ui?.mobileVisibleColumns || DEFAULT_CONFIG.ui.mobileVisibleColumns }
  set mobileVisibleColumns(val) { this.updateUIConfig({ mobileVisibleColumns: val }) }

  get desktopVisibleColumns() { return this.config.ui?.desktopVisibleColumns || DEFAULT_CONFIG.ui.desktopVisibleColumns }
  set desktopVisibleColumns(val) { this.updateUIConfig({ desktopVisibleColumns: val }) }

  get sortBy() { return this.config.ui?.sortBy || 'name' }
  set sortBy(val) { this.updateUIConfig({ sortBy: val }) }

  get sortOrder() { return this.config.ui?.sortOrder || 'asc' }
  set sortOrder(val) { this.updateUIConfig({ sortOrder: val }) }

  // ========== 趋势策略映射配置 ==========

  getTrendStrategyMapping() {
    return this.config.trendStrategyMapping || DEFAULT_CONFIG.trendStrategyMapping
  }

  updateTrendStrategyMapping(mapping) {
    this.config.trendStrategyMapping = { ...this.config.trendStrategyMapping, ...mapping }
    this.saveToLocalStorage()
  }

  getStrategyTypeForTrend(trend) {
    const mapping = this.getTrendStrategyMapping()
    return mapping[trend] || 'normal'
  }

  /**
   * 从策略模板同步趋势映射关系
   * 根据模板的 trendMatches 更新 trendStrategyMapping
   */
  syncTrendMappingFromTemplates(templates) {
    if (!Array.isArray(templates)) return

    const newMapping = { ...this.config.trendStrategyMapping }

    templates.forEach(template => {
      if (!template.name || !Array.isArray(template.trendMatches)) return

      // 根据模板名称判断策略类型
      let strategyType = 'normal'
      const name = template.name.toLowerCase()
      if (name.includes('上涨') || name.includes('up')) {
        strategyType = 'uptrend'
      } else if (name.includes('下跌') || name.includes('down')) {
        strategyType = 'downtrend'
      }

      // 为每个匹配的趋势设置映射
      template.trendMatches.forEach(trend => {
        if (trend) {
          newMapping[trend] = strategyType
        }
      })
    })

    this.config.trendStrategyMapping = newMapping
    this.saveToLocalStorage()
    console.log('[AppConfig] 已从模板同步趋势映射:', JSON.stringify(newMapping))
  }

  // ========== 收市买入配置 ==========

  // 生成稳定的配置 key（基于股票代码、账户类型、券商）
  getMarketCloseKey(stockCode, accountType, provider) {
    return `${stockCode}_${accountType}_${provider || ''}`
  }

  getMarketCloseBuyConfig() {
    return this.config.marketCloseBuy || {}
  }

  // 直接保存收市买配置（用于批量更新）
  saveMarketCloseBuyConfig(configs) {
    this.config.marketCloseBuy = configs
    this.saveToLocalStorage()
  }

  // 获取收市买入配置（兼容旧版 strategyId 方式 + 新版稳定 key 方式）
  getMarketCloseBuyForStrategy(strategyId, stockCode, accountType, provider) {
    const configs = this.getMarketCloseBuyConfig()
    // 优先使用稳定 key 查找
    const stableKey = this.getMarketCloseKey(stockCode, accountType, provider)
    if (configs[stableKey]) {
      return configs[stableKey]
    }
    // 兼容旧版 strategyId 方式
    return configs[strategyId] || null
  }

  // 设置收市买入配置（使用稳定 key，支持多账户）
  setMarketCloseBuyForStrategy(strategyId, config, stockCode, accountType, provider) {
    if (!this.config.marketCloseBuy) {
      this.config.marketCloseBuy = {}
    }
    if (config) {
      // 使用稳定 key
      const stableKey = this.getMarketCloseKey(stockCode, accountType, provider)
      // 记录东八区时间 (Asia/Shanghai)
      const now = new Date()
      const cstTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }))
      config.createdAt = cstTime.toISOString()
      config.createdAtDisplay = cstTime.toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
      this.config.marketCloseBuy[stableKey] = config
      console.log(`[AppConfig] 收市买配置已保存, key=${stableKey}`, config)
    } else {
      delete this.config.marketCloseBuy[strategyId]
    }
    this.saveToLocalStorage()
  }

  // 清除收市买入配置
  clearMarketCloseBuyForStrategy(strategyId, stockCode, accountType, provider) {
    if (this.config.marketCloseBuy) {
      const stableKey = this.getMarketCloseKey(stockCode, accountType, provider)
      delete this.config.marketCloseBuy[stableKey]
      delete this.config.marketCloseBuy[strategyId]  // 兼容旧版
      this.saveToLocalStorage()
    }
  }

  // 获取某只股票的所有收市买配置（用于多账户下单）
  getAllMarketCloseConfigsForStock(stockCode) {
    const configs = this.getMarketCloseBuyConfig()
    const result = []
    for (const key in configs) {
      if (key.startsWith(stockCode + '_')) {
        result.push({ key, config: configs[key] })
      }
    }
    return result
  }

  // 清除某只股票的所有收市买配置
  clearAllMarketCloseConfigsForStock(stockCode) {
    if (this.config.marketCloseBuy) {
      const keysToDelete = []
      for (const key in this.config.marketCloseBuy) {
        if (key.startsWith(stockCode + '_')) {
          keysToDelete.push(key)
        }
      }
      keysToDelete.forEach(key => delete this.config.marketCloseBuy[key])
      this.saveToLocalStorage()
    }
  }

  // ========== 收市卖出配置 ==========

  getMarketCloseSellConfig() {
    return this.config.marketCloseSell || {}
  }

  // 直接保存收市卖配置（用于批量更新）
  saveMarketCloseSellConfig(configs) {
    this.config.marketCloseSell = configs
    this.saveToLocalStorage()
  }

  // 设置收市卖出配置（使用稳定 key，支持多账户）
  setMarketCloseSellForStrategy(strategyId, config, stockCode, accountType, provider) {
    if (!this.config.marketCloseSell) {
      this.config.marketCloseSell = {}
    }
    if (config) {
      // 使用稳定 key
      const stableKey = this.getMarketCloseKey(stockCode, accountType, provider)
      // 记录东八区时间 (Asia/Shanghai)
      const now = new Date()
      const cstTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }))
      config.createdAt = cstTime.toISOString()
      config.createdAtDisplay = cstTime.toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
      this.config.marketCloseSell[stableKey] = config
      console.log(`[AppConfig] 收市卖配置已保存, key=${stableKey}`, config)
    } else {
      delete this.config.marketCloseSell[strategyId]
    }
    this.saveToLocalStorage()
  }

  // 获取某只股票的所有收市卖配置
  getAllMarketCloseSellConfigsForStock(stockCode) {
    const configs = this.getMarketCloseSellConfig()
    const result = []
    for (const key in configs) {
      if (key.startsWith(stockCode + '_')) {
        result.push({ key, config: configs[key] })
      }
    }
    return result
  }

  // 清除某只股票的所有收市卖配置
  clearAllMarketCloseSellConfigsForStock(stockCode) {
    if (this.config.marketCloseSell) {
      const keysToDelete = []
      for (const key in this.config.marketCloseSell) {
        if (key.startsWith(stockCode + '_')) {
          keysToDelete.push(key)
        }
      }
      keysToDelete.forEach(key => delete this.config.marketCloseSell[key])
      this.saveToLocalStorage()
    }
  }

  // ========== Banner 配置 ==========

  getBannerConfig() {
    return this.config.banner || { text: '' }
  }

  getBannerText() {
    return this.config.banner?.text || ''
  }

  setBannerText(text) {
    if (!this.config.banner) {
      this.config.banner = { text: '' }
    }
    this.config.banner.text = text
    this.saveToLocalStorage()
  }

  clearBanner() {
    if (this.config.banner) {
      this.config.banner.text = ''
    }
    this.saveToLocalStorage()
  }

  // ========== 浮动笔记配置 ==========

  getNoteConfig() {
    return this.config.note || { ...DEFAULT_CONFIG.note }
  }

  updateNoteConfig(noteConfig) {
    this.config.note = { ...this.config.note, ...noteConfig }
    this.saveToLocalStorage()
  }

  getNoteContent() {
    return this.config.note?.content || ''
  }

  setNoteContent(content, updatedAt) {
    if (!this.config.note) {
      this.config.note = { ...DEFAULT_CONFIG.note }
    }
    this.config.note.content = content
    // 记录内容最后修改时间；未显式传入时取当前时间（本地编辑）
    this.config.note.updatedAt = updatedAt || new Date().toISOString()
    this.saveToLocalStorage()
  }

  getNoteVisible() {
    return this.config.note?.visible ?? false
  }

  setNoteVisible(visible) {
    if (!this.config.note) {
      this.config.note = { ...DEFAULT_CONFIG.note }
    }
    this.config.note.visible = visible
    this.saveToLocalStorage()
  }

  getNotePosition() {
    return {
      x: this.config.note?.x ?? DEFAULT_CONFIG.note.x,
      y: this.config.note?.y ?? DEFAULT_CONFIG.note.y
    }
  }

  setNotePosition(x, y) {
    if (!this.config.note) {
      this.config.note = { ...DEFAULT_CONFIG.note }
    }
    this.config.note.x = x
    this.config.note.y = y
    this.saveToLocalStorage()
  }

  getNoteSize() {
    return {
      width: this.config.note?.width ?? DEFAULT_CONFIG.note.width,
      height: this.config.note?.height ?? DEFAULT_CONFIG.note.height
    }
  }

  setNoteSize(width, height) {
    if (!this.config.note) {
      this.config.note = { ...DEFAULT_CONFIG.note }
    }
    this.config.note.width = width
    this.config.note.height = height
    this.saveToLocalStorage()
  }
}

// 导出单例
const appConfigService = new AppConfigService()

export default appConfigService
export { appConfigService, AppConfigService, STORAGE_KEY, DEFAULT_CONFIG }
