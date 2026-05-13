<template>
  <tr class="strategy-row">
    <td v-if="visibleColumns.includes('name')" class="name-cell">
      <span>{{ strategy.name }}</span>
      <span v-if="strategy.stockCode" class="stock-code">[{{ strategy.stockCode }}]</span>
    </td>
    
    <td v-if="visibleColumns.includes('quantity')" class="text-right">
      {{ strategy.netPosition || 0 }}
    </td>
    
    <td v-if="visibleColumns.includes('marketValue')" class="text-right">
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
    
    <td v-if="visibleColumns.includes('decreasePercentage')" class="text-right">
      {{ strategy.decreasePercentage || '-' }}%
    </td>
    
    <td v-if="visibleColumns.includes('autoTrend')">
      <select 
        v-model="localTrend" 
        @change="updateTrend"
        class="trend-select"
      >
        <option value="unset">未设置</option>
        <option value="unknown">未知</option>
        <option value="up">上升</option>
        <option value="down">下降</option>
        <option value="oscillation">震荡</option>
        <option value="pullback">回踩</option>
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
  min-width: 100px;
}

.stock-code {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  margin-left: 4px;
}

.text-right {
  text-align: right;
}

.positive {
  color: #28a745;
}

.negative {
  color: #dc3545;
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
  display: flex;
  gap: 4px;
  justify-content: center;
  width: 80px;
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
</style>
