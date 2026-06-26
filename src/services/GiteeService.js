/**
 * Gitee 同步服务
 * 将应用配置保存到 Gitee 仓库，实现跨设备同步
 * 策略脚本单独放在 strategies.js，其他配置放在 config.json
 */

import appConfigService from './AppConfigService.js'

const GITEE_CONFIG_KEY = 'giteeSyncConfig'

class GiteeService {
  constructor() {
    this.token = ''
    this.owner = ''
    this.repo = ''
    this.branch = 'master'
    this.basePath = 'my-quant'
    this.enabled = false
    this.loadConfig()
  }

  // 从 localStorage 读取配置
  loadConfig() {
    try {
      const saved = localStorage.getItem(GITEE_CONFIG_KEY)
      if (saved) {
        const config = JSON.parse(saved)
        this.token = config.token || ''
        this.owner = config.owner || ''
        this.repo = config.repo || ''
        this.branch = config.branch || 'master'
        this.basePath = config.basePath || 'my-quant'
        this.enabled = config.enabled || false
      }
    } catch (e) {
      console.error('[Gitee] 加载配置失败:', e)
    }
  }

  // 保存配置到 localStorage
  saveConfig() {
    try {
      const config = {
        token: this.token,
        owner: this.owner,
        repo: this.repo,
        branch: this.branch,
        basePath: this.basePath,
        enabled: this.enabled
      }
      localStorage.setItem(GITEE_CONFIG_KEY, JSON.stringify(config))
    } catch (e) {
      console.error('[Gitee] 保存配置失败:', e)
    }
  }

  // 设置配置并保存
  setConfig(config) {
    this.token = config.token || ''
    this.owner = config.owner || ''
    this.repo = config.repo || ''
    this.branch = config.branch || 'master'
    this.basePath = config.basePath || 'my-quant'
    this.enabled = config.enabled || false
    this.saveConfig()
  }

  // 获取配置
  getConfig() {
    return {
      token: this.token,
      owner: this.owner,
      repo: this.repo,
      branch: this.branch,
      basePath: this.basePath,
      enabled: this.enabled
    }
  }

  // 检查是否已配置
  isConfigured() {
    return !!(this.token && this.owner && this.repo)
  }

  // 构建 API URL
  getApiBaseUrl() {
    return `https://gitee.com/api/v5/repos/${this.owner}/${this.repo}`
  }

