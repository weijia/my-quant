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
        <a v-if="switchLink" :href="switchLink.href" class="header-version-link" :title="switchLink.text" style="display: flex !important; visibility: visible !important; opacity: 1 !important;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-4"/><path d="M12 6V2"/>
            <path d="M4 14h4"/><path d="M16 14h4"/><path d="M21 3l-7 7"/><path d="M3 3l7 7"/>
          </svg>
          {{ switchLink.text }}
        </a>
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
            <code class="path-value">{{ webdavConfigForm.url || '...' }}{{ WEBDAV_PATHS.STOCKS }}</code>
          </div>
          <div class="path-item">
            <span class="path-label">持仓数据</span>
            <code class="path-value">{{ webdavConfigForm.url || '...' }}{{ WEBDAV_PATHS.HOLDINGS }}</code>
          </div>
          <div class="path-item">
            <span class="path-label">趋势判断</span>
            <code class="path-value">{{ webdavConfigForm.url || '...' }}{{ WEBDAV_PATHS.TREND_JUDGMENTS }}</code>
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

      <!-- Gitee 配置区块 -->
      <section class="settings-section">
        <h2 class="section-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
          </svg>
          Gitee 同步
        </h2>
        <p class="config-hint">
          将配置保存到 Gitee 仓库。策略脚本单独放在 <code>strategies.js</code>，其他配置放在 <code>config.json</code>。
        </p>
        <div class="config-paths">
          <div class="path-item">
            <span class="path-label">应用配置</span>
            <code class="path-value">{{ giteeConfigForm.owner || 'owner' }}/{{ giteeConfigForm.repo || 'repo' }}/{{ giteeConfigForm.basePath || 'my-quant' }}/config.json</code>
          </div>
          <div class="path-item">
            <span class="path-label">策略脚本</span>
            <code class="path-value">{{ giteeConfigForm.owner || 'owner' }}/{{ giteeConfigForm.repo || 'repo' }}/{{ giteeConfigForm.basePath || 'my-quant' }}/strategies.js</code>
          </div>
        </div>
        <div class="form-group">
          <label>个人访问令牌</label>
          <input v-model="giteeConfigForm.token" type="password" placeholder="gitee personal access token" class="form-input" />
        </div>
        <div class="form-row">
          <div class="form-group form-group-half">
            <label>仓库所有者</label>
            <input v-model="giteeConfigForm.owner" type="text" placeholder="username" class="form-input" />
          </div>
          <div class="form-group form-group-half">
            <label>仓库名称</label>
            <input v-model="giteeConfigForm.repo" type="text" placeholder="repo-name" class="form-input" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group form-group-half">
            <label>分支</label>
            <input v-model="giteeConfigForm.branch" type="text" placeholder="main" class="form-input" />
          </div>
          <div class="form-group form-group-half">
            <label>文件路径</label>
            <input v-model="giteeConfigForm.basePath" type="text" placeholder="my-quant" class="form-input" />
          </div>
        </div>
        <div class="section-actions">
          <button @click="testGiteeConnection" class="btn btn-secondary" :disabled="giteeTesting">
            {{ giteeTesting ? '测试中...' : '测试连接' }}
          </button>
          <button @click="saveGiteeConfig" class="btn btn-primary">保存 Gitee 配置</button>
        </div>
        <div class="section-actions gitee-sync-actions">
          <button @click="downloadGiteeConfig" class="btn btn-secondary" :disabled="giteeSyncing">
            {{ giteeSyncing === 'download' ? '下载中...' : '从 Gitee 下载配置' }}
          </button>
          <button @click="uploadGiteeConfig" class="btn btn-primary" :disabled="giteeSyncing">
            {{ giteeSyncing === 'upload' ? '上传中...' : '上传配置到 Gitee' }}
          </button>
        </div>
      </section>

      <!-- 应用配置同步区块 -->
      <section class="settings-section">
        <h2 class="section-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" x2="12" y1="3" y2="15"/>
          </svg>
          应用配置同步 (WebDAV)
        </h2>
        <p class="config-hint">
          将 MQTT、窗口、UI 等配置同步到 WebDAV（<code>/app_data/my-quant/config.json</code>）。
        </p>
        <div class="section-actions">
          <button @click="downloadAppConfig" class="btn btn-secondary" :disabled="syncingConfig">
            {{ syncingConfig === 'download' ? '下载中...' : '从 WebDAV 下载配置' }}
          </button>
          <button @click="uploadAppConfig" class="btn btn-primary" :disabled="syncingConfig">
            {{ syncingConfig === 'upload' ? '上传中...' : '上传配置到 WebDAV' }}
          </button>
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

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input v-model="mqttConfigForm.encryptMessages" type="checkbox" />
            <span>加密消息（AES）</span>
          </label>
          <p class="form-hint">开启后 MQTT 消息将通过 AES 加密传输，Agent 端需使用相同密码解密</p>
        </div>

        <div class="mqtt-status">
          <span class="status-label">连接状态:</span>
          <span :class="['status-value', mqttConnected ? 'connected' : 'disconnected']">
            {{ mqttConnected ? '已连接' : '未连接' }}
          </span>
          <span v-if="mqttConnected" :class="['status-value', 'agent-status', agentOnline ? 'connected' : 'disconnected']">
            {{ agentOnline ? 'Agent 在线' : 'Agent 离线' }}
          </span>
          <button @click="testMqttConnection" class="btn btn-secondary btn-sm" :disabled="testingConnection">
            {{ testingConnection ? '测试中...' : '测试连接' }}
          </button>
        </div>

        <div class="section-actions">
          <button @click="saveMQTTConfig" class="btn btn-primary">保存 MQTT 配置</button>
        </div>
      </section>

      <!-- 持仓查询区块 -->
      <section class="settings-section">
        <h2 class="section-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="20" height="14" x="2" y="3" rx="2"/>
            <line x1="8" x2="16" y1="21" y2="21"/>
            <line x1="12" x2="12" y1="17" y2="21"/>
          </svg>
          持仓查询
        </h2>
        <p class="config-hint">
          通过 MQTT 向 Agent 发送 get_holdings 命令，获取券商持仓数据。需要 MQTT 已连接且 Agent 在线。
        </p>
        <div class="section-actions">
          <button @click="loadHoldings('pingan')" class="btn btn-primary" :disabled="loadingHoldings">
            {{ loadingHoldings === 'pingan' ? '加载中...' : '加载平安持仓' }}
          </button>
          <button @click="loadHoldings('founder')" class="btn btn-secondary" :disabled="loadingHoldings">
            {{ loadingHoldings === 'founder' ? '加载中...' : '加载方正常仓' }}
          </button>
        </div>

        <!-- 持仓结果 -->
        <div v-if="holdingsData.length > 0" class="holdings-result">
          <div class="holdings-header">
            <span>{{ holdingsProvider === 'pingan' ? '平安证券' : '方正证券' }}持仓（{{ holdingsData.length }} 只）</span>
            <button @click="clearHoldings" class="btn btn-secondary btn-sm">清除</button>
          </div>
          <div class="holdings-table-wrap">
            <table class="holdings-table">
              <thead>
                <tr>
                  <th>代码</th>
                  <th>名称</th>
                  <th>持仓</th>
                  <th>可用</th>
                  <th>成本价</th>
                  <th>现价</th>
                  <th>市值</th>
                  <th>盈亏</th>
                  <th>盈亏%</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="h in holdingsData" :key="h.stockCode">
                  <td>{{ h.stockCode }}</td>
                  <td>{{ h.stockName }}</td>
                  <td>{{ h.quantity }}</td>
                  <td>{{ h.availableQuantity || '-' }}</td>
                  <td>{{ h.costPrice?.toFixed(2) || '-' }}</td>
                  <td>{{ h.currentPrice?.toFixed(2) || '-' }}</td>
                  <td>{{ formatHoldingsValue(h.marketValue) }}</td>
                  <td :class="h.profit >= 0 ? 'text-profit' : 'text-loss'">{{ formatProfit(h.profit) }}</td>
                  <td :class="h.profitPercent >= 0 ? 'text-profit' : 'text-loss'">{{ h.profitPercent?.toFixed(2) || '-' }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-if="holdingsError" class="holdings-error">
          {{ holdingsError }}
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
        <p class="config-hint">
          每条策略是一个 JavaScript 脚本，输入股票数据，输出 MQTT 条件单消息数组。
          <button @click="showApiHelp = !showApiHelp" class="help-toggle-btn">{{ showApiHelp ? '隐藏' : '查看' }}输入数据说明</button>
        </p>

        <!-- API 帮助 -->
        <div v-if="showApiHelp" class="api-help">
          <h4>输入对象 (ctx) 包含以下字段：</h4>
          <table class="api-table">
            <thead><tr><th>字段</th><th>类型</th><th>说明</th><th>示例</th></tr></thead>
            <tbody>
              <tr><td>ctx.stockCode</td><td>string</td><td>股票代码，6位数字</td><td>"600519"</td></tr>
              <tr><td>ctx.stockName</td><td>string</td><td>股票名称</td><td>"贵州茅台"</td></tr>
              <tr><td>ctx.currentPrice</td><td>number</td><td>当前收盘价</td><td>1680.00</td></tr>
              <tr><td>ctx.netPosition</td><td>number</td><td>当前持仓数量（股）</td><td>100</td></tr>
              <tr><td>ctx.marketValue</td><td>number</td><td>持仓市值 = 持仓 × 价格</td><td>168000</td></tr>
              <tr><td>ctx.trendJudgment</td><td>string</td><td>趋势判断类型</td><td>"trend_up"</td></tr>
              <tr><td>ctx.volatility15d</td><td>number</td><td>15日平均波动率（小数，如1.65%存为0.0165）</td><td>0.0165</td></tr>
              <tr><td>ctx.priceDropRatio</td><td>number</td><td>最高价到当前价的下跌比率</td><td>0.05（表示5%）</td></tr>
              <tr><td>ctx.isMarginAccount</td><td>boolean</td><td>是否为融资融券账户</td><td>false</td></tr>
              <tr><td>ctx.defaultBuyVolume</td><td>number</td><td>缺省买入数量，优先使用策略的加仓数量（increaseAmount），否则为持仓的1/4</td><td>1/4持仓</td></tr>
              <tr><td>ctx.defaultSellVolume</td><td>number</td><td>缺省卖出数量，为持仓的1/4（向下取整到100的倍数）</td><td>25</td></tr>
              <tr><td>ctx.defaultAmount</td><td>number</td><td>缺省交易金额，固定值20000元</td><td>20000</td></tr>
              <tr><td>ctx.provider</td><td>string</td><td>券商代码</td><td>"pingan"</td></tr>
              <tr><td>ctx.accountType</td><td>string</td><td>账户类型</td><td>"default"或"credit"</td></tr>
            </tbody>
          </table>

          <h4>趋势判断值 (ctx.trendJudgment)：</h4>
          <table class="api-table">
            <thead><tr><th>值</th><th>含义</th></tr></thead>
            <tbody>
              <tr><td>"unset"</td><td>未设置</td></tr>
              <tr><td>"trend_unknown"</td><td>未知趋势</td></tr>
              <tr><td>"trend_up"</td><td>上涨趋势</td></tr>
              <tr><td>"trend_down"</td><td>下跌趋势</td></tr>
              <tr><td>"trend_breakdown"</td><td>下跌破位</td></tr>
              <tr><td>"trend_oscillation"</td><td>震荡趋势</td></tr>
              <tr><td>"trend_pullback"</td><td>回踩趋势</td></tr>
              <tr><td>"high_volatility"</td><td>高波动率</td></tr>
              <tr><td>"medium_volatility"</td><td>中等波动率</td></tr>
              <tr><td>"low_volatility"</td><td>低波动率</td></tr>
            </tbody>
          </table>

          <h4>缺省数量来源说明：</h4>
          <table class="api-table">
            <thead><tr><th>字段</th><th>来源</th><th>计算方式</th></tr></thead>
            <tbody>
              <tr>
                <td>defaultBuyVolume</td>
                <td>策略数据</td>
                <td>优先使用 strategy.increaseAmount（加仓数量），如果不存在则使用 Math.floor(netPosition / 4 / 100) * 100（1/4持仓）</td>
              </tr>
              <tr>
                <td>defaultSellVolume</td>
                <td>动态计算</td>
                <td>Math.floor(ctx.netPosition / 4 / 100) * 100，即持仓的1/4向下取整到100的倍数</td>
              </tr>
              <tr>
                <td>defaultAmount</td>
                <td>固定值</td>
                <td>固定为20000元，用于额买额卖时的金额计算</td>
              </tr>
            </tbody>
          </table>

          <h4>辅助函数：</h4>
          <table class="api-table">
            <thead><tr><th>函数</th><th>参数</th><th>返回值</th><th>说明</th></tr></thead>
            <tbody>
              <tr>
                <td>buy(data)</td>
                <td>data: 对象</td>
                <td>{ action: "buy", data }</td>
                <td>创建买入消息</td>
              </tr>
              <tr>
                <td>sell(data)</td>
                <td>data: 对象</td>
                <td>{ action: "sell", data }</td>
                <td>创建卖出消息</td>
              </tr>
            </tbody>
          </table>

          <h4>消息 data 字段说明：</h4>
          <table class="api-table">
            <thead><tr><th>字段</th><th>必填</th><th>类型</th><th>说明</th><th>示例</th></tr></thead>
            <tbody>
              <tr><td>stockCode</td><td>是</td><td>string</td><td>股票代码</td><td>"600519"</td></tr>
              <tr><td>stockName</td><td>是</td><td>string</td><td>股票名称</td><td>"贵州茅台"</td></tr>
              <tr><td>tradeVolume</td><td>否</td><td>number</td><td>交易数量（股）</td><td>100</td></tr>
              <tr><td>tradeAmount</td><td>否</td><td>number</td><td>交易金额（元）</td><td>20000</td></tr>
              <tr><td>percentage</td><td>否</td><td>number</td><td>触发百分比（如0.5表示0.5%）</td><td>0.5</td></tr>
              <tr><td>endDate</td><td>否</td><td>string</td><td>条件单结束日期</td><td>"2026-05-30"</td></tr>
              <tr><td>provider</td><td>否</td><td>string</td><td>券商</td><td>"pingan"</td></tr>
              <tr><td>accountType</td><td>否</td><td>string</td><td>账户类型</td><td>"default"</td></tr>
              <tr><td>side</td><td>否</td><td>string</td><td>交易方向，非融资时需要</td><td>"COLLABUY"/"COLLASELL"</td></tr>
            </tbody>
          </table>

          <h4>输出格式：</h4>
          <pre class="code-example">// 脚本必须返回一个数组
return [
  buy({
    stockCode: ctx.stockCode,
    stockName: ctx.stockName,
    tradeVolume: 100,
    percentage: 0.5,
    provider: ctx.provider,
    accountType: ctx.accountType
  }),
  sell({
    stockCode: ctx.stockCode,
    stockName: ctx.stockName,
    tradeVolume: 25,
    percentage: ctx.volatility15d * 100,
    provider: ctx.provider,
    accountType: ctx.accountType
  })
]</pre>

          <h4>常用计算示例：</h4>
          <pre class="code-example">// 将15日波动率转为百分比（如 0.0165 -> 1.65）
const volPercent = ctx.volatility15d * 100

// 计算1/4持仓并取整到100的倍数
const sellVolume = Math.floor(ctx.netPosition / 4 / 100) * 100

// 根据金额计算数量
const buyVolume = Math.floor(ctx.defaultAmount / ctx.currentPrice / 100) * 100

// 条件判断
if (ctx.trendJudgment === 'trend_up') {
  // 上涨趋势逻辑
}</pre>
        </div>

        <button @click="addTemplate" class="btn btn-primary add-template-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14"/>
            <path d="M5 12h14"/>
          </svg>
          添加策略
        </button>

        <div v-for="(template, index) in templates" :key="index" class="template-card" :class="{ 'default-template': template.isDefault }">
          <div class="template-header">
            <span class="template-index">#{{ index + 1 }}</span>
            <span v-if="template.isDefault" class="default-badge">缺省策略</span>
            <div class="template-header-actions">
              <button @click="runPreview(index)" class="btn btn-secondary btn-sm" title="运行预览">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                运行
              </button>
              <button @click="removeTemplate(index)" class="btn btn-danger btn-sm remove-btn" title="删除此策略">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
                删除
              </button>
            </div>
          </div>

          <div v-if="template.description" class="template-description">
            {{ template.description }}
          </div>

          <div class="template-form">
            <div class="form-group">
              <label>策略名称</label>
              <input v-model="template.name" type="text" placeholder="如: 通用上涨趋势策略" class="form-input" />
            </div>

            <!-- 趋势匹配设置 -->
            <div class="form-group trend-matches-group">
              <label>匹配趋势（多选）</label>
              <div class="trend-checkboxes">
                <label v-for="trend in availableTrends" :key="trend.value" class="trend-checkbox-label" :class="{ 'selected': (template.trendMatches || []).includes(trend.value) }">
                  <input
                    type="checkbox"
                    :value="trend.value"
                    v-model="template.trendMatches"
                    @change="onTrendMatchesChange(index)"
                  />
                  <span class="trend-name">{{ trend.label }}</span>
                </label>
              </div>
              <p class="trend-hint">当股票的趋势判断为选中的任一值时，此策略将被应用</p>
            </div>

            <!-- AI 提示词助手 -->
            <div class="form-group ai-prompt-group">
              <label class="ai-prompt-label">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                AI 提示词
              </label>
              <div class="ai-prompt-input-wrap">
                <textarea
                  v-model="aiPrompts[index]"
                  class="ai-prompt-textarea"
                  placeholder="描述你想要的策略，例如：上涨5%买入，下跌3%止损，分批建仓..."
                  spellcheck="false"
                ></textarea>
                <button @click="generateAIPrompt(index)" class="btn btn-secondary btn-sm ai-generate-btn" title="生成完整提示词">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                  </svg>
                  生成提示词
                </button>
              </div>
              <p class="ai-prompt-hint">输入策略需求 → 点击生成 → 复制发给 AI → 粘贴返回的代码到下方脚本编辑器</p>
            </div>

            <div class="form-group">
              <label>策略脚本</label>
              <textarea
                v-model="template.script"
                class="script-editor"
                placeholder="// 输入策略脚本&#10;// ctx: 股票数据&#10;// buy(data), sell(data): 辅助函数&#10;// 返回消息数组&#10;return []"
                spellcheck="false"
                @input="onScriptChange(index)"
              ></textarea>
            </div>
          </div>

          <!-- 输出预览 -->
          <div class="preview-section" v-if="previewResults[index]">
            <div class="preview-header">
              <span class="preview-label">运行结果 ({{ previewResults[index].length }} 条消息)</span>
              <button @click="copyPreview(index)" class="btn btn-secondary btn-sm copy-btn" title="复制消息">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
                {{ copiedIndex === index ? '已复制' : '复制全部' }}
              </button>
            </div>
            <pre class="preview-content">{{ previewResults[index] }}</pre>
          </div>
          <div v-if="previewErrors[index]" class="preview-error">
            <strong>脚本错误：</strong>{{ previewErrors[index] }}
          </div>
        </div>
      </section>

      <!-- 版本信息区块 -->
      <section class="settings-section">
        <h2 class="section-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          版本信息
        </h2>
        <div class="version-info">
          <div class="version-item">
            <span class="version-label">当前版本</span>
            <span class="version-value">{{ versionDisplay }}</span>
          </div>
          <div class="version-item">
            <span class="version-label">构建时间</span>
            <span class="version-value">{{ buildTimeDisplay }}</span>
          </div>
          <div v-if="switchLink" class="version-item version-switch">
            <span class="version-label">版本切换</span>
            <a :href="switchLink.href" class="version-link">{{ switchLink.text }}</a>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import mqttConditionService, { PRESET_SERVERS } from '../services/MQTTConditionService'
import { webdavImportService } from '../services/WebDAVImportService'
import WEBDAV_PATHS from '../config/WebDAVPaths'
import appConfigService from '../services/AppConfigService.js'
import giteeService from '../services/GiteeService.js'
import { versionDisplay, buildTimeDisplay } from '../version.js'

// 判断是否为中文环境
const isChineseLocale = () => {
  return navigator.language.startsWith('zh')
}

// 获取当前目录名
const currentDir = computed(() => {
  const pathname = window.location.pathname
    .replace(/\/index\.html$/, '')
    .replace(/\/$/, '')
  const segments = pathname.split('/').filter(Boolean)
  return segments[segments.length - 1] || ''
})

// 计算版本切换链接
const switchLink = computed(() => {
  const dir = currentDir.value
  console.log('[Settings] 当前目录:', dir)
  
  // 如果是 latest，切换到 release
  if (dir === 'latest') {
    return {
      href: '../release/index.html',
      text: isChineseLocale() ? '切换到正式版' : 'Switch to Release'
    }
  }
  // 如果是 release 或日期目录，切换到 latest
  if (dir === 'release' || /^\d{8}$/.test(dir)) {
    return {
      href: '../latest/index.html',
      text: isChineseLocale() ? '切换到最新版' : 'Switch to Latest'
    }
  }
  // 如果是版本号（如 v1.5.0）或其他目录，切换到 latest
  if (dir && dir !== 'my-quant' && dir !== '') {
    return {
      href: '../latest/index.html',
      text: isChineseLocale() ? '切换到最新版' : 'Switch to Latest'
    }
  }
  // 如果是根目录或 my-quant，显示切换到 latest
  return {
    href: 'latest/index.html',
    text: isChineseLocale() ? '切换到最新版' : 'Switch to Latest'
  }
})

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
  localStorage.setItem('webDAVConfig', JSON.stringify(config))
  webdavImportService.loadConfig()
  alert('WebDAV 配置已保存')
}

