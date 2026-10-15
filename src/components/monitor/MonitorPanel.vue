<!--
  监控视图面板
  - 列按「组」划分（基础 / 持仓 / 网格 / 趋势），列选择由 ColumnSelector 统一管理
  - 可见列存 localStorage（按客户端 + 设备），与 price monitor 的列设置逻辑一致
-->
<template>
  <section class="monitor-panel">
    <div class="monitor-header">
      <button class="collapse-btn" @click="expanded = !expanded" :title="expanded ? '折叠' : '展开'">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span class="monitor-title">监控视图</span>
        <span class="monitor-count">{{ rows.length }} 只股票</span>
      </button>
      <div class="header-right">
        <span
          class="quote-status"
          :class="{ online: quoteConnected }"
          :title="quoteConnected ? '已连接行情服务，显示实时价格' : '未连接行情服务，显示非实时价格'"
        >
          行情{{ quoteConnected ? '已连接' : '未连接' }}
        </span>
        <button class="column-select-button" title="选择显示的列" @click="showColumnSelector = true">
          列选择
        </button>
      </div>
    </div>

    <div v-if="expanded" class="monitor-body">
      <table class="monitor-table">
        <thead>
          <tr>
            <th v-for="column in visibleColumns" :key="column.key" :class="{ 'align-right': column.align === 'right' }">
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <MonitorRow v-for="row in rows" :key="row.key" :row="row" :columns="visibleColumns" />
          <tr v-if="rows.length === 0">
            <td :colspan="Math.max(visibleColumns.length, 1)" class="empty-state">
              暂无监控数据（可先在上方添加策略，或点击「刷新策略」拉取 MQTT 远程数据）
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ColumnSelector
      v-if="showColumnSelector"
      :columns="allColumns"
      :group-order="groupOrder"
      :visible-keys="visibleKeys"
      collapse-scope="monitor"
      @close="showColumnSelector = false"
      @reset="handleReset"
      @update:visible-keys="handleVisibleKeysChange"
    />
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import MonitorRow from './MonitorRow.vue'
import ColumnSelector from '../ColumnSelector.vue'
import { MONITOR_COLUMNS, GROUP_ORDER } from '../../config/columnCatalog'
import {
  loadVisibleKeys,
  saveVisibleKeys,
  getDefaultVisibleKeys,
  resolveVisibleColumns
} from '../../utils/columnVisibility'
import { useMonitorRows } from '../../composables/useMonitorRows'
import { usePriceFeed } from '../../composables/usePriceFeed'
import mqttPriceService from '../../services/MQTTPriceService'

const MONITOR_SCOPE = 'monitor'

const props = defineProps({
  strategies: { type: Array, default: () => [] },
  holdingsMap: { type: Map, default: () => new Map() },
  remoteStrategies: { type: Object, default: () => ({}) }
})

const allColumns = MONITOR_COLUMNS
const groupOrder = GROUP_ORDER.monitor

// 行内价格优先取 MQTT 实时报价，行情未连接时自动回退到非实时价格
const { rows } = useMonitorRows(
  computed(() => props.strategies),
  computed(() => props.holdingsMap),
  computed(() => props.remoteStrategies),
  computed(() => mqttPriceService.quotes)
)

// 按当前行涉及的代码订阅行情推送（代码变化会自动重新订阅）
const stockCodes = computed(() => rows.value.map((row) => row.stockCode))
const { connected: quoteConnected } = usePriceFeed(stockCodes)

const visibleKeys = ref(loadVisibleKeys(MONITOR_SCOPE))
const expanded = ref(true)
const showColumnSelector = ref(false)

watch(visibleKeys, (value) => saveVisibleKeys(MONITOR_SCOPE, value), { deep: true })

/** 顺序跟随列目录，保证表头与行的单元格一一对应 */
const visibleColumns = computed(() => resolveVisibleColumns(MONITOR_SCOPE, visibleKeys.value))

function handleVisibleKeysChange(keys) {
  visibleKeys.value = keys
}

function handleReset() {
  visibleKeys.value = getDefaultVisibleKeys(MONITOR_SCOPE)
}
</script>

<style scoped>
.monitor-panel {
  border: 1px solid rgba(78, 205, 196, 0.3);
  border-radius: 4px;
  overflow: hidden;
  background: rgba(78, 205, 196, 0.06);
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 15px;
  background: rgba(78, 205, 196, 0.12);
  border-bottom: 1px solid rgba(78, 205, 196, 0.25);
}

.collapse-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  font-size: 13px;
}

.collapse-btn svg {
  transition: transform 0.2s ease;
  color: rgba(255, 255, 255, 0.6);
}

.monitor-title {
  font-weight: bold;
  color: #4ecdc4;
}

.monitor-count {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.quote-status {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 3px;
  padding: 2px 6px;
}

.quote-status.online {
  color: #4ecdc4;
  border-color: rgba(78, 205, 196, 0.5);
}

.column-select-button {
  padding: 5px 12px;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.column-select-button:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.monitor-body {
  max-height: 420px;
  overflow: auto;
}

.monitor-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.monitor-table th {
  padding: 6px 10px;
  text-align: left;
  color: rgba(255, 255, 255, 0.55);
  font-weight: normal;
  font-size: 11px;
  background-color: rgba(0, 0, 0, 0.35);
  position: sticky;
  top: 0;
  z-index: 5;
  white-space: nowrap;
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
}

.align-right {
  text-align: right;
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: rgba(255, 255, 255, 0.5);
}
</style>
