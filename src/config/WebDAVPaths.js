/**
 * WebDAV 路径配置文件
 * 集中管理所有 WebDAV 相关的硬编码路径
 */

const WEBDAV_PATHS = {
  // 策略数据目录
  STOCKS: '/app_data/stocks/',

  // 持仓数据目录
  HOLDINGS: '/app_data/holdings/pingan/',

  // 趋势判断数据目录
  TREND_JUDGMENTS: '/app_data/stocks/trend_judgments/',

  // MQTT 配置文件
  MQTT_CONFIG: '/app_data/my-quant/mqtt-config.json',

  // 应用统一配置文件
  APP_CONFIG: '/app_data/my-quant/config.json',

  // 笔记文件
  NOTES: '/app_data/my-quant/notes.json',

  // 策略数据文件名
  STRATEGIES_FILE: 'all_strategies.json',
}

export default WEBDAV_PATHS
