# PouchDB 本地数据库文档

## 概述

本项目使用 PouchDB 作为本地数据库，数据存储在浏览器的 IndexedDB 中，支持离线使用和数据导入导出。

- **数据库名称**: `my_quant_strategies`
- **存储引擎**: IndexedDB（PouchDB 默认适配器）
- **CDN 地址**: `https://cdn.jsdelivr.net/npm/pouchdb@9.0.0/dist/pouchdb.min.js`
- **引入方式**: 在 `index.html` 中通过 `<script>` 标签全局加载
- **访问方式**: `window.PouchDB`
- **使用文件**: `src/utils/Database.js`

---

## 文档 ID 设计

### ID 前缀

| 前缀 | 用途 |
|------|------|
| `strategy_` | 策略文档 |
| `condition_` | 条件单文档 |
| `trend_` | 趋势历史文档 |

### ID 生成格式

```
{prefix}{timestamp}_{random9chars}
```

示例: `strategy_1716000000000_a1b2c3d4e`

---

## 数据库操作 API

| 方法 | 操作 | 说明 |
|------|------|------|
| `db.put(doc)` | 创建/更新文档 | PouchDB 标准 API |
| `db.get(id)` | 读取文档 | 通过 `_id` 获取 |
| `db.remove(doc)` | 删除文档 | 需要完整的 doc（含 `_rev`） |
| `db.allDocs({include_docs, startkey, endkey})` | 范围查询 | 使用前缀范围过滤文档类型 |
| `db.allDocs({include_docs: true})` | 全量查询 | 用于导出和清空 |

---

## 数据结构

### 策略文档 (strategy_)

```json
{
  "_id": "strategy_1716000000000_a1b2c3d4e",
  "_rev": "1-abc123",
  "id": "strategy_1716000000000_a1b2c3d4e",
  "name": "贵州茅台",
  "stockCode": "600519",
  "accountType": "default",
  "provider": "",
  "isMarginAccount": false,
  "netPosition": 100,
  "marketValue": "168,000",
  "fiveYearAvgDividendYield": "2.5",
  "profitLoss": "+5.2",
  "changePercent": "+2.3",
  "decreasePercentage": "5",
  "decreaseAmount": "200",
  "increasePercentage": "8",
  "increaseAmount": "300",
  "trendJudgment": "trend_up",
  "trendJudgmentUpdatedAt": "2025-01-01T00:00:00.000Z",
  "expiryDate": "",
  "oscillationGridSize": "2.5",
  "oscillationTradeAmount": "100",
  "breakoutGridSize": "5.0",
  "breakoutTradeAmount": "200",
  "decreaseSide": "COLLSELL",
  "decreaseStrategies": [
    {
      "deltaPercentage": "5",
      "tradeVolume": "200",
      "side": "SELL"
    }
  ],
  "increaseStrategies": [
    {
      "deltaPercentage": "8",
      "tradeVolume": "300",
      "side": "BUY"
    }
  ],
  "notes": "",
  "manualNotes": "长期持有",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

#### 策略字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | string | PouchDB 文档 ID |
| `_rev` | string | PouchDB 版本号 |
| `id` | string | 冗余存储的业务 ID |
| `name` | string | 策略名称 |
| `stockCode` | string | 股票代码（如 `600519`） |
| `accountType` | string | 账户类型：`"default"` / `"credit"` |
| `provider` | string | 数据来源（如 `"pingan"`） |
| `isMarginAccount` | boolean | 是否融资融券账户 |
| `netPosition` | number | 净持仓数量 |
| `marketValue` | string | 市值 |
| `fiveYearAvgDividendYield` | string | 5年平均股息率 |
| `profitLoss` | string | 盈亏百分比 |
| `changePercent` | string | 涨跌百分比 |
| `decreasePercentage` | string | 下跌触发百分比 |
| `decreaseAmount` | string | 下跌触发金额 |
| `increasePercentage` | string | 上涨触发百分比 |
| `increaseAmount` | string | 上涨触发金额 |
| `trendJudgment` | string | 趋势判断值 |
| `trendJudgmentUpdatedAt` | string | 趋势更新时间 |
| `expiryDate` | string | 到期日期 |
| `oscillationGridSize` | string | 震荡网格大小 |
| `oscillationTradeAmount` | string | 震荡交易数量 |
| `breakoutGridSize` | string | 突破网格大小 |
| `breakoutTradeAmount` | string | 突破交易数量 |
| `decreaseSide` | string | 下跌交易方向：`"COLLSELL"` / `"SELL"` / `"MARGINSELL"` |
| `decreaseStrategies` | array | 下跌减仓策略数组 |
| `increaseStrategies` | array | 上涨加仓策略数组 |
| `notes` | string | 备注 |
| `manualNotes` | string | 手动备注 |
| `createdAt` | string | 创建时间（ISO 8601） |
| `updatedAt` | string | 更新时间（ISO 8601） |

### 条件单文档 (condition_)

```json
{
  "_id": "condition_1716000000000_x1y2z3w4",
  "_rev": "1-def456",
  "id": "condition_1716000000000_x1y2z3w4",
  "strategyId": "strategy_xxx",
  "deltaPercentage": "5",
  "deltaAmount": "",
  "tradeVolume": "200",
  "side": "BUY",
  "createDate": "2025-01-01",
  "expiredTime": "",
  "status": "active",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

#### 条件单字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `strategyId` | string | 关联的策略 ID |
| `deltaPercentage` | string | 触发百分比 |
| `deltaAmount` | string | 触发金额 |
| `tradeVolume` | string | 交易数量（股） |
| `side` | string | 交易方向：`"BUY"` / `"SELL"` / `"MARGINBUY"` / `"MARGINSELL"` / `"COLLSELL"` |
| `createDate` | string | 创建日期 |
| `expiredTime` | string | 过期时间 |
| `status` | string | 状态：`"active"` / `"stopped"` |

### 趋势历史文档 (trend_)

```json
{
  "_id": "trend_1716000000000_m1n2o3p4",
  "strategyId": "strategy_xxx",
  "trend": "trend_up",
  "updatedAt": "2025-01-01T00:00:00.000Z",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

---

## 数据导入/导出

### 导出

- 调用 `db.allDocs({include_docs: true})` 获取全部文档
- 序列化为 JSON 字符串
- 通过 `Blob` + `URL.createObjectURL` 触发文件下载

### 导入

- 解析上传的 JSON 数组
- 删除每条记录的 `_rev` 字段
- 逐条调用 `db.put()` 写入

### 清空

- 按前缀范围查询（如 `startkey: "strategy_"`, `endkey: "strategy_\ufff0"`）
- 批量调用 `db.remove()` 删除
