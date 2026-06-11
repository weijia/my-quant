<template>
  <tr class="strategy-row">
    <td v-if="visibleColumns.includes('name')" class="name-cell">
      <div class="name-cell-inner">
        <span>{{ strategy.name }}</span>
        <span v-if="strategy.stockCode" class="stock-code">[{{ strategy.stockCode }}]</span>
      </div>
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
      <span :class="getDecreaseColorClass(strategy.decreasePercentage)">{{ strategy.decreasePercentage ? '-' + strategy.decreasePercentage : '-' }}%</span>
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

    <td v-if="visibleColumns.includes('strategyType')" class="strategy-type-cell">
      <div class="strategy-type-wrapper">
        <select
          v-model="localStrategyName"
          @change="updateStrategySelection"
          class="strategy-select"
          :class="{ 'manual-selected': localStrategyName && localStrategyName !== 'auto' }"
        >
          <option value="auto">自动 ({{ getAutoStrategyName() }})</option>
          <option v-for="tpl in availableStrategyTemplates" :key="tpl.name" :value="tpl.name">
            {{ tpl.name }}
          </option>
        </select>
        <button @click="executeStrategyScript" class="execute-strategy-btn" title="按量执行策略脚本生成条件单">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </button>
        <button @click="executeStrategyByAmount" class="execute-strategy-btn amount-btn" title="按额执行策略脚本生成条件单">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </button>
      </div>
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
    
    <!-- 条件配置：交易金额、数量、价格和涨跌幅 -->
    <td v-if="visibleColumns.includes('conditionConfig')" class="condition-config-cell">
      <div class="settings-inputs">
        <div class="setting-item">
          <span class="setting-label">额</span>
          <input 
            v-model.number="defaultTradeAmount" 
            type="number" 
            class="setting-input"
            placeholder="26000"
            min="0"
            step="1000"
            @change="saveTradeSettings"
          />
        </div>
        <div class="setting-item">
          <span class="setting-label">量</span>
          <input 
            :value="defaultTradeVolume ?? getQuarterPosition()"
            @input="defaultTradeVolume = Number($event.target.value) || null"
            type="number" 
            class="setting-input"
            :placeholder="getQuarterPosition().toString()"
            min="0"
            step="100"
            @change="saveTradeSettings"
          />
        </div>
        <div class="setting-item" :class="{ 'price-missing': !effectivePrice }">
          <span class="setting-label">价</span>
          <input 
            :value="manualPrice ?? (strategy.currentPrice || '')"
            @input="manualPrice = Number($event.target.value) || null"
            type="number" 
            class="setting-input"
            placeholder="输入价格"
            min="0"
            step="0.01"
          />
        </div>
        <div class="setting-item total-display">
          <span class="setting-label">总</span>
          <span class="total-amount" :class="{ 'zero': !totalTradeAmount }">
            {{ totalTradeAmount ? formatAmount(totalTradeAmount) : '-' }}
          </span>
        </div>
        <div class="setting-item">
          <span class="setting-label">涨%</span>
          <input 
            v-model.number="conditionPct" 
            type="number" 
            class="setting-input"
            placeholder="0.1"
            min="0.01"
            step="0.1"
            @change="saveConditionPct"
          />
        </div>
        <div class="quick-set-btns">
          <button @click="setDefaultVolumeFull" class="quick-set-btn" title="设置为全额持仓">1/1</button>
          <button @click="setDefaultVolumeHalf" class="quick-set-btn" title="设置为1/2持仓">1/2</button>
          <button @click="setDefaultVolumeQuarter" class="quick-set-btn" title="设置为1/4持仓">1/4</button>
          <button @click="setDefaultVolumeEighth" class="quick-set-btn" title="设置为1/8持仓">1/8</button>
        </div>
        <div class="condition-config-actions">
          <button @click="resetConditionConfig" class="config-action-btn reset-btn" :class="{ 'has-custom-config': hasCustomConfig }" title="重置为默认配置">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12"/><path d="M3 3v9h9"/></svg>
            重置
            <span v-if="hasCustomConfig" class="config-indicator"></span>
          </button>
        </div>
      </div>
    </td>

    <!-- 条件单：6个按钮（基于额和量，使用条件配置中的涨跌幅） -->
    <td v-if="visibleColumns.includes('conditionOrder')" class="condition-order-cell">
      <div class="condition-order-btns">
        <!-- 基于金额（额）的按钮组 -->
        <div class="condition-group amount-group">
          <div class="condition-info">
            <span class="condition-amount amount-based">{{ formatAmount(defaultTradeAmount) || '-' }}</span>
            <span class="condition-pct">±{{ conditionPct }}%</span>
          </div>
          <div class="condition-group-btns">
            <button 
              @click="handleConditionAmountBuy" 
              class="condition-order-btn amount-buy-btn"
              :disabled="sendingConditionAmountBuy || !effectivePrice"
              :title="`上涨${conditionPct}%买入 金额:${defaultTradeAmount || 26000} 数量:${calculateVolumeFromAmount(defaultTradeAmount || 26000, effectivePrice || 10)}`"
            >
              {{ sendingConditionAmountBuy ? '...' : '额↑买' }}<span v-if="getButtonCount('amountBuy') > 0" class="btn-count">{{ getButtonCount('amountBuy') }}</span>
            </button>
            <button 
              @click="handleConditionAmountSell" 
              class="condition-order-btn amount-sell-btn"
              :disabled="sendingConditionAmountSell || !effectivePrice"
              :title="`下跌${conditionPct}%卖出 金额:${defaultTradeAmount || 26000} 数量:${calculateVolumeFromAmount(defaultTradeAmount || 26000, effectivePrice || 10)}`"
            >
              {{ sendingConditionAmountSell ? '...' : '额↓卖' }}<span v-if="getButtonCount('amountSell') > 0" class="btn-count">{{ getButtonCount('amountSell') }}</span>
            </button>
            <button 
              @click="handleConditionAmountBoth" 
              class="condition-order-btn amount-both-btn"
              :disabled="sendingConditionAmountBoth || !effectivePrice"
              :title="`上涨${conditionPct}%买入+下跌${conditionPct}%卖出 金额:${defaultTradeAmount || 26000} 数量:${calculateVolumeFromAmount(defaultTradeAmount || 26000, effectivePrice || 10)}`"
            >
              {{ sendingConditionAmountBoth ? '...' : '额双向' }}<span v-if="getButtonCount('amountBoth') > 0" class="btn-count">{{ getButtonCount('amountBoth') }}</span>
            </button>
          </div>
        </div>
        <!-- 基于数量（量）的按钮组 -->
        <div class="condition-group volume-group">
          <div class="condition-info">
            <span class="condition-amount volume-based">{{ formatAmount(totalTradeAmount) || '-' }}</span>
            <span class="condition-pct">±{{ conditionPct }}%</span>
          </div>
          <div class="condition-group-btns">
            <button 
              @click="handleConditionVolumeBuy" 
              class="condition-order-btn volume-buy-btn"
              :disabled="sendingConditionVolumeBuy"
              :title="`上涨${conditionPct}%买入 金额:${Math.round(getEffectiveTradeVolume() * (effectivePrice || 0))} 数量:${getEffectiveTradeVolume()}`"
            >
              {{ sendingConditionVolumeBuy ? '...' : '量↑买' }}<span v-if="getButtonCount('volumeBuy') > 0" class="btn-count">{{ getButtonCount('volumeBuy') }}</span>
            </button>
            <button 
              @click="handleConditionVolumeSell" 
              class="condition-order-btn volume-sell-btn"
              :disabled="sendingConditionVolumeSell"
              :title="`下跌${conditionPct}%卖出 金额:${Math.round(getEffectiveTradeVolume() * (effectivePrice || 0))} 数量:${getEffectiveTradeVolume()}`"
            >
              {{ sendingConditionVolumeSell ? '...' : '量↓卖' }}<span v-if="getButtonCount('volumeSell') > 0" class="btn-count">{{ getButtonCount('volumeSell') }}</span>
            </button>
            <button 
              @click="handleConditionVolumeBoth" 
              class="condition-order-btn volume-both-btn"
              :disabled="sendingConditionVolumeBoth"
              :title="`上涨${conditionPct}%买入+下跌${conditionPct}%卖出 金额:${Math.round(getEffectiveTradeVolume() * (effectivePrice || 0))} 数量:${getEffectiveTradeVolume()}`"
            >
              {{ sendingConditionVolumeBoth ? '...' : '量双向' }}<span v-if="getButtonCount('volumeBoth') > 0" class="btn-count">{{ getButtonCount('volumeBoth') }}</span>
            </button>
          </div>
        </div>
        <!-- 收市买入按钮 -->
        <button 
          @click="handleMarketCloseBuy" 
          class="condition-order-btn market-close-btn"
          :class="{ 'active': hasMarketCloseBuyFlag }"
          :disabled="sendingMarketCloseBuy || !strategy.stockCode"
          :title="marketCloseBuyTime 
            ? `收市买入 上涨0.1%买入 金额:${Math.round(getEffectiveTradeVolume() * (effectivePrice || 0))} 数量:${getEffectiveTradeVolume()}股（2:45左右执行）\n设置时间: ${marketCloseBuyTime} ${isMarketCloseBuyToday ? '✓ 今天' : '✗ 非今天'}` 
            : `收市买入 上涨0.1%买入 金额:${Math.round(getEffectiveTradeVolume() * (effectivePrice || 0))} 数量:${getEffectiveTradeVolume()}股（2:45左右执行）`"
        >
          {{ sendingMarketCloseBuy ? '...' : (hasMarketCloseBuyFlag ? '收市✓' : '收市买') }}<span v-if="getButtonCount('marketCloseBuy') > 0" class="btn-count">{{ getButtonCount('marketCloseBuy') }}</span>
        </button>
        <!-- 收市卖出按钮 -->
        <button 
          @click="handleMarketCloseSell" 
          class="condition-order-btn market-close-btn market-close-sell-btn"
          :class="{ 'active': hasMarketCloseSellFlag }"
          :disabled="sendingMarketCloseSell || !strategy.stockCode"
          :title="marketCloseSellTime 
            ? `收市卖出 下跌0.1%卖出 金额:${Math.round(getEffectiveTradeVolume() * (effectivePrice || 0))} 数量:${getEffectiveTradeVolume()}股（2:45左右执行）\n设置时间: ${marketCloseSellTime} ${isMarketCloseSellToday ? '✓ 今天' : '✗ 非今天'}` 
            : `收市卖出 下跌0.1%卖出 金额:${Math.round(getEffectiveTradeVolume() * (effectivePrice || 0))} 数量:${getEffectiveTradeVolume()}股（2:45左右执行）`"
        >
          {{ sendingMarketCloseSell ? '...' : (hasMarketCloseSellFlag ? '收卖✓' : '收市卖') }}<span v-if="getButtonCount('marketCloseSell') > 0" class="btn-count">{{ getButtonCount('marketCloseSell') }}</span>
        </button>
      </div>
    </td>
    
    <!-- 快捷：金额显示 + 百分比 + 3个按钮（固定0.5%，按数量下单） -->
    <td v-if="visibleColumns.includes('quickOrder')" class="quick-order-cell">
      <div class="quick-info">
        <span class="quick-amount">{{ formatAmount(totalTradeAmount) || '-' }}</span>
        <span class="quick-pct">±0.5%</span>
      </div>
      <button
        class="quick-order-btn buy-btn"
        @click="handleQuickBuy"
        :disabled="!strategy.stockCode || sendingBuy"
        :title="`上涨0.5%买入 金额:${Math.round(getEffectiveTradeVolume() * (effectivePrice || 0))} 数量:${getEffectiveTradeVolume()}`"
      >
        {{ sendingBuy ? '...' : '↑买' }}<span v-if="getButtonCount('quickBuy') > 0" class="btn-count">{{ getButtonCount('quickBuy') }}</span>
      </button>
      <button
        class="quick-order-btn sell-btn"
        @click="handleQuickSell"
        :disabled="!strategy.stockCode || sendingSell"
        :title="`下跌0.5%卖出 金额:${Math.round(getEffectiveTradeVolume() * (effectivePrice || 0))} 数量:${getEffectiveTradeVolume()}`"
      >
        {{ sendingSell ? '...' : '↓卖' }}<span v-if="getButtonCount('quickSell') > 0" class="btn-count">{{ getButtonCount('quickSell') }}</span>
      </button>
      <button
        class="quick-order-btn both-btn"
        @click="handleQuickBoth"
        :disabled="!strategy.stockCode || sendingBoth"
        :title="`上涨0.5%买入及下跌0.5%卖出 金额:${Math.round(getEffectiveTradeVolume() * (effectivePrice || 0))} 数量:${getEffectiveTradeVolume()}`"
      >
        {{ sendingBoth ? '...' : '双向' }}<span v-if="getButtonCount('quickBoth') > 0" class="btn-count">{{ getButtonCount('quickBoth') }}</span>
      </button>
    </td>
    
    <!-- 高级设置：上涨/下跌趋势的买卖百分比 -->
    <td v-if="visibleColumns.includes('advancedOrderSettings')" class="advanced-settings-cell">
      <div class="config-rows">
        <div class="config-row">
          <span class="config-label up">↑</span>
          <input 
            v-model.number="upTrendBuyPct" 
            type="number" 
            class="config-input"
            placeholder="买%"
            min="0"
            step="0.1"
            @change="saveConditionConfig"
          />
          <input 
            v-model.number="upTrendSellPct" 
            type="number" 
            class="config-input"
            placeholder="卖%"
            min="0"
            step="0.1"
            @change="saveConditionConfig"
          />
        </div>
        <div class="config-row">
          <span class="config-label down">↓</span>
          <input 
            v-model.number="downTrendSellPct" 
            type="number" 
            class="config-input"
            placeholder="卖%"
            min="0"
            step="0.1"
            @change="saveConditionConfig"
          />
          <input 
            v-model.number="downTrendBuyPct" 
            type="number" 
            class="config-input"
            placeholder="买%"
            min="0"
            step="0.1"
            @change="saveConditionConfig"
          />
        </div>
      </div>
    </td>
    
    <!-- 高级快捷：2个按钮（使用条件配置的百分比，按金额计算数量） -->
    <td v-if="visibleColumns.includes('advancedOrder')" class="advanced-order-cell">
      <div class="advanced-order-btns">
        <button
          class="advanced-order-btn amount-buy-btn"
          @click="handleAdvancedUpTrendBuy"
          :disabled="!strategy.stockCode || sendingAdvancedUpTrendBuy || !effectivePrice"
          :title="effectivePrice ? `上涨${upTrendBuyPct || 0.1}%买入 + 下跌${upTrendSellPct || 0.5}%卖出\n数量: ${getAdvancedOrderVolume()}股\n金额: ${defaultTradeAmount || 26000}元` : '请先输入价格'"
        >
          {{ sendingAdvancedUpTrendBuy ? '...' : `↑买${getAdvancedOrderVolume()}` }}
        </button>
        <button
          class="advanced-order-btn amount-sell-btn"
          @click="handleAdvancedDownTrendSell"
          :disabled="!strategy.stockCode || sendingAdvancedDownTrendSell || !effectivePrice"
          :title="effectivePrice ? `下跌${downTrendSellPct || 0.1}%卖出 + 上涨${downTrendBuyPct || 0.5}%买入\n数量: ${getAdvancedOrderVolume()}股\n金额: ${defaultTradeAmount || 26000}元` : '请先输入价格'"
        >
          {{ sendingAdvancedDownTrendSell ? '...' : `↓卖${getAdvancedOrderVolume()}` }}
        </button>
      </div>
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import mqttConditionService from '../services/MQTTConditionService.js'
import clickCounterService from '../services/ClickCounterService.js'
import appConfigService from '../services/AppConfigService.js'

