/**
 * 共享的"当前时间" ticker。
 * 模块级单例：所有导入方共用同一个 setInterval（每 30 秒刷新一次），
 * 供"距今 N 天/小时"之类的相对时间显示实时走动，避免每个表格行各起一个定时器。
 */
import { ref } from 'vue'

export const now = ref(Date.now())

// 仅在浏览器环境启动定时器
if (typeof window !== 'undefined') {
  setInterval(() => {
    now.value = Date.now()
  }, 30000)
}
