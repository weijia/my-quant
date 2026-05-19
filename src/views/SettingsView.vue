<template>
  <div class="settings-container">
    <!-- 页面头部 -->
    <header class="settings-header">
      <div class="header-content">
        <router-link to="/" class="back-btn" title="返回首页">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
        </router-link>
        <h1>设置</h1>
      </div>
    </header>

    <main class="settings-content">
      <!-- WebDAV 配置区块 -->
      <section class="settings-section">
        <h2 class="section-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 3h6v6"/>
            <path d="M10 14L21 3"/>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          </svg>
          WebDAV 配置
        </h2>
        <p class="config-hint">配置存储在浏览器本地 (localStorage)，不会上传到 Git。</p>
        <div class="config-paths">
          <div class="path-item">
            <span class="path-label">策略数据</span>
            <code class="path-value">{{ webdavConfigForm.url || '...' }}/app_data/stocks/</code>
          </div>
          <div class="path-item">
            <span class="path-label">持仓数据</span>
            <code class="path-value">{{ webdavConfigForm.url || '...' }}/app_data/holdings/pingan/</code>
          </div>
          <div class="path-item">
            <span class="path-label">趋势判断</span>
            <code class="path-value">{{ webdavConfigForm.url || '...' }}/app_data/stocks/trend_judgments/</code>
          </div>
        </div>
        <div class="form-group">
          <label>服务器 URL</label>
          <input v-model="webdavConfigForm.url" type="text" placeholder="https://your-server.com/dav/" class="form-input" />
        </div>
        <div class="form-group">
          <label>用户名</label>
          <input v-model="webdavConfigForm.username" type="text" placeholder="username" class="form-input" />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input v-model="webdavConfigForm.password" type="password" placeholder="password" class="form-input" />
        </div>
        <div class="section-actions">
          <button @click="saveWebDAVConfig" class="btn btn-primary">保存 WebDAV 配置</button>
        </div>
      </section>

      <!-- MQTT 配置区块 -->
      <section class="settings-section">
        <h2 class="section-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
            <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <line x1="12" x2="12.01" y1="20" y2="20"/>
          </svg>
          MQTT 条件单设置
        </h2>
        <p class="config-hint">配置用于向平安证券条件单脚本发送指令。配置存储在浏览器本地 (localStorage)。</p>

        <div class="form-group">
          <label>服务器类型</label>
          <select v-model="mqttConfigForm.serverType" @change="handleServerTypeChange" class="form-input">
            <option v-for="server in presetServers" :key="server.id" :value="server.id">
              {{ server.name }}
            </option>
            <option value="custom">自定义服务器</option>
          </select>
        </div>

        <div class="form-group" v-if="mqttConfigForm.serverType === 'custom'">
          <label>自定义服务器 URL</label>
          <input v-model="mqttConfigForm.serverUrl" type="text" placeholder="wss://your-broker.com/mqtt" class="form-input" />
        </div>

        <div class="form-group">
          <label>Topic 主题</label>
          <input v-model="mqttConfigForm.topic" type="text" placeholder="user/xxxx/orders" class="form-input" />
        </div>

        <div class="form-group">
          <label>加密密码 (AES)</label>
          <div class="password-input-wrapper">
            <input v-model="mqttConfigForm.password" :type="showMQTTPassword ? 'text' : 'password'" placeholder="your-secret-password" class="form-input" />
            <button type="button" @click="showMQTTPassword = !showMQTTPassword" class="toggle-password-btn" :title="showMQTTPassword ? '隐藏密码' : '显示密码'">
              <svg v-if="!showMQTTPassword" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="mqtt-status">
          <span class="status-label">连接状态:</span>
          <span :class="['status-value', mqttConnected ? 'connected' : 'disconnected']">
            {{ mqttConnected ? '已连接' : '未连接' }}
          </span>
          <button @click="testMqttConnection" class="btn btn-secondary btn-sm" :disabled="testingConnection">
            {{ testingConnection ? '测试中...' : '测试连接' }}
          </button>
        </div>

        <div class="section-actions">
          <button @click="saveMQTTConfig" class="btn btn-primary">保存 MQTT 配置</button>
        </div>
      </section>

      <!-- 策略管理器区块 -->
      <section class="settings-section">
        <h2 class="section-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          策略管理器
        </h2>
        <p class="config-hint">定义生成 MQTT 条件单消息的规则模板。可添加多个模板，每个模板对应一种下单策略。</p>

        <button @click="addTemplate" class="btn btn-primary add-template-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14"/>
            <path d="M5 12h14"/>
          </svg>
          添加策略模板
        </button>

        <div v-for="(template, index) in templates" :key="index" class="template-card">
          <div class="template-header">
            <span class="template-index">#{{ index + 1 }}</span>
            <button @click="removeTemplate(index)" class="btn btn-danger btn-sm remove-btn" title="删除此模板">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"/>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
              删除
            </button>
          </div>

          <div class="template-form">
            <div class="form-row">
              <div class="form-group">
                <label>名称</label>
                <input v-model="template.name" type="text" placeholder="如: 默认买入" class="form-input" />
              </div>
              <div class="form-group">
                <label>操作类型</label>
                <select v-model="template.action" class="form-input">
                  <option value="buy">买入</option>
                  <option value="sell">卖出</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>触发条件 - 上涨百分比</label>
                <input v-model="template.percentage" type="text" placeholder="如: 0.1 或 0.5" class="form-input" />
              </div>
              <div class="form-group">
                <label>下单方式</label>
                <select v-model="template.orderMode" class="form-input">
                  <option value="amount">按金额</option>
                  <option value="volume">按数量</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group" v-if="template.orderMode === 'amount'">
                <label>金额</label>
                <input v-model="template.amount" type="text" placeholder="如: 10000" class="form-input" />
              </div>
              <div class="form-group" v-if="template.orderMode === 'volume'">
                <label>数量</label>
                <input v-model="template.volume" type="text" placeholder="如: 200" class="form-input" />
              </div>
              <div class="form-group">
                <label>券商</label>
                <input v-model="template.provider" type="text" placeholder="pingan" class="form-input" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>账户类型</label>
                <select v-model="template.accountType" class="form-input">
                  <option value="default">普通</option>
                  <option value="credit">信用</option>
                </select>
              </div>
              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="template.useMargin" />
                  <span>使用融资</span>
                </label>
              </div>
            </div>
          </div>

          <!-- 输出预览 -->
          <div class="preview-section">
            <div class="preview-header">
              <span class="preview-label">消息预览</span>
              <button @click="copyPreview(index)" class="btn btn-secondary btn-sm copy-btn" title="复制消息">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
                {{ copiedIndex === index ? '已复制' : '复制消息' }}
              </button>
            </div>
            <pre class="preview-content">{{ generatePreview(template) }}</pre>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import mqttConditionService, { PRESET_SERVERS } from '../services/MQTTConditionService'
