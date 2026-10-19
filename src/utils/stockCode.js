/** 股票代码归一化：纯数字补零到 6 位，与行情推送里的 code 对齐 */
export function normalizeCode(code) {
  const text = String(code == null ? '' : code).trim()
  if (!text) return ''
  return /^\d+$/.test(text) ? text.padStart(6, '0') : text
}
