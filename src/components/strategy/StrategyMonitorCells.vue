<!--
  策略行中的「监控类」单元格：当前价 + 网格相关列。
  这些列由监控视图合并而来，集中在本组件渲染，避免在 StrategyRow 里再堆一大段 <td>。

  渲染顺序必须与 columnCatalog 中 price / grid_* 的顺序一致。
  本组件是多根节点片段，在 <tr> 内会展开为并列的 <td>。
-->
<template>
  <td v-if="isVisible('price')" class="monitor-cell align-right">{{ priceText }}</td>

  <td
    v-if="isVisible('grid_status')"
    class="monitor-cell"
    :class="gridStatusClass"
    :title="gridStatusTitle"
  >{{ gridStatusText }}</td>
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
import {
  findGridForStock,
  getGridPriceBounds,
  getGridPriceState,
  getGridCapacityIssues,
  getGridCapacityDetails
} from '../../utils/gridMatch'
import { normalizeCode } from '../../utils/stockCode'
import {
  formatNumber,
  formatSignedNumber,
  formatGridStatus,
  formatGridStatusFull,
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

/**
 * 网格数据源以 all_strategies.json 为准：WebDAV 导入时已把该股票的 gridStrategies
 * 挂到 strategy.grid（随策略落库，页面刷新后依然在）。
 * MQTT list_strategies 的远程策略只作补充，避免未点「获取策略」时整列为空。
 */
const grid = computed(() =>
  props.strategy.grid || findGridForStock(props.remoteStrategies, props.strategy.stockCode)
)

/** 破网判断与「当前价」列共用同一个价格：实时行情 > 策略携带价 > 网格现价 */
const currentPrice = computed(() =>
  liveQuote.value?.price ?? props.strategy.currentPrice ?? grid.value?.nowPrice
)
const priceText = computed(() => formatNumber(currentPrice.value, 2))

/**
 * 参照 vue-dialog-userscript 的 isOscillationGridOutOfRange：
 * 当前价低于 priceLowLimit 或高于 priceHighLimit 即为破网，网格状态列给出警示。
 */
const gridPriceState = computed(() => getGridPriceState(grid.value, currentPrice.value))

/**
 * 容量异常：可卖量 / 可用资金耗尽或超出设定上限。
 * 与破网提示并列展示，明细放在 tooltip 里，避免把窄列塞满。
 */
const gridIssues = computed(() => getGridCapacityIssues(grid.value, currentPrice.value))
const gridStatusText = computed(() =>
  formatGridStatusFull(grid.value?.status, gridPriceState.value, gridIssues.value)
)
const gridStatusClass = computed(() => {
  if (gridIssues.value.length) return 'grid-status-warn'
  return gridPriceState.value === 'out_low' || gridPriceState.value === 'out_high'
    ? 'grid-status-out'
    : ''
})
const gridStatusTitle = computed(() => {
  if (!grid.value) return ''
  const lines = [`网格状态: ${formatGridStatus(grid.value.status)}`]
  const bounds = getGridPriceBounds(grid.value)
  const price = Number(currentPrice.value)
  if (bounds) {
    const state = gridPriceState.value
    const verdict = state === 'in'
      ? '在网'
      : (state === 'out_low' ? '跌破网格下限' : state === 'out_high' ? '突破网格上限' : '无法判定')
    lines.push(
      `当前价: ${Number.isFinite(price) ? price.toFixed(2) : '-'}`,
      `区间: ${bounds.low} - ${bounds.high}`,
      `判定: ${verdict}`
    )
  }
  const details = getGridCapacityDetails(grid.value, currentPrice.value)
  if (details.length) lines.push('— 网格参数 —', ...details)
  if (gridIssues.value.length) {
    lines.push('— 容量提示 —')
    gridIssues.value.forEach((issue) => lines.push(`${issue.label}: ${issue.detail}`))
  }
  return lines.join('\n')
})
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

/* 当前价超出网格区间（破网）：警示色，与油猴脚本的越界标红对应 */
.grid-status-out {
  color: #ffa940;
  font-weight: 600;
}

/* 可卖量 / 可用资金耗尽或超限额：网格已单边停摆，比破网更需关注 */
.grid-status-warn {
  color: #ff7875;
  font-weight: 600;
}

/* 红涨绿跌 */
.value-up {
  color: #e74c3c;
}

.value-down {
  color: #28a745;
}
</style>
