/**
 * 列可见性读写工具（纯函数，不涉及渲染）
 *
 * 可见性按「客户端 + 设备」维度存放在 localStorage，
 * 与 price monitor 的 dashboard.js 做法一致。
 */

import { COLUMNS } from '../config/columnCatalog'

const STORAGE_KEYS = {
  mobile: 'mobileVisibleColumns',
  desktop: 'desktopVisibleColumns'
}

const COLLAPSE_KEY = 'visibleColumnCollapsedGroups'

/**
 * 列目录结构版本。
 * 新增列时 +1：老用户的存档里没有新列，会在此版本升级时把「默认可见的新列」回填一次，
 * 避免新列对存量用户不可见（回填只发生一次）。
 */
const SCHEMA_VERSION_KEY = 'visibleColumnsVersion'
const SCHEMA_VERSION = 3

export function isMobileDevice() {
  return typeof window !== 'undefined' && window.innerWidth <= 768
}

function resolveDevice() {
  return isMobileDevice() ? 'mobile' : 'desktop'
}

function getStorageKey() {
  return STORAGE_KEYS[resolveDevice()]
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

function readVersion() {
  const raw = Number(localStorage.getItem(SCHEMA_VERSION_KEY) || 0)
  return Number.isFinite(raw) ? raw : 0
}

function needsBackfill() {
  return readVersion() < SCHEMA_VERSION
}

function markVersion() {
  try {
    localStorage.setItem(SCHEMA_VERSION_KEY, String(SCHEMA_VERSION))
  } catch (_e) {
    console.warn('[columnVisibility] 写入版本标记失败')
  }
}

/** 按列定义的 defaultVisible 推导默认可见列 */
export function getDefaultVisibleKeys(device = resolveDevice()) {
  return COLUMNS.filter((col) => col.defaultVisible?.[device]).map((col) => col.key)
}

/** 把「默认可见但存档中缺失」的列补进去（仅用于版本升级时的一次性回填） */
function mergeNewDefaults(saved) {
  const missing = getDefaultVisibleKeys().filter((key) => !saved.includes(key))
  return missing.length ? [...saved, ...missing] : saved
}

/** 读取可见列；无存档或版本升级时用默认值 / 回填默认值 */
export function loadVisibleKeys() {
  const saved = readArray(getStorageKey())
  if (!saved) {
    markVersion()
    return getDefaultVisibleKeys()
  }
  if (needsBackfill()) {
    const merged = mergeNewDefaults(saved)
    writeArray(getStorageKey(), merged)
    markVersion()
    return merged
  }
  return saved
}

/** 保存可见列 */
export function saveVisibleKeys(keys) {
  writeArray(getStorageKey(), keys)
}

/**
 * 取「有序」的可见列对象：
 * 顺序严格跟随列目录（保证表头与 StrategyRow 的单元格顺序一致），
 * 因此用户反复开关某列后，该列仍回到目录中的固定位置。
 */
export function resolveVisibleColumns(visibleKeys) {
  const keys = Array.isArray(visibleKeys) ? visibleKeys : []
  return COLUMNS.filter((col) => keys.includes(col.key))
}

/** 读取折叠的分组列表 */
export function loadCollapsedGroups() {
  try {
    const parsed = JSON.parse(localStorage.getItem(COLLAPSE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch (_e) {
    return []
  }
}

/** 保存折叠的分组列表 */
export function saveCollapsedGroups(groups) {
  try {
    localStorage.setItem(COLLAPSE_KEY, JSON.stringify(groups))
  } catch (_e) {
    console.warn('[columnVisibility] 写入折叠状态失败')
  }
}
