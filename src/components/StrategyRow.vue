<template>
  <tr class="strategy-row">
    <td v-if="visibleColumns.includes('name')" class="name-cell">
      <span>{{ strategy.name }}</span>
      <span v-if="strategy.stockCode" class="stock-code">[{{ strategy.stockCode }}]</span>
    </td>
    
    <td v-if="visibleColumns.includes('quantity')" class="quantity-cell">
      {{ strategy.netPosition || 0 }}
    </td>
    
    <td v-if="visibleColumns.includes('marketValue')" class="market-value-cell">
      {{ strategy.marketValue || '-' }}
    </td>
    
    <td v-if="visibleColumns.includes('profitLoss')" class="text-right">
      <span :class="getProfitLossClass(strategy.profitLoss)">{{ strategy.profitLoss || '-' }}</span>
    </td>
    
    <td v-if="visibleColumns.includes('dividendYield')" class="text-right">
      {{ strategy.fiveYearAvgDividendYield || '-' }}%
    </td>
    
    <td v-if="visibleColumns.includes('changePercent')" class="text-right">
      <span :class="getChangeClass(strategy.changePercent)">{{ strategy.changePercent || '-' }}</span>
    </td>
    
    <td v-if="visibleColumns.includes('decreasePercentage')" class="decrease-pct-cell">
      <span :class="strategy.decreasePercentage ? 'decrease-value' : ''">{{ strategy.decreasePercentage ? '-' + strategy.decreasePercentage : '-' }}%</span>
    </td>
    
    <td v-if="visibleColumns.includes('trendIcon')" class="trend-icon-cell">
      <span 
        class="trend-icon" 
        :class="getTrendIconClass(localTrend)"
        @click="showTrendTip = !showTrendTip"
      >{{ getTrendIcon(localTrend) }}</span>
      <span v-if="showTrendTip" class="trend-tip" @click.stop="showTrendTip = false">{{ getTrendTooltip(localTrend) }}</span>
    </td>
    
    <td v-if="visibleColumns.includes('autoTrend')">
      <select 
        v-model="localTrend" 
        @change="updateTrend"
        :class="['trend-select', getTrendClass(localTrend)]"
      >
        <option value="unset">未设置</option>
        <option value="trend_unknown">未知趋势</option>
        <option value="trend_up">上涨趋势</option>
        <option value="trend_down">下跌趋势</option>
        <option value="trend_breakdown">下跌破位</option>
        <option value="trend_oscillation">震荡趋势</option>
        <option value="trend_pullback">回踩趋势</option>
        <option value="high_volatility">高波动率</option>
        <option value="medium_volatility">中等波动率</option>
        <option value="low_volatility">低波动率</option>
      </select>
    </td>
    
    <td v-if="visibleColumns.includes('oscillationGrid')">
      <div v-if="strategy.oscillationGridSize" class="grid-info">
        <span>网格: {{ strategy.oscillationGridSize }}元</span>
        <span class="trade-amount">× {{ strategy.oscillationTradeAmount }}股</span>
      </div>
      <span v-else>-</span>
    </td>
    
    <td v-if="visibleColumns.includes('decreaseStrategy')">
      <div v-if="strategy.decreaseStrategies && strategy.decreaseStrategies.length > 0">
        <div 
          v-for="(decrease, index) in strategy.decreaseStrategies.slice(0, 3)" 
          :key="index"
          class="strategy-tag"
        >
          {{ decrease.deltaPercentage || decrease.deltaAmount }}%/{{ decrease.tradeVolume }}股
        </div>
        <span v-if="strategy.decreaseStrategies.length > 3" class="more-count">
          +{{ strategy.decreaseStrategies.length - 3 }}
        </span>
      </div>
      <span v-else>-</span>
    </td>
    
    <td v-if="visibleColumns.includes('increaseStrategy')">
      <div v-if="strategy.increaseStrategies && strategy.increaseStrategies.length > 0">
        <div 
          v-for="(increase, index) in strategy.increaseStrategies.slice(0, 3)" 
          :key="index"
          class="strategy-tag"
        >
          {{ increase.deltaPercentage || increase.deltaAmount }}%/{{ increase.tradeVolume }}股
        </div>
        <span v-if="strategy.increaseStrategies.length > 3" class="more-count">
          +{{ strategy.increaseStrategies.length - 3 }}
        </span>
      </div>
      <span v-else>-</span>
    </td>
    
    <td v-if="visibleColumns.includes('manualNotes')" class="notes-cell">
      <span :title="strategy.manualNotes">{{ strategy.manualNotes || '-' }}</span>
    </td>
    
    <td v-if="visibleColumns.includes('quickOrder')" class="quick-order-cell">
      <button 
        class="quick-order-btn buy-btn" 
        @click="handleQuickBuy" 
        :disabled="!strategy.stockCode || sendingBuy"
        title="上涨0.5%买入"
      >
        {{ sendingBuy ? '...' : '↑买入' }}
      </button>
      <button 
        class="quick-order-btn sell-btn" 
        @click="handleQuickSell" 
        :disabled="!strategy.stockCode || sendingSell"
        title="下跌0.5%卖出"
      >
        {{ sendingSell ? '...' : '↓卖出' }}
      </button>
      <button 
        class="quick-order-btn both-btn" 
        @click="handleQuickBoth" 
        :disabled="!strategy.stockCode || sendingBoth"
        title="上涨0.5%买入及下跌0.5%卖出"
      >
        {{ sendingBoth ? '...' : '双向' }}
      </button>
    </td>
    
    <td v-if="visibleColumns.includes('actions')" class="actions-cell">
      <button class="action-btn edit-btn" @click="$emit('edit', strategy)" title="编辑">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
          <path d="m15 5 4 4"/>
        </svg>
      </button>
      <button class="action-btn delete-btn" @click="$emit('delete', strategy.id)" title="删除">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18"/>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
        </svg>
      </button>
      <button class="action-btn condition-btn" @click="$emit('batch-condition', strategy)" title="批量条件单">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 6v12"/>
          <path d="m8 10 4-4 4 4"/>
        </svg>
      </button>
    </td>
  </tr>
