/**
 * 按钮点击计数器服务
 * 记录每个按钮当天的点击次数，每天早上 8 点自动清零
 */

const STORAGE_PREFIX = 'clickCount_'

class ClickCounterService {
  constructor() {
    this.lastResetDate = null
    this.counts = {}
    this.init()
  }

  // 初始化：加载数据并检查是否需要重置
  init() {
    this.loadFromLocalStorage()
    this.checkAndResetIfNewDay()
    this.startDailyResetTimer()
  }

  // 获取今天的日期字符串
  getTodayKey() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }

  // 获取今天的秒数（用于 8 点判断）
  getSecondsSinceMidnight() {
    const now = new Date()
    return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
  }

  // 加载数据
  loadFromLocalStorage() {
    try {
      const todayKey = this.getTodayKey()
      const stored = localStorage.getItem(STORAGE_PREFIX + todayKey)
      if (stored) {
        this.counts = JSON.parse(stored)
      } else {
        this.counts = {}
      }
    } catch (e) {
      console.error('[ClickCounter] 加载失败:', e)
      this.counts = {}
    }
  }

  // 保存数据
  saveToLocalStorage() {
    try {
      const todayKey = this.getTodayKey()
      localStorage.setItem(STORAGE_PREFIX + todayKey, JSON.stringify(this.counts))
    } catch (e) {
      console.error('[ClickCounter] 保存失败:', e)
    }
  }

  // 检查是否需要重置（跨天）
  checkAndResetIfNewDay() {
    const today = this.getTodayKey()
    if (this.lastResetDate !== today) {
      // 只在 lastResetDate 已有值且与今天不同时才重置（真正的跨天）
      // 首次加载时 lastResetDate 为 null，不应清空刚从 localStorage 加载的数据
      if (this.lastResetDate !== null) {
        this.counts = {}
        this.saveToLocalStorage()
        console.log('[ClickCounter] 新的一天，计数器已重置')
      }
      this.lastResetDate = today
    }
  }

  // 获取点击次数
  getCount(strategyId, buttonType) {
    const key = this.getKey(strategyId, buttonType)
    return this.counts[key] || 0
  }

  // 增加点击次数
  increment(strategyId, buttonType) {
    const key = this.getKey(strategyId, buttonType)
    if (!this.counts[key]) {
      this.counts[key] = 0
    }
    this.counts[key]++
    this.saveToLocalStorage()
    return this.counts[key]
  }

  // 重置所有计数
  resetAll() {
    this.counts = {}
    this.saveToLocalStorage()
    console.log('[ClickCounter] 手动重置')
  }

  // 获取完整 key
  getKey(strategyId, buttonType) {
    return `${strategyId}_${buttonType}`
  }

  // 启动每日 8 点重置定时器
  startDailyResetTimer() {
    // 清除已有的定时器
    if (this.resetTimer) {
      clearTimeout(this.resetTimer)
    }

    // 计算距离明天 8 点的毫秒数
    const getNext8AMMs = () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(8, 0, 0, 0)
      return tomorrow.getTime() - now.getTime()
    }

    // 设置定时器
    this.resetTimer = setTimeout(() => {
      this.checkAndResetIfNewDay()
      this.startDailyResetTimer() // 重新设置下一个定时器
    }, getNext8AMMs())
  }

  // 获取所有按钮的计数（用于调试）
  getAllCounts(strategyId) {
    const result = {}
    for (const key in this.counts) {
      if (key.startsWith(strategyId + '_')) {
        const buttonType = key.replace(strategyId + '_', '')
        result[buttonType] = this.counts[key]
      }
    }
    return result
  }
}

// 导出单例
const clickCounterService = new ClickCounterService()

export default clickCounterService