// 移动端检测
const isMobile = ref(window.innerWidth <= 768)
window.addEventListener('resize', () => {
  isMobile.value = window.innerWidth <= 768
})

const props = defineProps({
  strategy: {
    type: Object,
    required: true
  },
  visibleColumns: {
    type: Array,
    default: () => []
  },
  useMarginTrade: {
    type: Boolean,
    default: true
  }
})

// 点击计数器
const buttonCounts = ref({})

const loadButtonCounts = () => {
  const counts = {}
  const buttons = ['quickBuy', 'quickSell', 'quickBoth', 'amountBuy', 'amountSell', 'amountBoth', 'volumeBuy', 'volumeSell', 'volumeBoth', 'marketCloseBuy']
  buttons.forEach(btn => {
    counts[btn] = clickCounterService.getCount(props.strategy.id, btn)
  })
  buttonCounts.value = counts
}

const getButtonCount = (buttonType) => {
  return buttonCounts.value[buttonType] || 0
}

const incrementCount = (buttonType) => {
  const newCount = clickCounterService.increment(props.strategy.id, buttonType)
  buttonCounts.value[buttonType] = newCount
}

const emit = defineEmits(['edit', 'delete', 'update-trend', 'batch-condition', 'execute-strategy', 'execute-strategy-by-amount', 'update-strategy-selection', 'update-trade-settings', 'update-condition-config'])

// 手动输入的价格（当 currentPrice 为空时使用）
const manualPrice = ref(null)

// 策略选择
const localStrategyName = ref(props.strategy.selectedStrategyName || 'auto')

// 条件配置（上涨趋势/下跌趋势的买卖百分比）
const upTrendBuyPct = ref(props.strategy.upTrendBuyPct ?? 0.1)
const upTrendSellPct = ref(props.strategy.upTrendSellPct ?? 0.5)
const downTrendSellPct = ref(props.strategy.downTrendSellPct ?? 0.1)
const downTrendBuyPct = ref(props.strategy.downTrendBuyPct ?? 0.5)