const loadWebDAVConfig = () => {
  const configStr = localStorage.getItem('webDAVConfig')
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

// Gitee 配置
const giteeConfigForm = reactive({
  token: '',
  owner: '',
  repo: '',
  branch: 'main',
  basePath: 'my-quant'
})
const giteeTesting = ref(false)
const giteeSyncing = ref(false)

const saveGiteeConfig = () => {
  giteeService.setConfig({
    token: giteeConfigForm.token,
    owner: giteeConfigForm.owner,
    repo: giteeConfigForm.repo,
    branch: giteeConfigForm.branch || 'main',
    basePath: giteeConfigForm.basePath || 'my-quant'
  })
  alert('Gitee 配置已保存')
}

const loadGiteeConfig = () => {
  const config = giteeService.getConfig()
  giteeConfigForm.token = config.token || ''
  giteeConfigForm.owner = config.owner || ''
  giteeConfigForm.repo = config.repo || ''
  giteeConfigForm.branch = config.branch || 'main'
  giteeConfigForm.basePath = config.basePath || 'my-quant'
}

const testGiteeConnection = async () => {
  giteeTesting.value = true
  try {
    giteeService.setConfig({
      token: giteeConfigForm.token,
      owner: giteeConfigForm.owner,
      repo: giteeConfigForm.repo,
      branch: giteeConfigForm.branch || 'main',
      basePath: giteeConfigForm.basePath || 'my-quant'
    })
    const result = await giteeService.testConnection()
    alert(`连接成功！仓库: ${result.repoName}`)
  } catch (e) {
    alert('连接失败: ' + e.message)
  } finally {
    giteeTesting.value = false
  }
}

const uploadGiteeConfig = async () => {
  giteeSyncing.value = 'upload'
  try {
    giteeService.setConfig({
      token: giteeConfigForm.token,
      owner: giteeConfigForm.owner,
      repo: giteeConfigForm.repo,
      branch: giteeConfigForm.branch || 'main',
      basePath: giteeConfigForm.basePath || 'my-quant'
    })
    // 上传前同步趋势映射
    appConfigService.syncTrendMappingFromTemplates(templates.value)
    await giteeService.upload()
    alert('配置上传成功')
  } catch (e) {
    alert('上传失败: ' + e.message)
  } finally {
    giteeSyncing.value = false
  }
}

const downloadGiteeConfig = async () => {
  giteeSyncing.value = 'download'
  try {
    giteeService.setConfig({
      token: giteeConfigForm.token,
      owner: giteeConfigForm.owner,
      repo: giteeConfigForm.repo,
      branch: giteeConfigForm.branch || 'main',
      basePath: giteeConfigForm.basePath || 'my-quant'
    })
    const result = await giteeService.download()
    // 重新加载 MQTT 配置到表单
    loadMQTTConfig()
    // 重新加载策略模板
    loadTemplates()
    let msg = '配置下载成功'
    if (result.configDownloaded) msg += '，config.json 已合并'
    if (result.strategiesDownloaded) msg += '，strategies.js 已更新'
    alert(msg)
  } catch (e) {
    alert('下载失败: ' + e.message)
  } finally {
    giteeSyncing.value = false
  }
}

// 持仓查询
const holdingsData = ref([])
const holdingsProvider = ref('')
const holdingsError = ref('')
const loadingHoldings = ref(false)

const loadHoldings = async (provider) => {
  if (!mqttConditionService.connected) {
    alert('MQTT 未连接，请先配置并连接 MQTT')
    return
  }

  loadingHoldings.value = provider
  holdingsError.value = ''
  holdingsProvider.value = provider

  try {
    // 发送命令
    await mqttConditionService.getHoldings({ provider, forceRefresh: true })

    // 监听响应（通过 addMessageListener，不覆盖主回调）
    const timeout = setTimeout(() => {
      holdingsError.value = '请求超时（15秒），未收到 Agent 响应'
      loadingHoldings.value = false
      removeListener()
    }, 15000)

    const removeListener = mqttConditionService.addMessageListener((data, msgData) => {
      if (msgData?.action === 'get_holdings') {
        clearTimeout(timeout)
        removeListener()
        console.log('[Settings] get_holdings 响应:', JSON.stringify(msgData))

        // 兼容两种格式：扁平格式 或 嵌套格式（msgData.data.status + msgData.data.data.holdings）
        const responseBody = msgData.data || {}
        const status = responseBody.status || msgData.status
        const payload = responseBody.data || msgData.data

        if (status === 'success') {
          if (payload && Array.isArray(payload.holdings)) {
            holdingsData.value = payload.holdings
            loadingHoldings.value = false
          } else {
            holdingsError.value = '响应格式异常：缺少 holdings 字段'
            loadingHoldings.value = false
          }
        } else {
          holdingsError.value = responseBody.message || msgData.message || '获取持仓失败'
          loadingHoldings.value = false
        }
      }
    })
  } catch (e) {
    holdingsError.value = '发送请求失败: ' + e.message
    loadingHoldings.value = false
  }
}

const clearHoldings = () => {
  holdingsData.value = []
  holdingsError.value = ''
}

const formatHoldingsValue = (val) => {
  if (!val) return '-'
  if (val >= 10000) return (val / 10000).toFixed(2) + '万'
  return val.toFixed(2)
}

const formatProfit = (val) => {
  if (val == null) return '-'
  const prefix = val >= 0 ? '+' : ''
  return prefix + val.toFixed(2)
}

// MQTT 配置
const showMQTTPassword = ref(false)
const presetServers = PRESET_SERVERS
const mqttConfigForm = reactive({
  serverType: 'emqx',
  serverUrl: '',
  topic: '',
  password: '',
  encryptMessages: true
})
const mqttConnected = ref(false)
const agentOnline = ref(false)
const testingConnection = ref(false)
const syncingConfig = ref(false)

// 应用配置上传/下载
const downloadAppConfig = async () => {
  syncingConfig.value = 'download'
  try {
    const success = await webdavImportService.downloadAppConfig()
    if (success) {
      // 重新加载 MQTT 配置到表单
      loadMQTTConfig()
      alert('配置下载成功，已合并到本地')
    } else {
      alert('配置下载失败，请检查 WebDAV 连接')
    }
  } catch (e) {
    alert('配置下载失败: ' + e.message)
  } finally {
    syncingConfig.value = false
  }
}

const uploadAppConfig = async () => {
  syncingConfig.value = 'upload'
  try {
    // 上传前从当前页面 templates 同步趋势映射，确保数据最新
    appConfigService.syncTrendMappingFromTemplates(templates.value)
    const success = await webdavImportService.uploadAppConfig()
    if (success) {
      alert('配置上传成功')
    } else {
      alert('配置上传失败，请检查 WebDAV 连接')
    }
  } catch (e) {
    alert('配置上传失败: ' + e.message)
  } finally {
    syncingConfig.value = false
  }
}

const loadMQTTConfig = () => {
  const config = mqttConditionService.getConfig()
  mqttConfigForm.serverType = config.serverType || 'emqx'
  mqttConfigForm.serverUrl = config.serverUrl || ''
  mqttConfigForm.topic = config.topic || ''
  mqttConfigForm.password = config.password || ''
  mqttConfigForm.encryptMessages = config.encryptMessages !== false
  mqttConnected.value = mqttConditionService.connected
  agentOnline.value = mqttConditionService.agentOnline
}

// 定时同步 MQTT 连接状态
let mqttStatusTimer = null

const startMqttStatusSync = () => {
  // 立即同步一次
  mqttConnected.value = mqttConditionService.connected
  agentOnline.value = mqttConditionService.agentOnline
  // 每 3 秒同步一次
  mqttStatusTimer = setInterval(() => {
    mqttConnected.value = mqttConditionService.connected
    agentOnline.value = mqttConditionService.agentOnline
  }, 3000)
}

const stopMqttStatusSync = () => {
  if (mqttStatusTimer) {
    clearInterval(mqttStatusTimer)
    mqttStatusTimer = null
  }
}

const saveMQTTConfig = () => {
  const selectedServer = presetServers.find(s => s.id === mqttConfigForm.serverType)
  const config = {
    serverType: mqttConfigForm.serverType,
    serverUrl: selectedServer ? selectedServer.url : mqttConfigForm.serverUrl,
    topic: mqttConfigForm.topic,
    password: mqttConfigForm.password,
    encryptMessages: mqttConfigForm.encryptMessages
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
const showApiHelp = ref(false)
const previewResults = reactive({})
const previewErrors = reactive({})
const aiPrompts = reactive({})

// 可用的趋势选项
const availableTrends = [
  { value: 'unset', label: '未设置' },
  { value: 'trend_unknown', label: '未知趋势' },
  { value: 'trend_up', label: '上涨趋势' },
  { value: 'trend_down', label: '下跌趋势' },
  { value: 'trend_breakdown', label: '下跌破位' },
  { value: 'trend_oscillation', label: '震荡趋势' },
  { value: 'trend_pullback', label: '回踩趋势' },
  { value: 'high_volatility', label: '高波动率' },
  { value: 'medium_volatility', label: '中等波动率' },
  { value: 'low_volatility', label: '低波动率' }
]

// 示例输入数据（用于预览）
const sampleCtx = {
  stockCode: '600519',
  stockName: '贵州茅台',
  currentPrice: 1680.00,
  netPosition: 100,
  marketValue: 168000,
  trendJudgment: 'trend_up',
  volatility15d: 0.0165,
  priceDropRatio: 0.05,
  isMarginAccount: false,
  defaultBuyVolume: 100,
  defaultSellVolume: 25,
  defaultAmount: 20000,
  provider: 'pingan',
  accountType: 'default'
}

const defaultTemplate = () => ({
  name: '',
  script: `// 输入: ctx (股票数据)\n// 辅助: buy(data), sell(data)\n// 输出: 消息数组\nreturn [\n  // buy({ stockCode: ctx.stockCode, stockName: ctx.stockName, tradeVolume: 100, percentage: 0.5 })\n]`,
  trendMatches: [], // 匹配的趋势列表，如 ['trend_up', 'trend_oscillation']
  isDefault: false
})

// 缺省策略脚本
const defaultStrategyScripts = [
  {
    name: '通用上涨趋势策略',
    description: '上涨趋势：下跌15日波动率卖出1/4持仓，上涨0.5%买入设定数量',
    isDefault: true,
    trendMatches: ['trend_up', 'trend_pullback'], // 匹配上涨趋势和回踩趋势
    script: `// 通用上涨趋势策略
// 下跌15日波动率卖出1/4持仓，上涨0.5%买入设定数量
const vol = ctx.volatility15d * 100  // 转为百分比

// 持仓已经是100股，不生成卖出条件单
if (ctx.netPosition === 100) {
  return [
    buy({
      stockCode: ctx.stockCode,
      stockName: ctx.stockName,
      tradeVolume: ctx.defaultBuyVolume,
      percentage: 0.5,
      provider: ctx.provider,
      accountType: ctx.accountType
    })
  ]
}

// 持仓市值小于20000时，卖出到只剩100股
const sellVol = ctx.marketValue < 20000
  ? Math.max(100, Math.floor((ctx.netPosition - 100) / 100) * 100)
  : Math.floor(ctx.netPosition / 4 / 100) * 100  // 1/4持仓，取整到100

return [
  sell({
    stockCode: ctx.stockCode,
    stockName: ctx.stockName,
    tradeVolume: sellVol,
    percentage: parseFloat(vol.toFixed(2)),
    provider: ctx.provider,
    accountType: ctx.accountType
  }),
  buy({
    stockCode: ctx.stockCode,
    stockName: ctx.stockName,
    tradeVolume: ctx.defaultBuyVolume,
    percentage: 0.5,
    provider: ctx.provider,
    accountType: ctx.accountType
  })
]`
  },
  {
    name: '通用下跌趋势策略',
    description: '下跌趋势：下跌15日波动率1/2卖出1/4持仓，上涨15日波动率买入设定数量',
    isDefault: true,
    trendMatches: ['trend_down', 'trend_breakdown'], // 匹配下跌趋势和下跌破位
    script: `// 通用下跌趋势策略
// 下跌15日波动率1/2卖出1/4持仓，上涨15日波动率买入设定数量
const vol = ctx.volatility15d * 100  // 转为百分比

// 持仓已经是100股，不生成卖出条件单
if (ctx.netPosition === 100) {
  return [
    buy({
      stockCode: ctx.stockCode,
      stockName: ctx.stockName,
      tradeVolume: ctx.defaultBuyVolume,
      percentage: parseFloat(vol.toFixed(2)),
      provider: ctx.provider,
      accountType: ctx.accountType
    })
  ]
}

// 持仓市值小于20000时，卖出到只剩100股
const sellVol = ctx.marketValue < 20000
  ? Math.max(100, Math.floor((ctx.netPosition - 100) / 100) * 100)
  : Math.floor(ctx.netPosition / 4 / 100) * 100  // 1/4持仓，取整到100

return [
  sell({
    stockCode: ctx.stockCode,
    stockName: ctx.stockName,
    tradeVolume: sellVol,
    percentage: parseFloat((vol / 2).toFixed(2)),
    provider: ctx.provider,
    accountType: ctx.accountType
  }),
  buy({
    stockCode: ctx.stockCode,
    stockName: ctx.stockName,
    tradeVolume: ctx.defaultBuyVolume,
    percentage: parseFloat(vol.toFixed(2)),
    provider: ctx.provider,
    accountType: ctx.accountType
  })
]`
  },
  {
    name: '通用普通策略',
    description: '普通趋势：上涨或下跌达15日波动率时，买入设定数量或卖出1/4持仓',
    isDefault: true,
    trendMatches: ['trend_oscillation', 'unset', 'trend_unknown'], // 匹配震荡趋势、未设置、未知趋势
    script: `// 通用普通策略
// 上涨或下跌达15日波动率时，买入设定数量或卖出1/4持仓
const vol = ctx.volatility15d * 100  // 转为百分比

// 持仓已经是100股，不生成卖出条件单
if (ctx.netPosition === 100) {
  return [
    buy({
      stockCode: ctx.stockCode,
      stockName: ctx.stockName,
      tradeVolume: ctx.defaultBuyVolume,
      percentage: parseFloat(vol.toFixed(2)),
      provider: ctx.provider,
      accountType: ctx.accountType
    })
  ]
}

// 持仓市值小于20000时，卖出到只剩100股
const sellVol = ctx.marketValue < 20000
  ? Math.max(100, Math.floor((ctx.netPosition - 100) / 100) * 100)
  : Math.floor(ctx.netPosition / 4 / 100) * 100  // 1/4持仓，取整到100

return [
  sell({
    stockCode: ctx.stockCode,
    stockName: ctx.stockName,
    tradeVolume: sellVol,
    percentage: parseFloat(vol.toFixed(2)),
    provider: ctx.provider,
    accountType: ctx.accountType
  }),
  buy({
    stockCode: ctx.stockCode,
    stockName: ctx.stockName,
    tradeVolume: ctx.defaultBuyVolume,
    percentage: parseFloat(vol.toFixed(2)),
    provider: ctx.provider,
    accountType: ctx.accountType
  })
]`
  }
]

const loadTemplates = () => {
  const saved = localStorage.getItem('orderStrategyTemplates')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      // 兼容旧格式：如果旧模板没有 script 字段，迁移为新格式
      if (parsed.length > 0 && !parsed[0].script) {
        templates.value = defaultStrategyScripts.map(s => ({
          name: s.name,
          description: s.description,
          isDefault: s.isDefault,
          script: s.script
        }))
        saveTemplates()
      } else {
        // 修复旧数据：确保每个模板都有 trendMatches 数组
        templates.value = parsed.map(t => ({
          ...t,
          trendMatches: Array.isArray(t.trendMatches) ? t.trendMatches : []
        }))
      }
    } catch (e) {
      console.error('加载策略模板失败:', e)
      templates.value = []
    }
  }
  // 如果没有模板，自动添加缺省策略
  if (templates.value.length === 0) {
    addDefaultStrategies()
  }
}

const addDefaultStrategies = () => {
  defaultStrategyScripts.forEach(strategy => {
    templates.value.push({
      name: strategy.name,
      description: strategy.description,
      isDefault: strategy.isDefault,
      trendMatches: strategy.trendMatches || [],
      script: strategy.script
    })
  })
  saveTemplates()
}

const saveTemplates = () => {
  localStorage.setItem('orderStrategyTemplates', JSON.stringify(templates.value))
  // 同步趋势映射关系到 AppConfigService
  appConfigService.syncTrendMappingFromTemplates(templates.value)
}

const addTemplate = () => {
  templates.value.push(defaultTemplate())
  saveTemplates()
}

const removeTemplate = (index) => {
  if (!confirm('确定要删除此策略吗？')) return
  templates.value.splice(index, 1)
  delete previewResults[index]
  delete previewErrors[index]
  saveTemplates()
}

const onScriptChange = (index) => {
  saveTemplates()
}

const onTrendMatchesChange = (index) => {
  // 确保 trendMatches 始终是数组
  const template = templates.value[index]
  if (!Array.isArray(template.trendMatches)) {
    template.trendMatches = []
  }
  saveTemplates()
}

// 执行策略脚本
const executeStrategyScript = (script, ctx) => {
  // 辅助函数
  const buy = (data) => ({ action: 'buy', data })
  const sell = (data) => ({ action: 'sell', data })

  try {
    const fn = new Function('ctx', 'buy', 'sell', script)
    const result = fn(ctx, buy, sell)
    if (!Array.isArray(result)) {
      return { error: '脚本必须返回一个数组', result: null }
    }
    return { error: null, result }
  } catch (e) {
    return { error: e.message, result: null }
  }
}

// 运行预览
const runPreview = (index) => {
  const template = templates.value[index]
  if (!template || !template.script) {
    previewErrors[index] = '请输入策略脚本'
    delete previewResults[index]
    return
  }

  const { error, result } = executeStrategyScript(template.script, sampleCtx)

  if (error) {
    previewErrors[index] = error
    delete previewResults[index]
  } else {
    delete previewErrors[index]
    // 格式化输出为完整的 MQTT 消息
    const messages = result.map((msg, i) => {
      const key = '消息' + (i + 1)
      const obj = {}
      obj[key] = {
        action: msg.action,
        data: msg.data
      }
      return obj
    })
    previewResults[index] = JSON.stringify(messages, null, 2)
  }
}

const copyPreview = async (index) => {
  const text = previewResults[index]
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copiedIndex.value = index
    setTimeout(() => { copiedIndex.value = -1 }, 2000)
  } catch (e) {
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copiedIndex.value = index
    setTimeout(() => { copiedIndex.value = -1 }, 2000)
  }
}