  // 获取文件内容
  async getFile(path) {
    if (!this.isConfigured()) {
      throw new Error('Gitee 未配置')
    }

    const encodedPath = encodeURIComponent(path).replace(/%2F/g, '/')
    const url = `${this.getApiBaseUrl()}/contents/${encodedPath}?access_token=${this.token}&ref=${this.branch}`

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })

    if (response.status === 404) {
      return null // 文件不存在
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `获取文件失败: ${response.status}`)
    }

    const data = await response.json()
    return {
      content: data.content, // base64
      sha: data.sha,
      name: data.name,
      path: data.path
    }
  }

  // 创建文件
  async createFile(path, content, message) {
    if (!this.isConfigured()) {
      throw new Error('Gitee 未配置')
    }

    const encodedPath = encodeURIComponent(path).replace(/%2F/g, '/')
    const url = `${this.getApiBaseUrl()}/contents/${encodedPath}`
    const body = {
      access_token: this.token,
      content: btoa(unescape(encodeURIComponent(content))), // base64
      message: message || `更新 ${path}`,
      branch: this.branch
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `创建文件失败: ${response.status}`)
    }

    return await response.json()
  }

  // 更新文件
  async updateFile(path, content, message, sha) {
    if (!this.isConfigured()) {
      throw new Error('Gitee 未配置')
    }

    const encodedPath = encodeURIComponent(path).replace(/%2F/g, '/')
    const url = `${this.getApiBaseUrl()}/contents/${encodedPath}`
    const body = {
      access_token: this.token,
      content: btoa(unescape(encodeURIComponent(content))), // base64
      message: message || `更新 ${path}`,
      branch: this.branch,
      sha: sha
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `更新文件失败: ${response.status}`)
    }

    return await response.json()
  }

  // 创建或更新文件（自动判断）
  async putFile(path, content, message) {
    const existing = await this.getFile(path)
    if (existing && existing.sha) {
      return await this.updateFile(path, content, message, existing.sha)
    } else {
      return await this.createFile(path, content, message)
    }
  }

  // 生成 strategies.js 内容
  // script 字段改为真正的 JS 函数，Gitee 上可享受完整语法高亮
  generateStrategiesJs(templates) {
    const lines = ['export default [']

    for (const t of templates) {
      const name = JSON.stringify(t.name || '')
      const description = JSON.stringify(t.description || '')
      const script = t.script || ''
      const trendMatches = JSON.stringify(t.trendMatches || [])
      const isDefault = t.isDefault ? 'true' : 'false'

      lines.push('  {')
      lines.push(`    name: ${name},`)
      lines.push(`    description: ${description},`)
      lines.push(`    script(ctx, buy, sell) {`)

      // 写入函数体，保持原始缩进（前面加 6 个空格）
      if (script.trim()) {
        const bodyLines = script.split('\n')
        for (const line of bodyLines) {
          lines.push(`      ${line}`)
        }
      }

      lines.push(`    },`)
      lines.push(`    trendMatches: ${trendMatches},`)
      lines.push(`    isDefault: ${isDefault}`)
      lines.push('  },')
    }

    // 移除最后一个逗号
    if (templates.length > 0) {
      lines[lines.length - 1] = lines[lines.length - 1].replace(/,$/, '')
    }

    lines.push(']\n')
    return lines.join('\n')
  }

  // 解析 strategies.js 内容
  parseStrategiesJs(content) {
    try {
      // 使用 Function 构造函数安全地执行模块代码
      const fn = new Function('return ' + content.replace(/^\s*export\s+default\s*/, ''))
      const templates = fn()

      // 把函数转回字符串存入 localStorage
      if (Array.isArray(templates)) {
        for (const t of templates) {
          if (typeof t.script === 'function') {
            const fnStr = t.script.toString()
            // 提取函数体：去掉 "function script(ctx, buy, sell) {" 或 "script(ctx, buy, sell) {"
            // 以及最后的 "}"
            let body = fnStr
              .replace(/^\s*function\s+\w*\s*\([^)]*\)\s*\{/, '')
              .replace(/^\s*\w*\s*\([^)]*\)\s*\{/, '')
              .replace(/\}\s*$/, '')
              .trim()

            // 去掉函数体的统一缩进（6 个空格）
            const bodyLines = body.split('\n')
            const trimmedLines = bodyLines.map(line => {
              if (line.startsWith('      ')) {
                return line.slice(6)
              }
              return line
            })
            t.script = trimmedLines.join('\n')
          }
        }
      }

      return templates
    } catch (e) {
      console.error('[Gitee] 解析 strategies.js 失败:', e)
      // 降级：尝试移除 export default 后用 JSON.parse（兼容旧版模板字符串格式）
      try {
        const jsonStr = content.replace(/^\s*export\s+default\s*/, '').trim()
        return JSON.parse(jsonStr)
      } catch (e2) {
        console.error('[Gitee] JSON 解析也失败:', e2)
        return null
      }
    }
  }

  // 上传配置到 Gitee
  async upload() {
    if (!this.isConfigured()) {
      throw new Error('请先配置 Gitee 仓库信息')
    }

    console.log('[Gitee] 开始上传配置...')

    // 1. 获取完整配置
    const configData = appConfigService.exportConfig()

    // 2. 获取策略模板
    const templatesStr = localStorage.getItem('orderStrategyTemplates')
    const templates = templatesStr ? JSON.parse(templatesStr) : []

    // 3. 生成 strategies.js
    const strategiesJs = this.generateStrategiesJs(templates)
    const strategiesPath = `${this.basePath}/strategies.js`

    // 4. 生成 config.json（移除 orderStrategyTemplates）
    const configForGitee = { ...configData }
    delete configForGitee.orderStrategyTemplates
    const configJson = JSON.stringify(configForGitee, null, 2)
    const configPath = `${this.basePath}/config.json`

    // 5. 上传两个文件
    await this.putFile(strategiesPath, strategiesJs, '更新策略脚本')
    console.log('[Gitee] strategies.js 上传成功')

    await this.putFile(configPath, configJson, '更新应用配置')
    console.log('[Gitee] config.json 上传成功')

    console.log('[Gitee] 配置上传完成')
    return true
  }

  // 从 Gitee 下载配置
  async download() {
    if (!this.isConfigured()) {
      throw new Error('请先配置 Gitee 仓库信息')
    }

    console.log('[Gitee] 开始下载配置...')

    const configPath = `${this.basePath}/config.json`
    const strategiesPath = `${this.basePath}/strategies.js`

    let configDownloaded = false
    let strategiesDownloaded = false

    // 1. 下载 config.json
    try {
      const configFile = await this.getFile(configPath)
      if (configFile && configFile.content) {
        const configJson = decodeURIComponent(escape(atob(configFile.content)))
        const configData = JSON.parse(configJson)
        appConfigService.mergeFromRemote(configData)
        console.log('[Gitee] config.json 下载并合并成功')
        configDownloaded = true
      } else {
        console.warn('[Gitee] 远程不存在 config.json')
      }
    } catch (e) {
      console.error('[Gitee] 下载 config.json 失败:', e)
      throw new Error(`下载配置失败: ${e.message}`)
    }

    // 2. 下载 strategies.js
    try {
      const strategiesFile = await this.getFile(strategiesPath)
      if (strategiesFile && strategiesFile.content) {
        const strategiesJs = decodeURIComponent(escape(atob(strategiesFile.content)))
        const templates = this.parseStrategiesJs(strategiesJs)
        if (templates && Array.isArray(templates)) {
          localStorage.setItem('orderStrategyTemplates', JSON.stringify(templates))
          console.log('[Gitee] strategies.js 下载成功，共', templates.length, '个模板')
          strategiesDownloaded = true

          // 触发模板更新事件
          window.dispatchEvent(new CustomEvent('strategyTemplatesUpdated', {
            detail: { templates }
          }))
        }
      } else {
        console.warn('[Gitee] 远程不存在 strategies.js')
      }
    } catch (e) {
      console.error('[Gitee] 下载 strategies.js 失败:', e)
    }

    if (!configDownloaded && !strategiesDownloaded) {
      throw new Error('远程仓库中未找到配置文件')
    }

    console.log('[Gitee] 配置下载完成')
    return { configDownloaded, strategiesDownloaded }
  }

  // 测试连接
  async testConnection() {
    if (!this.isConfigured()) {
      throw new Error('请先配置 Gitee 仓库信息')
    }

    try {
      const url = `${this.getApiBaseUrl()}?access_token=${this.token}`
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `连接失败: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        repoName: data.full_name,
        description: data.description
      }
    } catch (e) {
      throw new Error(`连接测试失败: ${e.message}`)
    }
  }
}

// 导出单例
const giteeService = new GiteeService()

export default giteeService
export { GiteeService, GITEE_CONFIG_KEY }