// 条件单按钮发送状态（6个按钮）
const sendingConditionAmountBuy = ref(false)
const sendingConditionAmountSell = ref(false)
const sendingConditionAmountBoth = ref(false)
const sendingConditionVolumeBuy = ref(false)
const sendingConditionVolumeSell = ref(false)
const sendingConditionVolumeBoth = ref(false)

// 收市买入按钮状态
const sendingMarketCloseBuy = ref(false)
const hasMarketCloseBuyFlag = ref(false)
const marketCloseBuyTime = ref('')
const isMarketCloseBuyToday = ref(false)

// 收市卖出按钮状态
const sendingMarketCloseSell = ref(false)
const hasMarketCloseSellFlag = ref(false)
const marketCloseSellTime = ref('')
const isMarketCloseSellToday = ref(false)

// 检查是否是今天（东八区）
const isTodayInCST = (isoString) => {
  if (!isoString) return false
  const date = new Date(isoString)
  const now = new Date()
  // 转换为东八区日期字符串比较
  const dateStr = date.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })
  const nowStr = now.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })
  return dateStr === nowStr
}

// 加载收市买入标记（从统一配置，支持多账户）
const loadMarketCloseBuyFlag = () => {
  console.log(`[StrategyRow] loadMarketCloseBuyFlag 被调用, strategy.id=${props.strategy?.id}`)
  if (props.strategy.id) {
    // 获取该股票的所有收市买配置
    const allConfigs = appConfigService.getAllMarketCloseConfigsForStock(props.strategy.stockCode)
    console.log(`[StrategyRow] 从 appConfigService 获取配置:`, allConfigs)
    
    if (allConfigs.length > 0) {
      hasMarketCloseBuyFlag.value = true
      // 获取第一个配置的时间信息（兼容旧数据：只有 createdAt ISO 字符串）
      const firstConfig = allConfigs[0].config
      if (firstConfig.createdAtDisplay) {
        marketCloseBuyTime.value = firstConfig.createdAtDisplay
      } else if (firstConfig.createdAt) {
        // 旧数据兼容：将 ISO 字符串格式化为东八区显示
        const d = new Date(firstConfig.createdAt)
        marketCloseBuyTime.value = d.toLocaleString('zh-CN', {
          timeZone: 'Asia/Shanghai',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      } else {
        marketCloseBuyTime.value = ''
      }
      isMarketCloseBuyToday.value = isTodayInCST(firstConfig.createdAt)
      console.log(`[StrategyRow] 已加载 ${allConfigs.length} 个账户配置, 时间:${marketCloseBuyTime.value}, 今天:${isMarketCloseBuyToday.value}`)
    } else {
      hasMarketCloseBuyFlag.value = false
      marketCloseBuyTime.value = ''
      isMarketCloseBuyToday.value = false
    }
    console.log(`[StrategyRow] hasMarketCloseBuyFlag 设置为: ${hasMarketCloseBuyFlag.value}`)
  } else {
    console.log(`[StrategyRow] strategy.id 为空，无法加载收市买状态`)
  }
}

// 加载收市卖出标记
const loadMarketCloseSellFlag = () => {
  console.log(`[StrategyRow] loadMarketCloseSellFlag 被调用, strategy.id=${props.strategy?.id}`)
  if (props.strategy.id) {
    const allConfigs = appConfigService.getAllMarketCloseSellConfigsForStock(props.strategy.stockCode)
    console.log(`[StrategyRow] 从 appConfigService 获取收市卖配置:`, allConfigs)
    
    if (allConfigs.length > 0) {
      hasMarketCloseSellFlag.value = true
      const firstConfig = allConfigs[0].config
      if (firstConfig.createdAtDisplay) {
        marketCloseSellTime.value = firstConfig.createdAtDisplay
      } else if (firstConfig.createdAt) {
        const d = new Date(firstConfig.createdAt)
        marketCloseSellTime.value = d.toLocaleString('zh-CN', {
          timeZone: 'Asia/Shanghai',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      } else {
        marketCloseSellTime.value = ''
      }
      isMarketCloseSellToday.value = isTodayInCST(firstConfig.createdAt)
      console.log(`[StrategyRow] 已加载 ${allConfigs.length} 个收市卖账户配置, 时间:${marketCloseSellTime.value}, 今天:${isMarketCloseSellToday.value}`)
    } else {
      hasMarketCloseSellFlag.value = false
      marketCloseSellTime.value = ''
      isMarketCloseSellToday.value = false
    }
    console.log(`[StrategyRow] hasMarketCloseSellFlag 设置为: ${hasMarketCloseSellFlag.value}`)
  } else {
    console.log(`[StrategyRow] strategy.id 为空，无法加载收市卖状态`)
  }
}

// 监听 props.strategy.id 变化，确保数据加载
watch(() => props.strategy?.id, (newId, oldId) => {
  console.log(`[StrategyRow] strategy.id 变化: ${oldId} -> ${newId}`)
  loadMarketCloseBuyFlag()
  loadButtonCounts()
  loadConditionConfigFromStorage()
}, { immediate: true })

// 监听配置更新事件，重新加载收市买状态
window.addEventListener('appConfigUpdated', () => {
  loadMarketCloseBuyFlag()
})

// 条件单涨跌幅（缺省0.1%）
const conditionPct = ref(0.1)

// 保存条件单涨跌幅到 localStorage
const saveConditionPct = () => {
  if (props.strategy.id) {
    const key = `conditionPct_${props.strategy.id}`
    localStorage.setItem(key, conditionPct.value.toString())
  }
}

// 加载条件单涨跌幅
const loadConditionPct = () => {
  if (props.strategy.id) {
    const key = `conditionPct_${props.strategy.id}`
    const saved = localStorage.getItem(key)
    if (saved) {
      conditionPct.value = parseFloat(saved) || 0.1
    }
  }
}

// 初始化加载条件单涨跌幅
loadConditionPct()

// 可用的策略模板（从 localStorage 加载）
const availableStrategyTemplates = ref([])

// 加载策略模板
const loadStrategyTemplates = () => {
  try {
    const saved = localStorage.getItem('orderStrategyTemplates')
    if (saved) {
      availableStrategyTemplates.value = JSON.parse(saved)
    }
  } catch (e) {
    console.error('加载策略模板失败:', e)
  }
}

// 组件挂载时加载模板
loadStrategyTemplates()

// 根据趋势获取自动策略名称
const getAutoStrategyName = () => {
  const trend = props.strategy.trendJudgment || 'unset'
  const matched = availableStrategyTemplates.value.filter(t =>
    Array.isArray(t.trendMatches) && t.trendMatches.includes(trend)
  )
  if (matched.length > 0) {
    return matched.map(m => m.name).join(', ')
  }
  return '无匹配'
}

// 更新策略选择
const updateStrategySelection = () => {
  emit('update-strategy-selection', props.strategy, localStrategyName.value)
}

// 获取有效价格：优先使用策略中的 currentPrice，其次使用手动输入
const effectivePrice = computed(() => {
  return props.strategy.currentPrice || manualPrice.value || null
})

// 交易总额 = 量 × 价
const totalTradeAmount = computed(() => {
  const vol = defaultTradeVolume.value ?? getQuarterPosition()
  const price = effectivePrice.value
  if (!vol || !price || price <= 0) return 0
  return vol * price
})

// 格式化金额显示
const formatAmount = (amount) => {
  if (amount >= 10000) {
    return (amount / 10000).toFixed(2) + '万'
  }
  return amount.toFixed(0)
}

const localTrend = ref(props.strategy.trendJudgment || 'unset')

// 快速下单发送状态
const sendingBuy = ref(false)
const sendingSell = ref(false)
const sendingBoth = ref(false)
const showTrendTip = ref(false)

// 高级快捷下单设置
const defaultTradeAmount = ref(26000)  // 缺省下单金额
const defaultTradeVolume = ref(null)   // 缺省下单数量（null表示使用1/4持仓）

// 从策略数据初始化高级设置
if (props.strategy.increaseAmount) {
  defaultTradeVolume.value = parseInt(props.strategy.increaseAmount) || null
}
const sendingAdvancedUpTrendBuy = ref(false)   // 高级快捷上涨买入状态
const sendingAdvancedDownTrendSell = ref(false) // 高级快捷下跌卖出状态

// 根据金额和价格计算数量（向下取整到100的倍数）
const calculateVolumeFromAmount = (amount, price) => {
  if (!price || price <= 0) return null
  const volume = Math.floor(amount / price / 100) * 100
  return volume > 0 ? volume : 100
}

// 计算持仓的1/4，向下取整到100的倍数，最低100股
const getQuarterPosition = () => {
  const netPosition = props.strategy.netPosition || 0
  const quarter = Math.floor(netPosition / 4)
  return Math.max(100, Math.floor(quarter / 100) * 100)
}

// 计算持仓的1/2，向下取整到100的倍数，最低100股
const getHalfPosition = () => {
  const netPosition = props.strategy.netPosition || 0
  const half = Math.floor(netPosition / 2)
  return Math.max(100, Math.floor(half / 100) * 100)
}

// 计算持仓的1/8，向下取整到100的倍数，最低100股
const getEighthPosition = () => {
  const netPosition = props.strategy.netPosition || 0
  const eighth = Math.floor(netPosition / 8)
  return Math.max(100, Math.floor(eighth / 100) * 100)
}

// 计算持仓的全额，向下取整到100的倍数，最低100股
const getFullPosition = () => {
  const netPosition = props.strategy.netPosition || 0
  return Math.max(100, Math.floor(netPosition / 100) * 100)
}

// 快速设置缺省数量为1/8持仓
const setDefaultVolumeEighth = () => {
  defaultTradeVolume.value = getEighthPosition()
}

// 快速设置缺省数量为1/4持仓
const setDefaultVolumeQuarter = () => {
  defaultTradeVolume.value = getQuarterPosition()
}

// 快速设置缺省数量为1/2持仓
const setDefaultVolumeHalf = () => {
  defaultTradeVolume.value = getHalfPosition()
}

// 快速设置缺省数量为全额持仓
const setDefaultVolumeFull = () => {
  defaultTradeVolume.value = getFullPosition()
}

// 获取当前有效的下单数量
const getEffectiveTradeVolume = () => {
  return defaultTradeVolume.value ?? getQuarterPosition()
}

// 获取高级快捷按钮显示的数量（优先使用金额计算，否则使用数量）
const getAdvancedOrderVolume = () => {
  if (effectivePrice.value) {
    const tradeAmount = defaultTradeAmount.value || 26000
    return calculateVolumeFromAmount(tradeAmount, effectivePrice.value)
  }
  return getEffectiveTradeVolume()
}

// 保存高级设置到策略数据
const saveTradeSettings = () => {
  emit('update-trade-settings', props.strategy, {
    increaseAmount: String(defaultTradeVolume.value ?? getQuarterPosition()),
    decreaseAmount: String(defaultTradeVolume.value ?? getQuarterPosition())
  })
}

// 保存条件配置到策略数据
const saveConditionConfig = () => {
  emit('update-condition-config', props.strategy, {
    upTrendBuyPct: upTrendBuyPct.value,
    upTrendSellPct: upTrendSellPct.value,
    downTrendSellPct: downTrendSellPct.value,
    downTrendBuyPct: downTrendBuyPct.value
  })
}

// 默认配置值
const DEFAULT_TRADE_AMOUNT = 26000
const DEFAULT_TRADE_VOLUME = null
const DEFAULT_MANUAL_PRICE = null
const DEFAULT_CONDITION_PCT = 0.1

// 检查是否有自定义配置
const hasCustomConfig = ref(false)

// 更新自定义配置状态
const updateCustomConfigStatus = () => {
  const isCustom = 
    defaultTradeAmount.value !== DEFAULT_TRADE_AMOUNT ||
    defaultTradeVolume.value !== DEFAULT_TRADE_VOLUME ||
    manualPrice.value !== DEFAULT_MANUAL_PRICE ||
    conditionPct.value !== DEFAULT_CONDITION_PCT
  hasCustomConfig.value = isCustom
}

// 自动保存条件配置到 localStorage（修改时自动保存，使用稳定的 stockCode 作为 key）
const autoSaveConditionConfig = () => {
  if (props.strategy.stockCode) {
    const key = `conditionConfig_${props.strategy.stockCode}`
    const config = {
      defaultTradeAmount: defaultTradeAmount.value,
      defaultTradeVolume: defaultTradeVolume.value,
      manualPrice: manualPrice.value,
      conditionPct: conditionPct.value
    }
    localStorage.setItem(key, JSON.stringify(config))
    updateCustomConfigStatus()
    console.log(`[StrategyRow] 条件配置已自动保存: ${props.strategy.name}`, config)
  }
}

// 从 localStorage 加载条件配置（使用稳定的 stockCode 作为 key）
const loadConditionConfigFromStorage = () => {
  if (props.strategy.stockCode) {
    const key = `conditionConfig_${props.strategy.stockCode}`
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        const config = JSON.parse(saved)
        defaultTradeAmount.value = config.defaultTradeAmount ?? DEFAULT_TRADE_AMOUNT
        defaultTradeVolume.value = config.defaultTradeVolume ?? DEFAULT_TRADE_VOLUME
        manualPrice.value = config.manualPrice ?? DEFAULT_MANUAL_PRICE
        conditionPct.value = config.conditionPct ?? DEFAULT_CONDITION_PCT
        console.log(`[StrategyRow] 条件配置已加载: ${props.strategy.name}`, config)
      } catch (e) {
        console.error('加载条件配置失败:', e)
      }
    }
    updateCustomConfigStatus()
  }
}

// 重置条件配置为默认值
const resetConditionConfig = () => {
  if (confirm('确定要重置条件配置为默认值吗？')) {
    defaultTradeAmount.value = DEFAULT_TRADE_AMOUNT
    defaultTradeVolume.value = DEFAULT_TRADE_VOLUME
    manualPrice.value = DEFAULT_MANUAL_PRICE
    conditionPct.value = DEFAULT_CONDITION_PCT
    
    // 清除 localStorage 中保存的配置
    if (props.strategy.stockCode) {
      const key = `conditionConfig_${props.strategy.stockCode}`
      localStorage.removeItem(key)
    }
    
    hasCustomConfig.value = false
    console.log(`[StrategyRow] 条件配置已重置: ${props.strategy.name}`)
  }
}

// 组件挂载时加载保存的条件配置
loadConditionConfigFromStorage()

// 监听配置变化，自动保存
watch([defaultTradeAmount, defaultTradeVolume, manualPrice, conditionPct], () => {
  autoSaveConditionConfig()
}, { deep: true })

// 条件配置：上涨买入（上涨X%买入 + 下跌Y%卖出）
const handleUpTrendBuy = async () => {
  if (!props.strategy.stockCode) {
    alert('股票代码不存在')
    return
  }
  sendingUpTrendBuy.value = true
  const tradeVolume = getEffectiveTradeVolume()
  const buyPct = upTrendBuyPct.value || 0.1
  const sellPct = upTrendSellPct.value || 0.5

  try {
    // 发送上涨买入条件单
    await mqttConditionService.sendBuyOrder({
      stockCode: props.strategy.stockCode,
      stockName: props.strategy.name,
      tradeVolume,
      percentage: buyPct,
      provider: props.strategy.provider === 'pingan' ? 'pingan' : '',
      accountType: getAccountType(),
      side: getBuySide()
    })
    // 发送下跌卖出条件单
    await mqttConditionService.sendSellOrder({
      stockCode: props.strategy.stockCode,
      stockName: props.strategy.name,
      tradeVolume,
      percentage: sellPct,
      provider: props.strategy.provider === 'pingan' ? 'pingan' : '',
      accountType: getAccountType(),
      side: getSellSide()
    })
    console.log(`[条件配置] 上涨买入已发送: ${props.strategy.stockCode}, 上涨${buyPct}%买入 + 下跌${sellPct}%卖出, 数量: ${tradeVolume}`)
  } catch (error) {
    console.error('[条件配置] 上涨买入失败:', error)
    alert('发送失败，请检查MQTT连接')
  } finally {
    sendingUpTrendBuy.value = false
  }
}

// 条件配置：下跌卖出（下跌X%卖出 + 上涨Y%买入）
const handleDownTrendSell = async () => {
  if (!props.strategy.stockCode) {
    alert('股票代码不存在')
    return
  }
  sendingDownTrendSell.value = true
  const tradeVolume = getEffectiveTradeVolume()
  const sellPct = downTrendSellPct.value || 0.1
  const buyPct = downTrendBuyPct.value || 0.5

  try {
    // 发送下跌卖出条件单
    await mqttConditionService.sendSellOrder({
      stockCode: props.strategy.stockCode,
      stockName: props.strategy.name,
      tradeVolume,
      percentage: sellPct,
      provider: props.strategy.provider === 'pingan' ? 'pingan' : '',
      accountType: getAccountType(),
      side: getSellSide()
    })
    // 发送上涨买入条件单
    await mqttConditionService.sendBuyOrder({
      stockCode: props.strategy.stockCode,
      stockName: props.strategy.name,
      tradeVolume,
      percentage: buyPct,
      provider: props.strategy.provider === 'pingan' ? 'pingan' : '',
      accountType: getAccountType(),
      side: getBuySide()
    })
    console.log(`[条件配置] 下跌卖出已发送: ${props.strategy.stockCode}, 下跌${sellPct}%卖出 + 上涨${buyPct}%买入, 数量: ${tradeVolume}`)
  } catch (error) {
    console.error('[条件配置] 下跌卖出失败:', error)
    alert('发送失败，请检查MQTT连接')
  } finally {
    sendingDownTrendSell.value = false
  }
}

// ========== 条件单：6个按钮的处理函数 ==========

// 基于金额：上涨1%买入
const handleConditionAmountBuy = async () => {
  if (!props.strategy.stockCode || !effectivePrice.value) {
    alert('股票代码或价格不存在')
    return
  }
  incrementCount('amountBuy')
  sendingConditionAmountBuy.value = true
  const tradeAmount = defaultTradeAmount.value || 26000
  const tradeVolume = calculateVolumeFromAmount(tradeAmount, effectivePrice.value)
  const pct = conditionPct.value || 0.1

  try {
    await mqttConditionService.sendBuyOrder({
      stockCode: props.strategy.stockCode,
      stockName: props.strategy.name,
      tradeVolume,
      percentage: pct,
      provider: props.strategy.provider === 'pingan' ? 'pingan' : '',
      accountType: getAccountType(),
      side: getBuySide()
    })
    console.log(`[条件单] 额↑买已发送: ${props.strategy.stockCode}, 上涨${pct}%买入, 金额:${tradeAmount}, 数量:${tradeVolume}`)
  } catch (error) {
    console.error('[条件单] 额↑买失败:', error)
    alert('发送失败，请检查MQTT连接')
  } finally {
    sendingConditionAmountBuy.value = false
  }
}

// 基于金额：下跌X%卖出
const handleConditionAmountSell = async () => {
  if (!props.strategy.stockCode || !effectivePrice.value) {
    alert('股票代码或价格不存在')
    return
  }
  incrementCount('amountSell')
  sendingConditionAmountSell.value = true
  const tradeAmount = defaultTradeAmount.value || 26000
  const tradeVolume = calculateVolumeFromAmount(tradeAmount, effectivePrice.value)
  const pct = conditionPct.value || 0.1

  try {
    await mqttConditionService.sendSellOrder({
      stockCode: props.strategy.stockCode,
      stockName: props.strategy.name,
      tradeVolume,
      percentage: pct,
      provider: props.strategy.provider === 'pingan' ? 'pingan' : '',
      accountType: getAccountType(),
      side: getSellSide()
    })
    console.log(`[条件单] 额↓卖已发送: ${props.strategy.stockCode}, 下跌${pct}%卖出, 金额:${tradeAmount}, 数量:${tradeVolume}`)
  } catch (error) {
    console.error('[条件单] 额↓卖失败:', error)
    alert('发送失败，请检查MQTT连接')
  } finally {
    sendingConditionAmountSell.value = false
  }
}

// 基于金额：双向（上涨X%买入 + 下跌X%卖出）
const handleConditionAmountBoth = async () => {
  if (!props.strategy.stockCode || !effectivePrice.value) {
    alert('股票代码或价格不存在')
    return
  }
  incrementCount('amountBoth')
  sendingConditionAmountBoth.value = true
  const tradeAmount = defaultTradeAmount.value || 26000
  const tradeVolume = calculateVolumeFromAmount(tradeAmount, effectivePrice.value)
  const pct = conditionPct.value || 0.1

  try {
    await mqttConditionService.sendBuyOrder({
      stockCode: props.strategy.stockCode,
      stockName: props.strategy.name,
      tradeVolume,
      percentage: pct,
      provider: props.strategy.provider === 'pingan' ? 'pingan' : '',
      accountType: getAccountType(),
      side: getBuySide()
    })
    await mqttConditionService.sendSellOrder({
      stockCode: props.strategy.stockCode,
      stockName: props.strategy.name,
      tradeVolume,
      percentage: pct,
      provider: props.strategy.provider === 'pingan' ? 'pingan' : '',
      accountType: getAccountType(),
      side: getSellSide()
    })
    console.log(`[条件单] 额双向已发送: ${props.strategy.stockCode}, 上涨${pct}%买入+下跌${pct}%卖出, 金额:${tradeAmount}, 数量:${tradeVolume}`)
  } catch (error) {
    console.error('[条件单] 额双向失败:', error)
    alert('发送失败，请检查MQTT连接')
  } finally {
    sendingConditionAmountBoth.value = false
  }
}

// 基于数量：上涨1%买入
const handleConditionVolumeBuy = async () => {
  if (!props.strategy.stockCode) {
    alert('股票代码不存在')
    return
  }
  incrementCount('volumeBuy')
  sendingConditionVolumeBuy.value = true
  const tradeVolume = getEffectiveTradeVolume()
  const pct = conditionPct.value || 0.1

  try {
    await mqttConditionService.sendBuyOrder({
      stockCode: props.strategy.stockCode,
      stockName: props.strategy.name,
      tradeVolume,
      percentage: pct,
      provider: props.strategy.provider === 'pingan' ? 'pingan' : '',
      accountType: getAccountType(),
      side: getBuySide()
    })
    console.log(`[条件单] 量↑买已发送: ${props.strategy.stockCode}, 上涨${pct}%买入, 数量:${tradeVolume}`)
  } catch (error) {
    console.error('[条件单] 量↑买失败:', error)
    alert('发送失败，请检查MQTT连接')
  } finally {
    sendingConditionVolumeBuy.value = false
  }
}

// 基于数量：下跌X%卖出
const handleConditionVolumeSell = async () => {
  if (!props.strategy.stockCode) {
    alert('股票代码不存在')
    return
  }
  incrementCount('volumeSell')
  sendingConditionVolumeSell.value = true
  const tradeVolume = getEffectiveTradeVolume()
  const pct = conditionPct.value || 0.1

  try {
    await mqttConditionService.sendSellOrder({
      stockCode: props.strategy.stockCode,
      stockName: props.strategy.name,
      tradeVolume,
      percentage: pct,
      provider: props.strategy.provider === 'pingan' ? 'pingan' : '',
      accountType: getAccountType(),
      side: getSellSide()
    })
    console.log(`[条件单] 量↓卖已发送: ${props.strategy.stockCode}, 下跌${pct}%卖出, 数量:${tradeVolume}`)
  } catch (error) {
    console.error('[条件单] 量↓卖失败:', error)
    alert('发送失败，请检查MQTT连接')
  } finally {
    sendingConditionVolumeSell.value = false
  }
}

// 基于数量：双向（上涨X%买入 + 下跌X%卖出）
const handleConditionVolumeBoth = async () => {
  if (!props.strategy.stockCode) {
    alert('股票代码不存在')
    return
  }
  incrementCount('volumeBoth')
  sendingConditionVolumeBoth.value = true
  const tradeVolume = getEffectiveTradeVolume()
  const pct = conditionPct.value || 0.1

  try {
    await mqttConditionService.sendBuyOrder({
      stockCode: props.strategy.stockCode,
      stockName: props.strategy.name,
      tradeVolume,
      percentage: pct,
      provider: props.strategy.provider === 'pingan' ? 'pingan' : '',
      accountType: getAccountType(),
      side: getBuySide()
    })
    await mqttConditionService.sendSellOrder({
      stockCode: props.strategy.stockCode,
      stockName: props.strategy.name,
      tradeVolume,
      percentage: pct,
      provider: props.strategy.provider === 'pingan' ? 'pingan' : '',
      accountType: getAccountType(),
      side: getSellSide()
    })
    console.log(`[条件单] 量双向已发送: ${props.strategy.stockCode}, 上涨1%买入+下跌1%卖出, 数量:${tradeVolume}`)
  } catch (error) {
    console.error('[条件单] 量双向失败:', error)
    alert('发送失败，请检查MQTT连接')
  } finally {
    sendingConditionVolumeBoth.value = false
  }
}

// 收市买入：切换标记状态，并设置定时任务
const handleMarketCloseBuy = async () => {
  if (!props.strategy.stockCode) {
    alert('股票代码不存在')
    return
  }

  // 如果已经有标记，则取消
  if (hasMarketCloseBuyFlag.value) {
    appConfigService.clearAllMarketCloseConfigsForStock(props.strategy.stockCode)
    hasMarketCloseBuyFlag.value = false
    marketCloseBuyTime.value = ''
    isMarketCloseBuyToday.value = false
    console.log(`[收市买入] 已取消: ${props.strategy.stockCode}`)
    return
  }

  incrementCount('marketCloseBuy')
  sendingMarketCloseBuy.value = true

  try {
    // 计算交易数量（使用默认数量或1/4持仓）
    const tradeVolume = getEffectiveTradeVolume()

    // 保存收市买入配置（使用当前策略的账户信息）
    const config = {
      stockCode: props.strategy.stockCode,
      stockName: props.strategy.name,
      tradeVolume: tradeVolume,
      percentage: 0.1,  // 上涨0.1%
      provider: props.strategy.provider === 'pingan' ? 'pingan' : '',
      accountType: getAccountType(),
      side: getBuySide(),
      createdAt: new Date().toISOString()
    }

    // 使用稳定的 key 保存配置
    appConfigService.setMarketCloseBuyForStrategy(
      props.strategy.id,
      config,
      props.strategy.stockCode,
      config.accountType,
      config.provider
    )

    hasMarketCloseBuyFlag.value = true
    // 立即更新时间显示
    const cstNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }))
    marketCloseBuyTime.value = cstNow.toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
    isMarketCloseBuyToday.value = true
    console.log(`[收市买入] 已设置: ${props.strategy.stockCode}, 账户:${config.accountType}, 券商:${config.provider || '同花顺'}, 数量:${tradeVolume}`)

    // 检查当前时间是否接近2:45，如果是则立即执行
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()

    // 如果在2:45-2:50之间，立即执行
    if (hours === 14 && minutes >= 45 && minutes <= 50) {
      await executeMarketCloseBuy(config)
    }
  } catch (error) {
    console.error('[收市买入] 设置失败:', error)
    alert('设置失败')
  } finally {
    sendingMarketCloseBuy.value = false
  }
}