// 生成 AI 提示词
const generateAIPrompt = async (index) => {
  const template = templates.value[index]
  const userPrompt = aiPrompts[index] || ''

  if (!userPrompt.trim()) {
    alert('请先输入策略需求描述')
    return
  }

  const trendLabels = (template.trendMatches || [])
    .map(v => availableTrends.find(t => t.value === v)?.label || v)
    .join('、')

  const fullPrompt = `你是一个量化交易策略专家。请根据以下信息生成一个 JavaScript 策略脚本。

## 框架说明

脚本运行在以下环境中：
- 输入变量 "ctx" 包含股票数据：
  - ctx.stockCode: 股票代码，6位数字（如 "600519"）
  - ctx.stockName: 股票名称（如 "贵州茅台"）
  - ctx.currentPrice: 当前收盘价（如 1680.00）
  - ctx.netPosition: 当前持仓数量（股）（如 100）
  - ctx.marketValue: 持仓市值 = 持仓 × 价格（如 168000）
  - ctx.trendJudgment: 趋势判断类型（如 "trend_up", "trend_down" 等）
  - ctx.volatility15d: 15日平均波动率（小数，如 1.65% 存为 0.0165）
  - ctx.priceDropRatio: 最高价到当前价的下跌比率（如 0.05 表示 5%）
  - ctx.isMarginAccount: 是否为融资融券账户（true/false）
  - ctx.defaultBuyVolume: 缺省买入数量，优先使用策略的加仓数量，否则为持仓的 1/4
  - ctx.defaultSellVolume: 缺省卖出数量，为持仓的 1/4（向下取整到 100 的倍数）
  - ctx.defaultAmount: 缺省交易金额，固定值 20000 元
  - ctx.provider: 券商代码（如 "pingan"）
  - ctx.accountType: 账户类型（"default" 或 "credit"）

- 辅助函数：
  - buy(data): 生成买入条件单消息
  - sell(data): 生成卖出条件单消息
  - data 参数包含：stockCode, stockName, tradeVolume（交易数量）, percentage（触发百分比）, provider, accountType, side

- 脚本必须返回一个数组，每个元素是一条 MQTT 消息

## 当前策略信息

- 策略名称：${template.name || '未命名'}
- 策略描述：${template.description || '无'}
- 匹配趋势：${trendLabels || '未设置'}

## 当前脚本（如需要修改/优化）

\`\`\`javascript
${template.script || '// 暂无脚本'}
\`\`\`

## 用户需求

${userPrompt.trim()}

## 输出要求

1. 返回完整的 JavaScript 策略脚本代码
2. 代码必须是一个函数体，最后返回数组
3. 使用 ctx 变量获取股票数据
4. 使用 buy() / sell() 辅助函数生成条件单
5. 添加必要的注释说明逻辑
6. 代码格式规范，使用 2 空格缩进

请直接返回代码，不要包含任何解释。`

  try {
    await navigator.clipboard.writeText(fullPrompt)
    alert('AI 提示词已复制到剪贴板！请粘贴到 ChatGPT/Claude 等 AI 工具中。')
  } catch (e) {
    const textarea = document.createElement('textarea')
    textarea.value = fullPrompt
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('AI 提示词已复制到剪贴板！请粘贴到 ChatGPT/Claude 等 AI 工具中。')
  }
}

