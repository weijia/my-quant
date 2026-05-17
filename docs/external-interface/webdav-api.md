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
| URL | `https://your-webdav-server.com/dav/app_data/stocks/trend_judgments/trend_judgment_{stockName}_{date}_{time}.json` |
| 请求头 | `Accept: application/json` |

### 单个文件响应格式

```json
{
  "name": "星湖科技",
  "stockCode": "600866",
  "trendJudgment": "down",
  "trendJudgmentUpdatedAt": "2025-11-15T11:34:00.559Z",
  "autoTrendJudgment": "up",
  "autoTrendJudgmentUpdatedAt": "2025-12-19T00:00:00",
  "volatilityMetrics": {
    "daily_price_volatility": 0.0117,
    "price_range_volatility": 0.0117,
    "close_position_volatility": 0.0088,
    "volatility_5d_ma": 0.0205,
    "volatility_10d_ma": 0.0178,
    "volatility_15d_ma": 0.0156,
    "max_high_price": 8.55,
    "current_price": 6.86,
    "price_drop_value": 1.69,
    "price_drop_ratio": 19.77
  },
  "volatilityMetricsUpdatedAt": "2025-12-19T19:40:46.510916",
  "fiveYearAverageDividendYield": 0.92,
  "fiveYearAverageDividendYieldUpdatedAt": "2025-12-05T19:10:15.656062Z",
  "previousDayChangePercent": 0.29,
  "previousDayChangePercentUpdatedAt": "2025-12-19T19:40:46.510916",
  "createTime": "2025-12-07T12:11:49.191830",
  "previousDayChangeDate": "2025-12-19T00:00:00"
}
```

### 字段说明

#### 核心字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 股票名称 |
| `stockCode` | string | 股票代码（如 `600866`） |
| `trendJudgment` | string | 手动趋势判断值 |
| `trendJudgmentUpdatedAt` | string | 手动判断更新时间（ISO 8601） |
| `autoTrendJudgment` | string | 自动趋势判断值 |
| `autoTrendJudgmentUpdatedAt` | string | 自动判断更新时间（ISO 8601） |

#### volatilityMetrics（波动率指标）

| 字段 | 类型 | 说明 |
|------|------|------|
| `daily_price_volatility` | number | 日价格波动率 |
| `price_range_volatility` | number | 价格区间波动率 |
| `close_position_volatility` | number | 收盘位置波动率 |
| `volatility_5d_ma` | number | 5日波动率移动平均 |
| `volatility_10d_ma` | number | 10日波动率移动平均 |
| `volatility_15d_ma` | number | 15日波动率移动平均 |
| `max_high_price` | number | 90天内最高价 |
| `current_price` | number | 当前价格 |
| `price_drop_value` | number | 相对最高价的下跌金额 |
| `price_drop_ratio` | number | 相对最高价的下跌百分比（%） |
| `volatilityMetricsUpdatedAt` | string | 波动率指标更新时间 |

#### 其他字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `fiveYearAverageDividendYield` | number | 五年平均股息率 |
| `fiveYearAverageDividendYieldUpdatedAt` | string | 五年平均股息率更新时间 |
| `previousDayChangePercent` | number | 前一日涨跌幅（%） |
| `previousDayChangePercentUpdatedAt` | string | 前一日涨跌幅更新时间 |
| `previousDayChangeDate` | string | 前一日日期 |
| `createTime` | string | 记录创建时间 |

### 趋势值说明

#### 原始趋势值（WebDAV 文件中的值）

| 原始值 | 说明 |
|--------|------|
| `up` | 上涨趋势 |
| `down` | 下跌趋势 |
| `oscillation` | 震荡趋势 |
| `pullback` | 回踩趋势 |
| `breakdown` | 下跌破位 |
| `unset` | 未设置 |
| `high_volatility` | 高波动 |
| `medium_volatility` | 中波动 |
| `low_volatility` | 低波动 |
| `trend_breakdown` | 下跌破位 |

#### 标准趋势值（my-quant 内部存储的格式）

如果原始值没有前缀，导入时会自动添加 `trend_` 前缀：

| 原始值 | 标准值 |
|--------|--------|
| `up` | `trend_up` |
| `down` | `trend_down` |
| `oscillation` | `trend_oscillation` |

### 聚合后返回格式

以 `stockCode` 为 key 的 Map 对象，按更新时间合并多条记录：

```javascript
{
  "600866": {
    trendJudgment: "down",
    trendJudgmentUpdatedAt: "2025-11-15T11:34:00.559Z",
    autoTrendJudgment: "up",
    autoTrendJudgmentUpdatedAt: "2025-12-19T00:00:00",
    decreasePercentage: null,
    price_drop_ratio: 19.77
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
