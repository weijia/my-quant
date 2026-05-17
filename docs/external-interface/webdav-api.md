# WebDAV 接口文档

## 概述

本项目使用 WebDAV 服务作为远程数据存储，用于同步策略数据、持仓数据和趋势判断数据。

- **服务器**: `your-webdav-server.com`
- **认证方式**: HTTP Basic Auth（用户名/密码）
- **使用文件**: `src/services/WebDAVImportService.js`

## 基础路径

| 用途 | URL |
|------|-----|
| 策略数据 | `https://your-webdav-server.com/dav/app_data/stocks/` |
| 持仓数据 | `https://your-webdav-server.com/dav/app_data/holdings/pingan/` |
| 趋势判断 | `https://your-webdav-server.com/dav/app_data/stocks/trend_judgments/` |

---

## 接口 1: 获取策略数据

### 请求

| 属性 | 值 |
|------|-----|
| 方法 | `GET` |
| URL | `https://your-webdav-server.com/dav/app_data/stocks/all_strategies.json` |
| 请求头 | `Accept: application/json` |

### 响应格式

```json
{
  "stockData": [],
  "advancedStrategies": [],
  "conditionalStrategies": [],
  "gridStrategies": [],
  "trendJudgments": {},
  "holdingsData": {
    "holdings": []
  }
}
```

### 字段说明

#### stockData / advancedStrategies

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 策略名称（可能包含股票代码） |
| `stockCode` | string | 股票代码（如 `600519`、`600519.SH`） |
| `accountType` | string | 账户类型：`"default"`（普通）、`"credit"`（信用） |
| `currentAmount` / `quantity` / `enableAmount` | number | 持仓数量 |
| `marketValue` | string | 市值（如 `"168,000"`、`"1.23万"`） |
| `decreasePercentage` | number/string | 下跌百分比 |
| `decreaseAmount` | number/string | 下跌金额 |
| `increasePercentage` | number/string | 上涨百分比 |
| `increaseAmount` | number/string | 上涨金额 |
| `oscillationGridSize` | number/string | 震荡网格大小 |
| `oscillationTradeAmount` | number/string | 震荡交易数量 |
| `breakoutGridSize` | number/string | 突破网格大小 |
| `breakoutTradeAmount` | number/string | 突破交易数量 |

#### conditionalStrategies

| 字段 | 类型 | 说明 |
|------|------|------|
| `stockCode` | string | 股票代码 |
| `stockName` | string | 股票名称 |
| `accountType` | string | 账户类型 |
| `deltaPercentage` / `delta` / `percentage` | number/string | 触发百分比 |
| `tradeVolume` / `volume` / `tradeAmount` / `amount` | number/string | 交易数量 |
| `side` | string | 交易方向：`"SELL"`、`"COLLSELL"`、`"SELL_SHORT"`、`"BUY"`、`"BUY_COVER"` |
| `tradingDirection` | string | 备选方向字段：`"buy"` / `"sell"` |

#### gridStrategies

| 字段 | 类型 | 说明 |
|------|------|------|
| `stockCode` | string | 股票代码 |
| `gridData` | array | 网格数据数组 |
| `gridData[].tradeAmount` | number/string | 网格交易数量 |

---

## 接口 2: 获取持仓数据

### 请求（两步操作）

**第一步：PROPFIND 列出目录文件**

| 属性 | 值 |
|------|-----|
| 方法 | `PROPFIND` |
| URL | `https://your-webdav-server.com/dav/app_data/holdings/pingan/` |
| 请求头 | `Depth: 1`, `Content-Type: application/xml` |

**第二步：GET 获取具体文件**

| 属性 | 值 |
|------|-----|
| 方法 | `GET` |
| URL | `https://your-webdav-server.com/dav/app_data/holdings/pingan/{动态JSON文件名}` |
| 请求头 | `Accept: application/json` |

### 响应格式

```json
{
  "holdings": [
    {
      "secuCode": "600519",
      "secuName": "贵州茅台",
      "mktQty": 100,
      "mktVal": "168000",
      "accountType": "default",
      "provider": "pingan"
    }
  ]
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `secuCode` | string | 股票代码 |
| `secuName` | string | 股票名称 |
| `mktQty` | number | 持仓数量 |
| `mktVal` | string | 持仓市值 |
| `accountType` | string | 账户类型 |
| `provider` | string | 数据来源（固定为 `"pingan"`） |

---

## 接口 3: 获取趋势判断数据

### 请求（两步操作）

**第一步：PROPFIND 列出目录文件**

| 属性 | 值 |
|------|-----|
| 方法 | `PROPFIND` |
| URL | `https://your-webdav-server.com/dav/app_data/stocks/trend_judgments/` |
| 请求头 | `Depth: 1`, `Content-Type: application/xml` |
| 文件匹配规则 | 文件名以 `trend_judgment_` 开头、`.json` 结尾 |

**第二步：GET 批量获取文件**

| 属性 | 值 |
|------|-----|
| 方法 | `GET` |
| URL | `https://your-webdav-server.com/dav/app_data/stocks/trend_judgments/trend_judgment_{stockCode}.json` |
| 请求头 | `Accept: application/json` |

### 单个文件响应格式

```json
{
  "stockCode": "600519",
  "trendJudgment": "up",
  "trendJudgmentUpdatedAt": "2025-01-01T00:00:00.000Z",
  "autoTrendJudgment": "up",
  "autoTrendJudgmentUpdatedAt": "2025-01-01T00:00:00.000Z",
  "decreasePercentage": 5.2,
  "price_drop_ratio": 0.052
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `stockCode` | string | 股票代码 |
| `trendJudgment` | string | 手动趋势判断值 |
| `trendJudgmentUpdatedAt` | string | 手动判断更新时间（ISO 8601） |
| `autoTrendJudgment` | string | 自动趋势判断值 |
| `autoTrendJudgmentUpdatedAt` | string | 自动判断更新时间（ISO 8601） |
| `decreasePercentage` | number | 下跌百分比 |
| `price_drop_ratio` | number | 90天内最高价与当前价的下跌比率（0-1） |

### 趋势值映射

| 原始值 | 标准值 | 显示名 |
|--------|--------|--------|
| `up` | `trend_up` | 上涨趋势 |
| `down` | `trend_down` | 下跌趋势 |
| `oscillation` | `trend_oscillation` | 震荡趋势 |
| `pullback` | `trend_pullback` | 回踩趋势 |
| `breakdown` | `trend_breakdown` | 下跌破位 |
| `unknown` | `trend_unknown` | 未知趋势 |

### 聚合后返回格式

以 `stockCode` 为 key 的 Map 对象：

```javascript
{
  "600519": {
    trendJudgment: "up",
    trendJudgmentUpdatedAt: "...",
    autoTrendJudgment: "up",
    autoTrendJudgmentUpdatedAt: "...",
    decreasePercentage: 5.2,
    price_drop_ratio: 0.052
  }
}
```

---

## CI/CD 中的 WebDAV 配置

### 发布静态站点到 WebDAV

- **配置文件**: `.github/workflows/webdav-publish.yml`
- **GitHub Action**: `weijia/action-upload-webdav@master`
- **目标路径**: `online/my-quant`
- **源目录**: `./dist`
- **配置参数**（来自 GitHub Secrets）:
  - `webdav-url`: WebDAV 服务器地址
  - `webdav-username`: 用户名
  - `webdav-password`: 密码
- **触发条件**: push 到 main/master、打 `v*` 标签、手动触发
