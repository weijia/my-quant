/**
 * MQTT 条件单服务
 * 用于通过 MQTT 协议向平安证券条件单脚本发送指令
 */

const MQTT_CONFIG = {
  broker: 'wss://broker.emqx.io:8084/mqtt',
  topic: 'secure/stock-condition-order',
  password: 'stock_condition_order_Secret',
  clientId: 'myquant_' + Math.random().toString(16).slice(2, 8)
};

class MQTTConditionOrderService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.pendingMessages = new Map();
    this.onMessageCallback = null;
    this.onConnectCallback = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.client && this.connected) {
        resolve();
        return;
      }

      try {
        this.client = mqtt.connect(MQTT_CONFIG.broker, {
          clientId: MQTT_CONFIG.clientId,
          reconnectPeriod: 5000
        });

        this.client.on('connect', () => {
          console.log('[MQTT] Connected to broker');
          this.connected = true;
          this.client.subscribe(MQTT_CONFIG.topic, { qos: 1 }, (err) => {
            if (err) {
              console.error('[MQTT] Subscribe error:', err);
              reject(err);
            } else {
              console.log('[MQTT] Subscribed to topic:', MQTT_CONFIG.topic);
              if (this.onConnectCallback) this.onConnectCallback();
              resolve();
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
        });

      } catch (error) {
        console.error('[MQTT] Connect error:', error);
        reject(error);
      }
    });
  }

  handleMessage(encryptedData) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, MQTT_CONFIG.password);
      const raw = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!raw) {
        console.error('[MQTT] Decryption failed');
        return;
      }

      const data = JSON.parse(raw);
      
      // 忽略自己的消息
      if (data.id === MQTT_CONFIG.clientId) return;

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

      const msgId = Date.now() + '_' + Math.random().toString(16).slice(2, 6);
      
      const payload = {
        id: MQTT_CONFIG.clientId,
        msgId: msgId,
        user: 'myquant',
        msg: JSON.stringify({ action, data }),
        time: Date.now()
      };

      const payloadStr = JSON.stringify(payload);
      const cipher = CryptoJS.AES.encrypt(payloadStr, MQTT_CONFIG.password).toString();

      this.client.publish(MQTT_CONFIG.topic, cipher, { qos: 1 }, (err) => {
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
   * 发送买入条件单
   * @param {Object} params - 参数
   * @param {string} params.stockCode - 股票代码
   * @param {string} params.stockName - 股票名称
   * @param {number} params.tradeVolume - 交易数量
   * @param {number} params.percentage - 触发百分比
   * @param {string} params.provider - 券商名称，默认 "pingan"
   * @param {string} params.accountType - 账户类型，默认 "default"
   */
  async sendBuyOrder({ stockCode, stockName, tradeVolume = 100, percentage = 0.5, provider = 'pingan', accountType = 'default' }) {
    // 买入使用正百分比
    return this.sendCommand('create', {
      provider,
      accountType,
      stockCode,
      stockName,
      tradeVolume,
      percentage: Math.abs(percentage)
    });
  }

  /**
   * 发送卖出条件单
   * @param {Object} params - 参数
   * @param {string} params.stockCode - 股票代码
   * @param {string} params.stockName - 股票名称
   * @param {number} params.tradeVolume - 交易数量
   * @param {number} params.percentage - 触发百分比
   * @param {string} params.provider - 券商名称，默认 "pingan"
   * @param {string} params.accountType - 账户类型，默认 "default"
   */
  async sendSellOrder({ stockCode, stockName, tradeVolume = 100, percentage = 0.5, provider = 'pingan', accountType = 'default' }) {
    // 卖出使用负百分比（下跌）
    return this.sendCommand('create', {
      provider,
      accountType,
      stockCode,
      stockName,
      tradeVolume,
      percentage: -Math.abs(percentage)
    });
  }

  /**
   * 发送双向条件单（同时创建买入和卖出）
   * @param {Object} params - 参数
   */
  async sendBothOrders({ stockCode, stockName, tradeVolume = 100, percentage = 0.5, provider = 'pingan', accountType = 'default' }) {
    // 发送一次 create，会同时创建买入和卖出条件单
    return this.sendCommand('create', {
      provider,
      accountType,
      stockCode,
      stockName,
      tradeVolume,
      percentage
    });
  }

  /**
   * 取消条件单
   * @param {string} stockCode - 股票代码
   */
  async cancelOrder(stockCode) {
    return this.sendCommand('cancel', { stockCode });
  }

  onMessage(callback) {
    this.onMessageCallback = callback;
  }

  onConnect(callback) {
    this.onConnectCallback = callback;
  }

  disconnect() {
    if (this.client) {
      this.client.end(true);
      this.connected = false;
    }
  }
}

// 导出单例
const mqttConditionService = new MQTTConditionOrderService();

export default mqttConditionService;
export { MQTTConditionOrderService };