</template>

<script setup>
import { ref, watch } from 'vue'
import mqttConditionService from '../services/MQTTConditionService.js'

const props = defineProps({
  strategy: {
    type: Object,
    required: true
  },
  visibleColumns: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['edit', 'delete', 'update-trend', 'batch-condition'])

const localTrend = ref(props.strategy.trendJudgment || 'unset')

// 快速下单发送状态
const sendingBuy = ref(false)
const sendingSell = ref(false)
const sendingBoth = ref(false)
const showTrendTip = ref(false)

// 获取趋势图标
const getTrendIcon = (trend) => {
  const icons = {
    'trend_up': '↑',
    'trend_down': '↓',
    'trend_breakdown': '⇓',
    'trend_oscillation': '↔',
    'trend_pullback': '↘',
    'trend_unknown': '?',
    'high_volatility': '⚡',
    'medium_volatility': '∼',
    'low_volatility': '─',
    'unset': '·'
  }
  return icons[trend] || '·'
}

// 获取趋势图标样式类
const getTrendIconClass = (trend) => {
  const classes = {
    'trend_up': 'trend-up',
    'trend_down': 'trend-down',
    'trend_breakdown': 'trend-breakdown',
    'trend_oscillation': 'trend-oscillation',
    'trend_pullback': 'trend-pullback',
    'trend_unknown': 'trend-unknown',
    'high_volatility': 'trend-high-vol',
    'medium_volatility': 'trend-medium-vol',
    'low_volatility': 'trend-low-vol',
    'unset': 'trend-unset'
  }
  return classes[trend] || 'trend-unset'
}

// 获取趋势提示文本
const getTrendTooltip = (trend) => {
  const tooltips = {
    'trend_up': '上涨趋势',
    'trend_down': '下跌趋势',
    'trend_breakdown': '下跌破位',
    'trend_oscillation': '震荡趋势',
    'trend_pullback': '回踩趋势',
    'trend_unknown': '未知趋势',
    'high_volatility': '高波动率',
    'medium_volatility': '中等波动率',
    'low_volatility': '低波动率',
    'unset': '未设置'
  }
  return tooltips[trend] || '未设置'
}

// 获取账户类型
const getAccountType = () => {
  if (props.strategy.provider === 'pingan') {
    return 'default'
  }
  return props.strategy.accountType === 'credit' ? 'credit' : 'default'
}

// 计算下单数量：持仓的1/4，向下取整到100的倍数
const calculateTradeVolume = (netPosition) => {
  if (!netPosition || netPosition < 100) return 100
  const quarter = Math.floor(netPosition / 4)
  return Math.floor(quarter / 100) * 100  // 向下取整到100的倍数
}

// 上涨买入
const handleQuickBuy = async () => {
  if (!props.strategy.stockCode) return
  sendingBuy.value = true
  const tradeVolume = calculateTradeVolume(props.strategy.netPosition)
  
  try {
    await mqttConditionService.sendBuyOrder({
      stockCode: props.strategy.stockCode,
      stockName: props.strategy.name,
      tradeVolume,
      percentage: 0.5,
      provider: props.strategy.provider || 'pingan',
      accountType: getAccountType()
    })
    console.log(`[快速下单] 上涨0.5%买入已发送: ${props.strategy.stockCode}, 数量: ${tradeVolume}`)
  } catch (error) {
    console.error('[快速下单] 买入失败:', error)
    alert('发送失败，请检查MQTT连接')
  } finally {
    sendingBuy.value = false
  }
}

// 下跌卖出
const handleQuickSell = async () => {
  if (!props.strategy.stockCode) return
  sendingSell.value = true
  const tradeVolume = calculateTradeVolume(props.strategy.netPosition)
  
  try {
    await mqttConditionService.sendSellOrder({
      stockCode: props.strategy.stockCode,
      stockName: props.strategy.name,
      tradeVolume,
      percentage: 0.5,
      provider: props.strategy.provider || 'pingan',
      accountType: getAccountType()
    })
    console.log(`[快速下单] 下跌0.5%卖出已发送: ${props.strategy.stockCode}, 数量: ${tradeVolume}`)
  } catch (error) {
    console.error('[快速下单] 卖出失败:', error)
    alert('发送失败，请检查MQTT连接')
  } finally {
    sendingSell.value = false
  }
}

// 双向下单
const handleQuickBoth = async () => {
  if (!props.strategy.stockCode) return
  sendingBoth.value = true
  const tradeVolume = calculateTradeVolume(props.strategy.netPosition)
  
  try {
    await mqttConditionService.sendBothOrders({
      stockCode: props.strategy.stockCode,
      stockName: props.strategy.name,
      tradeVolume,
      percentage: 0.5,
      provider: props.strategy.provider || 'pingan',
      accountType: getAccountType()
    })
    console.log(`[快速下单] 双向条件单已发送: ${props.strategy.stockCode}, 数量: ${tradeVolume}`)
  } catch (error) {
    console.error('[快速下单] 双向下单失败:', error)
    alert('发送失败，请检查MQTT连接')
  } finally {
    sendingBoth.value = false
  }
}

// 【调试】监控 decreasePercentage 的值
console.log(`[调试-StrategyRow] 渲染策略: ${props.strategy.name}(${props.strategy.stockCode}), decreasePercentage=${props.strategy.decreasePercentage}, 类型=${typeof props.strategy.decreasePercentage}`);

watch(() => props.strategy.trendJudgment, (newVal) => {
  localTrend.value = newVal || 'unset'
})

const updateTrend = () => {
  emit('update-trend', localTrend.value)
}

const getProfitLossClass = (value) => {
  if (!value) return ''
  const num = parseFloat(value)
  return num >= 0 ? 'positive' : 'negative'
}

const getChangeClass = (value) => {
  if (!value) return ''
  const num = parseFloat(value)
  return num >= 0 ? 'positive' : 'negative'
}

const getTrendClass = (trend) => {
  const trendColors = {
    trend_up: 'trend-up',
    trend_down: 'trend-down',
    trend_breakdown: 'trend-breakdown',
    trend_oscillation: 'trend-oscillation',
    trend_pullback: 'trend-pullback',
    trend_unknown: 'trend-unknown',
    high_volatility: 'trend-high-volatility',
    medium_volatility: 'trend-medium-volatility',
    low_volatility: 'trend-low-volatility',
    unset: 'trend-unset'
  }
  return trendColors[trend] || 'trend-unset'
}
</script>

<style scoped>
.strategy-row {
  transition: background-color 0.2s;
}

.strategy-row:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.strategy-row td {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.name-cell {
  font-weight: bold;
  width: 88px;
  max-width: 88px;
}

.market-value-cell {
  width: 88px;
  max-width: 88px;
  text-align: right;
}

.quantity-cell {
  width: 88px;
  max-width: 88px;
  text-align: right;
}

.decrease-pct-cell {
  width: 3ch;
  min-width: 3ch;
  text-align: right;
}

.trend-icon-cell {
  width: 1.5ch;
  min-width: 1.5ch;
  text-align: center;
  padding: 8px 4px;
  position: relative;
}

.trend-icon {
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
}

.trend-tip {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.85);
  color: white;
  font-size: 12px;
  font-weight: normal;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  z-index: 100;
  cursor: pointer;
  pointer-events: auto;
}

.trend-icon.trend-up { color: #dc3545; }
.trend-icon.trend-down { color: #28a745; }
.trend-icon.trend-breakdown { color: #dc3545; }
.trend-icon.trend-oscillation { color: #ffc107; }
.trend-icon.trend-pullback { color: #17a2b8; }
.trend-icon.trend-unknown { color: #6c757d; }
.trend-icon.trend-high-vol { color: #fd7e14; }
.trend-icon.trend-medium-vol { color: #20c997; }
.trend-icon.trend-low-vol { color: #6c757d; }
.trend-icon.trend-unset { color: rgba(255, 255, 255, 0.3); }

.stock-code {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  margin-left: 4px;
}

.text-right {
  text-align: right;
}

.positive {
  color: #dc3545;
}

.negative {
  color: #28a745;
}

.decrease-value {
  color: white;
}

.trend-select {
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  cursor: pointer;
  width: 80px;
}

.trend-select:hover {
  border-color: rgba(255, 255, 255, 0.6);
}

.trend-up {
  color: #dc3545;
  border-color: rgba(220, 53, 69, 0.5);
}

.trend-down {
  color: #28a745;
  border-color: rgba(40, 167, 69, 0.5);
}

.trend-oscillation {
  color: #ffc107;
  border-color: rgba(255, 193, 7, 0.5);
}

.trend-pullback {
  color: #17a2b8;
  border-color: rgba(23, 162, 184, 0.5);
}

.trend-unknown {
  color: #6c757d;
  border-color: rgba(108, 117, 125, 0.5);
}

.trend-unset {
  color: rgba(255, 255, 255, 0.5);
  border-color: rgba(255, 255, 255, 0.2);
}

.trend-breakdown {
  color: #8b0000;
  border-color: rgba(139, 0, 0, 0.5);
}

.trend-high-volatility {
  color: #ff6600;
  border-color: rgba(255, 102, 0, 0.5);
}

.trend-medium-volatility {
  color: #9966ff;
  border-color: rgba(153, 102, 255, 0.5);
}

.trend-low-volatility {
  color: #00cc99;
  border-color: rgba(0, 204, 153, 0.5);
}

.grid-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
}

.trade-amount {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.strategy-tag {
  display: inline-block;
  padding: 2px 6px;
  background-color: rgba(78, 205, 196, 0.2);
  border-radius: 3px;
  font-size: 11px;
  margin-bottom: 2px;
}

.more-count {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.notes-cell {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions-cell {
  display: table-cell;
  vertical-align: middle;
  width: 80px;
  min-width: 80px;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s;
}

.action-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.delete-btn:hover {
  color: #dc3545;
}

.edit-btn:hover {
  color: #4ecdc4;
}

.condition-btn:hover {
  color: #ffc107;
}

/* 快速下单按钮样式 */
.quick-order-cell {
  display: table-cell;
  vertical-align: middle;
  width: 160px;
  min-width: 160px;
}

.quick-order-cell .quick-order-btn {
  margin: 0 2px;
}

.quick-order-btn {
  padding: 3px 6px;
  border: none;
  border-radius: 3px;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.quick-order-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quick-order-btn.buy-btn {
  background-color: rgba(40, 167, 69, 0.3);
  color: #28a745;
  border: 1px solid rgba(40, 167, 69, 0.5);
}

.quick-order-btn.buy-btn:hover:not(:disabled) {
  background-color: rgba(40, 167, 69, 0.5);
  color: white;
}

.quick-order-btn.sell-btn {
  background-color: rgba(220, 53, 69, 0.3);
  color: #dc3545;
  border: 1px solid rgba(220, 53, 69, 0.5);
}

.quick-order-btn.sell-btn:hover:not(:disabled) {
  background-color: rgba(220, 53, 69, 0.5);
  color: white;
}

.quick-order-btn.both-btn {
  background-color: rgba(255, 193, 7, 0.3);
  color: #ffc107;
  border: 1px solid rgba(255, 193, 7, 0.5);
}

.quick-order-btn.both-btn:hover:not(:disabled) {
  background-color: rgba(255, 193, 7, 0.5);
  color: white;
}
</style>
