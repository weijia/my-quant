# 平安证券条件单 MQTT 消息格式

本文档定义 MQTT 协议中条件单相关消息的格式规范。

## 目录

- [1. 配置参数](#1-配置参数)
- [2. 消息信封](#2-消息信封)
- [3. 操作指令](#3-操作指令)
- [4. 响应消息](#4-响应消息)
- [5. 格式对比](#5-格式对比)

---

## 1. 配置参数

### 1.1 预置公共服务器

| 服务器名称 | WebSocket URL | 适用场景 |
|-----------|---------------|----------|
| EMQX 公共集群 | `wss://broker.emqx.io:8084/mqtt` | 测试、小规模使用 |
| HiveMQ 公共 Broker | `wss://broker.hivemq.com:8884/mqtt` | 临时测试、无需注册 |
| Mosquitto Test Server | `wss://test.mosquitto.org:8081/mqtt` | 简单验证 |

### 1.2 自定义服务器

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| serverUrl | string | 是 | MQTT Broker WebSocket 地址，如 `ws://192.168.1.100:8083/mqtt` 或 `wss://your-broker.com/mqtt` |
| serverName | string | 否 | 服务器名称标识，仅用于显示 |

### 1.3 Topic 配置

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| topic | string | 是 | MQTT 主题路径，建议格式：`user/{userId}/orders`，如 `user/xxxx/orders` |

### 1.4 认证配置

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| password | string | 是 | AES 加密密钥，用于加密/解密消息内容，建议使用 16 位及以上字符串 |
| clientId | string | 否 | 客户端唯一标识，默认自动生成 |
| username | string | 否 | MQTT 用户名（部分 Broker 需要） |
| authPassword | string | 否 | MQTT 认证密码（部分 Broker 需要） |

### 1.5 配置示例

```javascript
// 使用公共服务器
const config = {
  serverUrl: 'wss://broker.emqx.io:8084/mqtt',
  topic: 'user/xxxx/orders',
  password: 'your-aes-password-here',
  clientId: 'client_' + Date.now()
};

// 使用自定义服务器
const config = {
  serverUrl: 'wss://your-private-broker.com/mqtt',
  serverName: 'My MQTT Server',
  topic: 'user/xxxx/orders',
  password: 'your-aes-password-here',
  clientId: 'client_' + Date.now(),
  username: 'mqtt_user',      // 可选
  authPassword: 'mqtt_pass'   // 可选
};
```

---

## 2. 消息信封

所有 MQTT 消息采用统一的双层 JSON 结构：

### 2.1 外层信封（固定格式）

```javascript
{
  "id": "clientId_xxxx",       // 客户端唯一标识，用于识别自己发送的消息
  "msgId": "timestamp_random", // 消息唯一ID，用于去重
  "user": "User_xxxx",         // 用户标识
  "msg": "...",                // 消息内容（见 2.2）
  "time": 1704067200000        // 时间戳（毫秒）
}
```

### 2.2 msg 字段（条件单命令）

msg 字段是 JSON 字符串，包含 `action` 和 `data` 两个必需字段：

```javascript
{
  "action": "buy",          // 操作类型
  "data": {                 // 操作数据
    "stockCode": "002475",
    "stockName": "立讯精密",
    "tradeVolume": "300"
  }
}
```

### 2.3 加密传输

消息使用 AES 加密后通过 MQTT 发布：

```javascript
// 加密
const payload = JSON.stringify({
  id: clientId,
  msgId: msgId,
  user: 'User_xxxx',
  msg: JSON.stringify({ action: 'buy', data: {...} }),
  time: Date.now()
});
const encrypted = CryptoJS.AES.encrypt(payload, password).toString();
client.publish(topic, encrypted, { qos: 1 });

// 解密
const bytes = CryptoJS.AES.decrypt(encryptedMessage, password);
const data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
```

---

## 3. 操作指令

> **注意**：按钮管理命令（add/remove/list）请参阅 [api/add.md](./add.md)

### 3.1 buy - 创建买入条件单

**功能**: 创建买入条件单

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | string | 是 | 固定值: `buy` |
| data.stockCode | string | 是 | 股票代码 |
| data.tradeVolume | number | 否 | 交易数量 |
| data.percentage | number | 否 | 上涨触发百分比 |
| data.endDate | string | 否 | 条件单结束日期（格式 "YYYY-MM-DD"），不传则使用默认过期逻辑 |

**请求示例**:

```json
{
  "action": "buy",
  "data": {
    "stockCode": "002475",
    "tradeVolume": 300,
    "percentage": 0.5,
    "endDate": "2026-05-30"
  }
}
```

**响应**: 见 [4. 响应消息](#4-响应消息)

---

### 3.2 sell - 创建卖出条件单

**功能**: 创建卖出条件单

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | string | 是 | 固定值: `sell` |
| data.stockCode | string | 是 | 股票代码 |
| data.tradeVolume | number | 否 | 交易数量 |
| data.percentage | number | 否 | 下跌触发百分比 |
| data.endDate | string | 否 | 条件单结束日期（格式 "YYYY-MM-DD"），不传则使用默认过期逻辑 |

**请求示例**:

```json
{
  "action": "sell",
  "data": {
    "stockCode": "002475",
    "tradeVolume": 300,
    "percentage": 0.5,
    "endDate": "2026-05-30"
  }
}
```

**响应**: 见 [4. 响应消息](#4-响应消息)

---

## 4. 响应消息

### 4.1 创建买入条件单成功

```json
{
  "type": "buy_order_created",
  "status": "success",
  "orderId": "002475"
}
```

### 4.2 创建卖出条件单成功

```json
{
  "type": "sell_order_created",
  "status": "success",
  "orderId": "002475"
}
```

### 4.3 创建条件单失败

```json
{
  "type": "order_created",
  "status": "error",
  "message": "按钮不存在，请先使用 add 命令添加"
}
```

### 4.4 按钮相关响应

按钮管理响应的详细格式请参阅 [api/add.md](./add.md)：

- `button_added` - 添加按钮成功/失败
- `button_removed` - 移除按钮成功
- `order_list` - 按钮列表

---

## 5. 格式对比

### 5.1 各端点消息格式

| 端点 | action 字段 | data 字段 | 特点 |
|------|-------------|-----------|------|
| pingan 脚本 (接收) | ✅ 必需 | ✅ 必需 | 结构化命令 |
| pingan 脚本 (发送) | ❌ 无 | ❌ 无 | 直接 JSON 字符串 |
| server.js (接收) | ❌ 无 | ❌ 无 | 直接 `msg` 字段作为 code 执行 |
| server.js (发送) | ❌ 无 | ❌ 无 | 直接 JSON 字符串 |

### 5.2 统一规范

为保证跨端点兼容性，发送命令时使用以下格式：

```javascript
// 发送命令
{
  id: clientId,
  msgId: msgId,
  user: 'User_xxxx',
  msg: JSON.stringify({
    action: 'buy',  // 统一使用 action + data 结构
    data: {...}
  }),
  time: Date.now()
}

// 发送响应
{
  id: clientId,
  msgId: msgId,
  user: 'User_xxxx',
  msg: JSON.stringify({
    type: 'buy_order_created',  // 使用 type 表示响应类型
    status: 'success',
    data: {...}
  }),
  time: Date.now()
}
```

---

## 6. 工作流程

```
┌─────────────────────────────────────────────────────────────┐
│                       上层应用                               │
│  (同时发送 buy + sell，自动创建双向条件单)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ add (添加按钮)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    pingan-condition-order.user.js           │
│                   (Userscript - 按钮管理)                      │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              │ buy (买入条件单)                │ sell (卖出条件单)
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│  平安证券 - 反弹买入     │     │  平安证券 - 回落卖出     │
│  /reboundBuy            │     │  /fallingSell           │
└─────────────────────────┘     └─────────────────────────┘
```

### 典型使用场景

```javascript
// 1. 创建买入条件单
service.sendBuyOrder({ stockCode: '002475', stockName: '立讯精密', tradeVolume: 300, percentage: 0.5, endDate: '2026-05-30' });

// 2. 创建卖出条件单
service.sendSellOrder({ stockCode: '002475', stockName: '立讯精密', tradeVolume: 300, percentage: 0.5, endDate: '2026-05-30' });

// 3. 创建双向条件单
service.sendBothOrders({ stockCode: '002475', stockName: '立讯精密', tradeVolume: 300, percentage: 0.5, endDate: '2026-05-30' });
```
