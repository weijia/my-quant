<!--
  通用「分组列选择器」弹窗
  - 按列组折叠 / 展开（参考 price monitor dashboard.js 的 .col-group 交互）
  - 组标题支持整组一键开关，组内部分选中时显示半选态
  - 折叠状态按 scope 存 localStorage
-->
<template>
  <div class="dialog-overlay" @click="emit('close')">
    <div class="dialog-content" @click.stop>
      <div class="dialog-header">
        <h3>选择显示的列</h3>
        <button class="close-button" @click="emit('close')">×</button>
      </div>

      <div class="dialog-body">
        <div
          v-for="group in groupedColumns"
          :key="group.key"
          class="col-group"
          :class="{ collapsed: isCollapsed(group.key) }"
        >
          <div class="col-group-head" @click="toggleCollapse(group.key)">
            <span class="col-group-tri">{{ isCollapsed(group.key) ? '▸' : '▾' }}</span>
            <input
              type="checkbox"
              class="group-checkbox"
              :checked="isGroupAllOn(group)"
              :indeterminate.prop="isGroupPartial(group)"
              @click.stop
              @change="toggleGroup(group)"
            >
            <span class="col-group-title">{{ group.title }}</span>
            <span class="col-group-count">{{ groupOnCount(group) }}/{{ group.columns.length }}</span>
          </div>

          <div v-show="!isCollapsed(group.key)" class="col-group-items">
            <label
              v-for="column in group.columns"
              :key="column.key"
              class="col-item"
            >
              <input
                type="checkbox"
                :checked="visibleKeys.includes(column.key)"
                @change="toggleColumn(column.key)"
              >
              <span>{{ column.label }}</span>
            </label>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="btn btn-secondary" @click="emit('reset')">重置默认</button>
        <button class="btn btn-primary" @click="emit('close')">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { COLUMN_GROUPS } from '../config/columnCatalog'
import { loadCollapsedGroups, saveCollapsedGroups } from '../utils/columnVisibility'

const props = defineProps({
  /** 全部列定义（含 group 字段） */
  columns: { type: Array, required: true },
  /** 分组展示顺序 */
  groupOrder: { type: Array, required: true },
  /** 当前可见列 key 列表 */
  visibleKeys: { type: Array, required: true },
  /** 折叠状态的存储 scope：strategy / monitor */
  collapseScope: { type: String, default: 'strategy' }
})

const emit = defineEmits(['close', 'reset', 'update:visibleKeys'])

const collapsed = ref(loadCollapsedGroups(props.collapseScope))

watch(collapsed, (value) => saveCollapsedGroups(props.collapseScope, value), { deep: true })

/** 按分组顺序聚合列，组内顺序沿用列目录 */
const groupedColumns = computed(() => {
  const buckets = new Map()
  props.columns.forEach((column) => {
    if (!buckets.has(column.group)) buckets.set(column.group, [])
    buckets.get(column.group).push(column)
  })
  return props.groupOrder
    .filter((groupKey) => buckets.has(groupKey))
    .map((groupKey) => ({
      key: groupKey,
      title: COLUMN_GROUPS[groupKey]?.title || '其他',
      columns: buckets.get(groupKey)
    }))
})

const groupKeysOf = (group) => group.columns.map((column) => column.key)

const groupOnCount = (group) =>
  groupKeysOf(group).filter((key) => props.visibleKeys.includes(key)).length

const isGroupAllOn = (group) => groupOnCount(group) === group.columns.length

const isGroupPartial = (group) => {
  const on = groupOnCount(group)
  return on > 0 && on < group.columns.length
}

function commit(keys) {
  emit('update:visibleKeys', keys)
}

function toggleColumn(key) {
  const next = props.visibleKeys.includes(key)
    ? props.visibleKeys.filter((item) => item !== key)
    : [...props.visibleKeys, key]
  commit(next)
}

/** 整组开关：全选时取消整组，否则补齐全组 */
function toggleGroup(group) {
  const keys = groupKeysOf(group)
  const allOn = isGroupAllOn(group)
  const remaining = props.visibleKeys.filter((key) => !keys.includes(key))
  commit(allOn ? remaining : [...remaining, ...keys])
}

function toggleCollapse(groupKey) {
  const next = collapsed.value.includes(groupKey)
    ? collapsed.value.filter((key) => key !== groupKey)
    : [...collapsed.value, groupKey]
  collapsed.value = next
}

function isCollapsed(groupKey) {
  return collapsed.value.includes(groupKey)
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background-color: #2c3e50;
  border-radius: 8px;
  width: 92%;
  max-width: 460px;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
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
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.dialog-body {
  padding: 12px 16px;
  max-height: 340px;
  overflow-y: auto;
}

.col-group {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  margin-bottom: 8px;
  background: rgba(0, 0, 0, 0.18);
}

.col-group-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  cursor: pointer;
  user-select: none;
  color: #4ecdc4;
  font-size: 13px;
  font-weight: 600;
}

.col-group-tri {
  width: 12px;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
}

.col-group-title {
  flex: 1;
}

.col-group-count {
  font-size: 11px;
  font-weight: normal;
  color: rgba(255, 255, 255, 0.45);
}

.col-group-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 8px 12px;
  padding: 6px 10px 10px 26px;
}

.col-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  cursor: pointer;
}

.group-checkbox,
.col-item input[type='checkbox'] {
  accent-color: #4ecdc4;
  cursor: pointer;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
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
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.btn-secondary:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.btn-primary {
  background-color: #4ecdc4;
  color: white;
}

.btn-primary:hover {
  background-color: #45b7aa;
}
</style>
