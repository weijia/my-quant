# my-quant - 高级策略监控系统

股票量化交易策略管理 Web 应用。

## 功能特性

- 策略的增删改查
- 条件单管理（下跌减仓、上涨加仓）
- 趋势判断设置
- 数据导入/导出
- PouchDB 本地存储

## 技术栈

- Vue 3
- Vite
- TailwindCSS 3
- PouchDB

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

# 设置 WebDAV 凭据
gh secret set WEBDAV_URL --repo %ROOT% --body https://your-webdav-server.com/dav/
gh secret set WEBDAV_USERNAME --repo %ROOT% --body YOUR_USERNAME
gh secret set WEBDAV_PASSWORD --repo %ROOT% --body YOUR_PASSWORD
```

### 部署触发

1. **WebDAV 自动部署**: 推送到 main/master 分支或打 `v*` 标签
2. **GitHub Pages + Release**: 打 `v*` 标签时自动发布

### 注意事项

- 项目部署路径: `/x/`
- Vite base URL 已配置为 `/x/`
- WebDAV 目标目录: `online/x`