// 执行收市买入条件单
const executeMarketCloseBuy = async (config) => {
  try {
    await mqttConditionService.sendBuyOrder({
      stockCode: config.stockCode,
      stockName: config.stockName,
      tradeVolume: config.tradeVolume,
      percentage: config.percentage,
      provider: config.provider,
      accountType: config.accountType,
      side: config.side
    })
    console.log(`[收市买入] 条件单已发送: ${config.stockCode}, 上涨0.1%买入, 账户:${config.accountType}, 数量:${config.tradeVolume}`)
  } catch (error) {
    console.error('[收市买入] 发送失败:', error)
  }
}

// 收市卖出：切换标记状态
const handleMarketCloseSell = async () => {
  if (!props.strategy.stockCode) {
    alert('股票代码不存在')
    return
  }

  // 如果已经有标记，则取消
  if (hasMarketCloseSellFlag.value) {
    appConfigService.clearAllMarketCloseSellConfigsForStock(props.strategy.stockCode)
    hasMarketCloseSellFlag.value = false
    marketCloseSellTime.value = ''
    isMarketCloseSellToday.value = false
    console.log(`[收市卖出] 已取消: ${props.strategy.stockCode}`)
    return
  }

  incrementCount('marketCloseSell')
  sendingMarketCloseSell.value = true

  try {
    // 计算交易数量（使用默认数量或1/4持仓）
    const tradeVolume = getEffectiveTradeVolume()

    // 保存收市卖出配置
    const config = {
      stockCode: props.strategy.stockCode,
      stockName: props.strategy.name,
      tradeVolume: tradeVolume,
      percentage: 0.1,  // 下跌0.1%
      provider: props.strategy.provider === 'pingan' ? 'pingan' : '',
      accountType: getAccountType(),
      side: getSellSide(),
      createdAt: new Date().toISOString()
    }

    // 使用稳定的 key 保存配置
    appConfigService.setMarketCloseSellForStrategy(
      props.strategy.id,
      config,
      props.strategy.stockCode,
      config.accountType,
      config.provider
    )

    hasMarketCloseSellFlag.value = true
    // 立即更新时间显示
    const cstNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }))
    marketCloseSellTime.value = cstNow.toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
    isMarketCloseSellToday.value = true
    console.log(`[收市卖出] 已设置: ${props.strategy.stockCode}, 账户:${config.accountType}, 券商:${config.provider || '同花顺'}, 数量:${tradeVolume}`)

    // 检查当前时间是否接近2:45，如果是则立即执行
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()

    // 如果在2:45-2:50之间，立即执行
    if (hours === 14 && minutes >= 45 && minutes <= 50) {
      await executeMarketCloseSell(config)
    }
  } catch (error) {
    console.error('[收市卖出] 设置失败:', error)
    alert('设置失败')
  } finally {
    sendingMarketCloseSell.value = false
  }
}

