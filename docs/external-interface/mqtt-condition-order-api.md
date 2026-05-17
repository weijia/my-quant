# 平安证券条件单 MQTT 消息格式

本文档定义 MQTT 协议中条件单相关消息的格式规范。

## 目录

- [1. 消息信封](#1-消息信封)
- [2. 操作指令](#2-操作指令)
- [3. 响应消息](#3-响应消息)
- [4. 格式对比](#4-格式对比)

---

## 1. 消息信封

所有 MQTT 消息采用统一的双层 JSON 结构：

### 1.1 外层信封（固定格式）

```javascript
{
  "id": "clientId_xxxx",       // 客户端唯一标识，用于识别自己发送的消息
  "msgId": "timestamp_random", // 消息唯一ID，用于去重
  "user": "User_xxxx",         // 用户标识
  "msg": "...",                // 消息内容（见 1.2）
  "time": 1704067200000        // 时间戳（毫秒）
}
```

### 1.2 msg 字段（条件单命令）

msg 字段是 JSON 字符串，包含 `action` 和 `data` 两个必需字段：

```javascript
{
  "action": "create",         // 操作类型
  "data": {                   // 操作数据
    "stockCode": "002475",
    "stockName": "立讯精密",
    "tradeVolume": "300"
  }
}
```

### 1.3 加密传输

消息使用 AES 加密后通过 MQTT 发布：

```javascript
// 加密
const payload = JSON.stringify({
  id: clientId,
  msgId: msgId,
  user: 'User_xxxx',
  msg: JSON.stringify({ action: 'create', data: {...} }),
  time: Date.now()
});
const encrypted = CryptoJS.AES.encrypt(payload, password).toString();
client.publish(topic, encrypted, { qos: 1 });

// 解密
const bytes = CryptoJS.AES.decrypt(encryptedMessage, password);
const data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
```

---

## 2. 操作指令

### 2.1 create - 创建条件单

**功能**: 创建新的买入和卖出条件单

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | string | 是 | 固定值: `create` |
| data.provider | string | 否 | 券商名称，默认 "pingan" (平安证券) |
| data.accountType | string | 否 | 账户类型: `default`=普通账户, `credit`=信用账户，默认 "default" |
| data.stockCode | string | 是 | 股票代码 (6位数字) |
| data.stockName | string | 否 | 股票名称，不填显示"未知股票" |
| data.tradeVolume | number | 否 | 交易数量（100的倍数），默认 100 |
| data.percentage | number | 否 | 触发百分比，如 5 表示涨跌 5% 后触发，默认 0.5 |

**请求示例**:

```json
{
  "action": "create",
  "data": {
    "provider": "pingan",
    "accountType": "default",
    "stockCode": "002475",
    "stockName": "立讯精密",
    "tradeVolume": 300,
    "percentage": 5
  }
}
```

**响应**: 见 [3. 响应消息](#3-响应消息)

---

### 2.2 cancel - 取消订单

**功能**: 取消指定的订单

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | string | 是 | 固定值: `cancel` |
| data.stockCode | string | 是 | 股票代码 |

**请求示例**:

```json
{
  "action": "cancel",
  "data": {
    "stockCode": "002475"
  }
}
```

---

### 2.4 list - 列出订单

**功能**: 列出所有订单

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | string | 是 | 固定值: `list` |
| data | object | 是 | 空对象 `{}` |

**请求示例**:

```json
{
  "action": "list",
  "data": {}
}
```

---

### 2.5 ping - 连接测试

**功能**: 测试 MQTT 连接是否正常

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | string | 是 | 固定值: `ping` |
| data | object | 是 | 空对象 `{}` |

**请求示例**:

```json
{
  "action": "ping",
  "data": {}
}
```

**响应**:

```json
{
  "msg": "pong",
  "user": "User_xxxx",
  "time": 1704067200000
}
```

---

## 3. 响应消息

### 3.1 创建成功

```json
{
  "type": "order_created",
  "status": "success",
  "orderId": "002475"
}
```

### 3.2 创建失败

```json
{
  "type": "order_created",
  "status": "error",
  "message": "错误描述"
}
```

### 3.3 取消成功

```json
{
  "type": "order_canceled",
  "status": "success",
  "orderId": "002475"
}
```

### 3.4 列出订单

```json
{
  "type": "order_list",
  "total": 2,
  "data": [
    {
      "name": "立讯精密",
      "stockCode": "002475",
      "amount": "300"
    }
  ]
}
```

---

## 4. 格式对比

### 4.1 各端点消息格式

| 端点 | action 字段 | data 字段 | 特点 |
|------|-------------|-----------|------|
| pingan 脚本 (接收) | ✅ 必需 | ✅ 必需 | 结构化命令 |
| pingan 脚本 (发送) | ❌ 无 | ❌ 无 | 直接 JSON 字符串 |
| server.js (接收) | ❌ 无 | ❌ 无 | 直接 `msg` 字段作为 code 执行 |
| server.js (发送) | ❌ 无 | ❌ 无 | 直接 JSON 字符串 |

### 4.2 统一规范

为保证跨端点兼容性，发送命令时使用以下格式：

```javascript
// 发送命令
{
  id: clientId,
  msgId: msgId,
  user: 'User_xxxx',
  msg: JSON.stringify({
    action: 'create',  // 统一使用 action + data 结构
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
    type: 'order_created',  // 使用 type 表示响应类型
    status: 'success',
    data: {...}
  }),
  time: Date.now()
}
```
