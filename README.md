# my-quant - 高级策略监控系统

股票量化交易策略管理 Web 应用。

## 功能特性

- 策略的增删改查
- 条件单管理（下跌减仓、上涨加仓）
- 趋势判断设置
- 数据导入/导出
- 从 WebDAV 同步 vue-dialog-userscript 数据
- PouchDB 本地存储
- **版本切换** - 支持 latest/release 版本切换（参考 auto-deploy skill）

## 技术栈

- Vue 3
- Vite
- TailwindCSS 3
- PouchDB

## 项目结构

```
my-quant/
├── .github/workflows/      # GitHub Actions 工作流
│   ├── release.yml         # 发布到 GitHub Pages + Release
│   └── webdav-publish.yml  # 部署到 WebDAV
├── docs/                   # 文档
│   ├── external-interface/ # 外部接口文档
│   └── webdav/             # WebDAV 数据格式文档
├── src/
│   ├── components/         # Vue 组件
│   │   ├── VersionSwitch.vue   # ⭐ 版本切换组件 (latest/release)
│   │   ├── StrategyList.vue
│   │   ├── StrategyRow.vue
│   │   └── ...
│   ├── views/              # 页面视图
│   ├── services/           # 业务服务
│   ├── utils/              # 工具函数
│   ├── App.vue
│   └── main.js
├── README.md
└── package.json
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## GitHub Actions 部署

### 设置 GitHub Secrets

在 GitHub 仓库设置以下 Secrets：

```powershell
# 设置仓库名称
set USERNAME=weijia
set PROJ=my-quant
set ROOT=%USERNAME%/%PROJ%

# 设置 WebDAV 凭据（请替换为你的实际值）
gh secret set WEBDAV_URL --repo %ROOT% --body https://your-webdav-server.com/dav/
gh secret set WEBDAV_USERNAME --repo %ROOT% --body YOUR_USERNAME
gh secret set WEBDAV_PASSWORD --repo %ROOT% --body YOUR_PASSWORD
```

### 部署触发

1. **WebDAV 自动部署**: 推送到 main/master 分支或打 `v*` 标签
2. **GitHub Pages + Release**: 打 `v*` 标签时自动发布

### 部署目录结构

```
online/
├── my-quant/               # 版本目录（按 tag 命名）
│   ├── v1.0.0/
│   ├── v1.1.0/
│   └── ...
├── latest/                 # 始终指向最新版本
└── release/                # 稳定版本（手动切换）
```

### 版本切换功能

项目已集成 **版本切换组件** (`src/components/VersionSwitch.vue`)：

- **latest 目录**: 始终自动指向最新发布的版本
- **release 目录**: 稳定版本，可手动控制何时切换

当用户访问 `latest` 版本时，页面右下角显示 **"切换到正式版"** 链接；
当用户访问 `release` 或其他版本时，显示 **"切换到最新版"** 链接。

### 注意事项

- 项目部署路径: `/my-quant/`
- Vite base URL 已配置为 `/my-quant/`
- WebDAV 目标目录: `online/my-quant`

## 数据导入

### 从 WebDAV 同步

点击页面顶部的 **"同步WebDAV"** 按钮，可以从 vue-dialog-userscript 的 WebDAV 存储同步数据。

**支持的 WebDAV 路径**: `https://your-webdav-server.com/dav/app_data/stocks/all_strategies.json`

**同步内容**:
- 股票基本信息（名称、代码、账户类型、持仓数量、市值等）
- 条件单策略（下跌减仓、上涨加仓）
- 网格策略
- 高级策略配置

### 从本地文件导入

1. 点击 **"导入数据"** 按钮
2. 选择 JSON 格式的文件
3. 系统会自动转换数据格式并导入

**支持的 JSON 格式**:
- my-quant 导出的格式
- vue-dialog-userscript 的 `all_strategies.json` 格式

## 参考 Skills

本项目参考了以下 skills：

| Skill | 用途 | 位置 |
|-------|------|------|
| [auto-deploy](https://github.com/weijia/my-skills/tree/main/auto-deploy) | 三通道自动部署 + 版本切换 | `.github/workflows/`, `src/components/VersionSwitch.vue` |
| [version-display](https://github.com/weijia/my-skills/tree/main/version-display) | 版本号显示 | `src/version.js`, `src/views/SettingsView.vue` |
