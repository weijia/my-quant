/**
 * MQTT 条件单服务
 * 用于通过 MQTT 协议向平安证券条件单脚本发送指令
 */

// 预置公共服务器列表
export const PRESET_SERVERS = [
  {
    id: 'emqx',
    name: 'EMQX 公共集群',
    url: 'wss://broker.emqx.io:8084/mqtt'
  },
  {
    id: 'hivemq',
    name: 'HiveMQ 公共 Broker',
    url: 'wss://broker.hivemq.com:8884/mqtt'
  },
  {
    id: 'mosquitto',
    name: 'Mosquitto Test Server',
    url: 'wss://test.mosquitto.org:8081/mqtt'
  }
];

import appConfigService from './AppConfigService.js'

// 默认配置
const DEFAULT_MQTT_CONFIG = {
  serverType: 'emqx',           // 预置服务器 ID 或 'custom'
  serverUrl: 'wss://broker.emqx.io:8084/mqtt',
  serverName: 'EMQX 公共集群',
  topic: 'test/myquant/orders',
  password: 'testpass',
  clientId: 'myquant_' + Math.random().toString(16).slice(2, 8)
};

// 从统一配置服务加载 MQTT 配置
const loadConfig = () => {
  try {
    const mqttConfig = appConfigService.getMqttConfig()
    if (mqttConfig && mqttConfig.serverUrl) {
      return { ...DEFAULT_MQTT_CONFIG, ...mqttConfig };
    }
  } catch (e) {
    console.error('[MQTT] 加载配置失败:', e);
  }
  return { ...DEFAULT_MQTT_CONFIG };
};

// 保存配置到统一配置服务
const saveConfig = (config) => {
  appConfigService.updateMqttConfig(config);
};

// 获取当前运行时配置
const getRuntimeConfig = () => {
  return loadConfig();
};

