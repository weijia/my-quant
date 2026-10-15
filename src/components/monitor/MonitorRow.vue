<!-- 监控视图单行：一只股票一行，按可见列渲染单元格 -->
<template>
  <tr class="monitor-row">
    <td v-for="column in columns" :key="column.key" :class="cellClass(column)">
      <template v-if="column.key === 'name'">
        <span class="monitor-name">{{ row.name || '-' }}</span>
        <span v-if="row.stockCode" class="monitor-code">[{{ row.stockCode }}]</span>
      </template>
      <span v-else :class="cellColorClass(row, column.key)">
        {{ formatMonitorCell(row, column.key) }}
      </span>
    </td>
  </tr>
</template>

<script setup>
import { formatMonitorCell, cellColorClass } from '../../utils/monitorFormatters'

defineProps({
  row: { type: Object, required: true },
  /** 有序的可见列对象 */
  columns: { type: Array, required: true }
})

const cellClass = (column) => ({
  'align-right': column.align === 'right'
})
</script>

<style scoped>
.monitor-row td {
  padding: 6px 10px;
  color: rgba(255, 255, 255, 0.88);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  white-space: nowrap;
}

.align-right {
  text-align: right;
}

.monitor-name {
  color: rgba(255, 255, 255, 0.92);
}

.monitor-code {
  margin-left: 4px;
  color: rgba(255, 255, 255, 0.45);
  font-family: monospace;
  font-size: 11px;
}

.value-up {
  color: #e74c3c;
}

.value-down {
  color: #28a745;
}
</style>
