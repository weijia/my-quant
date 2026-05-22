/**
 * 缺省策略服务
 * 根据趋势自动为股票生成缺省策略
 */

import appConfigService from './AppConfigService.js'

class DefaultStrategyService {
  /**
   * 获取15日平均波动率（从趋势数据）
   * @param {Object} strategy - 策略对象
   * @returns {number|null} 15日平均波动率百分比，如 5.2 表示 5.2%
   */
  get15DayVolatility(strategy) {
    // 从策略中获取波动率数据（由 WebDAVImportService 注入）
    const volatility15d = strategy.volatility15d || strategy.volatility_15d_ma
    if (volatility15d != null) {
      // volatility_15d_ma 是小数格式（如 0.025），转换为百分比
      return volatility15d * 100
    }
    return null
  }

  /**
   * 获取1/4持仓数量
   * @param {Object} strategy - 策略对象
   * @returns {number} 1/4持仓数量，向下取整到100的倍数
   */
  getQuarterPosition(strategy) {
    const netPosition = strategy.netPosition || 0
    if (netPosition <= 0) return 0
    return Math.floor(netPosition / 4 / 100) * 100
  }

  /**
   * 获取当前设定的买入数量
   * @param {Object} strategy - 策略对象
   * @returns {number} 买入数量
   */
  getDefaultBuyVolume(strategy) {
    // 优先使用策略中的设定，如果没有则使用1/4持仓
    return strategy.defaultBuyVolume || strategy.oscillationTradeAmount || this.getQuarterPosition(strategy)
  }

  /**
   * 生成通用上涨趋势策略
   * 
   * 规则：
   * - 下跌卖出：以15日平均波动率为下跌百分比
   * - 上涨买入：上涨0.5%买入
   * 
   * @param {Object} strategy - 策略对象
   * @returns {Object} 生成的策略配置 { decreaseStrategies, increaseStrategies }
   */
  generateUptrendStrategy(strategy) {
    const volatility15d = this.get15DayVolatility(strategy)
    if (!volatility15d) return null

    const buyVolume = this.getDefaultBuyVolume(strategy)
    if (!buyVolume || buyVolume <= 0) return null

    return {
      name: '通用上涨趋势策略',
      description: `下跌${volatility15d.toFixed(2)}%卖出，上涨0.5%买入`,
      decreaseStrategies: [
        {
          deltaPercentage: volatility15d.toFixed(2),
          tradeVolume: buyVolume.toString(),
          side: 'SELL'
        }
      ],
      increaseStrategies: [
        {
          deltaPercentage: '0.5',
          tradeVolume: buyVolume.toString(),
          side: 'BUY'
        }
      ]
    }
  }

  /**
   * 生成通用下跌趋势策略
   * 
   * 规则：
   * - 下跌卖出：达到15日平均波动率的1/2时，卖出1/4持仓
   * - 上涨买入：上涨达到15日平均波动率时，买入当前设定的买入数量
   * 
   * @param {Object} strategy - 策略对象
   * @returns {Object} 生成的策略配置
   */
  generateDowntrendStrategy(strategy) {
    const volatility15d = this.get15DayVolatility(strategy)
    if (!volatility15d) return null

    const quarterPosition = this.getQuarterPosition(strategy)
    const buyVolume = this.getDefaultBuyVolume(strategy)
    
    if (!quarterPosition || quarterPosition <= 0) return null
    if (!buyVolume || buyVolume <= 0) return null

    const sellPercentage = (volatility15d / 2).toFixed(2)
    const buyPercentage = volatility15d.toFixed(2)

    return {
      name: '通用下跌趋势策略',
      description: `下跌${sellPercentage}%卖出1/4持仓，上涨${buyPercentage}%买入${buyVolume}股`,
      decreaseStrategies: [
        {
          deltaPercentage: sellPercentage,
          tradeVolume: quarterPosition.toString(),
          side: 'SELL'
        }
      ],
      increaseStrategies: [
        {
          deltaPercentage: buyPercentage,
          tradeVolume: buyVolume.toString(),
          side: 'BUY'
        }
      ]
    }
  }

  /**
   * 生成通用普通策略
   * 
   * 规则：
   * - 下跌卖出：达到15日平均波动率时，卖出1/4持仓
   * - 上涨买入：达到15日平均波动率时，买入当前设定的买入数量
   * 
   * @param {Object} strategy - 策略对象
   * @returns {Object} 生成的策略配置
   */
  generateNormalStrategy(strategy) {
    const volatility15d = this.get15DayVolatility(strategy)
    if (!volatility15d) return null

    const quarterPosition = this.getQuarterPosition(strategy)
    const buyVolume = this.getDefaultBuyVolume(strategy)
    
    if (!quarterPosition || quarterPosition <= 0) return null
    if (!buyVolume || buyVolume <= 0) return null

    const percentage = volatility15d.toFixed(2)

    return {
      name: '通用普通策略',
      description: `下跌${percentage}%卖出1/4持仓，上涨${percentage}%买入${buyVolume}股`,
      decreaseStrategies: [
        {
          deltaPercentage: percentage,
          tradeVolume: quarterPosition.toString(),
          side: 'SELL'
        }
      ],
      increaseStrategies: [
        {
          deltaPercentage: percentage,
          tradeVolume: buyVolume.toString(),
          side: 'BUY'
        }
      ]
    }
  }

  /**
   * 根据趋势自动选择合适的缺省策略
   * 
   * @param {Object} strategy - 策略对象
   * @returns {Object|null} 生成的策略配置
   */
  generateDefaultStrategy(strategy) {
    // 如果已经有手动设置的策略，不覆盖
    if (strategy.decreaseStrategies?.length > 0 || strategy.increaseStrategies?.length > 0) {
      return null
    }

    const trend = strategy.trendJudgment || strategy.autoTrendJudgment || 'unset'
    
    // 从配置中获取策略类型映射
    const mapping = appConfigService.getTrendStrategyMapping()
    const strategyType = appConfigService.getStrategyTypeForTrend(trend)
    
    console.log(`[DefaultStrategy] 策略: ${strategy.name}, 趋势: ${trend}, 映射:`, mapping[trend], '->', strategyType)
    
    switch (strategyType) {
      case 'uptrend':
        return this.generateUptrendStrategy(strategy)
      
      case 'downtrend':
        return this.generateDowntrendStrategy(strategy)
      
      case 'normal':
      default:
        return this.generateNormalStrategy(strategy)
    }
  }

  /**
   * 应用缺省策略到策略对象
   * 
   * @param {Object} strategy - 策略对象
   * @returns {Object} 更新后的策略对象（如果没有生成策略则返回原对象）
   */
  applyDefaultStrategy(strategy) {
    const defaultStrategy = this.generateDefaultStrategy(strategy)
    if (!defaultStrategy) return strategy

    return {
      ...strategy,
      decreaseStrategies: defaultStrategy.decreaseStrategies,
      increaseStrategies: defaultStrategy.increaseStrategies,
      defaultStrategyName: defaultStrategy.name,
      defaultStrategyDescription: defaultStrategy.description,
      isDefaultStrategy: true
    }
  }
}

export const defaultStrategyService = new DefaultStrategyService()
