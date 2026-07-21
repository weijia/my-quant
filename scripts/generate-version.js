/**
 * 构建前自动生成版本信息
 * 输出到 stdout，由 vite.config.js 读取并注入为全局变量
 * 
 * 使用方式：
 *   node scripts/generate-version.js  →  输出 JSON 到 stdout
 */

const { execSync } = require('child_process');
const path = require('path');

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', cwd: path.resolve(__dirname, '..') }).trim();
  } catch {
    return '';
  }
}

// 读取 package.json 版本
let pkgVersion = '1.0.0';
try {
  pkgVersion = require(path.resolve(__dirname, '..', 'package.json')).version || '1.0.0';
} catch { /* fallback */ }

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

// 输出 JSON 供 vite.config.js 捕获
const payload = JSON.stringify({ version, buildTime, sha, branch, tag, pkgVersion });
process.stdout.write(payload);

// 同时打印人类可读信息到 stderr
console.error(`[generate-version] ${version} (${sha}) @ ${buildTime}`);