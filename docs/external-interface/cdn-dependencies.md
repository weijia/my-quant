# CDN 依赖与项目配置文档

## 概述

本文档记录项目通过 CDN 引入的外部资源以及项目构建配置。

---

## CDN 外部资源

### PouchDB

| 属性 | 值 |
|------|-----|
| 库 | PouchDB |
| 版本 | 9.0.0 |
| CDN URL | `https://cdn.jsdelivr.net/npm/pouchdb@9.0.0/dist/pouchdb.min.js` |
| 引入位置 | `index.html` 第 11 行 |
| 引入方式 | `<script>` 标签全局加载 |
| 访问方式 | `window.PouchDB` |
| 用途 | 本地浏览器数据库，存储策略、条件单、趋势数据 |

---

## npm 依赖

| 依赖名 | 版本 | 类型 | 用途 |
|--------|------|------|------|
| `vue` | ^3.5.34 | dependencies | 前端框架 |
| `vite` | ^5.4.11 | dependencies | 构建工具 |
| `@vitejs/plugin-vue` | ^5.2.1 | dependencies | Vite 的 Vue 插件 |
| `tailwindcss` | ^3.4.19 | dependencies | CSS 工具类框架 |
| `autoprefixer` | ^10.5.0 | dependencies | CSS 自动添加浏览器前缀 |
| `pouchdb` | ^9.0.0 | dependencies | 本地数据库（npm 备用，实际通过 CDN 引入） |

> **注意**: `lucide-vue-next` 已安装但代码中未实际使用。

---

## 构建配置

### Vite 配置 (`vite.config.js`)

```javascript
const { defineConfig } = require('vite')
const vue = require('@vitejs/plugin-vue')

module.exports = defineConfig({
  plugins: [vue()],
  base: './'
})
```

- **base**: `./`（相对路径，支持任意部署目录）
- **插件**: `@vitejs/plugin-vue`

### TailwindCSS 配置 (`tailwind.config.js`)

```javascript
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: []
}
```

- **扫描范围**: `index.html` 和 `src/` 下所有 Vue/JS 文件

### PostCSS 配置 (`postcss.config.js`)

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

---

## GitHub Actions 依赖

### release.yml

| Action | 版本 | 用途 |
|--------|------|------|
| `actions/checkout@v4` | v4 | 检出代码 |
| `actions/setup-node@v4` | v4 | 安装 Node.js 20 |
| `actions/create-release@v1` | v1 | 创建 GitHub Release |
| `actions/upload-release-asset@v1` | v1 | 上传 Release 资产 |
| `peaceiris/actions-gh-pages@v3` | v3 | 部署到 GitHub Pages |

### webdav-publish.yml

| Action | 版本 | 用途 |
|--------|------|------|
| `actions/checkout@v4` | v4 | 检出代码 |
| `actions/setup-node@v4` | v4 | 安装 Node.js 20 |
| `weijia/action-upload-webdav@master` | master | 上传构建产物到 WebDAV |

---

## 浏览器原生 API 使用

| API | 使用位置 | 用途 |
|-----|----------|------|
| `fetch()` | `WebDAVImportService.js` | HTTP 请求（GET/PROPFIND） |
| `DOMParser` | `WebDAVImportService.js` | 解析 WebDAV XML 响应 |
| `localStorage` | `StrategyList.vue` | 持久化用户偏好设置 |
| `Blob` | `App.vue` | 导出数据为 JSON 文件下载 |
| `URL.createObjectURL()` | `App.vue` | 创建下载链接 |
| `alert()` / `confirm()` | 多个组件 | 用户确认和提示 |
