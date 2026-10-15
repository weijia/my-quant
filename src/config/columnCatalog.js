/**
 * 列目录：my-quant 全部列的单一数据源（元数据 + 分组）。
 *
 * 约定：
 * 1) STRATEGY_COLUMNS 的顺序必须与 StrategyRow.vue 中 `<td v-if>` 的顺序一致，
 *    否则表头与单元格会错位（StrategyRow 的单元格顺序是硬编码的）。
 * 2) defaultVisible 声明该列在移动 / 桌面的默认可见性。
 */

/** 分组定义：key 为组内列的 group 字段取值 */
export const COLUMN_GROUPS = {
  basic: { key: 'basic', title: '基础' },
  profit: { key: 'profit', title: '收益' },
  trend: { key: 'trend', title: '趋势分析' },
  strategy: { key: 'strategy', title: '策略参数' },
  notes: { key: 'notes', title: '备注' },
  order: { key: 'order', title: '条件单' },
  action: { key: 'action', title: '操作' },
  holding: { key: 'holding', title: '持仓' },
  grid: { key: 'grid', title: '网格' }
}

/** 各表格的分组展示顺序 */
export const GROUP_ORDER = {
  strategy: ['basic', 'profit', 'trend', 'strategy', 'notes', 'order', 'action'],
  monitor: ['basic', 'holding', 'grid', 'trend']
}

/**
 * 策略表列（顺序须与 StrategyRow.vue 的 <td> 一致）
 * header 字段描述表头的特殊渲染需求，由 StrategyHeaderCell 消费。
 */
export const STRATEGY_COLUMNS = [
  {
    key: 'name',
    label: '策略名称',
    group: 'basic',
    defaultVisible: { mobile: true, desktop: true },
    header: { sortable: true }
  },
  {
    key: 'quantity',
    label: '股数',
    group: 'basic',
    defaultVisible: { mobile: true, desktop: true },
    header: { cssClass: 'quantity-header', hasHideZeroToggle: true }
  },
  {
    key: 'dynamicHoldings',
    label: '动态持仓',
    group: 'basic',
    defaultVisible: { mobile: false, desktop: false },
    header: { cssClass: 'dynamic-holdings-header', hasHoldingsRefresh: true, size: 'small' }
  },
  {
    key: 'marketValue',
    label: '市值',
    group: 'basic',
    defaultVisible: { mobile: false, desktop: false },
    header: { sortable: true, cssClass: 'market-value-header' }
  },
  {
    key: 'profitLoss',
    label: '盈亏%',
    group: 'profit',
    defaultVisible: { mobile: false, desktop: false },
    header: {}
  },
  {
    key: 'dividendYield',
    label: '5年平均股息率',
    group: 'profit',
    defaultVisible: { mobile: false, desktop: false },
    header: {}
  },
  {
    key: 'changePercent',
    label: '涨跌%',
    group: 'profit',
    defaultVisible: { mobile: false, desktop: false },
    header: {}
  },
  {
    key: 'decreasePercentage',
    label: '下跌百分比',
    group: 'strategy',
    defaultVisible: { mobile: false, desktop: false },
    header: { sortable: true, cssClass: 'decrease-pct-header' }
  },
  {
    key: 'trendIcon',
    label: '势',
    group: 'trend',
    defaultVisible: { mobile: true, desktop: true },
    header: { cssClass: 'trend-icon-header', hint: '趋势' }
  },
  {
    key: 'autoTrend',
    label: '自动生成趋势',
    group: 'trend',
    defaultVisible: { mobile: false, desktop: false },
    header: { hasTrendFilter: true }
  },
  {
    key: 'strategyType',
    label: '策略',
    group: 'strategy',
    defaultVisible: { mobile: false, desktop: false },
    header: {}
  },
  {
    key: 'oscillationGrid',
    label: '震荡时网格',
    group: 'strategy',
    defaultVisible: { mobile: false, desktop: false },
    header: {}
  },
  {
    key: 'decreaseStrategy',
    label: '下跌减仓',
    group: 'strategy',
    defaultVisible: { mobile: false, desktop: false },
    header: {}
  },
  {
    key: 'increaseStrategy',
    label: '上涨加仓',
    group: 'strategy',
    defaultVisible: { mobile: false, desktop: false },
    header: {}
  },
  {
    key: 'manualNotes',
    label: '手工备注',
    group: 'notes',
    defaultVisible: { mobile: false, desktop: false },
    header: {}
  },
  {
    key: 'conditionConfig',
    label: '条件配置',
    group: 'order',
    defaultVisible: { mobile: false, desktop: true },
    header: { widthPx: 140 }
  },
  {
    key: 'conditionOrder',
    label: '条件单',
    group: 'order',
    defaultVisible: { mobile: false, desktop: true },
    header: { widthPx: 100 }
  },
  {
    key: 'quickOrder',
    label: '快捷',
    group: 'order',
    defaultVisible: { mobile: false, desktop: true },
    header: { widthPx: 80, hasMarginToggle: true }
  },
  {
    key: 'advancedOrderSettings',
    label: '高级设置',
    group: 'order',
    defaultVisible: { mobile: false, desktop: true },
    header: { widthPx: 160 }
  },
  {
    key: 'advancedOrder',
    label: '高级快捷',
    group: 'order',
    defaultVisible: { mobile: true, desktop: true },
    header: { widthPx: 120, hasMarginToggle: true }
  },
  {
    key: 'stockAnalysis',
    label: '买卖建议',
    group: 'trend',
    defaultVisible: { mobile: true, desktop: true },
    header: { widthPx: 120 }
  },
  {
    key: 'adx',
    label: 'ADX趋势强度',
    group: 'trend',
    defaultVisible: { mobile: true, desktop: true },
    header: { widthPx: 100 }
  },
  {
    key: 'actions',
    label: '操作',
    group: 'action',
    defaultVisible: { mobile: false, desktop: false },
    header: { widthPx: 80 }
  }
]