// 执行收市卖出条件单
const executeMarketCloseSell = async (config) => {
  try {
    await mqttConditionService.sendSellOrder({
      stockCode: config.stockCode,
      stockName: config.stockName,
      tradeVolume: config.tradeVolume,
      percentage: config.percentage,
      provider: config.provider,
      accountType: config.accountType,
      side: config.side
    })
    console.log(`[收市卖出] 条件单已发送: ${config.stockCode}, 下跌0.1%卖出, 账户:${config.accountType}, 数量:${config.tradeVolume}`)
  } catch (error) {
    console.error('[收市卖出] 发送失败:', error)
  }
}

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
  if (props.strategy.provider === 'pingan' || props.strategy.provider === 'founder') {
    return 'default'
  }
  return props.strategy.accountType === 'credit' ? 'credit' : 'default'
}

// 获取券商 provider
const getProvider = () => {
  // 只返回已知的券商代码，其他返回空字符串
  if (props.strategy.provider === 'pingan' || props.strategy.provider === 'founder') {
    return props.strategy.provider
  }
  return ''
}

// 判断是否为手动设置的策略
// 只有当用户在策略编辑器中明确修改过策略时才标记为手动
const isManualStrategy = (strategy) => {
  return !!strategy.isManuallyEdited
}

// 执行策略脚本（按量）
const executeStrategyScript = () => {
  emit('execute-strategy', props.strategy)
}

