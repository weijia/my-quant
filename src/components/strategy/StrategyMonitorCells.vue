<!--
  策略行中的「监控类」单元格：当前价 + 网格相关列。
  这些列由监控视图合并而来，集中在本组件渲染，避免在 StrategyRow 里再堆一大段 <td>。

  渲染顺序必须与 columnCatalog 中 price / grid_* 的顺序一致。
  本组件是多根节点片段，在 <tr> 内会展开为并列的 <td>。
-->
<template>
  <td v-if="isVisible('price')" class="monitor-cell align-right">{{ priceText }}</td>

  <td v-if="isVisible('grid_status')" class="monitor-cell">{{ gridStatusText }}</td>
  <td v-if="isVisible('grid_mid')" class="monitor-cell align-right">{{ gridMidText }}</td>
  <td v-if="isVisible('grid_range')" class="monitor-cell">{{ gridRangeText }}</td>
  <td v-if="isVisible('grid_step')" class="monitor-cell align-right">{{ gridStepText }}</td>
  <td v-if="isVisible('grid_netpos')" class="monitor-cell align-right">{{ gridNetposText }}</td>
  <td v-if="isVisible('grid_profit')" class="monitor-cell align-right" :class="gridProfitClass">
    {{ gridProfitText }}
  </td>
  <td v-if="isVisible('grid_expiry')" class="monitor-cell">{{ gridExpiryText }}</td>
</template>

<script setup>
import { computed } from 'vue'
import mqttPriceService from '../../services/MQTTPriceService'
import { findGridForStock } from '../../utils/gridMatch'
import { normalizeCode } from '../../utils/stockCode'
import {
  formatNumber,
  formatSignedNumber,
  formatGridStatus,
  formatDateOnly
} from '../../utils/monitorFormatters'

const props = defineProps({
  strategy: { type: Object, required: true },
  remoteStrategies: { type: Object, default: () => ({}) },
  visibleColumns: { type: Array, default: () => [] }
})

const isVisible = (key) => props.visibleColumns.includes(key)

/** 实时行情优先，缺失时回退策略自身携带的价格 */
const liveQuote = computed(() => mqttPriceService.quotes.get(normalizeCode(props.strategy.stockCode)))

const grid = computed(() => findGridForStock(props.remoteStrategies, props.strategy.stockCode))

const priceText = computed(() => formatNumber(liveQuote.value?.price ?? props.strategy.currentPrice, 2))

const gridStatusText = computed(() => formatGridStatus(grid.value?.status))
const gridMidText = computed(() => formatNumber(grid.value?.basicPrice, 2))
const gridRangeText = computed(() => grid.value?.priceRange || '-')
const gridStepText = computed(() => formatNumber(grid.value?.gridSpacing, 2))
const gridNetposText = computed(() => formatNumber(grid.value?.netPosition, 0))
const gridExpiryText = computed(() => formatDateOnly(grid.value?.expiredTime))

const gridProfitText = computed(() => formatSignedNumber(grid.value?.profit, 0))
const gridProfitClass = computed(() => {
  const value = Number(grid.value?.profit)
  if (!Number.isFinite(value) || value === 0) return ''
  return value > 0 ? 'value-up' : 'value-down'
})
</script>

<style scoped>
.monitor-cell {
  padding: 8px 12px;
  color: rgba(255, 255, 255, 0.85);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  white-space: nowrap;
  font-size: 12px;
}

.align-right {
  text-align: right;
}

/* 红涨绿跌 */
.value-up {
  color: #e74c3c;
}

.value-down {
  color: #28a745;
}
</style>