class MQTTConditionOrderService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.agentOnline = false;
    this.pendingMessages = new Map();
    this._messageCallbacks = [];
    this.onMessageCallback = null;
    this.onConnectCallback = null;
    this.onAgentStatusCallback = null;
    this._pingTimer = null;
    this._pongTimeout = null;
  }

  getConfig() {
    return loadConfig();
  }

  updateConfig(newConfig) {
    const current = loadConfig();
    const merged = { ...current, ...newConfig };
    saveConfig(merged);
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.client && this.connected) {
        resolve();
        return;
      }

      const config = loadConfig();

      try {
        this.client = mqtt.connect(config.serverUrl, {
          clientId: config.clientId,
          reconnectPeriod: 5000
        });

        this.client.on('connect', () => {
          console.log('[MQTT] Connected to broker:', config.serverUrl);
          this.connected = true;
          this.client.subscribe(config.topic, { qos: 1 }, (err) => {
            if (err) {
              console.error('[MQTT] Subscribe error:', err);
              reject(err);
            } else {
              console.log('[MQTT] Subscribed to topic:', config.topic);
              if (this.onConnectCallback) this.onConnectCallback();
              resolve();
              // 连接成功后立即 ping 一次，然后定时 ping
              this.ping();
              this.startPingInterval();
            }
          });
        });

        this.client.on('message', (topic, payload) => {
          this.handleMessage(payload.toString());
        });

        this.client.on('error', (err) => {
          console.error('[MQTT] Error:', err);
          this.connected = false;
          reject(err);
        });

        this.client.on('close', () => {
          console.log('[MQTT] Connection closed');
          this.connected = false;
          this.agentOnline = false;
          this.stopPingInterval();
          if (this.onAgentStatusCallback) this.onAgentStatusCallback(false);
        });

      } catch (error) {
        console.error('[MQTT] Connect error:', error);
        reject(error);
      }
    });
  }

  handleMessage(encryptedData) {
    try {
      const config = loadConfig();
      const bytes = CryptoJS.AES.decrypt(encryptedData, config.password);
      const raw = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!raw) {
        console.error('[MQTT] Decryption failed');
        return;
      }

      const data = JSON.parse(raw);
      
      // 忽略自己的消息
      if (data.id === config.clientId) return;

      // 处理 pong 响应
      if (data.msg === 'pong') {
        console.log('[MQTT] Received pong from agent:', data.id);
        this.agentOnline = true;
        if (this._pongTimeout) {
          clearTimeout(this._pongTimeout);
          this._pongTimeout = null;
        }
        if (this.onAgentStatusCallback) this.onAgentStatusCallback(true);
        return;
      }

      // 解析 msg 字段
      let msgData;
      try {
        msgData = JSON.parse(data.msg);
      } catch {
        msgData = data.msg;
      }

      if (this.onMessageCallback) {
        this.onMessageCallback(data, msgData);
      }
      // 同时调用额外注册的回调
      for (const cb of this._messageCallbacks) {
        try { cb(data, msgData); } catch (e) { console.error('[MQTT] callback error:', e); }
      }
    } catch (e) {
      console.error('[MQTT] Error handling message:', e);
    }
  }

  sendCommand(action, data) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('MQTT not connected'));
        return;
      }

      const config = loadConfig();
      const msgId = Date.now() + '_' + Math.random().toString(16).slice(2, 6);
      
      const payload = {
        id: config.clientId,
        msgId: msgId,
        user: 'myquant',
        msg: JSON.stringify({ action, data }),
        time: Date.now()
      };

      const payloadStr = JSON.stringify(payload);
      const cipher = CryptoJS.AES.encrypt(payloadStr, config.password).toString();

      this.client.publish(config.topic, cipher, { qos: 1 }, (err) => {
        if (err) {
          console.error('[MQTT] Publish error:', err);
          reject(err);
        } else {
          console.log('[MQTT] Command sent:', action, data);
          resolve({ msgId, payload });
        }
      });
    });
  }

  /**
   * 添加按钮到列表
   * @param {Object} params - 参数
   * @param {string} params.stockCode - 股票代码
   * @param {string} params.stockName - 股票名称
   * @param {number} params.tradeVolume - 预设交易数量
   * @param {number} params.percentage - 预设触发百分比
   * @param {string} params.provider - 券商名称，默认 "pingan"
   * @param {string} params.accountType - 账户类型，默认 "default"
   */
  async addButton({ stockCode, stockName, tradeVolume = 100, percentage = 0.5, provider = 'pingan', accountType = 'default' }) {
    return this.sendCommand('add', {
      provider,
      accountType,
      stockCode,
      stockName,
      tradeVolume,
      percentage
    });
  }

  /**
   * 创建实际条件单
   * @param {Object} params - 参数
   * @param {string} params.stockCode - 股票代码
   * @param {number} params.tradeVolume - 交易数量
   * @param {number} params.percentage - 触发百分比
   */
  async createConditionOrder({ stockCode, tradeVolume = 100, percentage = 0.5 }) {
    return this.sendCommand('create', {
      stockCode,
      tradeVolume,
      percentage
    });
  }

  /**
   * 发送买入条件单
   */
  async sendBuyOrder({ stockCode, stockName, tradeVolume = 100, tradeAmount, percentage = 0.5, provider = 'pingan', accountType = 'default', side, endDate }) {
    const data = {
      stockCode,
      stockName,
      percentage: Math.abs(percentage),
      provider,
      accountType
    };
    if (tradeAmount) {
      data.tradeAmount = tradeAmount;
    }
    if (tradeVolume) {
      data.tradeVolume = tradeVolume;
    }
    if (side) {
      data.side = side;
    }
    if (endDate) {
      data.endDate = endDate;
    }
    console.log('[MQTT] 发送买入订单:', JSON.stringify(data));
    return this.sendCommand('buy', data);
  }

  /**
   * 发送卖出条件单
   */
  async sendSellOrder({ stockCode, stockName, tradeVolume = 100, tradeAmount, percentage = 0.5, provider = 'pingan', accountType = 'default', side, endDate }) {
    const data = {
      stockCode,
      stockName,
      percentage: Math.abs(percentage),
      provider,
      accountType
    };
    if (tradeAmount) {
      data.tradeAmount = tradeAmount;
    }
    if (tradeVolume) {
      data.tradeVolume = tradeVolume;
    }
    if (side) {
      data.side = side;
    }
    if (endDate) {
      data.endDate = endDate;
    }
    console.log('[MQTT] 发送卖出订单:', JSON.stringify(data));
    return this.sendCommand('sell', data);
  }

  /**
   * 发送双向条件单（同时创建买入和卖出）
   */
  async sendBothOrders({ stockCode, stockName, tradeVolume = 100, percentage = 0.5, provider = 'pingan', accountType = 'default', endDate }) {
    const buyResult = await this.sendBuyOrder({ stockCode, stockName, tradeVolume, percentage, provider, accountType, endDate });
    const sellResult = await this.sendSellOrder({ stockCode, stockName, tradeVolume, percentage, provider, accountType, endDate });
    return { buyResult, sellResult };
  }

  /**
   * 移除按钮
   * @param {string} stockCode - 股票代码
   */
  async removeButton(stockCode) {
    return this.sendCommand('remove', { stockCode });
  }

  /**
   * 取消条件单（仅移除按钮）
   * @param {string} stockCode - 股票代码
   */
  async cancelOrder(stockCode) {
    return this.removeButton(stockCode);
  }

  onMessage(callback) {
    this.onMessageCallback = callback;
  }

  /**
   * 添加额外的消息回调（不会覆盖主回调）
   * @param {Function} callback
   * @returns {Function} 取消注册函数
   */
  addMessageListener(callback) {
    this._messageCallbacks.push(callback);
    return () => {
      const idx = this._messageCallbacks.indexOf(callback);
      if (idx >= 0) this._messageCallbacks.splice(idx, 1);
    };
  }

  onConnect(callback) {
    this.onConnectCallback = callback;
  }

  disconnect() {
    this.stopPingInterval();
    if (this.client) {
      this.client.end(true);
      this.connected = false;
    }
    this.agentOnline = false;
  }

  /**
   * 发送 ping 消息检测 agent 是否在线
   */
  ping() {
    if (!this.connected) return;

    const config = loadConfig();
    const payload = {
      id: config.clientId,
      msgId: Date.now() + '_ping',
      user: 'myquant',
      msg: 'ping',
      time: Date.now()
    };

    const payloadStr = JSON.stringify(payload);
    const cipher = CryptoJS.AES.encrypt(payloadStr, config.password).toString();

    this.client.publish(config.topic, cipher, { qos: 1 }, (err) => {
      if (err) {
        console.error('[MQTT] Ping publish error:', err);
      } else {
        console.log('[MQTT] Ping sent');
      }
    });

    // 设置超时：5秒内未收到 pong 则标记 agent 离线
    if (this._pongTimeout) clearTimeout(this._pongTimeout);
    this._pongTimeout = setTimeout(() => {
      if (this.agentOnline) {
        this.agentOnline = false;
        if (this.onAgentStatusCallback) this.onAgentStatusCallback(false);
        console.log('[MQTT] Agent ping timeout, marking offline');
      }
    }, 5000);
  }

  /**
   * 定时 ping（每 30 秒）
   */
  startPingInterval() {
    this.stopPingInterval();
    this._pingTimer = setInterval(() => {
      this.ping();
    }, 30000);
  }

  stopPingInterval() {
    if (this._pingTimer) {
      clearInterval(this._pingTimer);
      this._pingTimer = null;
    }
    if (this._pongTimeout) {
      clearTimeout(this._pongTimeout);
      this._pongTimeout = null;
    }
  }

  onAgentStatus(callback) {
    this.onAgentStatusCallback = callback;
  }

  /**
   * 获取持仓列表
   * @param {Object} params
   * @param {string} params.provider - 券商类型：'pingan'（平安）或 'founder'（方正）
   * @param {string} params.accountType - 账户类型：'normal'/'credit'，不传返回全部
   * @param {boolean} params.forceRefresh - 是否强制刷新，默认 false
   * @returns {Promise<Object>} 返回持仓数据
   */
  async getHoldings({ provider = 'founder', accountType, forceRefresh = false }) {
    const data = { provider, forceRefresh };
    if (accountType) data.accountType = accountType;
    return this.sendCommand('get_holdings', data);
  }
}

// 导出单例
const mqttConditionService = new MQTTConditionOrderService();

export default mqttConditionService;
export { MQTTConditionOrderService, getRuntimeConfig };
