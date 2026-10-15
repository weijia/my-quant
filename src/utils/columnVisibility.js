/**
 * 列可见性读写工具（纯函数，不涉及渲染）
 *
 * 可见性按「客户端 + 设备」维度存放在 localStorage，
 * 与 price monitor 的 dashboard.js 做法一致。
 */

import { getColumns } from '../config/columnCatalog'

/** 各表格、各设备的 localStorage key */
const STORAGE_KEYS = {
  strategy: {
    mobile: 'mobileVisibleColumns',
    desktop: 'desktopVisibleColumns'
  },
  monitor: {
    mobile: 'monitorMobileVisibleColumns',
    desktop: 'monitorDesktopVisibleColumns'
  }
}

/** 组折叠状态 key */
const COLLAPSE_KEYS = {
  strategy: 'strategyCollapsedGroups',
  monitor: 'monitorCollapsedGroups'
}

export function isMobileDevice() {
  return typeof window !== 'undefined' && window.innerWidth <= 768
}

function resolveDevice() {
  return isMobileDevice() ? 'mobile' : 'desktop'
}

function readArray(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch (_e) {
    return null
  }
}

function writeArray(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (_e) {
    console.warn('[columnVisibility] 写入 localStorage 失败:', key)
  }
}

/** 某 scope 在当前设备下的存储 key */
export function getStorageKey(scope) {
  const keys = STORAGE_KEYS[scope] || STORAGE_KEYS.strategy
  return keys[resolveDevice()]
}

/** 按列定义的 defaultVisible 推导默认可见列 */
export function getDefaultVisibleKeys(scope, device = resolveDevice()) {
  return getColumns(scope)
    .filter((col) => col.defaultVisible?.[device])
    .map((col) => col.key)
}

/** 读取可见列；无存档时用默认值 */
export function loadVisibleKeys(scope) {
  const saved = readArray(getStorageKey(scope))
  return saved || getDefaultVisibleKeys(scope)
}

/** 保存可见列 */
export function saveVisibleKeys(scope, keys) {
  writeArray(getStorageKey(scope), keys)
}

/**
 * 取「有序」的可见列对象：
 * 顺序严格跟随列目录（保证表头与 StrategyRow 的单元格顺序一致），
 * 因此用户在来回开关某列后，该列仍回到目录中的固定位置。
 */
export function resolveVisibleColumns(scope, visibleKeys) {
  const keys = Array.isArray(visibleKeys) ? visibleKeys : []
  return getColumns(scope).filter((col) => keys.includes(col.key))
}

/** 读取折叠的分组列表 */
export function loadCollapsedGroups(scope) {
  const key = COLLAPSE_KEYS[scope]
  if (!key) return []
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch (_e) {
    return []
  }
}

/** 保存折叠的分组列表 */
export function saveCollapsedGroups(scope, groups) {
  const key = COLLAPSE_KEYS[scope]
  if (!key) return
  try {
    localStorage.setItem(key, JSON.stringify(groups))
  } catch (_e) {
    console.warn('[columnVisibility] 写入折叠状态失败:', key)
  }
}