// 执行策略脚本（按额）
const executeStrategyByAmount = () => {
  emit('execute-strategy-by-amount', props.strategy)
}

// 获取策略类型标签
const getStrategyTypeLabel = (strategy) => {
  // 如果是手动设置，显示"手动策略"
  if (isManualStrategy(strategy)) {
    return '手动策略'
  }

  // 如果是缺省策略，显示缺省策略名称
  if (strategy.isDefaultStrategy && strategy.defaultStrategyName) {
    return strategy.defaultStrategyName
  }

  // 否则根据趋势自动生成策略名称
  const trend = strategy.trendJudgment || 'unset'
  const trendMap = {
    'unset': '默认策略',
    'trend_unknown': '默认策略',
    'trend_up': '趋势跟随',
    'trend_down': '趋势跟随',
    'trend_breakdown': '破位止损',
    'trend_oscillation': '网格策略',
    'trend_pullback': '回踩买入',
    'high_volatility': '高波策略',
    'medium_volatility': '中波策略',
    'low_volatility': '低波策略'
  }
  return trendMap[trend] || '默认策略'
}

// 获取策略类型样式类
const getStrategyTypeClass = (strategy) => {
  if (isManualStrategy(strategy)) {
    return 'manual'
  }

  const trend = strategy.trendJudgment || 'unset'
  const classMap = {
    'unset': 'default',
    'trend_unknown': 'default',
    'trend_up': 'trend-up',
    'trend_down': 'trend-down',
    'trend_breakdown': 'breakdown',
    'trend_oscillation': 'oscillation',
    'trend_pullback': 'pullback',
    'high_volatility': 'high-vol',
    'medium_volatility': 'medium-vol',
    'low_volatility': 'low-vol'
  }
  return classMap[trend] || 'default'
}

// 计算下单数量：持仓的1/4，向下取整到100的倍数
const calculateTradeVolume = (netPosition) => {
  if (!netPosition || netPosition < 100) return 100
  const quarter = Math.floor(netPosition / 4)
  return Math.floor(quarter / 100) * 100  // 向下取整到100的倍数
}

// 获取下单 side 参数（不使用融资时传入）
const getBuySide = () => {
  const side = props.useMarginTrade ? undefined : 'COLLABUY'
  console.log(`[调试] getBuySide: useMarginTrade=${props.useMarginTrade}, side=${side}`)
  return side
}

const getSellSide = () => {
  const side = props.useMarginTrade ? undefined : 'COLLASELL'
  console.log(`[调试] getSellSide: useMarginTrade=${props.useMarginTrade}, side=${side}`)
  return side
}

