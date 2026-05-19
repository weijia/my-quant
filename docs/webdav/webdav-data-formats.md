# WebDAV 数据格式文档

本文档记录项目中所有保存到 WebDAV 的数据格式，包括文件路径、数据结构和字段说明。

## 目录

- [文件路径总览](#文件路径总览)
- [1. 综合策略单文件](#1-综合策略单文件-all_strategiesjson)
- [2. 股票基础信息](#2-股票基础信息)
- [3. 条件单策略](#3-条件单策略)
- [4. 网格策略](#4-网格策略)
- [5. 高级策略](#5-高级策略)
- [6. 趋势判断](#6-趋势判断)
- [7. 持仓历史记录](#7-持仓历史记录)
- [8. 窗口配置](#8-窗口配置)
- [9. 股票数据（WebDAVStockManager）](#9-股票数据webdavstockmanager)
- [10. 条件单调试日志](#10-条件单调试日志)

---

## 文件路径总览

| WebDAV 文件路径 | 数据类型 | 同步模式 |
|---|---|---|
| `app_data/stocks/all_strategies.json` | 综合策略（股票+条件单+网格+高级） | 单文件模式（默认） |
| `stock_data.json` | 股票基础信息 | 多文件模式 |
| `conditional_strategies.json` | 条件单策略 | 多文件模式 |
| `grid_strategies.json` | 网格策略 | 多文件模式 |
| `app_data/stocks/trend_judgments/trend_judgment_{name}_{date}.json` | 趋势判断 | 独立同步 |
| `app_data/stocks/holdings.default.{timestamp}.json` | 持仓历史/导出 | 独立同步 |
| `app_data/stocks/window_config.json` | 窗口配置 | 独立同步 |
| `stocks/data.json` | 股票数据 | WebDAVStockManager |
| `stocks/watchlist.json` | 关注列表 | WebDAVStockManager |
| `app_data/stocks/debug/condition_order_{timestamp}.json` | 条件单调试 | 自动创建 |

> **同步模式说明**：单文件模式将所有策略数据合并到一个文件中同步（默认）；多文件模式将各类型策略分别保存到独立文件。

---

## 1. 综合策略单文件 `all_strategies.json`

**文件路径**: `app_data/stocks/all_strategies.json`  
**源代码**: `src/services/DataStorageService.js` — `syncAllStrategiesToWebDAV()`  
**说明**: 默认同步模式，将所有策略数据合并为一个文件上传。

```json
{
  "stockData": [ ... ],
  "conditionalStrategies": [ ... ],
  "gridStrategies": [ ... ],
  "advancedStrategies": [ ... ],
  "lastUpdated": "2025-01-01T12:00:00.000Z"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `stockData` | `Array<StockItem>` | 股票基础信息数组（见第2节） |
| `conditionalStrategies` | `Array<ConditionalStrategy>` | 条件单策略数组（见第3节） |
| `gridStrategies` | `Array<GridStrategy>` | 网格策略数组（见第4节） |
| `advancedStrategies` | `Array<AdvancedStrategy>` | 高级策略数组（见第5节） |
| `lastUpdated` | `string` | 最后更新时间，ISO 8601 格式 |

---

## 2. 股票基础信息

**多文件模式路径**: `stock_data.json`  
**单文件模式路径**: `app_data/stocks/all_strategies.json` → `stockData` 字段  
**源代码**: `src/services/StockInfoService.js` — `syncToWebDAV()` / `createStockObject()`

### StockItem 结构

```json
{
  "id": "1700000000000abc12",
  "stockName": "星湖科技",
  "stockCode": "600866",
  "accountType": "default"
}
```

| 字段 | 类型 | 必选 | 说明 |
|------|------|------|------|
| `id` | `string` | 是 | 唯一ID，格式：`时间戳 + 随机5位字符` |
| `stockName` | `string` | 是 | 股票名称 |
| `stockCode` | `string` | 是 | 股票代码（如 "600866"） |
| `accountType` | `string` | 是 | 账户类型：`"default"`（普通）或 `"credit"`（信用），默认 `"default"` |

---

## 3. 条件单策略

**多文件模式路径**: `conditional_strategies.json`  
**单文件模式路径**: `app_data/stocks/all_strategies.json` → `conditionalStrategies` 字段  
**源代码**: `src/services/ConditionalStrategyService.js` — `createStrategyObject()` / `formatTaskListForInternalUse()`

条件单策略存在两种来源，字段略有差异：

### 3a. 手动创建的策略

**源代码**: `createStrategyObject()` 方法

```json
{
  "id": "1700000000000abc12",
  "stockName": "星湖科技",
  "stockCode": "600866",
  "deltaPercentage": "5",
  "deltaAmount": "0.500",
  "bounceType": "percentage",
  "tradeVolume": "100",
  "targetPrice": "10.000",
  "notes": "",
  "accountType": "credit",
  "strategyType": "bottom_buy",
  "side": "MARGINBUY",
  "createDate": "01-15 10:30:00",
  "expiredTime": "2025-03-15",
  "status": "active"
}
```

| 字段 | 类型 | 必选 | 说明 |
|------|------|------|------|
| `id` | `string` | 是 | 唯一ID |
| `stockName` | `string` | 是 | 股票名称 |
| `stockCode` | `string` | 是 | 股票代码 |
| `deltaPercentage` | `string` | 否 | 涨跌百分比 |
| `deltaAmount` | `string` | 否 | 涨跌金额，精确到小数点后3位 |
| `bounceType` | `string` | 否 | 反弹类型：`"percentage"` 或 `"amount"` |
| `tradeVolume` | `string` | 否 | 交易数量 |
| `targetPrice` | `string` | 否 | 目标价格，精确到小数点后3位 |
| `notes` | `string` | 否 | 备注 |
| `accountType` | `string` | 是 | 账户类型：`"default"` 或 `"credit"` |
| `strategyType` | `string` | 是 | 策略类型：`"bottom_buy"` 或 `"top_sell"` |
| `side` | `string` | 否 | 交易方向（见下方 side 值表） |
| `createDate` | `string` | 否 | 创建时间，格式：`"MM-dd HH:mm:ss"` |
| `expiredTime` | `string` | 否 | 过期时间，格式：`"YYYY-MM-DD"` |
| `status` | `string` | 否 | 状态，默认 `"active"` |

### 3b. 从 API 格式化的策略

**源代码**: `formatTaskListForInternalUse()` 方法

除上述字段外，还包含以下额外字段：

```json
{
  "id": "1880938628",
  "stockCode": "600866",
  "stockName": "星湖科技",
  "description": "",
  "deltaPercentage": "5",
  "deltaAmount": "0.500",
  "bounceType": "percentage",
  "direction": "buy",
  "tradeVolume": "100",
  "accountType": "credit",
  "status": "running",
  "createDate": "01-15 10:30:00",
  "updateDate": "01-15 12:00:00",
  "strategyType": "bottom_buy",
  "targetPrice": "10.000",
  "expiredTime": "2025-03-15",
  "originalTaskName": "底部反弹买入600866",
  "originalSname": "strategy_bottom_buy",
  "originalStatus": "RUNNING",
  "originalSide": "MARGINBUY"
}
```

| 额外字段 | 类型 | 说明 |
|---------|------|------|
| `description` | `string` | 策略描述 |
| `direction` | `string` | 买卖方向：`"buy"` 或 `"sell"` |
| `updateDate` | `string` | 更新时间，格式：`"MM-dd HH:mm:ss"` |
| `originalTaskName` | `string` | 原始任务名称（API 返回） |
| `originalSname` | `string` | 原始策略类型标识（API 返回） |
| `originalStatus` | `string` | 原始状态（API 返回，如 `"RUNNING"`） |
| `originalSide` | `string` | 原始交易方向（API 返回） |

### side 值表

| 账户类型 | 买入方向 | 卖出方向 |
|---------|---------|---------|
| 普通账户 | `BUY` | `SELL` |
| 信用账户-担保品 | `COLLABUY` | `COLLASELL` |
| 信用账户-融资融券 | `MARGINBUY` | `MARGINSELL` |

---

## 4. 网格策略

**多文件模式路径**: `grid_strategies.json`  
**单文件模式路径**: `app_data/stocks/all_strategies.json` → `gridStrategies` 字段  
**源代码**: `src/services/GridStrategyService.js` — `createStrategyObject()`

### GridStrategy 结构

```json
{
  "id": "1700000000000abc12",
  "stockName": "星湖科技",
  "stockCode": "600866",
  "priceRange": "10-20",
  "gridSpacing": "0.5",
  "gridCount": "10",
  "gridAmount": "10000",
  "quantityBuy": "100",
  "quantitySell": "100",
  "totalAmount": "50000",
  "accountType": "default",
  "notes": ""
}
```

| 字段 | 类型 | 必选 | 说明 |
|------|------|------|------|
| `id` | `string` | 是 | 唯一ID，格式：`时间戳 + 随机5位字符` |
| `stockName` | `string` | 是 | 股票名称 |
| `stockCode` | `string` | 是 | 股票代码 |
| `priceRange` | `string` | 否 | 价格区间（如 "10-20"） |
| `gridSpacing` | `string` | 否 | 网格间距 |
| `gridCount` | `string` | 否 | 网格数量 |
| `gridAmount` | `string` | 否 | 每格金额 |
| `quantityBuy` | `string` | 否 | 买入数量 |
| `quantitySell` | `string` | 否 | 卖出数量 |
| `totalAmount` | `string` | 否 | 总金额 |
| `accountType` | `string` | 是 | 账户类型：`"default"` 或 `"credit"` |
| `notes` | `string` | 否 | 备注 |

---

## 5. 高级策略

**多文件模式路径**: 无独立文件（通过 `all_strategies.json` 同步）  
**单文件模式路径**: `app_data/stocks/all_strategies.json` → `advancedStrategies` 字段  
**源代码**: `src/services/AdvancedStrategyService.js` — `addStrategy()` / `AdvancedStrategyTable.vue`

### AdvancedStrategy 结构

```json
{
  "id": "1700000000000",
  "name": "星湖科技",
  "isMarginAccount": false,
  "accountType": "default",
  "stockCode": "600866",
  "marketValue": "50000",
  "fiveYearAvgDividendYield": "3.2",
  "trendJudgment": "unset",
  "expiryDate": "",
  "oscillationGridSize": "0.5",
  "oscillationTradeAmount": "100",
  "breakoutGridSize": "1.0",
  "breakoutTradeAmount": "200",
  "decreaseSide": "COLLASELL",
  "decreaseStrategies": [],
  "increaseStrategies": [],
  "netPosition": 1000,
  "price": "10.50",
  "notes": "自动生成",
  "manualNotes": "",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T12:00:00.000Z"
}
```

| 字段 | 类型 | 必选 | 说明 |
|------|------|------|------|
| `id` | `string` | 是 | 唯一ID，格式：时间戳字符串 |
| `name` | `string` | 是 | 策略名称（通常为股票名称） |
| `isMarginAccount` | `boolean` | 否 | 是否融资融券账户，默认 `false` |
| `accountType` | `string` | 否 | 账户类型：`"default"` 或 `"credit"` |
| `stockCode` | `string` | 否 | 股票代码 |
| `marketValue` | `string` | 否 | 市值 |
| `fiveYearAvgDividendYield` | `string` | 否 | 5年平均股息率 |
| `trendJudgment` | `string` | 否 | 趋势判断：`"unset"` / `"unknown"` / `"up"` / `"down"` / `"oscillation"` / `"pullback"` |
| `expiryDate` | `string` | 否 | 过期日期 |
| `oscillationGridSize` | `string` | 否 | 震荡网格大小 |
| `oscillationTradeAmount` | `string` | 否 | 震荡交易数量 |
| `breakoutGridSize` | `string` | 否 | 突破网格大小 |
| `breakoutTradeAmount` | `string` | 否 | 突破交易数量 |
| `decreaseSide` | `string` | 否 | 下跌卖出方向，如 `"COLLASELL"` |
| `decreaseStrategies` | `Array` | 否 | 下跌策略列表 |
| `increaseStrategies` | `Array` | 否 | 上涨策略列表 |
| `netPosition` | `number` | 否 | 净持仓量 |
| `price` | `string` | 否 | 当前价格 |
| `notes` | `string` | 否 | 备注（系统生成） |
| `manualNotes` | `string` | 否 | 手动备注 |
| `createdAt` | `string` | 是 | 创建时间，ISO 8601 格式 |
| `updatedAt` | `string` | 否 | 更新时间，ISO 8601 格式 |

---

## 6. 趋势判断

**文件路径**: `app_data/stocks/trend_judgments/trend_judgment_{name}_{YYYY-MM-DD_HH-MM-SS}.json`  
**源代码**: `src/services/TrendJudgmentWebDAVSync.js` — `saveTrendJudgmentToWebDAV()`

文件名中的 `{name}` 为股票名称，日期为人类可读格式。每只股票每次保存会创建一个新文件。

### 趋势判断数据结构

```json
{
  "name": "星湖科技",
  "stockCode": "600866",
  "trendJudgment": "up",
  "trendJudgmentUpdatedAt": "2025-01-01T12:00:00.000Z",
  "autoTrendJudgment": "up",
  "autoTrendJudgmentUpdatedAt": "2025-01-01T12:00:00.000Z",
  "volatilityMetrics": {
    "price_drop_ratio": 15.2,
    "updated_at": "2025-01-01T12:00:00.000Z"
  },
  "volatilityMetricsUpdatedAt": "2025-01-01T12:00:00.000Z",
  "fiveYearAverageDividendYield": 3.2,
  "fiveYearAverageDividendYieldUpdatedAt": "2025-01-01T12:00:00.000Z"
}
```

| 字段 | 类型 | 必选 | 说明 |
|------|------|------|------|
| `name` | `string` | 是 | 股票名称 |
| `stockCode` | `string` | 是 | 股票代码 |
| `trendJudgment` | `string` | 否 | 手动趋势判断：`"unset"` / `"unknown"` / `"up"` / `"down"` / `"oscillation"` / `"pullback"` |
| `trendJudgmentUpdatedAt` | `string` | 否 | 手动趋势判断更新时间，ISO 8601 格式 |
| `autoTrendJudgment` | `string` | 否 | 自动趋势判断，取值同上 |
| `autoTrendJudgmentUpdatedAt` | `string` | 否 | 自动趋势判断更新时间，ISO 8601 格式 |
| `volatilityMetrics` | `object` | 否 | 波动率指标（可选，有数据时才包含） |
| `volatilityMetrics.price_drop_ratio` | `number` | 否 | 90天内最高点到当前价格下跌比率（%） |
| `volatilityMetrics.updated_at` | `string` | 否 | 波动率数据更新时间 |
| `volatilityMetricsUpdatedAt` | `string` | 否 | 波动率指标整体更新时间 |
| `fiveYearAverageDividendYield` | `number` | 否 | 5年平均股息率（可选，有数据时才包含） |
| `fiveYearAverageDividendYieldUpdatedAt` | `string` | 否 | 5年平均股息率更新时间 |

---

## 7. 持仓历史记录

**文件路径**: `app_data/stocks/holdings.default.{timestamp}.json`  
**源代码**: `src/services/holdings/HoldingsWebDAVManager.js`

文件名中的 `{timestamp}` 为 ISO 8601 格式时间戳。有两种类型的持仓数据文件：

### 7a. 持仓历史记录 (`type: "holdings_history"`)

**源方法**: `saveHistoryToWebDAV()`

```json
{
  "historyEntry": { ... },
  "exportTime": "2025-01-01T12:00:00.000Z",
  "version": "1.0",
  "type": "holdings_history"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `historyEntry` | `object` | 持仓历史条目（由 HoldingsService 生成的历史记录对象） |
| `exportTime` | `string` | 导出时间，ISO 8601 格式 |
| `version` | `string` | 数据版本号 |
| `type` | `string` | 数据类型标识：`"holdings_history"` |

### 7b. 持仓导出数据 (`type: "holdings_export"`)

**源方法**: `saveAllHoldingsToWebDAV()`

```json
{
  "holdingsData": { ... },
  "exportTime": "2025-01-01T12:00:00.000Z",
  "version": "1.0",
  "type": "holdings_export"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `holdingsData` | `object` | 持仓数据（包含完整的持仓信息和历史记录） |
| `holdingsData.history` | `Array` | 持仓历史记录数组（加载时使用此字段） |
| `exportTime` | `string` | 导出时间，ISO 8601 格式 |
| `version` | `string` | 数据版本号 |
| `type` | `string` | 数据类型标识：`"holdings_export"` |

---

## 8. 窗口配置

**文件路径**: `app_data/stocks/window_config.json`  
**源代码**: `src/directives/window.js` — `syncWindowPositionToWebDAV()`

### 窗口配置数据结构

```json
{
  "top": "50vh",
  "left": "50vw",
  "width": "600px",
  "height": "200px"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `top` | `string` | 窗口顶部位置（CSS 值，如 `"50vh"`、`"0px"`） |
| `left` | `string` | 窗口左侧位置（CSS 值，如 `"50vw"`、`"0px"`、`"auto"`） |
| `width` | `string` | 窗口宽度（CSS 值，如 `"600px"`、`"100vw"`、`"300px"`） |
| `height` | `string` | 窗口高度（CSS 值，如 `"200px"`、`"100vh"`、`"40px"`） |

> **注意**: 停靠模式下可能包含 `right` 字段（如 `"0px"`）。

---

## 9. 股票数据（WebDAVStockManager）

**源代码**: `src/utils/webdav/WebDAVStockManager.js`

### 9a. 股票数据 `stocks/data.json`

```json
{
  "stocks": [ ... ],
  "lastUpdated": "2025-01-01T12:00:00.000Z"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `stocks` | `Array` | 股票数据数组 |
| `lastUpdated` | `string` | 最后更新时间，ISO 8601 格式 |

### 9b. 关注列表 `stocks/watchlist.json`

```json
{
  "watchList": [ ... ],
  "lastUpdated": "2025-01-01T12:00:00.000Z"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `watchList` | `Array` | 关注的股票代码列表 |
| `lastUpdated` | `string` | 最后更新时间，ISO 8601 格式 |

---

## 10. 条件单调试日志

**文件路径**: `app_data/stocks/debug/condition_order_{timestamp}.json`  
**源代码**: `src/utils/ApiService.js` — 创建条件单时自动保存

文件名中的 `{timestamp}` 为 ISO 8601 格式（`:` 和 `.` 替换为 `-`）。

```json
{
  "strategyData": { ... },
  "createTime": "2025-01-01T12:00:00.000Z",
  "type": "condition_order",
  "version": "1.0"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `strategyData` | `object` | 发送到 API 创建条件单的完整策略数据 |
| `createTime` | `string` | 创建时间，ISO 8601 格式 |
| `type` | `string` | 数据类型标识：`"condition_order"` |
| `version` | `string` | 数据版本号 |

---

## WebDAV 同步架构

```
                    ┌─────────────────────┐
                    │   WebDAV Server     │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────┴──────┐  ┌─────┴──────┐  ┌──────┴─────────┐
    │ 单文件模式      │  │ 独立同步    │  │ WebDAVStock   │
    │ all_strategies │  │ (趋势/持仓  │  │ Manager       │
    │ .json          │  │  /窗口)     │  │ (data/watch)  │
    └────────────────┘  └────────────┘  └───────────────┘
```

**同步流程**：
1. **单文件模式（默认）**: `DataStorageService.syncAllStrategiesToWebDAV()` 将所有策略数据合并上传到 `all_strategies.json`
2. **多文件模式**: 各 Service 独立调用 `syncToWebDAV()` 上传到各自的文件
3. **独立同步**: 趋势判断、持仓、窗口配置有独立的同步逻辑
4. **上传前自动备份**: `WebDAVDataManager.uploadData()` 会在上传前将现有文件备份到 `.backup/` 目录（窗口配置文件除外）
