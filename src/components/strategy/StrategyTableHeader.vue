<!--
  策略表表头：按「有序可见列」渲染 <th>，
  单列的特殊控件（排序 / 过滤 / 开关）下放到 StrategyHeaderCell。
-->
<template>
  <thead>
    <tr>
      <StrategyHeaderCell
        v-for="column in columns"
        :key="column.key"
        :column="column"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :hide-zero-quantity="hideZeroQuantity"
        :use-margin-trade="useMarginTrade"
        :loading-holdings="loadingHoldings"
        :trend-filter="trendFilter"
        @sort="emit('sort', $event)"
        @refresh-holdings="emit('refresh-holdings')"
        @update:hide-zero-quantity="emit('update:hideZeroQuantity', $event)"
        @update:use-margin-trade="emit('update:useMarginTrade', $event)"
        @update:trend-filter="emit('update:trendFilter', $event)"
      />
    </tr>
  </thead>
</template>

<script setup>
import StrategyHeaderCell from './StrategyHeaderCell.vue'

defineProps({
  /** 有序的可见列对象（顺序已由 resolveVisibleColumns 校正） */
  columns: { type: Array, required: true },
  sortBy: { type: String, default: 'name' },
  sortOrder: { type: String, default: 'asc' },
  hideZeroQuantity: { type: Boolean, default: false },
  useMarginTrade: { type: Boolean, default: true },
  loadingHoldings: { type: Boolean, default: false },
  trendFilter: { type: String, default: 'all' }
})

const emit = defineEmits([
  'sort',
  'refresh-holdings',
  'update:hideZeroQuantity',
  'update:useMarginTrade',
  'update:trendFilter'
])
</script>