// 上涨买入
const handleQuickBuy = async () => {
  if (!props.strategy.stockCode) return
  incrementCount('quickBuy')
  sendingBuy.value = true
  const tradeVolume = getEffectiveTradeVolume()
  
  try {
    await mqttConditionService.sendBuyOrder({
      stockCode: props.strategy.stockCode,
      stockName: props.strategy.name,
      tradeVolume,
      percentage: 0.5,
      provider: props.strategy.provider === 'pingan' ? 'pingan' : '',
      accountType: getAccountType(),
      side: getBuySide()
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
  incrementCount('quickSell')
  sendingSell.value = true
  const tradeVolume = getEffectiveTradeVolume()
  
  try {
    await mqttConditionService.sendSellOrder({
      stockCode: props.strategy.stockCode,
      stockName: props.strategy.name,
      tradeVolume,
      percentage: 0.5,
      provider: props.strategy.provider === 'pingan' ? 'pingan' : '',
      accountType: getAccountType(),
      side: getSellSide()
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
  incrementCount('quickBoth')
  sendingBoth.value = true
  const tradeVolume = getEffectiveTradeVolume()
  
  try {
    await mqttConditionService.sendBothOrders({
      stockCode: props.strategy.stockCode,
      stockName: props.strategy.name,
      tradeVolume,
      percentage: 0.5,
      provider: props.strategy.provider === 'pingan' ? 'pingan' : '',
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

// 高级快捷上涨买入：发送上涨买入 + 下跌止盈止损（使用高级设置的百分比）
const handleAdvancedUpTrendBuy = async () => {
  if (!props.strategy.stockCode || !effectivePrice.value) {
    if (!effectivePrice.value) alert('请先在设置中输入价格')
    return
  }
  sendingAdvancedUpTrendBuy.value = true
  const tradeAmount = defaultTradeAmount.value || 26000
  const tradeVolume = calculateVolumeFromAmount(tradeAmount, effectivePrice.value)
  const buyPct = upTrendBuyPct.value || 0.5  // 使用条件配置的上涨买入百分比
  const sellPct = upTrendSellPct.value || 0.5  // 使用条件配置的下跌卖出百分比

  try {
    // 发送上涨买入条件单
    await mqttConditionService.sendBuyOrder({
      stockCode: props.strategy.stockCode,
      stockName: props.strategy.name,
      tradeVolume,
      percentage: buyPct,
      provider: props.strategy.provider === 'pingan' ? 'pingan' : '',
      accountType: getAccountType(),
      side: getBuySide()
    })
    // 发送下跌卖出条件单（止盈止损）
    await mqttConditionService.sendSellOrder({
      stockCode: props.strategy.stockCode,
      stockName: props.strategy.name,
      tradeVolume,
      percentage: sellPct,
      provider: props.strategy.provider === 'pingan' ? 'pingan' : '',
      accountType: getAccountType(),
      side: getSellSide()
    })
    console.log(`[高级快捷] 上涨买入已发送: ${props.strategy.stockCode}, 上涨${buyPct}%买入 + 下跌${sellPct}%卖出, 金额: ${tradeAmount}, 数量: ${tradeVolume}`)
  } catch (error) {
    console.error('[高级快捷] 上涨买入失败:', error)
    alert('发送失败，请检查MQTT连接')
  } finally {
    sendingAdvancedUpTrendBuy.value = false
  }
}

// 高级快捷下跌卖出：发送下跌卖出 + 上涨抄底（使用高级设置的百分比）
const handleAdvancedDownTrendSell = async () => {
  if (!props.strategy.stockCode || !effectivePrice.value) {
    if (!effectivePrice.value) alert('请先在设置中输入价格')
    return
  }
  sendingAdvancedDownTrendSell.value = true
  const tradeAmount = defaultTradeAmount.value || 26000
  const tradeVolume = calculateVolumeFromAmount(tradeAmount, effectivePrice.value)
  const sellPct = downTrendSellPct.value || 0.5  // 使用条件配置的下跌卖出百分比
  const buyPct = downTrendBuyPct.value || 0.5  // 使用条件配置的上涨买入百分比

  try {
    // 发送下跌卖出条件单
    await mqttConditionService.sendSellOrder({
      stockCode: props.strategy.stockCode,
      stockName: props.strategy.name,
      tradeVolume,
      percentage: sellPct,
      provider: props.strategy.provider === 'pingan' ? 'pingan' : '',
      accountType: getAccountType(),
      side: getSellSide()
    })
    // 发送上涨买入条件单（抄底）
    await mqttConditionService.sendBuyOrder({
      stockCode: props.strategy.stockCode,
      stockName: props.strategy.name,
      tradeVolume,
      percentage: buyPct,
      provider: props.strategy.provider === 'pingan' ? 'pingan' : '',
      accountType: getAccountType(),
      side: getBuySide()
    })
    console.log(`[高级快捷] 下跌卖出已发送: ${props.strategy.stockCode}, 下跌${sellPct}%卖出 + 上涨${buyPct}%买入, 金额: ${tradeAmount}, 数量: ${tradeVolume}`)
  } catch (error) {
    console.error('[高级快捷] 下跌卖出失败:', error)
    alert('发送失败，请检查MQTT连接')
  } finally {
    sendingAdvancedDownTrendSell.value = false
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

// 监听收市买入执行事件
const handleMarketCloseBuyExecuted = (event) => {
  if (event.detail && event.detail.strategyId === props.strategy.id) {
    // 重新加载标记状态
    loadMarketCloseBuyFlag()
  }
}

// 处理收市买清理事件
const handleMarketCloseBuyCleaned = () => {
  loadMarketCloseBuyFlag()
}

// 处理收市卖执行事件
const handleMarketCloseSellExecuted = (event) => {
  if (event.detail && event.detail.strategyId === props.strategy.id) {
    loadMarketCloseSellFlag()
  }
}

// 处理收市卖清理事件
const handleMarketCloseSellCleaned = () => {
  loadMarketCloseSellFlag()
}

onMounted(() => {
  window.addEventListener('marketCloseBuyExecuted', handleMarketCloseBuyExecuted)
  window.addEventListener('marketCloseBuyCleaned', handleMarketCloseBuyCleaned)
  window.addEventListener('marketCloseSellExecuted', handleMarketCloseSellExecuted)
  window.addEventListener('marketCloseSellCleaned', handleMarketCloseSellCleaned)
  // 确保收市买/卖状态已加载（防止 props 在 script setup 时未准备好）
  loadMarketCloseBuyFlag()
  loadMarketCloseSellFlag()
  console.log(`[StrategyRow] onMounted: 收市买状态 = ${hasMarketCloseBuyFlag.value}, 收市卖状态 = ${hasMarketCloseSellFlag.value}, strategy.id = ${props.strategy?.id}`)
})

onUnmounted(() => {
  window.removeEventListener('marketCloseBuyExecuted', handleMarketCloseBuyExecuted)
  window.removeEventListener('marketCloseBuyCleaned', handleMarketCloseBuyCleaned)
  window.removeEventListener('marketCloseSellExecuted', handleMarketCloseSellExecuted)
  window.removeEventListener('marketCloseSellCleaned', handleMarketCloseSellCleaned)
})

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

// 根据下跌百分比返回颜色类，跌幅越大越红
const getDecreaseColorClass = (value) => {
  if (!value) return ''
  const num = parseFloat(value)
  if (num >= 20) return 'decrease-severe'      // 跌幅≥20%：深红
  if (num >= 10) return 'decrease-heavy'       // 跌幅≥10%：红
  if (num >= 5) return 'decrease-moderate'     // 跌幅≥5%：浅红
  return 'decrease-light'                      // 跌幅<5%：白色
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
  width: 160px;
  min-width: 160px;
  max-width: 160px;
  padding: 8px 4px !important;
}

.name-cell-inner {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 152px;
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

/* 下跌百分比颜色：跌幅越大越红 */
.decrease-light {
  color: white;
}

.decrease-moderate {
  color: #ff9999;
}

.decrease-heavy {
  color: #ff6666;
}

.decrease-severe {
  color: #ff3333;
}

.trend-select {
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  cursor: pointer;
  width: auto;
  min-width: 80px;
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

.quick-info {
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 2px;
}

.quick-amount {
  font-size: 11px;
  color: #888;
}

.quick-pct {
  font-size: 10px;
  color: #6a6;
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
  background-color: rgba(220, 53, 69, 0.3);
  color: #dc3545;
  border: 1px solid rgba(220, 53, 69, 0.5);
}

.quick-order-btn.buy-btn:hover:not(:disabled) {
  background-color: rgba(220, 53, 69, 0.5);
  color: white;
}

.quick-order-btn.sell-btn {
  background-color: rgba(40, 167, 69, 0.3);
  color: #28a745;
  border: 1px solid rgba(40, 167, 69, 0.5);
}

.quick-order-btn.sell-btn:hover:not(:disabled) {
  background-color: rgba(40, 167, 69, 0.5);
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

/* 高级快捷下单设置 */
.advanced-settings-cell {
  padding: 4px;
}

.settings-inputs {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.setting-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  min-width: 12px;
}

.setting-input {
  width: 70px;
  padding: 2px 6px;
  font-size: 11px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  color: white;
}

.setting-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.price-missing .setting-input {
  border-color: rgba(255, 193, 7, 0.6);
  background-color: rgba(255, 193, 7, 0.1);
}

.price-missing .setting-label {
  color: #ffc107;
}

.total-display {
  min-width: 55px;
}

.total-amount {
  display: inline-block;
  padding: 2px 6px;
  font-size: 11px;
  background-color: rgba(78, 205, 196, 0.1);
  border: 1px solid rgba(78, 205, 196, 0.3);
  border-radius: 3px;
  color: #4ecdc4;
  white-space: nowrap;
}

.total-amount.zero {
  color: rgba(255, 255, 255, 0.3);
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

/* 条件配置 */
.condition-config-cell {
  padding: 4px;
}

.config-rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.config-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.config-label {
  font-size: 11px;
  font-weight: bold;
  min-width: 14px;
  text-align: center;
}

.config-label.up {
  color: #ff6b6b;
}

.config-label.down {
  color: #4ecdc4;
}

.config-input {
  width: 45px;
  padding: 2px 4px;
  font-size: 10px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  color: white;
}

.config-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
  font-size: 9px;
}

/* 条件单列 */
.condition-order-cell {
  padding: 4px;
}

.condition-info {
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 2px;
}

.condition-amount {
  font-size: 11px;
  color: #888;
}

.condition-pct {
  font-size: 10px;
  color: #6a6;
}

.condition-order-btns {
  display: flex;
  flex-direction: row;
  gap: 8px;
}

.condition-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.condition-group-btns {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.condition-order-btn {
  padding: 4px 6px;
  font-size: 10px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  color: white;
  cursor: pointer;
  white-space: nowrap;
}

.condition-order-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.condition-order-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.condition-order-btn.up-btn,
.condition-order-btn.amount-buy-btn,
.condition-order-btn.volume-buy-btn {
  background-color: rgba(220, 53, 69, 0.3);
  color: #dc3545;
  border: 1px solid rgba(220, 53, 69, 0.5);
}

.condition-order-btn.up-btn:hover,
.condition-order-btn.amount-buy-btn:hover,
.condition-order-btn.volume-buy-btn:hover {
  background-color: rgba(220, 53, 69, 0.5);
  color: white;
}

.condition-order-btn.down-btn,
.condition-order-btn.amount-sell-btn,
.condition-order-btn.volume-sell-btn {
  background-color: rgba(40, 167, 69, 0.3);
  color: #28a745;
  border: 1px solid rgba(40, 167, 69, 0.5);
}

.condition-order-btn.down-btn:hover,
.condition-order-btn.amount-sell-btn:hover,
.condition-order-btn.volume-sell-btn:hover {
  background-color: rgba(40, 167, 69, 0.5);
  color: white;
}

.condition-order-btn.both-btn,
.condition-order-btn.amount-both-btn,
.condition-order-btn.volume-both-btn {
  background-color: rgba(255, 193, 7, 0.3);
  color: #ffc107;
  border: 1px solid rgba(255, 193, 7, 0.5);
}

.condition-order-btn.both-btn:hover,
.condition-order-btn.amount-both-btn:hover,
.condition-order-btn.volume-both-btn:hover {
  background-color: rgba(255, 193, 7, 0.5);
  color: white;
}

/* 收市买入按钮 - 红色（买入=红） */
.condition-order-btn.market-close-btn {
  border-color: rgba(255, 100, 100, 0.4);
  background-color: rgba(255, 100, 100, 0.1);
  color: #ff6464;
}

.condition-order-btn.market-close-btn:hover:not(:disabled) {
  background-color: rgba(255, 100, 100, 0.3);
  border-color: #ff6464;
}

.condition-order-btn.market-close-btn.active {
  background-color: rgba(255, 100, 100, 0.5);
  border-color: #ff6464;
  color: white;
  font-weight: bold;
}

/* 收市卖出按钮 - 绿色（卖出=绿） */
.condition-order-btn.market-close-sell-btn {
  border-color: rgba(76, 175, 80, 0.4);
  background-color: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

.condition-order-btn.market-close-sell-btn:hover:not(:disabled) {
  background-color: rgba(76, 175, 80, 0.3);
  border-color: #4caf50;
}

.condition-order-btn.market-close-sell-btn.active {
  background-color: rgba(76, 175, 80, 0.5);
  border-color: #4caf50;
  color: white;
  font-weight: bold;
}

.quick-set-btns {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.quick-set-btn {
  flex: 1;
  padding: 2px 4px;
  font-size: 10px;
  background-color: rgba(78, 205, 196, 0.3);
  border: 1px solid rgba(78, 205, 196, 0.5);
  border-radius: 3px;
  color: #4ecdc4;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-set-btn:hover {
  background-color: rgba(78, 205, 196, 0.5);
  color: white;
}

/* 条件配置操作按钮 */
.condition-config-actions {
  display: flex;
  gap: 4px;
  margin-top: 6px;
}

.config-action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 3px 6px;
  font-size: 11px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s;
}

.config-action-btn.save-btn {
  background-color: rgba(40, 167, 69, 0.2);
  border: 1px solid rgba(40, 167, 69, 0.5);
  color: #28a745;
}

.config-action-btn.save-btn:hover {
  background-color: rgba(40, 167, 69, 0.4);
  color: white;
}

.config-action-btn.reset-btn {
  background-color: rgba(108, 117, 125, 0.2);
  border: 1px solid rgba(108, 117, 125, 0.5);
  color: #6c757d;
  position: relative;
}

.config-action-btn.reset-btn:hover {
  background-color: rgba(108, 117, 125, 0.4);
  color: white;
}

/* 有自定义配置时的样式 */
.config-action-btn.reset-btn.has-custom-config {
  background-color: rgba(255, 193, 7, 0.2);
  border-color: rgba(255, 193, 7, 0.6);
  color: #ffc107;
}

.config-action-btn.reset-btn.has-custom-config:hover {
  background-color: rgba(255, 193, 7, 0.4);
  color: white;
}

/* 自定义配置指示器 */
.config-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background-color: #ffc107;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.3);
}

/* 高级快捷下单 */
.advanced-order-cell {
  padding: 4px;
}

.advanced-order-row {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
}

.advanced-order-row:last-child {
  margin-bottom: 0;
}

.advanced-order-btn {
  flex: 1;
  padding: 4px 6px;
  font-size: 10px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.advanced-order-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.advanced-order-btn.amount-buy-btn {
  background-color: rgba(255, 107, 107, 0.3);
}

.advanced-order-btn.amount-buy-btn:hover:not(:disabled) {
  background-color: rgba(255, 107, 107, 0.5);
}

.advanced-order-btn.amount-sell-btn {
  background-color: rgba(78, 205, 196, 0.3);
}

.advanced-order-btn.amount-sell-btn:hover:not(:disabled) {
  background-color: rgba(78, 205, 196, 0.5);
}

/* 策略类型列 */
.strategy-type-cell {
  width: 80px;
  min-width: 80px;
}

.strategy-type-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.strategy-type-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.strategy-type-badge.default {
  background-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.8);
}

.strategy-type-badge.manual {
  background-color: rgba(78, 205, 196, 0.3);
  color: #4ecdc4;
  border: 1px solid rgba(78, 205, 196, 0.5);
}

.strategy-type-badge.trend-up {
  background-color: rgba(220, 53, 69, 0.3);
  color: #dc3545;
}

.strategy-type-badge.trend-down {
  background-color: rgba(40, 167, 69, 0.3);
  color: #28a745;
}

.strategy-type-badge.breakdown {
  background-color: rgba(108, 117, 125, 0.3);
  color: #6c757d;
}

.strategy-type-badge.oscillation {
  background-color: rgba(255, 193, 7, 0.3);
  color: #ffc107;
}

.strategy-type-badge.pullback {
  background-color: rgba(111, 66, 193, 0.3);
  color: #6f42c1;
}

.strategy-type-badge.high-vol {
  background-color: rgba(253, 126, 20, 0.3);
  color: #fd7e14;
}

.strategy-type-badge.medium-vol {
  background-color: rgba(32, 201, 151, 0.3);
  color: #20c997;
}

.strategy-type-badge.low-vol {
  background-color: rgba(13, 202, 240, 0.3);
  color: #0dcaf0;
}

.manual-indicator {
  font-size: 12px;
  cursor: help;
}

.execute-strategy-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 1px solid rgba(78, 205, 196, 0.4);
  border-radius: 3px;
  background-color: rgba(78, 205, 196, 0.1);
  color: #4ecdc4;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.execute-strategy-btn:hover {
  background-color: rgba(78, 205, 196, 0.3);
  border-color: #4ecdc4;
}

.execute-strategy-btn.amount-btn {
  border-color: rgba(255, 165, 0, 0.4);
  background-color: rgba(255, 165, 0, 0.1);
  color: #ffa500;
}

.execute-strategy-btn.amount-btn:hover {
  background-color: rgba(255, 165, 0, 0.3);
  border-color: #ffa500;
}

.execute-strategy-btn svg {
  width: 10px;
  height: 10px;
}

/* 策略选择器 */
.strategy-select {
  padding: 4px 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.3);
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  cursor: pointer;
  min-width: 120px;
  max-width: 160px;
}

.strategy-select:focus {
  outline: none;
  border-color: rgba(78, 205, 196, 0.5);
}

.strategy-select option {
  background-color: #2c3e50;
  color: rgba(255, 255, 255, 0.9);
}

.strategy-select.manual-selected {
  border-color: rgba(78, 205, 196, 0.5);
  background-color: rgba(78, 205, 196, 0.1);
}

@media (max-width: 768px) {
  .advanced-settings-cell {
    padding: 2px;
  }
  
  .setting-input {
    width: 50px;
    font-size: 10px;
    padding: 2px;
  }
  
  .setting-label {
    font-size: 9px;
  }
  
  .advanced-order-cell {
    padding: 2px;
    min-width: 100px;
  }
  
  .advanced-order-row {
    gap: 2px;
    margin-bottom: 2px;
  }
  
  .advanced-order-btn {
    font-size: 8px;
    padding: 2px 3px;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .stock-code {
    display: none;
  }
}

/* 按钮点击计数 */
.btn-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  margin-left: 3px;
  font-size: 9px;
  font-weight: bold;
  background-color: rgba(255, 165, 0, 0.3);
  color: #ffa500;
  border-radius: 8px;
  line-height: 1;
}

.quick-order-btn .btn-count {
  background-color: rgba(255, 165, 0, 0.3);
  color: #ffa500;
}

.condition-order-btn .btn-count {
  background-color: rgba(255, 165, 0, 0.3);
  color: #ffa500;
}
</style>
