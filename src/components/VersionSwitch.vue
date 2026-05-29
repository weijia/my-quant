<template>
  <div v-if="switchLink" class="version-switch">
    <a :href="switchLink.href">{{ switchLink.text }}</a>
  </div>
</template>

<script setup>
import { computed } from 'vue'

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

// 计算切换链接
const switchLink = computed(() => {
  if (currentDir.value === 'latest') {
    return {
      href: '../release/index.html',
      text: isChineseLocale() ? '切换到正式版' : 'Switch to Release'
    }
  }
  if (currentDir.value === 'release' || /^\d{8}$/.test(currentDir.value)) {
    return {
      href: '../latest/index.html',
      text: isChineseLocale() ? '切换到最新版' : 'Switch to Latest'
    }
  }
  return null
})
</script>

<style scoped>
.version-switch {
  position: fixed;
  bottom: 8px;
  right: 16px;
  z-index: 1000;
  font-size: 12px;
}

.version-switch a {
  color: #666;
  text-decoration: none;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid #ddd;
  transition: all 0.2s;
}

.version-switch a:hover {
  background-color: rgba(78, 205, 196, 0.1);
  border-color: #4ecdc4;
  color: #4ecdc4;
}

@media (prefers-color-scheme: dark) {
  .version-switch a {
    color: #aaa;
    background-color: rgba(30, 30, 30, 0.9);
    border-color: #444;
  }

  .version-switch a:hover {
    background-color: rgba(78, 205, 196, 0.2);
    border-color: #4ecdc4;
    color: #4ecdc4;
  }
}
</style>
