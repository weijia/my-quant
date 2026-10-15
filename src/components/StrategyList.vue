<template>
  <div class="strategy-list">
    <div class="table-header">
      <h3 class="table-title">
        <span class="status-indicator" :class="statusClass" :title="statusTitle">●</span>
        {{ statusText }}
      </h3>
      <button 
        class="column-select-button"
        @click="showColumnSelectDialog = true"
        title="选择显示的列"
      >
        列选择
      </button>
    </div>
    
    <div class="table-wrapper">
      <table class="strategy-table">
        <thead>
          <tr>
            <th v-if="visibleColumns.includes('name')" class="sortable-header" @click="handleSort('name')">
              <div class="sort-header-content">
                <span class="header-text">策略名称</span>
                <span class="sort-icon">
                  <span v-if="sortBy === 'name' && sortOrder === 'asc'">↑</span>
                  <span v-else-if="sortBy === 'name' && sortOrder === 'desc'">↓</span>
                  <span v-else>↕</span>
                </span>
              </div>
            </th>
            <th v-if="visibleColumns.includes('quantity')" class="quantity-header">
              <div class="filter-header">
                <span>股数</span>
                <label class="toggle-filter">
                  <input 
                    type="checkbox" 
                    v-model="hideZeroQuantity"
                    @change="saveHideZeroQuantity"
                  >
                  <span class="toggle-label">隐藏0股</span>
                </label>
              </div>
            </th>
            <th v-if="visibleColumns.includes('dynamicHoldings')" class="dynamic-holdings-header" title="从 MQTT 获取的实时持仓">
              <span>动态持仓</span>
              <button
                class="holdings-refresh-btn"
                :class="{ 'is-loading': loadingHoldings }"
                :disabled="loadingHoldings"
                @click.stop="$emit('refresh-holdings')"
                title="刷新持仓"
              >
                <svg v-if="!loadingHoldings" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                </svg>
              </button>
              <span v-if="loadingHoldings" class="loading-dot">·</span>
            </th>
            <th v-if="visibleColumns.includes('marketValue')" class="sortable-header market-value-header" @click="handleSort('marketValue')">
              <div class="sort-header-content">
                <span class="header-text">市值</span>
                <span class="sort-icon">
                  <span v-if="sortBy === 'marketValue' && sortOrder === 'asc'">↑</span>
                  <span v-else-if="sortBy === 'marketValue' && sortOrder === 'desc'">↓</span>
                  <span v-else>↕</span>
                </span>
              </div>
            </th>
            <th v-if="visibleColumns.includes('profitLoss')">盈亏%</th>
            <th v-if="visibleColumns.includes('dividendYield')">5年平均股息率</th>
            <th v-if="visibleColumns.includes('changePercent')">涨跌%</th>
            <th v-if="visibleColumns.includes('decreasePercentage')" class="sortable-header decrease-pct-header" @click="handleSort('decreasePercentage')">
              <div class="sort-header-content">
                <span class="header-text">下跌百分比</span>
                <span class="sort-icon">
                  <span v-if="sortBy === 'decreasePercentage' && sortOrder === 'asc'">↑</span>
                  <span v-else-if="sortBy === 'decreasePercentage' && sortOrder === 'desc'">↓</span>
                  <span v-else>↕</span>
                </span>
              </div>
            </th>
            <th v-if="visibleColumns.includes('trendIcon')" class="trend-icon-header" title="趋势">势</th>
            <th v-if="visibleColumns.includes('autoTrend')">
              <div class="filter-header">
                <span>自动生成趋势</span>
                <select 
                  :value="trendFilter" 
                  @change="handleTrendFilterChange"
                  class="trend-filter-select"
                  title="按自动生成趋势过滤"
                >
                  <option value="all">全部</option>
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
              </div>
            </th>
            <th v-if="visibleColumns.includes('strategyType')">策略</th>
            <th v-if="visibleColumns.includes('oscillationGrid')">震荡时网格</th>
            <th v-if="visibleColumns.includes('decreaseStrategy')">下跌减仓</th>
            <th v-if="visibleColumns.includes('increaseStrategy')">上涨加仓</th>
            <th v-if="visibleColumns.includes('manualNotes')">手工备注</th>
            <th v-if="visibleColumns.includes('conditionConfig')" style="width: 140px;">条件配置</th>
            <th v-if="visibleColumns.includes('conditionOrder')" style="width: 100px;">条件单</th>
            <th v-if="visibleColumns.includes('quickOrder')" style="width: 80px;">
              <div class="filter-header">
                <span>快捷</span>
                <label class="toggle-filter">
                  <input 
                    type="checkbox" 
                    v-model="useMarginTrade"
                    @change="saveUseMarginTrade"
                  >
                  <span class="toggle-label">融资</span>
                </label>
              </div>
            </th>
            <th v-if="visibleColumns.includes('advancedOrderSettings')" style="width: 160px;">高级设置</th>
            <th v-if="visibleColumns.includes('advancedOrder')" style="width: 120px;">
              <div class="filter-header">
                <span>高级快捷</span>
                <label class="toggle-filter">
                  <input 
                    type="checkbox" 
                    v-model="useMarginTrade"
                    @change="saveUseMarginTrade"
                  >
                  <span class="toggle-label">融资</span>
                </label>
              </div>
            </th>
            <th v-if="visibleColumns.includes('stockAnalysis')" style="width: 120px;">买卖建议</th>
            <th v-if="visibleColumns.includes('adx')" style="width: 100px;">ADX趋势强度</th>
            <th v-if="visibleColumns.includes('actions')" style="width: 80px;">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="defaultStrategies.length > 0" class="account-section-header">
            <td :colspan="visibleColumns.length">普通账户策略 ({{ defaultStrategies.length }})</td>
          </tr>
          <StrategyRow
            v-for="strategy in defaultStrategies"
            :key="strategy.id"
            :strategy="strategy"
            :visible-columns="visibleColumns"
            :use-margin-trade="useMarginTrade"
            :holdings-map="holdingsMap"
            :remote-strategies="remoteStrategies"
            @edit="$emit('edit-strategy', strategy)"
            @delete="$emit('delete-strategy', strategy.id)"
            @update-trend="(trend) => $emit('update-trend-judgment', strategy.id, trend)"
            @batch-condition="$emit('batch-condition', strategy)"
            @execute-strategy="(s) => $emit('execute-strategy', s)"
            @execute-strategy-by-amount="(s) => $emit('execute-strategy-by-amount', s)"
            @execute-strategy-buy-only="(s) => $emit('execute-strategy-buy-only', s)"
            @execute-strategy-buy-only-by-amount="(s) => $emit('execute-strategy-buy-only-by-amount', s)"
            @execute-strategy-sell-only="(s) => $emit('execute-strategy-sell-only', s)"
            @execute-strategy-sell-only-by-amount="(s) => $emit('execute-strategy-sell-only-by-amount', s)"
            @update-strategy-selection="(s, name) => $emit('update-strategy-selection', s, name)"
            @update-trade-settings="(s, data) => $emit('update-trade-settings', s, data)"
            @update-condition-config="(s, data) => $emit('update-condition-config', s, data)"
          />

          <tr v-if="marginStrategies.length > 0" class="account-section-header margin-section">
            <td :colspan="visibleColumns.length">信用账户策略 ({{ marginStrategies.length }})</td>
          </tr>
          <StrategyRow
            v-for="strategy in marginStrategies"
            :key="strategy.id"
            :strategy="strategy"
            :visible-columns="visibleColumns"
            :use-margin-trade="useMarginTrade"
            :holdings-map="holdingsMap"
            :remote-strategies="remoteStrategies"
            @edit="$emit('edit-strategy', strategy)"
            @delete="$emit('delete-strategy', strategy.id)"
            @update-trend="(trend) => $emit('update-trend-judgment', strategy.id, trend)"
            @batch-condition="$emit('batch-condition', strategy)"
            @execute-strategy="(s) => $emit('execute-strategy', s)"
            @execute-strategy-by-amount="(s) => $emit('execute-strategy-by-amount', s)"
            @execute-strategy-buy-only="(s) => $emit('execute-strategy-buy-only', s)"
            @execute-strategy-buy-only-by-amount="(s) => $emit('execute-strategy-buy-only-by-amount', s)"
            @execute-strategy-sell-only="(s) => $emit('execute-strategy-sell-only', s)"
            @execute-strategy-sell-only-by-amount="(s) => $emit('execute-strategy-sell-only-by-amount', s)"
            @update-strategy-selection="(s, name) => $emit('update-strategy-selection', s, name)"
            @update-trade-settings="(s, data) => $emit('update-trade-settings', s, data)"
            @update-condition-config="(s, data) => $emit('update-condition-config', s, data)"
          />

          <tr v-if="pinganStrategies.length > 0" class="account-section-header pingan-section">
            <td :colspan="visibleColumns.length">平安持仓 ({{ pinganStrategies.length }})</td>
          </tr>
          <StrategyRow
            v-for="strategy in pinganStrategies"
            :key="strategy.id"
            :strategy="strategy"
            :visible-columns="visibleColumns"
            :use-margin-trade="useMarginTrade"
            :holdings-map="holdingsMap"
            :remote-strategies="remoteStrategies"
            @edit="$emit('edit-strategy', strategy)"
            @delete="$emit('delete-strategy', strategy.id)"
            @update-trend="(trend) => $emit('update-trend-judgment', strategy.id, trend)"
            @batch-condition="$emit('batch-condition', strategy)"
            @execute-strategy="(s) => $emit('execute-strategy', s)"
            @execute-strategy-by-amount="(s) => $emit('execute-strategy-by-amount', s)"
            @execute-strategy-buy-only="(s) => $emit('execute-strategy-buy-only', s)"
            @execute-strategy-buy-only-by-amount="(s) => $emit('execute-strategy-buy-only-by-amount', s)"
            @execute-strategy-sell-only="(s) => $emit('execute-strategy-sell-only', s)"
            @execute-strategy-sell-only-by-amount="(s) => $emit('execute-strategy-sell-only-by-amount', s)"
            @update-trade-settings="(s, data) => $emit('update-trade-settings', s, data)"
            @update-condition-config="(s, data) => $emit('update-condition-config', s, data)"
          />
          
          <tr v-if="strategies.length === 0">
            <td :colspan="visibleColumns.length" class="empty-state">
              暂无策略数据，请点击右上角添加按钮添加新策略
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- 远程策略数据（通过 MQTT list_strategies 获取的条件单和网格策略） -->
    <div v-if="hasAnyRemoteData" class="remote-strategies-section">
      <div class="section-divider">
        <span class="section-divider-text">📡 MQTT 远程策略数据</span>
      </div>

      <!-- 方正证券远程策略 — 按账户类型分组 -->
      <template v-for="account in founderAccounts" :key="'fa-' + account.key">
        <div v-if="account.data && account.data.strategies.length > 0" class="remote-provider-section">
          <div class="remote-provider-header" @click="toggleFounderAccount(account.key)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{ transform: showFounderAccounts[account.key] ? 'rotate(90deg)' : 'rotate(0deg)' }">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <span class="provider-badge founder">方正证券</span>
            <span class="account-type-badge" :class="'account-' + account.key">{{ account.label }}</span>
            <span class="provider-count">{{ account.data.total }} 条策略</span>
            <span class="update-time">{{ formatUpdateTime(account.data.updatedAt) }}</span>
          </div>
          <template v-if="showFounderAccounts[account.key]">
            <!-- 网格策略 -->
            <div v-if="account.grids.length > 0" class="remote-subsection">
              <div class="remote-subsection-header">网格策略 ({{ account.grids.length }})</div>
              <table class="remote-table">
                <thead>
                  <tr>
                    <th>股票</th>
                    <th>名称</th>
                    <th>状态</th>
                    <th>基准价</th>
                    <th>现价</th>
                    <th>间距</th>
                    <th>区间</th>
                    <th>盈亏</th>
                    <th>净持仓</th>
                    <th>已用资金</th>
                    <th>过期</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="s in account.grids" :key="'fg-' + account.key + '-' + s.strategyId">
                    <td class="remote-code">{{ s.stockCode }}</td>
                    <td class="remote-name">{{ s.stockName }}</td>
                    <td><span class="remote-status" :class="getStatusClass(s.status)">{{ statusLabel(s.status) }}</span></td>
                    <td>{{ s.basicPrice }}</td>
                    <td>{{ s.nowPrice }}</td>
                    <td>{{ s.gridSpacing }}</td>
                    <td>{{ s.priceRange }}</td>
                    <td :class="parseFloat(s.profit) >= 0 ? 'profit-positive' : 'profit-negative'">{{ s.profit }}</td>
                    <td>{{ s.netPosition }}</td>
                    <td>{{ s.costFunds }}</td>
                    <td :class="s.expireStatus === 'expiring' ? 'expiring' : ''">{{ s.expiredTime ? s.expiredTime.slice(0, 10) : '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- 条件单 -->
            <div v-if="account.conditions.length > 0" class="remote-subsection">
              <div class="remote-subsection-header">条件单 ({{ account.conditions.length }})</div>
              <table class="remote-table">
                <thead>
                  <tr>
                    <th>股票</th>
                    <th>名称</th>
                    <th>类型</th>
                    <th>状态</th>
                    <th>涨跌%</th>
                    <th>交易量</th>
                    <th>方向</th>
                    <th>账户</th>
                    <th>创建</th>
                    <th>结束</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="s in account.conditions" :key="'fc-' + account.key + '-' + s.strategyId">
                    <td class="remote-code">{{ s.stockCode }}</td>
                    <td class="remote-name">{{ s.stockName }}</td>
                    <td>{{ s.strategyTypeName || '-' }}</td>
                    <td><span class="remote-status" :class="getStatusClass(s.status)">{{ statusLabel(s.status) }}</span></td>
                    <td>{{ s.deltaPercentage }}</td>
                    <td>{{ s.tradeVolume }}</td>
                    <td>{{ s.side }}</td>
                    <td>{{ s.accountType }}</td>
                    <td>{{ s.createDate }}</td>
                    <td>{{ s.endDate || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>
      </template>

      <!-- 平安证券远程策略 -->
      <div v-if="remoteStrategies.pingan && remoteStrategies.pingan.strategies.length > 0" class="remote-provider-section">
        <div class="remote-provider-header pingan-header" @click="showRemotePingan = !showRemotePingan">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{ transform: showRemotePingan ? 'rotate(90deg)' : 'rotate(0deg)' }">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span class="provider-badge pingan">平安证券</span>
          <span class="provider-count">{{ remoteStrategies.pingan.total }} 条策略</span>
          <span class="update-time">{{ formatUpdateTime(remoteStrategies.pingan.updatedAt) }}</span>
        </div>
        <table v-if="showRemotePingan" class="remote-table">
          <thead>
            <tr>
              <th>股票</th>
              <th>名称</th>
              <th>类型</th>
              <th>状态</th>
              <th>基准价</th>
              <th>触发价</th>
              <th>涨幅</th>
              <th>跌幅</th>
              <th>买入额</th>
              <th>卖出额</th>
              <th>创建</th>
              <th>过期</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in remoteStrategies.pingan.strategies" :key="'pa-' + (s._raw?.ymdId || s.strategyId)">
              <td class="remote-code">{{ s.stockCode }}</td>
              <td class="remote-name">{{ s.stockName }}</td>
              <td>{{ s.strategyTypeName }}</td>
              <td><span class="remote-status" :class="getStatusClass(s.status)">{{ statusLabel(s.status) }}</span></td>
              <td>{{ s.basicPrice || '-' }}</td>
              <td>{{ s._raw?.triggerPrice || '-' }}</td>
              <td>{{ s.strategyType === 'condition' && s.side === 'BUY' ? s.deltaPercentage : '-' }}</td>
              <td>{{ s.strategyType === 'condition' && s.side === 'SELL' ? s.deltaPercentage : '-' }}</td>
              <td>{{ s.tradeVolume || '-' }}</td>
              <td>{{ s.tradeVolume || '-' }}</td>
              <td>{{ s._raw?.createDatetime ? s._raw.createDatetime.slice(0, 10) : '-' }}</td>
              <td>{{ s._raw?.expiryDatetime ? s._raw.expiryDatetime.slice(0, 10) : '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="dialog-overlay" v-if="showColumnSelectDialog" @click="showColumnSelectDialog = false">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3>选择显示的列</h3>
          <button class="close-button" @click="showColumnSelectDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="column-select-list">
            <label v-for="column in allColumns" :key="column.key" class="column-select-item">
              <input 
                type="checkbox" 
                :checked="visibleColumns.includes(column.key)"
                @change="toggleColumn(column.key)"
              >
              <span>{{ column.label }}</span>
            </label>
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="resetColumns" class="btn btn-secondary">重置默认</button>
          <button @click="showColumnSelectDialog = false" class="btn btn-primary">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import StrategyRow from './StrategyRow.vue'
import appConfigService from '../services/AppConfigService.js'

const props = defineProps({
  strategies: {
    type: Array,
    required: true
  },
  sortBy: {
    type: String,
    default: 'name'
  },
  sortOrder: {
    type: String,
    default: 'asc'
  },
  trendFilter: {
    type: String,
    default: 'all'
  },
  mqttConnected: {
    type: Boolean,
    default: false
  },
  agentOnline: {
    type: Boolean,
    default: false
  },
  holdingsMap: {
    type: Map,
    default: () => new Map()
  },
  loadingHoldings: {
    type: Boolean,
    default: false
  },
  remoteStrategies: {
    type: Object,
    default: () => ({ founder: { default: null, credit: null }, pingan: null })
  }
})

const statusClass = computed(() => {
  if (props.agentOnline) return 'status-online'
  if (props.mqttConnected) return 'status-mqtt-only'
  return 'status-offline'
})

const statusText = computed(() => {
  if (props.agentOnline) return '条件单代理已连接'
  if (props.mqttConnected) return 'MQTT已连接·代理离线'
  return 'MQTT未连接'
})

const statusTitle = computed(() => {
  if (props.agentOnline) return 'MQTT已连接，条件单代理在线'
  if (props.mqttConnected) return 'MQTT已连接，但条件单代理未响应'
  return 'MQTT未连接'
})

const emit = defineEmits([
  'edit-strategy',
  'delete-strategy',
  'update-trend-judgment',
  'batch-condition',
  'execute-strategy',
  'execute-strategy-by-amount',
  'execute-strategy-buy-only',
  'execute-strategy-buy-only-by-amount',
  'execute-strategy-sell-only',
  'execute-strategy-sell-only-by-amount',
  'update-strategy-selection',
  'update-trade-settings',
  'update-condition-config',
  'update-trend-filter',
  'update-sort',
  'refresh-holdings'
])

const showColumnSelectDialog = ref(false)
// 从统一配置读取初始值，确保是布尔类型
const hideZeroQuantity = ref(!!appConfigService.hideZeroQuantity)
const useMarginTrade = ref(appConfigService.useMarginTrade !== false)

const saveHideZeroQuantity = () => {
  appConfigService.hideZeroQuantity = hideZeroQuantity.value
}

const saveUseMarginTrade = () => {
  appConfigService.useMarginTrade = useMarginTrade.value
}

// 监听配置更新，同步本地状态
const handleConfigUpdate = () => {
  // 确保值是有效的布尔类型
  hideZeroQuantity.value = !!appConfigService.hideZeroQuantity
  useMarginTrade.value = appConfigService.useMarginTrade !== false
}

onMounted(() => {
  window.addEventListener('appConfigUpdated', handleConfigUpdate)
})

onUnmounted(() => {
  window.removeEventListener('appConfigUpdated', handleConfigUpdate)
})

const allColumns = [
  { key: 'name', label: '策略名称' },
  { key: 'quantity', label: '股数' },
  { key: 'dynamicHoldings', label: '动态持仓' },
  { key: 'marketValue', label: '市值' },
  { key: 'profitLoss', label: '盈亏%' },
  { key: 'dividendYield', label: '5年平均股息率' },
  { key: 'changePercent', label: '涨跌%' },
  { key: 'decreasePercentage', label: '下跌百分比' },
  { key: 'trendIcon', label: '趋势' },
  { key: 'autoTrend', label: '自动生成趋势' },
  { key: 'strategyType', label: '策略' },
  { key: 'oscillationGrid', label: '震荡时网格' },
  { key: 'decreaseStrategy', label: '下跌减仓' },
  { key: 'increaseStrategy', label: '上涨加仓' },
  { key: 'manualNotes', label: '手工备注' },
  { key: 'conditionConfig', label: '条件配置' },
  { key: 'conditionOrder', label: '条件单' },
  { key: 'quickOrder', label: '快捷' },
  { key: 'advancedOrderSettings', label: '高级设置' },
  { key: 'advancedOrder', label: '高级快捷' },
  { key: 'stockAnalysis', label: '买卖建议' },
  { key: 'adx', label: 'ADX趋势强度' },
  { key: 'actions', label: '操作' }
]

// 手机端默认可见列
const mobileDefaultVisibleColumns = [
  'name',
  'quantity',
  'trendIcon',
  'stockAnalysis',
  'advancedOrder'
]

// 电脑端默认可见列
const desktopDefaultVisibleColumns = [
  'name',
  'quantity',
  'trendIcon',
  'stockAnalysis',
  'conditionConfig',
  'conditionOrder',
  'quickOrder',
  'advancedOrderSettings',
  'advancedOrder'
]

// 判断是否为移动端
const isMobileDevice = () => window.innerWidth <= 768

// 根据设备类型获取默认列
const getDefaultVisibleColumns = () => {
  return isMobileDevice() ? mobileDefaultVisibleColumns : desktopDefaultVisibleColumns
}

const getInitialVisibleColumns = () => {
  try {
    const storageKey = isMobileDevice() ? 'mobileVisibleColumns' : 'desktopVisibleColumns'
    const saved = localStorage.getItem(storageKey)
    const parsed = saved ? JSON.parse(saved) : null
    if (Array.isArray(parsed)) {
      // 检查是否包含 stockAnalysis，如果不包含则添加（新列自动显示）
      if (!parsed.includes('stockAnalysis')) {
        // 在 'trendIcon' 后面插入 'stockAnalysis'
        const trendIconIndex = parsed.indexOf('trendIcon')
        if (trendIconIndex !== -1) {
          parsed.splice(trendIconIndex + 1, 0, 'stockAnalysis')
        } else {
          parsed.push('stockAnalysis')
        }
        // 保存更新后的配置
        localStorage.setItem(storageKey, JSON.stringify(parsed))
        console.log('[StrategyList] 自动添加 stockAnalysis 到可见列')
      }
      // 检查是否包含 adx，如果不包含则添加（新列自动显示）
      if (!parsed.includes('adx')) {
        // 在 'stockAnalysis' 后面插入 'adx'
        const stockAnalysisIndex = parsed.indexOf('stockAnalysis')
        if (stockAnalysisIndex !== -1) {
          parsed.splice(stockAnalysisIndex + 1, 0, 'adx')
        } else {
          parsed.push('adx')
        }
        localStorage.setItem(storageKey, JSON.stringify(parsed))
        console.log('[StrategyList] 自动添加 adx 到可见列')
      }
      return parsed
    }
    return getDefaultVisibleColumns()
  } catch (error) {
    return getDefaultVisibleColumns()
  }
}

const visibleColumns = ref(getInitialVisibleColumns())

const defaultStrategies = computed(() => {
  return props.strategies.filter(s => s.accountType !== 'credit' && s.provider !== 'pingan')
    .filter(s => !hideZeroQuantity.value || (s.netPosition || 0) !== 0)
})

const marginStrategies = computed(() => {
  return props.strategies.filter(s => s.accountType === 'credit' && s.provider !== 'pingan')
    .filter(s => !hideZeroQuantity.value || (s.netPosition || 0) !== 0)
})

const pinganStrategies = computed(() => {
  return props.strategies.filter(s => s.provider === 'pingan')
    .filter(s => !hideZeroQuantity.value || (s.netPosition || 0) !== 0)
})

const handleSort = (column) => {
  let newSortBy = column
  let newSortOrder = 'asc'
  
  if (props.sortBy === column) {
    newSortOrder = props.sortOrder === 'asc' ? 'desc' : 'asc'
  }
  
  localStorage.setItem('advancedStrategySortBy', newSortBy)
  localStorage.setItem('advancedStrategySortOrder', newSortOrder)
  emit('update-sort', { sortBy: newSortBy, sortOrder: newSortOrder })
}

const handleTrendFilterChange = () => {
  emit('update-trend-filter', props.trendFilter)
}

const toggleColumn = (columnKey) => {
  const index = visibleColumns.value.indexOf(columnKey)
  if (index > -1) {
    if (visibleColumns.value.length > 1) {
      visibleColumns.value.splice(index, 1)
    }
  } else {
    visibleColumns.value.push(columnKey)
  }
  const storageKey = isMobileDevice() ? 'mobileVisibleColumns' : 'desktopVisibleColumns'
  localStorage.setItem(storageKey, JSON.stringify(visibleColumns.value))
}

const resetColumns = () => {
  visibleColumns.value = [...getDefaultVisibleColumns()]
  const storageKey = isMobileDevice() ? 'mobileVisibleColumns' : 'desktopVisibleColumns'
  localStorage.setItem(storageKey, JSON.stringify(visibleColumns.value))
}

// ========== 远程策略数据相关 ==========
const showFounderAccounts = reactive({ default: false, credit: false });
const showRemotePingan = ref(false);

const toggleFounderAccount = (key) => {
  showFounderAccounts[key] = !showFounderAccounts[key];
};

// 账户类型配置
const ACCOUNT_TYPES = [
  { key: 'default', label: '普通账户' },
  { key: 'credit', label: '信用账户' }
];

// 方正：按账户类型组织数据（grids + conditions）
const founderAccounts = computed(() => {
  return ACCOUNT_TYPES.map(acc => {
    const data = props.remoteStrategies?.founder?.[acc.key];
    if (!data || !data.strategies) {
      return { ...acc, data: null, grids: [], conditions: [] };
    }
    const grids = data.strategies.filter(s => s.strategyType === 'grid');
    const conditions = data.strategies.filter(s => s.strategyType === 'condition');
    return { ...acc, data, grids, conditions };
  });
});

const hasAnyRemoteData = computed(() => {
  const founder = props.remoteStrategies?.founder;
  const hasFounderData = founder && (
    (founder.default && founder.default.strategies?.length > 0)
    || (founder.credit && founder.credit.strategies?.length > 0)
  );
  const hasPinganData = props.remoteStrategies?.pingan?.strategies?.length > 0;
  return hasFounderData || hasPinganData;
});

// ========== 统一 status 显示 ==========
// 标准化后的 status: 'running' | 'paused' | 'expired' | 其他原值
const statusLabel = (status) => {
  const map = { running: '运行中', paused: '已暂停', expired: '已过期' }
  return map[status] || status || '-'
}
const getStatusClass = (status) => {
  if (status === 'running') return 'status-running'
  if (status === 'paused') return 'status-paused'
  if (status === 'expired') return 'status-expired'
  return 'status-idle'
}

const formatUpdateTime = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
</script>

<style scoped>
.strategy-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 4px;
  overflow: hidden;
  background: rgba(255,255,255,0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: rgba(255,255,255,0.1);
  border-bottom: 1px solid rgba(255,255,255,0.2);
}

.table-title {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: white;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-indicator {
  font-size: 12px;
}

.status-online {
  color: #4ecdc4;
}

.status-mqtt-only {
  color: #fd7e14;
}

.status-offline {
  color: #e74c3c;
}

.column-select-button {
  padding: 6px 12px;
  background-color: rgba(255,255,255,0.2);
  color: white;
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.column-select-button:hover {
  background-color: rgba(255,255,255,0.3);
}

.table-wrapper {
  flex: 1;
  overflow: auto;
  padding: 0;
  max-height: 600px;
  position: relative;
}

.strategy-table {
  border-collapse: collapse;
  font-size: 12px;
  color: white;
  position: relative;
}

.strategy-table th,
.strategy-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.strategy-table th {
  background-color: rgba(0,0,0,0.3);
  font-weight: bold;
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 2px solid rgba(255,255,255,0.3);
}

.market-value-header {
  width: 88px;
  min-width: 88px;
}

.quantity-header {
  width: 88px;
  min-width: 88px;
}

.dynamic-holdings-header {
  width: 90px;
  min-width: 90px;
  text-align: center;
  font-size: 11px;
  cursor: default;
}

.holdings-refresh-btn {
  margin-left: 4px;
  padding: 2px;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  transition: all 0.2s;
}

.holdings-refresh-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #4ecdc4;
}

.holdings-refresh-btn.is-loading {
  color: #4ecdc4;
  cursor: not-allowed;
}

.holdings-refresh-btn .spin {
  animation: spin-refresh 1s linear infinite;
}

@keyframes spin-refresh {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-dot {
  animation: blink 1s infinite;
  color: #4ecdc4;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.decrease-pct-header {
  width: 3ch;
  min-width: 3ch;
}

.trend-icon-header {
  width: 1.5ch;
  min-width: 1.5ch;
  text-align: center;
  padding: 8px 4px;
}

.strategy-table th:first-child,
.strategy-table td:first-child {
  position: sticky;
  left: 0;
  background-color: rgba(0,0,0,0.3);
  z-index: 5;
  width: 64px;
  min-width: 64px;
  border-right: 2px solid rgba(255,255,255,0.2);
}

.account-section-header {
  background-color: rgba(0,0,0,0.2);
  font-weight: bold;
}

.account-section-header td:first-child {
  background-color: rgba(0,0,0,0.4) !important;
}

.account-section-header.margin-section {
  background-color: rgba(253,126,20,0.2);
}

.account-section-header.margin-section td:first-child {
  background-color: rgba(253,126,20,0.4) !important;
}

.account-section-header.pingan-section {
  background-color: rgba(76,205,196,0.2);
}

.account-section-header.pingan-section td:first-child {
  background-color: rgba(76,205,196,0.4) !important;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: rgba(255,255,255,0.5);
}

.filter-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.trend-filter-select {
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 3px;
  border: 1px solid rgba(255,255,255,0.3);
  background-color: rgba(0,0,0,0.8);
  color: white;
  cursor: pointer;
  width: auto;
  min-width: 80px;
}

.toggle-filter {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 10px;
}

.toggle-filter input[type="checkbox"] {
  accent-color: #4ecdc4;
  cursor: pointer;
}

.toggle-label {
  color: rgba(255,255,255,0.7);
}

.sortable-header {
  cursor: pointer;
}

.sort-header-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sort-icon {
  font-size: 11px;
  color: rgba(255,255,255,0.6);
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background-color: #2c3e50;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(255,255,255,0.2);
}

.dialog-header h3 {
  margin: 0;
  color: white;
  font-size: 16px;
}

.close-button {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-button:hover {
  background-color: rgba(255,255,255,0.1);
}

.dialog-body {
  padding: 16px;
  max-height: 300px;
  overflow-y: auto;
}

.column-select-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.column-select-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-size: 14px;
  cursor: pointer;
}

.column-select-item input[type="checkbox"] {
  accent-color: #4ecdc4;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px;
  border-top: 1px solid rgba(255,255,255,0.2);
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-secondary {
  background-color: rgba(255,255,255,0.2);
  color: white;
}

.btn-secondary:hover {
  background-color: rgba(255,255,255,0.3);
}

.btn-primary {
  background-color: #4ecdc4;
  color: white;
}

.btn-primary:hover {
  background-color: #45b7aa;
}

@media (max-width: 768px) {
  .table-wrapper {
    overflow-x: auto;
  }
  
  .strategy-table th,
  .strategy-table td {
    white-space: normal;
    word-break: break-word;
    font-size: 9px;
    padding: 3px 2px;
  }
  
  .strategy-table th:first-child,
  .strategy-table td:first-child {
    width: 30px;
    min-width: 30px;
    font-size: 9px;
    padding: 3px 1px;
  }

  .name-cell {
    width: 75px !important;
    min-width: 75px !important;
    max-width: 75px !important;
    font-size: 9px;
    padding: 3px 2px !important;
  }

  .name-cell-inner {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 71px !important;
  }

  .name-cell span {
    display: inline;
  }
  
  .quantity-header,
  .quantity-cell {
    width: 28px;
    min-width: 28px;
  }

  .dynamic-holdings-header,
  .dynamic-holdings-cell {
    width: 40px;
    min-width: 40px;
    font-size: 9px;
  }

  .decrease-pct-header,
  .decrease-pct-cell {
    width: 28px;
    min-width: 28px;
  }
  
  .quick-order-cell button {
    padding: 3px 4px;
    font-size: 9px;
  }
  
  .quick-order-cell button svg {
    width: 10px;
    height: 10px;
  }
  
  .advanced-order-btn {
    padding: 2px 4px;
    font-size: 8px;
    min-width: 36px;
  }
  
  .setting-input {
    width: 36px;
    font-size: 9px;
    padding: 1px 2px;
  }
  
  .quick-set-btn {
    padding: 1px 3px;
    font-size: 8px;
  }
  
  .actions-cell .action-btn {
    padding: 2px;
  }
  
  .actions-cell .action-btn svg {
    width: 12px;
    height: 12px;
  }
  
  .trend-select {
    padding: 1px 2px;
    font-size: 9px;
  }
  
  .trend-btn {
    padding: 2px 4px;
    font-size: 9px;
  }
}

@media (min-width: 1400px) {
  .strategy-table {
    width: 100%;
  }
}

/* ========== 远程策略数据样式 ========== */
.remote-strategies-section {
  margin-top: 16px;
  padding: 8px 0;
}

.section-divider {
  display: flex;
  align-items: center;
  padding: 6px 15px;
  background: rgba(78, 205, 196, 0.1);
  border-bottom: 1px solid rgba(78, 205, 196, 0.3);
}

.section-divider-text {
  font-size: 13px;
  font-weight: bold;
  color: #4ecdc4;
}

.remote-provider-section {
  margin: 8px 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.remote-provider-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 15px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  user-select: none;
  font-size: 13px;
}

.remote-provider-header:hover {
  background: rgba(255, 255, 255, 0.1);
}

.remote-provider-header svg {
  transition: transform 0.2s ease;
  color: rgba(255, 255, 255, 0.6);
}

.remote-provider-header.pingan-header {
  background: rgba(78, 205, 196, 0.08);
}

.provider-badge {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: bold;
}

.provider-badge.founder {
  background: rgba(253, 126, 20, 0.2);
  color: #fd7e14;
}

.provider-badge.pingan {
  background: rgba(78, 205, 196, 0.2);
  color: #4ecdc4;
}

.account-type-badge {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: normal;
}

.account-type-badge.account-default {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.5);
}

.account-type-badge.account-credit {
  background: rgba(0, 123, 255, 0.15);
  color: #4da6ff;
}

.provider-count {
  color: rgba(255, 255, 255, 0.7);
}

.update-time {
  margin-left: auto;
  color: rgba(255, 255, 255, 0.4);
  font-size: 11px;
}

.remote-subsection {
  padding: 0 8px 8px;
}

.remote-subsection-header {
  padding: 6px 8px;
  font-size: 12px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 4px;
}

.remote-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.85);
}

.remote-table th,
.remote-table td {
  padding: 4px 8px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  white-space: nowrap;
}

.remote-table th {
  color: rgba(255, 255, 255, 0.5);
  font-weight: normal;
  font-size: 10px;
}

.remote-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.remote-code {
  color: rgba(255, 255, 255, 0.5);
  font-family: monospace;
}

.remote-name {
  color: rgba(255, 255, 255, 0.9);
}

.remote-status {
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 10px;
}

.remote-status.status-running {
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
}

.remote-status.status-paused {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.remote-status.status-expired {
  background: rgba(220, 53, 69, 0.2);
  color: #dc3545;
}

.remote-status.status-idle {
  background: rgba(108, 117, 125, 0.2);
  color: #6c757d;
}

.profit-positive {
  color: #e74c3c;
}

.profit-negative {
  color: #28a745;
}

.expiring {
  color: #fd7e14;
}
</style>
