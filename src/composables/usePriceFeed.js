/**
 * 行情订阅 composable：把一组股票代码绑定到 Price Server 的实时报价。
 *
 * 代码变化时自动重新订阅；组件卸载时停止监听。
 * MQTT 连接本身由 MQTTPriceService 单例持有并复用，这里不负责断连。
 */

import { computed, onUnmounted, unref, watch } from 'vue'
import mqttPriceService from '../services/MQTTPriceService.js'

export function usePriceFeed(codesSource) {
  const codesRef = computed(() => unref(codesSource) || [])

  const resubscribe = () => {
    const codes = [...new Set(codesRef.value.filter(Boolean))]
    mqttPriceService.subscribeQuotes(codes)
  }

  resubscribe()
  const stopWatch = watch(codesRef, resubscribe, { deep: true })
  onUnmounted(stopWatch)

  return {
    /** code → 最新报价 */
    quotes: mqttPriceService.quotes,
    connected: computed(() => mqttPriceService.connected.value)
  }
}