/**
 * 监控视图列（price monitor 风格）
 * source 仅用于标注数据来源，便于后续扩展。
 */
export const MONITOR_COLUMNS = [
  {
    key: 'name',
    label: '股票名称',
    group: 'basic',
    align: 'left',
    defaultVisible: { mobile: true, desktop: true }
  },
  {
    key: 'price',
    label: '当前价',
    group: 'basic',
    align: 'right',
    defaultVisible: { mobile: true, desktop: true }
  },
  {
    key: 'today',
    label: '当日涨跌%',
    group: 'basic',
    align: 'right',
    defaultVisible: { mobile: true, desktop: true }
  },
  {
    key: 'qty',
    label: '持仓数量',
    group: 'holding',
    align: 'right',
    defaultVisible: { mobile: false, desktop: true }
  },
  {
    key: 'hold_amt',
    label: '持仓市值',
    group: 'holding',
    align: 'right',
    defaultVisible: { mobile: false, desktop: true }
  },
  {
    key: 'profit',
    label: '持仓盈亏',
    group: 'holding',
    align: 'right',
    defaultVisible: { mobile: true, desktop: true }
  },
  {
    key: 'grid_status',
    label: '网格状态',
    group: 'grid',
    align: 'left',
    defaultVisible: { mobile: false, desktop: true }
  },
  {
    key: 'grid_mid',
    label: '中枢价',
    group: 'grid',
    align: 'right',
    defaultVisible: { mobile: false, desktop: true }
  },
  {
    key: 'grid_range',
    label: '网格区间',
    group: 'grid',
    align: 'left',
    defaultVisible: { mobile: false, desktop: true }
  },
  {
    key: 'grid_step',
    label: '间距',
    group: 'grid',
    align: 'right',
    defaultVisible: { mobile: false, desktop: true }
  },
  {
    key: 'grid_now',
    label: '网格现价',
    group: 'grid',
    align: 'right',
    defaultVisible: { mobile: false, desktop: false }
  },
  {
    key: 'grid_netpos',
    label: '网格净持仓',
    group: 'grid',
    align: 'right',
    defaultVisible: { mobile: false, desktop: false }
  },
  {
    key: 'grid_profit',
    label: '网格盈亏',
    group: 'grid',
    align: 'right',
    defaultVisible: { mobile: false, desktop: false }
  },
  {
    key: 'grid_expiry',
    label: '网格过期',
    group: 'grid',
    align: 'left',
    defaultVisible: { mobile: false, desktop: false }
  },
  {
    key: 'trend',
    label: '趋势',
    group: 'trend',
    align: 'left',
    defaultVisible: { mobile: false, desktop: true }
  }
]

/** 按 scope 取列定义 */
export function getColumns(scope) {
  return scope === 'monitor' ? MONITOR_COLUMNS : STRATEGY_COLUMNS
}