onMounted(() => {
  loadWebDAVConfig()
  loadGiteeConfig()
  loadMQTTConfig()
  loadTemplates()
  startMqttStatusSync()
})

onUnmounted(() => {
  stopMqttStatusSync()
})

// 监听 templates 变化，自动同步趋势映射
watch(templates, (newTemplates) => {
  if (newTemplates && newTemplates.length > 0) {
    console.log('[Settings] templates 变化，同步趋势映射')
    appConfigService.syncTrendMappingFromTemplates(newTemplates)
  }
}, { deep: true })
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

.header-content .header-version-link {
  display: flex !important;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  color: #ffa500 !important;
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid rgba(255, 165, 0, 0.5);
  background-color: rgba(255, 165, 0, 0.15);
  font-size: 12px;
  transition: all 0.2s;
  white-space: nowrap;
  visibility: visible !important;
  opacity: 1 !important;
}

.header-content .header-version-link:hover {
  background-color: rgba(255, 165, 0, 0.25);
  border-color: rgba(255, 165, 0, 0.7);
}

.header-content .header-version-link svg {
  flex-shrink: 0;
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

.agent-status {
  margin-left: 12px;
  padding-left: 12px;
  border-left: 1px solid rgba(255, 255, 255, 0.15);
  font-size: 12px;
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

.form-hint {
  margin: 4px 0 0 24px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
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

/* 缺省策略样式 */
.default-template {
  border-color: rgba(78, 205, 196, 0.4) !important;
  background-color: rgba(78, 205, 196, 0.05) !important;
}

.default-badge {
  font-size: 11px;
  padding: 2px 8px;
  background-color: rgba(78, 205, 196, 0.3);
  color: #4ecdc4;
  border-radius: 12px;
  margin-left: 8px;
}

.template-description {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 12px;
  padding: 8px 12px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  border-left: 3px solid #4ecdc4;
}

.template-header-actions {
  display: flex;
  gap: 6px;
}

/* 脚本编辑器 */
.script-editor {
  width: 100%;
  min-height: 200px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.4);
  color: #4ecdc4;
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
  box-sizing: border-box;
  tab-size: 2;
}

.script-editor::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

.script-editor:focus {
  outline: none;
  border-color: rgba(78, 205, 196, 0.5);
}

/* API 帮助 */
.help-toggle-btn {
  background: none;
  border: 1px solid rgba(78, 205, 196, 0.4);
  color: #4ecdc4;
  padding: 2px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  margin-left: 8px;
}

.help-toggle-btn:hover {
  background-color: rgba(78, 205, 196, 0.15);
}

.api-help {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 16px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

.api-help h4 {
  margin: 0 0 8px 0;
  color: #4ecdc4;
  font-size: 14px;
}

.api-help p {
  margin: 4px 0;
}

.api-help code {
  background-color: rgba(78, 205, 196, 0.15);
  padding: 1px 4px;
  border-radius: 3px;
  color: #4ecdc4;
  font-size: 12px;
}

.api-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 12px;
}

.api-table th,
.api-table td {
  padding: 4px 8px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
}

.api-table th {
  color: #4ecdc4;
  font-weight: 600;
}

.api-table td:first-child {
  color: #ffc107;
  font-family: 'Courier New', monospace;
  white-space: nowrap;
}

.api-table td:nth-child(2) {
  color: rgba(255, 255, 255, 0.5);
  width: 60px;
}

/* 预览错误 */
.preview-error {
  margin-top: 8px;
  padding: 8px 12px;
  background-color: rgba(220, 53, 69, 0.15);
  border: 1px solid rgba(220, 53, 69, 0.3);
  border-radius: 4px;
  color: #dc3545;
  font-size: 12px;
}

.preview-error strong {
  color: #ff6b6b;
}

/* 代码示例 */
.code-example {
  background-color: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 12px;
  margin: 8px 0;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #4ecdc4;
  white-space: pre-wrap;
  overflow-x: auto;
}

/* 趋势匹配选择器 */
.trend-matches-group {
  margin-bottom: 16px;
}

.trend-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.trend-checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background-color: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  cursor: pointer;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s;
}

.trend-checkbox-label:hover {
  background-color: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
}

.trend-checkbox-label.selected {
  background-color: rgba(78, 205, 196, 0.2);
  border-color: rgba(78, 205, 196, 0.5);
  color: #4ecdc4;
}

.trend-checkbox-label input[type="checkbox"] {
  display: none;
}

.trend-hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 6px;
  margin-bottom: 0;
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

/* 版本信息样式 */
.version-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px;
  background-color: rgba(78, 205, 196, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(78, 205, 196, 0.2);
}

.version-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.version-label {
  color: #888;
  font-size: 14px;
}

.version-value {
  color: #4ecdc4;
  font-size: 14px;
  font-weight: 500;
}

.version-switch .version-label {
  min-width: 70px;
}

.version-link {
  color: #ffa500;
  text-decoration: none;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid rgba(255, 165, 0, 0.3);
  background-color: rgba(255, 165, 0, 0.1);
  transition: all 0.2s;
  font-size: 13px;
}

.version-link:hover {
  background-color: rgba(255, 165, 0, 0.2);
  border-color: rgba(255, 165, 0, 0.5);
  color: #ffa500;
}

/* AI 提示词助手 */
.ai-prompt-group {
  background: rgba(78, 205, 196, 0.05);
  border: 1px solid rgba(78, 205, 196, 0.15);
  border-radius: 8px;
  padding: 12px;
}

.ai-prompt-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #4ecdc4;
  margin-bottom: 8px;
}

