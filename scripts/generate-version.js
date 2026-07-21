/**
 * 构建前自动生成版本信息 JSON
 * 读取 git tag/branch/commit 和 package.json 版本，生成 src/version.json
 */

const { execSync } = require('child_process');
const { writeFileSync } = require('fs');
const { join } = require('path');

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', cwd: join(__dirname, '..') }).trim();
  } catch {
    return '';
  }
}

// 读取 package.json 版本
let pkgVersion = '1.0.0';
try {
  pkgVersion = require(join(__dirname, '..', 'package.json')).version || '1.0.0';
} catch {
  // fallback
}

// Git 信息
const sha = run('git rev-parse --short HEAD') || 'unknown';
const branch = run('git rev-parse --abbrev-ref HEAD') || 'unknown';
const tag = run('git describe --tags --exact-match 2>/dev/null') || '';
const commitCount = run('git rev-list --count HEAD') || '0';

// 版本号优先级：git tag > package.json version + commitCount
const version = tag
  ? tag
  : `${pkgVersion}-dev.${commitCount}`;

// 构建时间（北京时间）
const buildTime = new Date().toLocaleString('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});

const payload = {
  version,
  buildTime,
  sha,
  branch,
  tag,
  pkgVersion
};

const outPath = join(__dirname, '..', 'src', 'version.json');
writeFileSync(outPath, JSON.stringify(payload, null, 2));

console.log(`[generate-version] ${version} (${sha}) @ ${buildTime}`);