import { webdavImportService } from '../services/WebDAVImportService'

// WebDAV 配置
const webdavConfigForm = reactive({
  url: '',
  username: '',
  password: ''
})

const saveWebDAVConfig = () => {
  const config = {
    url: webdavConfigForm.url.replace(/\/+$/, ''),
    username: webdavConfigForm.username,
    password: webdavConfigForm.password
  }
  localStorage.setItem('webDavConfig', JSON.stringify(config))
  webdavImportService.loadConfig()
  alert('WebDAV 配置已保存')
}

const loadWebDAVConfig = () => {
  const configStr = localStorage.getItem('webDavConfig')
  if (configStr) {
    try {
      const config = JSON.parse(configStr)
      webdavConfigForm.url = config.url || ''
      webdavConfigForm.username = config.username || ''
      webdavConfigForm.password = config.password || ''
    } catch (e) {
      console.error('加载 WebDAV 配置失败:', e)
    }
  }
}

// MQTT 配置
const showMQTTPassword = ref(false)
const presetServers = PRESET_SERVERS
const mqttConfigForm = reactive({
  serverType: 'emqx',
  serverUrl: '',
  topic: '',
  password: ''
})
const mqttConnected = ref(false)
const testingConnection = ref(false)

const loadMQTTConfig = () => {
  const config = mqttConditionService.getConfig()
  mqttConfigForm.serverType = config.serverType || 'emqx'
  mqttConfigForm.serverUrl = config.serverUrl || ''
  mqttConfigForm.topic = config.topic || ''
  mqttConfigForm.password = config.password || ''
  mqttConnected.value = mqttConditionService.connected
}

const saveMQTTConfig = () => {
  const selectedServer = presetServers.find(s => s.id === mqttConfigForm.serverType)
  const config = {
    serverType: mqttConfigForm.serverType,
    serverUrl: selectedServer ? selectedServer.url : mqttConfigForm.serverUrl,
    topic: mqttConfigForm.topic,
    password: mqttConfigForm.password
  }
  mqttConditionService.updateConfig(config)
  webdavImportService.saveMQTTConfig(config)
  alert('MQTT 配置已保存')
}

const handleServerTypeChange = () => {
  const selectedServer = presetServers.find(s => s.id === mqttConfigForm.serverType)
  if (selectedServer) {
    mqttConfigForm.serverUrl = selectedServer.url
  }
}

const testMqttConnection = async () => {
  saveMQTTConfig()
  testingConnection.value = true
  try {
    mqttConditionService.disconnect()
    await mqttConditionService.connect()
    mqttConnected.value = true
    alert('MQTT 连接成功！')
  } catch (error) {
    mqttConnected.value = false
    alert('MQTT 连接失败: ' + error.message)
  } finally {
    testingConnection.value = false
  }
}

// 策略管理器
const templates = ref([])
const copiedIndex = ref(-1)

