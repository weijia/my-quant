<!--
  策略表单列表头单元格。
  每列的特殊控件由 columnCatalog.js 的 header 字段声明，本组件据此分支渲染。
-->
<template>
  <th :class="thClass" :style="thStyle" :title="column.header?.hint || null" @click="handleSortClick">
    <!-- 带「隐藏0股」开关的列（股数） -->
    <div v-if="column.header?.hasHideZeroToggle" class="filter-header">
      <span>{{ column.label }}</span>
      <label class="toggle-filter" @click.stop>
        <input
          type="checkbox"
          :checked="hideZeroQuantity"
          @change="emit('update:hideZeroQuantity', $event.target.checked)"
        >
        <span class="toggle-label">隐藏0股</span>
      </label>
    </div>

    <!-- 带「刷新持仓」按钮的列（动态持仓） -->
    <div v-else-if="column.header?.hasHoldingsRefresh" class="filter-header">
      <span>{{ column.label }}</span>
      <button
        class="holdings-refresh-btn"
        :class="{ 'is-loading': loadingHoldings }"
        :disabled="loadingHoldings"
        title="刷新持仓"
        @click.stop="emit('refresh-holdings')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="{ spin: loadingHoldings }">
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
    </div>

    <!-- 带趋势过滤下拉的列（自动生成趋势） -->
    <div v-else-if="column.header?.hasTrendFilter" class="filter-header">
      <span>{{ column.label }}</span>
      <select :value="trendFilter" class="trend-filter-select" title="按自动生成趋势过滤" @click.stop @change="emit('update:trendFilter', $event.target.value)">
        <option v-for="option in trendOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>

    <!-- 带「融资」开关的列（快捷 / 高级快捷） -->
    <div v-else-if="column.header?.hasMarginToggle" class="filter-header">
      <span>{{ column.label }}</span>
      <label class="toggle-filter" @click.stop>
        <input
          type="checkbox"
          :checked="useMarginTrade"
          @change="emit('update:useMarginTrade', $event.target.checked)"
        >
        <span class="toggle-label">融资</span>
      </label>
    </div>

    <!-- 可排序列 -->
    <div v-else-if="isSortable" class="sort-header-content">
      <span class="header-text">{{ column.label }}</span>
      <span class="sort-icon">{{ sortIcon }}</span>
    </div>

    <!-- 普通列 -->
    <span v-else>{{ column.label }}</span>

    <!-- 直接隐藏本列：hover 才显示，避免误点（参考 price monitor 的 col-hide-btn） -->
    <button
      class="col-hide-btn"
      title="隐藏此列"
      @click.stop="emit('hide', column.key)"
    >
      ✕
    </button>
  </th>
</template>

<script setup>
import { computed } from 'vue'
import { TREND_FILTER_OPTIONS } from '../../config/trendFilterOptions'

const props = defineProps({
  column: { type: Object, required: true },
  sortBy: { type: String, default: 'name' },
  sortOrder: { type: String, default: 'asc' },
  hideZeroQuantity: { type: Boolean, default: false },
  useMarginTrade: { type: Boolean, default: true },
  loadingHoldings: { type: Boolean, default: false },
  trendFilter: { type: String, default: 'all' }
})

const emit = defineEmits([
  'sort',
  'hide',
  'refresh-holdings',
  'update:hideZeroQuantity',
  'update:useMarginTrade',
  'update:trendFilter'
])

const trendOptions = TREND_FILTER_OPTIONS

const isSortable = computed(() => Boolean(props.column.header?.sortable))

const sortIcon = computed(() => {
  if (props.sortBy !== props.column.key) return '↕'
  return props.sortOrder === 'asc' ? '↑' : '↓'
})

const thClass = computed(() => [
  props.column.header?.cssClass,
  { 'sortable-header': isSortable.value }
])

const thStyle = computed(() => {
  const widthPx = props.column.header?.widthPx
  return widthPx ? { width: `${widthPx}px`, minWidth: `${widthPx}px` } : null
})

function handleSortClick() {
  if (!isSortable.value) return
  emit('sort', props.column.key)
}
</script>

<style scoped>
th {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 2px solid rgba(255, 255, 255, 0.3);
  background-color: rgba(0, 0, 0, 0.3);
  font-weight: bold;
  font-size: 12px;
  color: white;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 10;
}

.quantity-header,
.market-value-header {
  width: 88px;
  min-width: 88px;
}

.dynamic-holdings-header {
  width: 90px;
  min-width: 90px;
  text-align: center;
  font-size: 11px;
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
  color: rgba(255, 255, 255, 0.6);
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
  border: 1px solid rgba(255, 255, 255, 0.3);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  cursor: pointer;
  min-width: 80px;
}

.toggle-filter {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 10px;
}

.toggle-filter input[type='checkbox'] {
  accent-color: #4ecdc4;
  cursor: pointer;
}

.toggle-label {
  color: rgba(255, 255, 255, 0.7);
}

.holdings-refresh-btn {
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

/* 表头「隐藏此列」按钮。
   绝对定位于右上角（th 是 sticky，本身就是定位祖先，不影响粘性）；
   默认 visibility:hidden —— 不可见即不可点，避免与「点击表头排序」冲突。 */
.col-hide-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  padding: 0;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 10px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  visibility: hidden;
}

th:hover .col-hide-btn {
  visibility: visible;
}

.col-hide-btn:hover {
  background: rgba(255, 255, 255, 0.18);
  color: #ff6b6b;
}

@keyframes spin-refresh {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