.ai-prompt-input-wrap {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.ai-prompt-textarea {
  flex: 1;
  min-height: 60px;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  resize: vertical;
  outline: none;
  font-family: inherit;
}

.ai-prompt-textarea::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.ai-prompt-textarea:focus {
  border-color: rgba(78, 205, 196, 0.4);
  background: rgba(0, 0, 0, 0.4);
}

.ai-generate-btn {
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  font-size: 11px;
}

.ai-prompt-hint {
  margin: 6px 0 0 0;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

/* Gitee 同步 */
.gitee-sync-actions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.form-group-half {
  flex: 1;
}

/* 持仓查询 */
.holdings-result {
  margin-top: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.holdings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

.holdings-table-wrap {
  overflow-x: auto;
}

.holdings-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.holdings-table th {
  padding: 8px 12px;
  text-align: right;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  white-space: nowrap;
}

.holdings-table th:first-child {
  text-align: left;
}

.holdings-table td {
  padding: 8px 12px;
  text-align: right;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.85);
}

.holdings-table td:first-child,
.holdings-table td:nth-child(2) {
  text-align: left;
}

.text-profit {
  color: #ff6b6b;
}

.text-loss {
  color: #51cf66;
}

.holdings-error {
  margin-top: 12px;
  padding: 10px 14px;
  background: rgba(220, 53, 69, 0.1);
  border: 1px solid rgba(220, 53, 69, 0.3);
  border-radius: 6px;
  font-size: 13px;
  color: #ff6b6b;
}
</style>
