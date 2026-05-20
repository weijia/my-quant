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
            <th v-if="visibleColumns.includes('decreasePercentage')" class="decrease-pct-header">下跌百分比</th>
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
            @edit="$emit('edit-strategy', strategy)"
            @delete="$emit('delete-strategy', strategy.id)"
            @update-trend="(trend) => $emit('update-trend-judgment', strategy.id, trend)"
            @batch-condition="$emit('batch-condition', strategy)"
            @execute-strategy="(s) => $emit('execute-strategy', s)"
            @execute-strategy-by-amount="(s) => $emit('execute-strategy-by-amount', s)"
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
            @edit="$emit('edit-strategy', strategy)"
            @delete="$emit('delete-strategy', strategy.id)"
            @update-trend="(trend) => $emit('update-trend-judgment', strategy.id, trend)"
            @batch-condition="$emit('batch-condition', strategy)"
            @execute-strategy="(s) => $emit('execute-strategy', s)"
            @execute-strategy-by-amount="(s) => $emit('execute-strategy-by-amount', s)"
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
            @edit="$emit('edit-strategy', strategy)"
            @delete="$emit('delete-strategy', strategy.id)"
            @update-trend="(trend) => $emit('update-trend-judgment', strategy.id, trend)"
            @batch-condition="$emit('batch-condition', strategy)"
            @execute-strategy="(s) => $emit('execute-strategy', s)"
            @execute-strategy-by-amount="(s) => $emit('execute-strategy-by-amount', s)"
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
import { ref, computed, onMounted } from 'vue'
import StrategyRow from './StrategyRow.vue'

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
  'update-strategy-selection',
  'update-trade-settings',
  'update-condition-config',
  'update-trend-filter',
  'update-sort'
])

const showColumnSelectDialog = ref(false)
const hideZeroQuantity = ref(localStorage.getItem('hideZeroQuantity') === 'true')
const useMarginTrade = ref(localStorage.getItem('useMarginTrade') !== 'false')

const saveHideZeroQuantity = () => {
  localStorage.setItem('hideZeroQuantity', hideZeroQuantity.value)
}

const saveUseMarginTrade = () => {
  localStorage.setItem('useMarginTrade', useMarginTrade.value)
}

const allColumns = [
  { key: 'name', label: '策略名称' },
  { key: 'quantity', label: '股数' },
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
  { key: 'quickOrder', label: '快捷' },
  { key: 'advancedOrderSettings', label: '高级设置' },
  { key: 'advancedOrder', label: '高级快捷' },
  { key: 'actions', label: '操作' }
]

const defaultVisibleColumns = [
  'name',
  'quantity',
  'marketValue',
  'profitLoss',
  'dividendYield',
  'changePercent',
  'decreasePercentage',
  'trendIcon',
  'autoTrend',
  'strategyType',
  'oscillationGrid',
  'decreaseStrategy',
  'increaseStrategy',
  'manualNotes',
  'quickOrder',
  'advancedOrderSettings',
  'advancedOrder',
  'actions'
]

const getInitialVisibleColumns = () => {
  try {
    const saved = localStorage.getItem('advancedStrategyVisibleColumns')
    const parsed = saved ? JSON.parse(saved) : null
    return Array.isArray(parsed) ? parsed : defaultVisibleColumns
  } catch (error) {
    return defaultVisibleColumns
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
  localStorage.setItem('advancedStrategyVisibleColumns', JSON.stringify(visibleColumns.value))
}

const resetColumns = () => {
  visibleColumns.value = [...defaultVisibleColumns]
  localStorage.setItem('advancedStrategyVisibleColumns', JSON.stringify(visibleColumns.value))
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
  width: 80px;
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
    min-width: 80px;
    max-width: 120px;
    font-size: 9px;
  }

  .name-cell span {
    display: inline-block;
    max-width: 110px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .quantity-header,
  .quantity-cell {
    width: 28px;
    min-width: 28px;
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
</style>
