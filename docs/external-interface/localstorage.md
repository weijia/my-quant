# localStorage 存储文档

## 概述

本项目使用浏览器 `localStorage` 持久化用户界面偏好设置。

- **使用文件**: `src/components/StrategyList.vue`

---

## 存储键

| 键名 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `hideZeroQuantity` | boolean | `false` | 是否隐藏零股策略 |
| `advancedStrategyVisibleColumns` | JSON Array | `["name", "quantity", "marketValue", "profitLoss", "dividendYield", "changePercent", "decreasePercentage", "autoTrend", "oscillationGrid", "decreaseStrategy", "increaseStrategy", "manualNotes", "actions"]` | 用户选择的可见列配置 |
| `advancedStrategySortBy` | string | `"name"` | 排序字段 |
| `advancedStrategySortOrder` | string | `"asc"` | 排序方向 |

---

## 字段详细说明

### hideZeroQuantity

- **类型**: `boolean`（存储为字符串 `"true"` / `"false"`）
- **用途**: 控制是否在列表中隐藏持仓数量为 0 的策略
- **读取**: `localStorage.getItem('hideZeroQuantity')`
- **写入**: `localStorage.setItem('hideZeroQuantity', value)`

### advancedStrategyVisibleColumns

- **类型**: `JSON Array`（存储为 JSON 字符串）
- **用途**: 记录用户选择显示的列
- **可选值**:

| 列 Key | 显示名 |
|--------|--------|
| `name` | 策略名称 |
| `quantity` | 股数 |
| `marketValue` | 市值 |
| `profitLoss` | 盈亏% |
| `dividendYield` | 5年平均股息率 |
| `changePercent` | 涨跌% |
| `decreasePercentage` | 下跌百分比 |
| `autoTrend` | 趋势判断 |
| `oscillationGrid` | 震荡网格 |
| `decreaseStrategy` | 下跌策略 |
| `increaseStrategy` | 上涨策略 |
| `manualNotes` | 备注 |
| `actions` | 操作 |

- **读取**: `JSON.parse(localStorage.getItem('advancedStrategyVisibleColumns'))`
- **写入**: `localStorage.setItem('advancedStrategyVisibleColumns', JSON.stringify(columns))`

### advancedStrategySortBy

- **类型**: `string`
- **用途**: 记录当前排序字段
- **可选值**: `"name"` / `"marketValue"` / `"netPosition"`
- **读取**: `localStorage.getItem('advancedStrategySortBy')`
- **写入**: `localStorage.setItem('advancedStrategySortBy', value)`

### advancedStrategySortOrder

- **类型**: `string`
- **用途**: 记录当前排序方向
- **可选值**: `"asc"` / `"desc"`
- **读取**: `localStorage.getItem('advancedStrategySortOrder')`
- **写入**: `localStorage.setItem('advancedStrategySortOrder', value)`
