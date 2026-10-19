/**
 * 列目录：策略表全部列的单一数据源（元数据 + 分组）。
 *
 * 监控视图已合并进策略表，因此这里只有一套列：
 * 原策略列 + 监控列去重后的净新增列（price 与 7 个网格列）。
 *
 * 约束：COLUMNS 的顺序必须与 StrategyRow.vue 中 `<td v-if>` 的顺序一致，
 * 否则表头与单元格会错位（StrategyRow 的单元格顺序是硬编码的）。
 */

/** 分组定义：key 为组内列的 group 字段取值 */
export const COLUMN_GROUPS = {
  basic: { key: 'basic', title: '基础' },
  profit: { key: 'profit', title: '收益' },
  grid: { key: 'grid', title: '网格' },
  trend: { key: 'trend', title: '趋势分析' },
  strategy: { key: 'strategy', title: '策略参数' },
  notes: { key: 'notes', title: '备注' },
  order: { key: 'order', title: '条件单' },
  action: { key: 'action', title: '操作' }
}

/** 分组在列选择器中的展示顺序 */
export const GROUP_ORDER = [
  'basic',
  'profit',
  'grid',
  'trend',
  'strategy',
  'notes',
  'order',
  'action'
]

/**
 * 全部列（顺序须与 StrategyRow.vue 的 <td> 一致）
 * header 字段描述表头的特殊渲染需求，由 StrategyHeaderCell 消费。
 * 新增的监控相关列（price / grid_*）集中在 marketValue 之后，
 * 对应 StrategyRow 中 StrategyMonitorCells 的唯一插入点。
 */
export const COLUMNS = [
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
    header: { cssClass: 'dynamic-holdings-header', hasHoldingsRefresh: true }
  },
  {
    key: 'marketValue',
    label: '市值',
    group: 'basic',
    defaultVisible: { mobile: false, desktop: false },
    header: { sortable: true, cssClass: 'market-value-header' }
  },
  // ===== 监控合并进来的列（price + 网格），对应 StrategyMonitorCells =====
  {
    key: 'price',
    label: '当前价',
    group: 'basic',
    defaultVisible: { mobile: true, desktop: true },
    header: { widthPx: 80 }
  },
  {
    key: 'grid_status',
    label: '网格状态',
    group: 'grid',
    defaultVisible: { mobile: false, desktop: true },
    header: { widthPx: 80 }
  },
  {
    key: 'grid_mid',
    label: '中枢价',
    group: 'grid',
    defaultVisible: { mobile: false, desktop: true },
    header: { widthPx: 80 }
  },
  {
    key: 'grid_range',
    label: '网格区间',
    group: 'grid',
    defaultVisible: { mobile: false, desktop: true },
    header: { widthPx: 120 }
  },
  {
    key: 'grid_step',
    label: '间距',
    group: 'grid',
    defaultVisible: { mobile: false, desktop: true },
    header: { widthPx: 70 }
  },
  {
    key: 'grid_netpos',
    label: '网格净持仓',
    group: 'grid',
    defaultVisible: { mobile: false, desktop: true },
    header: { widthPx: 90 }
  },
  {
    key: 'grid_profit',
    label: '网格盈亏',
    group: 'grid',
    defaultVisible: { mobile: false, desktop: true },
    header: { widthPx: 80 }
  },
  {
    key: 'grid_expiry',
    label: '网格过期',
    group: 'grid',
    defaultVisible: { mobile: false, desktop: true },
    header: { widthPx: 90 }
  },
  // ===== 原有策略列 =====
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
