/**
 * 构建前自动生成版本信息 JS 模块（CJS 格式，可被 require）
 * 输出到 src/version.gen.js，供 vite.config.js 使用
 */

const { execSync } = require('child_process');
const { writeFileSync } = require('fs');
const path = require('path');

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', cwd: path.resolve(__dirname, '..') }).trim();
  } catch {
    return '';
  }
}

let pkgVersion = '1.0.0';
try {
  pkgVersion = require(path.resolve(__dirname, '..', 'package.json')).version || '1.0.0';
} catch { /* fallback */ }

const sha = run('git rev-parse --short HEAD') || 'unknown';
const branch = run('git rev-parse --abbrev-ref HEAD') || 'unknown';
const tag = run('git describe --tags --exact-match 2>/dev/null') || '';
const commitCount = run('git rev-list --count HEAD') || '0';

const version = tag ? tag : `${pkgVersion}-dev.${commitCount}`;

const buildTime = new Date().toLocaleString('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});

// 输出 CJS 格式，供 vite.config.js 的 require() 使用
const content = `// 自动生成，请勿手动修改
module.exports = {
  VERSION: ${JSON.stringify(version)},
  BUILD_TIME: ${JSON.stringify(buildTime)},
  COMMIT_SHA: ${JSON.stringify(sha)},
  BRANCH: ${JSON.stringify(branch)},
  TAG: ${JSON.stringify(tag)},
  PKG_VERSION: ${JSON.stringify(pkgVersion)}
}
`;

const outPath = path.resolve(__dirname, '..', 'src', 'version.gen.js');
writeFileSync(outPath, content);

console.log(`[generate-version] ${version} (${sha}) @ ${buildTime}`);
