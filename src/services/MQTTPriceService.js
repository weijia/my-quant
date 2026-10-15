/**
 * 行情 MQTT 服务：从 Price Server 订阅实时价格（供监控视图使用）。
 *
 * 与下单用的 MQTTConditionOrderService 是两条独立连接：
 * broker 相同，但 topic / 密码取自不同配置段（AppConfigService.priceMqtt），
 * 因为 Price Server 与条件单 Agent 的服务凭证本来就是分开配置的。
 *
 * 协议对齐 stock/instock/server/mqtt_protocol.py：
 *   发布 { action: 'subscribe', data: { codes, interval } } → 请求持续推送
 *   收到 { action: 'quote_push', data: { code, name, price, prev_close, change_pct ... } } → 一次报价
 * 信封与加密规则沿用 mqtt-agent-protocol（CryptoJS.AES），与下单服务一致。
 */

import { reactive, ref } from 'vue'
import appConfigService from './AppConfigService.js'

const DEFAULT_PRICE_MQTT = {
  enabled: true,
  serverUrl: 'wss://broker.emqx.io:8084/mqtt',
  topic: 'secure/stock-price-mqtt',
  password: 'stock_price_mqtt_S3cret',
  clientId: 'myquant_price_' + Math.random().toString(16).slice(2, 8),
  pushInterval: 5
}

/** 股票代码归一：纯数字补零到 6 位，与 push 里的 code 对齐 */
function normalizeCode(code) {
  const text = String(code == null ? '' : code).trim()
  if (!text) return ''
  return /^\d+$/.test(text) ? text.padStart(6, '0') : text
}

function buildMsgId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`
}

function encryptText(text, password) {
  return CryptoJS.AES.encrypt(text, password).toString()
}

function decryptText(cipher, password) {
  return CryptoJS.AES.decrypt(cipher, password).toString(CryptoJS.enc.Utf8)
}

class MQTTPriceService {
  constructor() {
    this.client = null
    /** 连接状态（ref，供界面直接做响应式显示） */
    this.connected = ref(false)
    /** code → 最新报价 */
    this.quotes = reactive(new Map())
    this._codes = []
    this._connecting = null
  }

  loadConfig() {
    try {
      const config = appConfigService.getPriceMqttConfig()
      if (config && config.serverUrl) {
        return { ...DEFAULT_PRICE_MQTT, ...config }
      }
    } catch (e) {
      console.warn('[MQTTPrice] 配置加载失败，使用默认值:', e)
    }
    return { ...DEFAULT_PRICE_MQTT }
  }

  /** 幂等连接：并发调用复用同一个 Promise，失败降级为「无行情」而不抛错 */
  ensureConnected() {
    if (this.connected.value && this.client) return Promise.resolve()
    if (this._connecting) return this._connecting

    this._connecting = this.createConnection()
      .catch((error) => {
        console.warn('[MQTTPrice] 连接行情服务失败:', error?.message || error)
      })
      .finally(() => {
        this._connecting = null
      })
    return this._connecting
  }

  createConnection() {
    const config = this.loadConfig()
    if (!config.enabled) return Promise.resolve()
    if (typeof mqtt === 'undefined') {
      return Promise.reject(new Error('mqtt 库未加载（检查 index.html CDN）'))
    }

    return new Promise((resolve, reject) => {
      this.client = mqtt.connect(config.serverUrl, {
        clientId: config.clientId || undefined,
        reconnectPeriod: 5000
      })

      this.client.on('connect', () => {
        this.connected.value = true
        this.client.subscribe(config.topic, { qos: 0 }, (err) => {
          if (err) {
            reject(err)
            return
          }
          // 重连后自动恢复上一次的订阅清单
          this.publishSubscribe()
          resolve()
        })
      })

      this.client.on('message', (_topic, payload) => {
        this.handleMessage(payload.toString(), config)
      })

      this.client.on('error', (err) => {
        this.connected.value = false
        reject(err)
      })

      this.client.on('close', () => {
        this.connected.value = false
      })
    })
  }

  handleMessage(raw, config) {
    try {
      const text = config.password ? decryptText(raw, config.password) : raw
      if (!text) return

      const envelope = JSON.parse(text)
      // 忽略自身回声（与 mqtt-agent-protocol 的自消息过滤一致）
      if (envelope.id === config.clientId) return

      const inner = typeof envelope.msg === 'string' ? JSON.parse(envelope.msg) : envelope.msg
      if (!inner || inner.action !== 'quote_push') return

      this.updateQuote(inner.data)
    } catch (_e) {
      // 行情推送频率高，解析失败（密文/其它通道消息）静默忽略，避免刷日志
    }
  }

  updateQuote(quote) {
    if (!quote || !quote.code) return
    const code = normalizeCode(quote.code)
    this.quotes.set(code, {
      code,
      name: quote.name || '',
      price: quote.price ?? null,
      open: quote.open ?? null,
      prevClose: quote.prev_close ?? null,
      changePct: quote.change_pct ?? null,
      priceTs: quote.price_ts ?? null,
      stale: Boolean(quote.stale)
    })
  }

  /** 订阅若干股票的实时报价；未连接时会先建立连接 */
  subscribeQuotes(codes) {
    const list = [...new Set((codes || []).map(normalizeCode).filter(Boolean))]
    this._codes = list
    if (!list.length) return Promise.resolve()
    return this.ensureConnected()
  }

  publishSubscribe() {
    if (!this.client || !this._codes.length) return
    const config = this.loadConfig()
    this.publish({ action: 'subscribe', data: { codes: this._codes, interval: config.pushInterval } }, config)
  }

  publish(payload, config) {
    const envelope = {
      id: config.clientId || '',
      msgId: buildMsgId(),
      user: 'myquant',
      msg: JSON.stringify(payload),
      time: Date.now()
    }
    const plain = JSON.stringify(envelope)
    const body = config.password ? encryptText(plain, config.password) : plain
    this.client.publish(config.topic, body, { qos: 0 }, (err) => {
      if (err) console.warn('[MQTTPrice] 订阅请求发送失败:', err?.message || err)
    })
  }

  disconnect() {
    if (!this.client) return
    this.client.end(true)
    this.client = null
    this.connected.value = false
  }
}

export default new MQTTPriceService()