const defaultTemplate = () => ({
  name: '',
  action: 'buy',
  percentage: '0.5',
  orderMode: 'volume',
  amount: '',
  volume: '200',
  useMargin: false,
  provider: 'pingan',
  accountType: 'default'
})

const loadTemplates = () => {
  const saved = localStorage.getItem('orderStrategyTemplates')
  if (saved) {
    try {
      templates.value = JSON.parse(saved)
    } catch (e) {
      console.error('加载策略模板失败:', e)
      templates.value = []
    }
  }
}

const saveTemplates = () => {
  localStorage.setItem('orderStrategyTemplates', JSON.stringify(templates.value))
}

const addTemplate = () => {
  templates.value.push(defaultTemplate())
  saveTemplates()
}

const removeTemplate = (index) => {
  if (!confirm('确定要删除此策略模板吗？')) return
  templates.value.splice(index, 1)
  saveTemplates()
}

const generatePreview = (template) => {
  const action = template.action || 'buy'
  const percentage = parseFloat(template.percentage) || 0
  const orderMode = template.orderMode || 'volume'
  const amount = template.amount || ''
  const volume = template.volume || ''
  const useMargin = template.useMargin || false
  const provider = template.provider || 'pingan'
  const accountType = template.accountType || 'default'

  // 构建内部 msg 数据
  const data = {
    stockCode: '600519',
    stockName: '贵州茅台',
    percentage: percentage,
    provider: provider,
    accountType: accountType
  }

  if (orderMode === 'amount') {
    data.tradeAmount = parseFloat(amount) || 0
  } else {
    data.tradeVolume = parseInt(volume) || 0
  }

  if (!useMargin) {
    data.side = action === 'buy' ? 'COLLABUY' : 'COLLASELL'
  }

  const msgStr = JSON.stringify(data, null, 2)
  const preview = {
    id: 'myquant_xxxx',
    msgId: '1234567890_abcd',
    user: 'myquant',
    msg: msgStr,
    time: Date.now()
  }

  return JSON.stringify(preview, null, 2)
}

const copyPreview = async (index) => {
  const template = templates.value[index]
  const text = generatePreview(template)
  try {
    await navigator.clipboard.writeText(text)
    copiedIndex.value = index
    setTimeout(() => {
      copiedIndex.value = -1
    }, 2000)
  } catch (e) {
    // fallback
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copiedIndex.value = index
    setTimeout(() => {
      copiedIndex.value = -1
    }, 2000)
  }
}

onMounted(() => {
  loadWebDAVConfig()
  loadMQTTConfig()
  loadTemplates()
})
</script>

<style scoped>
.settings-container {
  min-height: 100vh;
  background-color: #1a1a2e;
}

.settings-header {
  background-color: #16213e;
  padding: 12px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 900px;
  margin: 0 auto;
}

.back-btn {
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: color 0.2s;
}

.back-btn:hover {
  color: #4ecdc4;
}

.header-content h1 {
  margin: 0;
  font-size: 20px;
  color: #4ecdc4;
  font-weight: bold;
}

.settings-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.settings-section {
  background-color: #16213e;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #4ecdc4;
}

.config-hint {
  margin: 0 0 16px 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.config-paths {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
}

.path-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.path-item:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.path-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  min-width: 60px;
}

.path-value {
  font-size: 12px;
  color: #4ecdc4;
  word-break: break-all;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 4px;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 14px;
  box-sizing: border-box;
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-group {
  flex: 1;
}

.section-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper .form-input {
  padding-right: 36px;
}

.toggle-password-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}

.toggle-password-btn:hover {
  color: rgba(255, 255, 255, 0.8);
}

.mqtt-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  margin-top: 12px;
}

.status-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.status-value {
  font-size: 13px;
  font-weight: bold;
}

.status-value.connected {
  color: #28a745;
}

.status-value.disconnected {
  color: #dc3545;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}

/* 通用按钮 */
.btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #4ecdc4;
  color: white;
}

.btn-primary:hover {
  background-color: #45b7aa;
}

.btn-secondary {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.btn-secondary:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
}

/* 策略管理器 */
.add-template-btn {
  margin-bottom: 16px;
}

.template-card {
  background-color: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.template-index {
  font-size: 14px;
  font-weight: bold;
  color: #4ecdc4;
}

.remove-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

.checkbox-group {
  display: flex;
  align-items: flex-end;
  padding-bottom: 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #4ecdc4;
}

.preview-section {
  margin-top: 12px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.preview-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

.preview-content {
  margin: 0;
  padding: 12px;
  font-size: 12px;
  color: #4ecdc4;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'Courier New', Courier, monospace;
  line-height: 1.5;
  max-height: 300px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .settings-content {
    padding: 12px;
  }

  .settings-section {
    padding: 16px;
  }

  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .mqtt-status {
    flex-wrap: wrap;
  }
}
</style>
