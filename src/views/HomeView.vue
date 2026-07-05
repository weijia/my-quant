<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <div class="logo-section">
          <a href="https://github.com/weijia/my-quant" target="_blank" rel="noopener noreferrer" class="logo-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 3v18h18"/>
              <path d="M18 9l-5 5-4-4-3 3"/>
            </svg>
            <h1>my-quant</h1>
          </a>
        </div>

        <div class="search-section">
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            placeholder="搜索策略名称..."
            class="search-input"
            @input="handleSearch"
          />
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="clear-search-btn"
            title="清空搜索"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        <div class="action-buttons">
          <button @click="toggleNote" class="btn btn-secondary" :class="{ active: noteVisible }" title="笔记">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </button>
          <button @click="refreshAllHoldings" class="btn btn-secondary" :class="{ active: loadingDynamicHoldings }" title="刷新持仓" :disabled="loadingDynamicHoldings">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 16h5v5"/>
            </svg>
          </button>
          <button @click="fetchRemoteStrategies" class="btn btn-secondary" :class="{ active: loadingRemoteStrategies }" title="通过 MQTT 获取条件单和网格策略" :disabled="loadingRemoteStrategies">
            <svg v-if="!loadingRemoteStrategies" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin-icon">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            获取策略
          </button>
          <button @click="showAddDialog" class="btn btn-primary" title="添加策略">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14"/>
              <path d="M5 12h14"/>
            </svg>
          </button>
          <button @click="toggleFullscreen" class="btn btn-secondary" :title="isFullscreen ? '退出全屏' : '全屏'">
            <svg v-if="!isFullscreen" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3"/>
              <path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
              <path d="M3 16v3a2 2 0 0 0 2 2h3"/>
              <path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3"/>
              <path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
              <path d="M3 16h3a2 2 0 0 1 2 2v3"/>
              <path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
            </svg>
          </button>
          <router-link to="/settings" class="btn btn-secondary" title="设置">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </router-link>
        </div>
      </div>
    </header>

    <div class="filter-bar">
      <div class="filter-header-row">
        <button class="filter-toggle" @click="showFilterPanel = !showFilterPanel">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{ transform: showFilterPanel ? 'rotate(90deg)' : 'rotate(0deg)' }">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          过滤条件
        </button>
        <!-- 可编辑提醒 Banner -->
        <div class="banner-inline" @click="editBanner" :title="bannerText || '点击编辑提醒内容'">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" x2="12" y1="8" y2="12"/>
            <line x1="12" x2="12.01" y1="16" y2="16"/>
          </svg>
          <span v-if="bannerText" class="banner-text-wrapper scrolling">
            <span class="banner-text">
              <span class="banner-text-item">{{ bannerText }}</span>
              <span class="banner-text-item">{{ bannerText }}</span>
            </span>
          </span>
          <span v-else class="banner-placeholder">💡 点击更新，对用户的提醒...</span>
          <button v-if="bannerText" class="banner-clear-inline" @click.stop="clearBanner" title="清除">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="filter-content" :class="{ collapsed: !showFilterPanel }">
        <div class="filter-group">
        <label>账户类型:</label>
        <select v-model="filter.accountType" @change="loadStrategies" class="filter-select">
          <option value="all">全部</option>
          <option value="default">普通账户</option>
          <option value="credit">信用账户</option>
        </select>
      </div>
      <div class="filter-group">
        <label>趋势过滤:</label>
        <select v-model="filter.trend" @change="loadStrategies" class="filter-select">
          <option value="all">全部</option>
          <option value="unset">未设置</option>
          <option value="trend_unknown">未知趋势</option>
          <option value="trend_up">上涨趋势</option>
          <option value="trend_down">下跌趋势</option>
          <option value="trend_breakdown">下跌破位</option>
          <option value="trend_oscillation">震荡趋势</option>
          <option value="trend_pullback">回踩趋势</option>
          <option value="high_volatility">高波动率</option>
          <option value="medium_volatility">中等波动率</option>
          <option value="low_volatility">低波动率</option>
        </select>
      </div>
      <div class="filter-group">
        <label>排序:</label>
        <select v-model="filter.sortBy" @change="loadStrategies" class="filter-select">
          <option value="name">名称</option>
          <option value="marketValue">市值</option>
          <option value="netPosition">股数</option>
        </select>
        <select v-model="filter.sortOrder" @change="loadStrategies" class="filter-select">
          <option value="asc">升序</option>
          <option value="desc">降序</option>
        </select>
      </div>
      </div>
    </div>

    <main class="main-content">
      <StrategyList
        :strategies="filteredStrategies"
        :sort-by="filter.sortBy"
        :sort-order="filter.sortOrder"
        :trend-filter="filter.trend"
        :mqtt-connected="mqttConnected"
        :agent-online="agentOnline"
        :holdings-map="holdingsMap"
        :loading-holdings="loadingDynamicHoldings"
        :remote-strategies="remoteStrategies"
        @edit-strategy="editStrategy"
        @delete-strategy="deleteStrategy"
        @update-trend-judgment="updateTrendJudgment"
        @batch-condition="openBatchConditionDialog"
        @execute-strategy="handleExecuteStrategy"
        @execute-strategy-by-amount="handleExecuteStrategyByAmount"
        @execute-strategy-buy-only="handleExecuteStrategyBuyOnly"
        @execute-strategy-buy-only-by-amount="handleExecuteStrategyBuyOnlyByAmount"
        @execute-strategy-sell-only="handleExecuteStrategySellOnly"
        @execute-strategy-sell-only-by-amount="handleExecuteStrategySellOnlyByAmount"
        @update-strategy-selection="handleStrategySelection"
        @update-trade-settings="handleTradeSettings"
        @update-condition-config="handleConditionConfig"
        @update-trend-filter="(trend) => { filter.trend = trend; loadStrategies() }"
        @update-sort="(sortInfo) => { filter.sortBy = sortInfo.sortBy; filter.sortOrder = sortInfo.sortOrder; loadStrategies() }"
        @refresh-holdings="refreshAllHoldings"
      />
    </main>

    <footer class="app-footer">
      <p>数据存储于本地浏览器 (PouchDB)</p>
      <p>共 {{ strategies.length }} 个策略</p>
      <p class="version-info">版本: {{ versionDisplay }} | 构建时间: {{ buildTimeDisplay }}</p>
    </footer>

    <StrategyDialog
      :show="showDialog"
      :is-editing="isEditing"
      :strategy="editingStrategy"
      @close="closeDialog"
      @save="saveStrategy"
    />

    <BatchConditionDialog
      :visible="showBatchConditionDialog"
      :stock-info="selectedStrategy"
      :existing-decrease-strategies="selectedStrategy?.decreaseStrategies || []"
      :existing-increase-strategies="selectedStrategy?.increaseStrategies || []"
      @update:visible="showBatchConditionDialog = false"
      @submit="handleBatchConditionSubmit"
    />

    <!-- 浮动笔记窗口 -->
    <div
      v-if="noteVisible"
      class="floating-note"
      :style="{ left: noteX + 'px', top: noteY + 'px', width: noteWidth + 'px', height: noteHeight + 'px' }"
    >
      <div class="note-header" @mousedown="startDrag">
        <span class="note-title">笔记</span>
        <button class="note-close" @click="toggleNote" title="关闭">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18"/>
            <path d="m6 6 12 12"/>
          </svg>
        </button>
      </div>
      <textarea
        v-model="noteContent"
        class="note-textarea"
        placeholder="在此输入笔记内容..."
        spellcheck="false"
      ></textarea>
      <div class="resize-handle" @mousedown="startResize" title="调整大小"></div>
    </div>

    <!-- Toast 提示 -->
    <Transition name="toast-fade">
      <div v-if="toastVisible" class="toast-container" :class="'toast-' + toastType">
        <span class="toast-icon" v-if="toastType === 'error'">⚠</span>
        <span class="toast-icon" v-else-if="toastType === 'success'">✓</span>
        <span class="toast-text">{{ toastMessage }}</span>
        <button class="toast-close" @click="toastVisible = false">✕</button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { strategyService } from '../services/StrategyService'
import { trendService } from '../services/TrendService'
import { database } from '../utils/Database'
import { webdavImportService } from '../services/WebDAVImportService'
import mqttConditionService from '../services/MQTTConditionService'
import { defaultStrategyService } from '../services/DefaultStrategyService'
import { appConfigService } from '../services/AppConfigService'
import { versionDisplay, buildTimeDisplay } from '../version'
import StrategyList from '../components/StrategyList.vue'
import StrategyDialog from '../components/StrategyDialog.vue'
import BatchConditionDialog from '../components/BatchConditionDialog.vue'
import { pinyin } from 'pinyin-pro'

const router = useRouter()

const strategies = ref([]);
const showDialog = ref(false);
const isEditing = ref(false);
const editingStrategy = ref({});
const showBatchConditionDialog = ref(false);
const selectedStrategy = ref({});
const mqttConnected = ref(false);
const agentOnline = ref(false);
const searchQuery = ref('');
const searchInput = ref(null);
const bannerText = ref(appConfigService.getBannerText());

// 远程策略数据（通过 MQTT 获取的条件单和网格策略）
// founder: { default: { total, strategies, updatedAt }, credit: { total, strategies, updatedAt } }
// pingan:  { total, strategies, updatedAt }
const remoteStrategies = ref({ founder: { default: null, credit: null }, pingan: null });
const loadingRemoteStrategies = ref(false);
// 用 msgId 追踪 list_strategies 响应对应的 provider 和 accountType
const listStrategiesMsgIdMap = new Map(); // msgId → { provider, accountType }

// Toast 提示
const toastMessage = ref('');
const toastType = ref('info');
const toastVisible = ref(false);
let toastTimer = null;

const showToast = (message, type = 'info', duration = 5000) => {
  if (toastTimer) clearTimeout(toastTimer);
  toastMessage.value = message;
  toastType.value = type;
  toastVisible.value = true;
  if (duration > 0) {
    toastTimer = setTimeout(() => {
      toastVisible.value = false;
    }, duration);
  }
};

// 动态持仓数据：按 provider:accountType 分组，避免不同券商/账户类型互相覆盖
// holdingsMap.value = Map<string, Map<string, Holding>>
// key 格式: `${provider}:${accountType}`，如 'founder:credit'
const holdingsMap = ref(new Map());
const loadingDynamicHoldings = ref(false);
// 用 msgId 追踪哪个响应对应哪个 provider，避免异步覆盖
const holdingsMsgIdMap = new Map();

const refreshHoldings = async (provider = 'founder') => {
  if (!mqttConditionService.connected) {
    showToast('MQTT 未连接，无法获取持仓', 'error');
    return;
  }
  loadingDynamicHoldings.value = true;
  try {
    const result = await mqttConditionService.getHoldings({ provider, forceRefresh: true });
    if (result && result.msgId) {
      holdingsMsgIdMap.set(result.msgId, provider);
    }
  } catch (e) {
    showToast('获取持仓失败: ' + e.message, 'error');
    loadingDynamicHoldings.value = false;
  }
};

// 刷新所有券商持仓（ founder + pingan ）
const refreshAllHoldings = async () => {
  if (!mqttConditionService.connected) {
    showToast('MQTT 未连接，无法获取持仓', 'error');
    return;
  }
  const providers = ['founder', 'pingan'];
  loadingDynamicHoldings.value = true;
  try {
    for (const provider of providers) {
      const result = await mqttConditionService.getHoldings({ provider, forceRefresh: true });
      if (result && result.msgId) {
        holdingsMsgIdMap.set(result.msgId, provider);
      }
      // 给 Agent 一点处理时间再发下一个
      await new Promise(r => setTimeout(r, 500));
    }
    // 等最后一个响应回来后再关闭 loading（最多等 5 秒）
    setTimeout(() => {
      loadingDynamicHoldings.value = false;
    }, 5000);
  } catch (e) {
    showToast('获取持仓失败: ' + e.message, 'error');
    loadingDynamicHoldings.value = false;
  }
};

// 通过 MQTT 获取条件单和网格策略
const fetchRemoteStrategies = async () => {
  if (!mqttConditionService.connected) {
    showToast('MQTT 未连接，无法获取策略数据', 'error');
    return;
  }
  loadingRemoteStrategies.value = true;

  // 方正：按账户类型分别刷新网格数据 + 获取策略列表
  const founderAccountTypes = ['default', 'credit'];
  try {
    for (const accountType of founderAccountTypes) {
      await mqttConditionService.refreshGrid({ accountType });
      await new Promise(r => setTimeout(r, 1500));
    }
  } catch (e) {
    console.warn('[fetchRemoteStrategies] refresh_grid 失败:', e.message);
  }
  try {
    for (const accountType of founderAccountTypes) {
      const result = await mqttConditionService.listStrategies({ provider: 'founder', accountType });
      if (result && result.msgId) {
        listStrategiesMsgIdMap.set(result.msgId, { provider: 'founder', accountType });
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    // 平安
    const paResult = await mqttConditionService.listStrategies({ provider: 'pingan' });
    if (paResult && paResult.msgId) {
      listStrategiesMsgIdMap.set(paResult.msgId, { provider: 'pingan', accountType: null });
    }
    // 等响应回来后再关闭 loading（最多等 15 秒）
    setTimeout(() => {
      loadingRemoteStrategies.value = false;
    }, 15000);
  } catch (e) {
    showToast('获取策略失败: ' + e.message, 'error');
    loadingRemoteStrategies.value = false;
  }
};

// 浮动笔记
const noteConfig = appConfigService.getNoteConfig();
const noteVisible = ref(noteConfig.visible);
const noteContent = ref(noteConfig.content);
const noteX = ref(noteConfig.x);
const noteY = ref(noteConfig.y);
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

// 防抖保存笔记内容
let noteSaveTimer = null;
const saveNoteContent = () => {
  if (noteSaveTimer) clearTimeout(noteSaveTimer);
  noteSaveTimer = setTimeout(() => {
    appConfigService.setNoteContent(noteContent.value);
  }, 500);
};

// 笔记内容变化时自动保存
watch(noteContent, saveNoteContent);

const toggleNote = () => {
  noteVisible.value = !noteVisible.value;
  appConfigService.setNoteVisible(noteVisible.value);
};

const startDrag = (e) => {
  isDragging = true;
  dragOffsetX = e.clientX - noteX.value;
  dragOffsetY = e.clientY - noteY.value;
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
};

const onDrag = (e) => {
  if (!isDragging) return;
  noteX.value = e.clientX - dragOffsetX;
  noteY.value = e.clientY - dragOffsetY;
};

const stopDrag = () => {
  if (isDragging) {
    isDragging = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    // 保存位置
    appConfigService.setNotePosition(noteX.value, noteY.value);
  }
};

// 笔记窗口大小
const noteSize = appConfigService.getNoteSize();
const noteWidth = ref(noteSize.width);
const noteHeight = ref(noteSize.height);
let isResizing = false;
let resizeStartX = 0;
let resizeStartY = 0;
let resizeStartWidth = 0;
let resizeStartHeight = 0;

const startResize = (e) => {
  isResizing = true;
  resizeStartX = e.clientX;
  resizeStartY = e.clientY;
  resizeStartWidth = noteWidth.value;
  resizeStartHeight = noteHeight.value;
  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize);
  e.preventDefault();
};

const onResize = (e) => {
  if (!isResizing) return;
  const newWidth = resizeStartWidth + (e.clientX - resizeStartX);
  const newHeight = resizeStartHeight + (e.clientY - resizeStartY);
  noteWidth.value = Math.max(200, newWidth);
  noteHeight.value = Math.max(120, newHeight);
};

const stopResize = () => {
  if (isResizing) {
    isResizing = false;
    document.removeEventListener('mousemove', onResize);
    document.removeEventListener('mouseup', stopResize);
    appConfigService.setNoteSize(noteWidth.value, noteHeight.value);
  }
};

// 用于存储组件生命周期内注册的 document 事件监听器引用
let _onFullscreenChange = null;

// 组件卸载时清理 document 事件监听器，防止 HMR 时出现 __vnode 错误
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
  if (_onFullscreenChange) {
    document.removeEventListener('fullscreenchange', _onFullscreenChange);
  }
});

const isFullscreen = ref(false);

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    isFullscreen.value = true;
  } else {
    document.exitFullscreen();
    isFullscreen.value = false;
  }
};
const showFilterPanel = ref(false);
const filter = reactive({
  accountType: 'all',
  trend: 'all',
  sortBy: 'name',
  sortOrder: 'asc'
});
const filteredStrategies = computed(() => {
  let result = [...strategies.value];
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    const queryPinyin = pinyin(query, { toneType: 'none' }).replace(/\s/g, '');
    const queryFirstLetter = pinyin(query, { toneType: 'none', pattern: 'first' }).replace(/\s/g, '').toLowerCase();
    result = result.filter(s => {
      const nameLower = s.name.toLowerCase();
      const codeLower = (s.stockCode || '').toLowerCase();
      const namePinyin = pinyin(s.name, { toneType: 'none' }).replace(/\s/g, '').toLowerCase();
      const nameFirstLetter = pinyin(s.name, { toneType: 'none', pattern: 'first' }).replace(/\s/g, '').toLowerCase();
      return nameLower.includes(query) ||
             codeLower.includes(query) ||
             namePinyin.includes(query) ||
             namePinyin.includes(queryPinyin) ||
             nameFirstLetter.includes(queryFirstLetter) ||
             nameFirstLetter.startsWith(queryFirstLetter);
    });
  }
  return result;
});
let loadStrategiesPromise = null
const loadStrategies = async () => {
  // 防止并发调用
  if (loadStrategiesPromise) {
    return loadStrategiesPromise
  }
  loadStrategiesPromise = (async () => {
    try {
      // 先获取趋势数据缓存
      const trendData = await getTrendData();

    // 获取策略列表
    const result = await strategyService.getAllStrategies({
      accountType: filter.accountType,
      trend: filter.trend,
      sortBy: filter.sortBy,
      sortOrder: filter.sortOrder
    });

    // 清理策略名称，去除其中的股票代码
    const cleanName = (name, stockCode) => {
      if (!name) return '';
      // 去除形如 (600519) 或 (600519.SH) 的股票代码
      let cleaned = name.replace(/\(\d{6}(\.\w+)?\)/g, '').trim();
      // 如果清理后为空，使用 stockCode
      if (!cleaned && stockCode) {
        cleaned = stockCode;
      }
      return cleaned;
    };

    // 为每个策略注入实时趋势值并清理名称
    if (result.length > 0) {
      let matchedCount = 0;
      let decreaseInjectedCount = 0;
      let decreaseMissingCount = 0;
      for (const strategy of result) {
        // 清理名称
        strategy.name = cleanName(strategy.name, strategy.stockCode);

        // 【调试】记录每个策略注入前的 decreasePercentage
        console.debug(`[调试-decreasePercentage] 策略: ${strategy.name}(${strategy.stockCode}), 注入前 decreasePercentage: ${strategy.decreasePercentage}, 本地值: ${strategy.decreasePercentage}`);

        // 注入实时趋势值和下跌百分比
        if (trendData) {
          const trend = getTrendByStockCode(strategy.stockCode, trendData);
          if (trend) {
            strategy.trendJudgment = normalizeTrendValue(trend.trendValue);

            // 【调试】打印完整的 trend 对象
            console.debug(`[调试-decreasePercentage] 策略: ${strategy.name}(${strategy.stockCode}), trend 对象:`, JSON.stringify(trend));

            // 始终用趋势数据覆盖下跌百分比
            // 优先使用 price_drop_ratio（90天内最高价与当前价的下跌百分比）
            // 根据最新文档格式：price_drop_ratio 位于 volatilityMetrics 内，且已经是百分比格式（如 19.77）
            // 修复：使用 != null 判断，避免 0 被当作 falsy 值处理
            if (trend.price_drop_ratio != null) {
              // price_drop_ratio 已经是百分比格式，直接使用
              strategy.decreasePercentage = Math.round(trend.price_drop_ratio * 100) / 100;
              decreaseInjectedCount++;
              console.debug(`[调试-decreasePercentage] 策略: ${strategy.name}(${strategy.stockCode}), 使用 price_drop_ratio: ${trend.price_drop_ratio}%`);
            } else if (trend.decreasePercentage != null) {
              strategy.decreasePercentage = trend.decreasePercentage;
              decreaseInjectedCount++;
              console.debug(`[调试-decreasePercentage] 策略: ${strategy.name}(${strategy.stockCode}), 使用 trend.decreasePercentage: ${strategy.decreasePercentage}`);
            } else {
              decreaseMissingCount++;
              console.debug(`[调试-decreasePercentage] 策略: ${strategy.name}(${strategy.stockCode}), trend 匹配成功但 price_drop_ratio 和 decreasePercentage 均为空! trend 对象:`, JSON.stringify(trend));
            }

            // 注入15日平均波动率
            if (trend.volatility15d != null) {
              strategy.volatility15d = trend.volatility15d;
            }

            // 注入当前价格
            if (trend.currentPrice != null) {
              strategy.currentPrice = trend.currentPrice;
            }

            // 注入买卖建议分析数据（包含生成时间）
            if (trend.stockAnalysis) {
              strategy.stockAnalysis = {
                ...trend.stockAnalysis,
                _generatedAt: trend.stockAnalysisUpdatedAt || trend.trendJudgmentUpdatedAt || trend.autoTrendJudgmentUpdatedAt || null
              };
              console.log(`[调试-stockAnalysis] 策略: ${strategy.name}(${strategy.stockCode}), 注入 stockAnalysis:`, trend.stockAnalysis);
            }

            matchedCount++;
          } else {
            // 【调试】trend 匹配失败
            console.debug(`[调试-decreasePercentage] 策略: ${strategy.name}(${strategy.stockCode}), 未能匹配到趋势数据! trendData 的 keys:`, Object.keys(trendData).slice(0, 10));
          }
        } else {
          // 【调试】trendData 为空
          console.debug(`[调试-decreasePercentage] 策略: ${strategy.name}(${strategy.stockCode}), trendData 为空，无法注入下跌百分比`);
        }

        // 【调试】记录注入后的最终值
        console.debug(`[调试-decreasePercentage] 策略: ${strategy.name}(${strategy.stockCode}), 注入后 decreasePercentage: ${strategy.decreasePercentage}`);
      }
      console.debug(`[调试-decreasePercentage] ===== 汇总 =====`);
      console.debug(`[调试-decreasePercentage] 策略总数: ${result.length}, 趋势匹配数: ${matchedCount}, 下跌百分比注入数: ${decreaseInjectedCount}, 下跌百分比缺失数: ${decreaseMissingCount}`);
      console.log('loadStrategies: 为', matchedCount, '个策略注入了实时趋势值');
      if (!trendData) {
        console.warn('loadStrategies: 趋势数据为空，WebDAV 可能未配置或请求失败。策略将使用本地存储的下跌百分比。');
      }
    }

    // 应用缺省策略（为没有手动设置策略的股票自动生成）
    let defaultStrategyAppliedCount = 0;
    for (const strategy of result) {
      const strategyWithDefault = defaultStrategyService.applyDefaultStrategy(strategy);
      if (strategyWithDefault.isDefaultStrategy) {
        defaultStrategyAppliedCount++;
        console.log(`[缺省策略] 为 ${strategy.name}(${strategy.stockCode}) 应用了${strategyWithDefault.defaultStrategyName}: ${strategyWithDefault.defaultStrategyDescription}`);
      }
    }
    if (defaultStrategyAppliedCount > 0) {
      console.log(`[缺省策略] 共为 ${defaultStrategyAppliedCount} 个策略应用了缺省策略`);
    }

    strategies.value = result;
  }
  catch (error) {
    console.error('加载策略失败:', error);
  }
  finally {
    loadStrategiesPromise = null
  }
  })()
};
const showAddDialog = () => {
  isEditing.value = false;
  editingStrategy.value = {};
  showDialog.value = true;
};
const editStrategy = (strategy) => {
  isEditing.value = true;
  editingStrategy.value = { ...strategy };
  showDialog.value = true;
};
const closeDialog = () => {
  showDialog.value = false;
  editingStrategy.value = {};
};
const saveStrategy = async (strategyData) => {
  try {
    // 标记为手动编辑过
    strategyData.isManuallyEdited = true
    if (isEditing.value && editingStrategy.value.id) {
      await strategyService.updateStrategy(editingStrategy.value.id, strategyData);
    }
    else {
      await strategyService.addStrategy(strategyData);
    }
    await loadStrategies();
    closeDialog();
  }
  catch (error) {
    console.error('保存策略失败:', error);
    alert('保存策略失败');
  }
};
const deleteStrategy = async (id) => {
  if (!confirm('确定要删除此策略吗？')) {
    return;
  }
  try {
    await strategyService.deleteStrategy(id);
    await loadStrategies();
  }
  catch (error) {
    console.error('删除策略失败:', error);
    alert('删除策略失败');
  }
};
const updateTrendJudgment = async (strategyId, trend) => {
  try {
    await trendService.updateTrendJudgment(strategyId, trend);
    await loadStrategies();
  }
  catch (error) {
    console.error('更新趋势判断失败:', error);
    alert('更新趋势判断失败');
  }
};
const openBatchConditionDialog = (strategy) => {
  selectedStrategy.value = { ...strategy };
  showBatchConditionDialog.value = true;
};
const handleBatchConditionSubmit = async (data) => {
  try {
    const { decreaseStrategies, increaseStrategies } = data;
    await strategyService.updateStrategy(selectedStrategy.value.id, {
      decreaseStrategies,
      increaseStrategies,
      isManuallyEdited: true
    });
    await loadStrategies();
  }
  catch (error) {
    console.error('更新条件单失败:', error);
    alert('更新条件单失败');
  }
};

// 执行策略脚本生成条件单（内部实现）
// filter: 'buy' = 只保留买入, 'sell' = 只保留卖出, null = 保留全部
const executeStrategyInternal = async (strategy, useAmount = false, filter = null) => {
  // 1. 从 localStorage 加载策略模板
  let templates = []
  try {
    const saved = localStorage.getItem('orderStrategyTemplates')
    if (saved) templates = JSON.parse(saved)
  } catch (e) {
    console.error('加载策略模板失败:', e)
  }

  // 2. 确定要执行的策略
  let templatesToExecute = []
  
  // 如果用户手动选择了策略（非自动），则执行选中的策略
  if (strategy.selectedStrategyName) {
    const selectedTemplate = templates.find(t => t.name === strategy.selectedStrategyName)
    if (selectedTemplate) {
      templatesToExecute = [selectedTemplate]
    }
  }
  
  // 如果没有手动选择或选中的策略不存在，则根据趋势自动匹配
  if (templatesToExecute.length === 0) {
    const trend = strategy.trendJudgment || 'unset'
    templatesToExecute = templates.filter(t =>
      Array.isArray(t.trendMatches) && t.trendMatches.length > 0 && t.trendMatches.includes(trend)
    )
  }

  if (templatesToExecute.length === 0) {
    alert('未找到匹配的策略脚本。当前趋势: ' + (strategy.trendJudgment || 'unset') + '\n请在设置页面配置策略的趋势匹配关系。')
    return
  }

  // 3. 构建上下文数据
  const trend = strategy.trendJudgment || 'unset'
  // 缺省买入量：优先使用策略的加仓数量，否则按高级设置缺省算法（1/4持仓，最低100股）
  const quarterPosition = Math.max(100, Math.floor((strategy.netPosition || 0) / 4 / 100) * 100)
  const defaultBuyVolume = parseInt(strategy.increaseAmount) || quarterPosition || 100
  const sellVolume = Math.max(100, Math.floor((strategy.netPosition || 0) / 4 / 100) * 100)
  const currentPrice = strategy.currentPrice || 0
  const defaultAmount = strategy.defaultTradeAmount || 20000

  const ctx = {
    stockCode: strategy.stockCode,
    stockName: strategy.name,
    currentPrice: currentPrice,
    netPosition: strategy.netPosition || 0,
    marketValue: parseFloat(String(strategy.marketValue).replace(/,/g, '')) || 0,
    trendJudgment: trend,
    volatility15d: strategy.volatility15d || 0,
    priceDropRatio: strategy.price_drop_ratio || 0,
    isMarginAccount: strategy.isMarginAccount || false,
    defaultBuyVolume: defaultBuyVolume,
    defaultSellVolume: sellVolume,
    defaultAmount: defaultAmount,
    provider: strategy.provider,
    accountType: strategy.accountType || 'default'
  }

  // 4. 执行所有匹配的策略脚本
  let totalMessages = []
  let errors = []

  for (const template of templatesToExecute) {
    if (!template.script) continue
    try {
      const buy = (data) => ({ action: 'buy', data })
      const sell = (data) => ({ action: 'sell', data })
      const fn = new Function('ctx', 'buy', 'sell', template.script)
      const result = fn(ctx, buy, sell)
      if (Array.isArray(result)) {
        totalMessages.push(...result)
      }
    } catch (e) {
      errors.push(template.name + ': ' + e.message)
    }
  }

  if (errors.length > 0) {
    alert('部分策略脚本执行失败:\n' + errors.join('\n'))
    return
  }

  // 5. 过滤：只保留买入或只保留卖出
  if (filter) {
    totalMessages = totalMessages.filter(msg => msg.action === filter)
  }

  if (totalMessages.length === 0) {
    const filterLabel = filter === 'buy' ? '买入' : '卖出'
    alert('策略脚本未生成任何' + filterLabel + '条件单消息')
    return
  }

  // 6. 按额模式：使用 defaultTradeAmount 替换 tradeVolume
  if (useAmount) {
    totalMessages = totalMessages.map(msg => {
      const data = { ...msg.data }
      // 按额模式：直接使用 defaultTradeAmount，删除 tradeVolume
      data.tradeAmount = defaultAmount
      delete data.tradeVolume
      return { ...msg, data }
    })
  }

  // 7. 确认并发送
  const filterLabel = filter === 'buy' ? ' [仅买入]' : filter === 'sell' ? ' [仅卖出]' : ''
  const modeLabel = (useAmount ? ' [按额模式]' : ' [按量模式]') + filterLabel
  const preview = totalMessages.map((msg, i) => {
    const action = msg.action === 'buy' ? '买入' : '卖出'
    const vol = msg.data.tradeVolume || msg.data.tradeAmount || '-'
    const unit = msg.data.tradeVolume ? '股' : '元'
    const pct = msg.data.percentage || '-'
    return '消息' + (i + 1) + ': ' + action + ' ' + vol + unit + ' @' + pct + '%'
  }).join('\n')

  if (!confirm('将发送 ' + totalMessages.length + ' 条条件单' + modeLabel + ':\n\n' + preview)) {
    return
  }

  // 7. 逐条发送
  let successCount = 0
  let sendErrors = []

  console.log('[executeStrategyInternal] 开始发送条件单, 共', totalMessages.length, '条')
  console.log('[executeStrategyInternal] MQTT 连接状态:', mqttConditionService.connected)

  for (const msg of totalMessages) {
    try {
      const data = msg.data
      console.log('[executeStrategyInternal] 发送消息:', msg.action, JSON.stringify(data))
      if (msg.action === 'buy') {
        await mqttConditionService.sendBuyOrder({
          stockCode: data.stockCode,
          stockName: data.stockName,
          tradeVolume: data.tradeVolume,
          tradeAmount: data.tradeAmount,
          percentage: data.percentage,
          provider: data.provider,
          accountType: data.accountType,
          side: data.side,
          endDate: data.endDate
        })
      } else if (msg.action === 'sell') {
        await mqttConditionService.sendSellOrder({
          stockCode: data.stockCode,
          stockName: data.stockName,
          tradeVolume: data.tradeVolume,
          tradeAmount: data.tradeAmount,
          percentage: data.percentage,
          provider: data.provider,
          accountType: data.accountType,
          side: data.side,
          endDate: data.endDate
        })
      }
      console.log('[executeStrategyInternal] 发送成功:', msg.action, data.stockCode)
      successCount++
    } catch (e) {
      console.error('[executeStrategyInternal] 发送失败:', e.message)
      sendErrors.push(e.message)
    }
  }

  if (sendErrors.length > 0) {
    alert('发送完成: 成功 ' + successCount + ' 条, 失败 ' + sendErrors.length + ' 条\n' + sendErrors.join('\n'))
  } else {
    alert('成功发送 ' + successCount + ' 条条件单')
  }
}

// 按量执行策略脚本
const handleExecuteStrategy = async (strategy) => {
  await executeStrategyInternal(strategy, false)
}

// 按额执行策略脚本
const handleExecuteStrategyByAmount = async (strategy) => {
  await executeStrategyInternal(strategy, true)
}

// 只买入 - 按量
const handleExecuteStrategyBuyOnly = async (strategy) => {
  await executeStrategyInternal(strategy, false, 'buy')
}

// 只买入 - 按额
const handleExecuteStrategyBuyOnlyByAmount = async (strategy) => {
  await executeStrategyInternal(strategy, true, 'buy')
}

// 只卖出 - 按量
const handleExecuteStrategySellOnly = async (strategy) => {
  await executeStrategyInternal(strategy, false, 'sell')
}

// 只卖出 - 按额
const handleExecuteStrategySellOnlyByAmount = async (strategy) => {
  await executeStrategyInternal(strategy, true, 'sell')
}

// 处理策略选择更新
const handleStrategySelection = async (strategy, strategyName) => {
  try {
    await strategyService.updateStrategy(strategy.id, {
      selectedStrategyName: strategyName === 'auto' ? null : strategyName
    })
    await loadStrategies()
  } catch (error) {
    console.error('更新策略选择失败:', error)
    alert('更新策略选择失败')
  }
}

// 处理高级设置更新（量/额保存到策略数据）
const handleTradeSettings = async (strategy, data) => {
  try {
    await strategyService.updateStrategy(strategy.id, data)
    // 静默更新，不重新加载整个列表
  } catch (error) {
    console.error('更新交易设置失败:', error)
  }
}

// 处理条件配置更新（保存到策略数据）
const handleConditionConfig = async (strategy, data) => {
  try {
    await strategyService.updateStrategy(strategy.id, data)
    // 静默更新，不重新加载整个列表
  } catch (error) {
    console.error('更新条件配置失败:', error)
  }
}

const handleSearch = () => {
};

const clearSearch = () => {
  searchQuery.value = '';
  searchInput.value?.focus();
};

// Banner 编辑和清除
const editBanner = async () => {
  const newText = prompt('请输入提醒内容:', bannerText.value);
  if (newText !== null) {
    bannerText.value = newText.trim();
    appConfigService.setBannerText(bannerText.value);
    // 自动上传到 WebDAV
    webdavImportService.uploadAppConfig().then(success => {
      if (success) {
        console.log('Banner 已同步到 WebDAV');
      }
    });
  }
};

const clearBanner = async () => {
  bannerText.value = '';
  appConfigService.clearBanner();
  // 自动上传到 WebDAV
  webdavImportService.uploadAppConfig().then(success => {
    if (success) {
      console.log('Banner 已清除并同步到 WebDAV');
    }
  });
};

const loadMockData = async () => {
  const mockStrategies = [
    {
      name: '贵州茅台',
      stockCode: '600519',
      accountType: 'default',
      netPosition: 100,
      marketValue: '168,000',
      profitLoss: '+5.2',
      fiveYearAvgDividendYield: '2.5',
      changePercent: '+2.3',
      decreasePercentage: '5',
      decreaseAmount: '200',
      increasePercentage: '8',
      increaseAmount: '300',
      trendJudgment: 'trend_up',
      oscillationGridSize: '2.5',
      oscillationTradeAmount: '100',
      breakoutGridSize: '5.0',
      breakoutTradeAmount: '200',
      decreaseStrategies: [
        { deltaPercentage: '5', tradeVolume: '200', side: 'SELL' },
        { deltaPercentage: '10', tradeVolume: '300', side: 'SELL' }
      ],
      increaseStrategies: [
        { deltaPercentage: '8', tradeVolume: '300', side: 'BUY' }
      ],
      manualNotes: '长期持有'
    },
    {
      name: '比亚迪',
      stockCode: '002594',
      accountType: 'default',
      netPosition: 500,
      marketValue: '95,000',
      profitLoss: '-3.1',
      fiveYearAvgDividendYield: '0.8',
      changePercent: '-1.5',
      decreasePercentage: '3',
      decreaseAmount: '100',
      increasePercentage: '6',
      increaseAmount: '200',
      trendJudgment: 'trend_down',
      oscillationGridSize: '1.0',
      oscillationTradeAmount: '100',
      decreaseStrategies: [],
      increaseStrategies: [],
      manualNotes: ''
    },
    {
      name: '招商银行',
      stockCode: '600036',
      accountType: 'credit',
      netPosition: 300,
      marketValue: '66,000',
      profitLoss: '+1.8',
      fiveYearAvgDividendYield: '4.2',
      changePercent: '+0.9',
      decreasePercentage: '4',
      decreaseAmount: '150',
      increasePercentage: '7',
      increaseAmount: '200',
      trendJudgment: 'trend_oscillation',
      oscillationGridSize: '0.5',
      oscillationTradeAmount: '100',
      breakoutGridSize: '1.0',
      breakoutTradeAmount: '150',
      decreaseStrategies: [
        { deltaPercentage: '4', tradeVolume: '150', side: 'COLLSELL' }
      ],
      increaseStrategies: [
        { deltaPercentage: '7', tradeVolume: '200', side: 'BUY' }
      ],
      manualNotes: '融资买入'
    },
    {
      name: '宁德时代',
      stockCode: '300750',
      accountType: 'default',
      netPosition: 200,
      marketValue: '78,000',
      profitLoss: '+8.5',
      fiveYearAvgDividendYield: '1.2',
      changePercent: '+3.2',
      decreasePercentage: '6',
      decreaseAmount: '100',
      increasePercentage: '10',
      increaseAmount: '150',
      trendJudgment: 'trend_up',
      oscillationGridSize: '3.0',
      oscillationTradeAmount: '50',
      decreaseStrategies: [],
      increaseStrategies: [
        { deltaPercentage: '10', tradeVolume: '150', side: 'BUY' }
      ],
      manualNotes: '新能源龙头'
    },
    {
      name: '中国平安',
      stockCode: '601318',
      accountType: 'default',
      netPosition: 400,
      marketValue: '28,000',
      profitLoss: '-2.5',
      fiveYearAvgDividendYield: '5.8',
      changePercent: '-0.8',
      decreasePercentage: '5',
      decreaseAmount: '100',
      increasePercentage: '8',
      increaseAmount: '200',
      trendJudgment: 'trend_pullback',
      oscillationGridSize: '0.3',
      oscillationTradeAmount: '100',
      decreaseStrategies: [],
      increaseStrategies: [],
      manualNotes: '高股息'
    },
    {
      name: '东方财富',
      stockCode: '300059',
      accountType: 'credit',
      netPosition: 150,
      marketValue: '34,500',
      profitLoss: '+4.2',
      fiveYearAvgDividendYield: '0.5',
      changePercent: '+2.1',
      decreasePercentage: '5',
      decreaseAmount: '50',
      increasePercentage: '7',
      increaseAmount: '100',
      trendJudgment: 'trend_unknown',
      oscillationGridSize: '1.5',
      oscillationTradeAmount: '50',
      breakoutGridSize: '3.0',
      breakoutTradeAmount: '100',
      decreaseStrategies: [
        { deltaPercentage: '5', tradeVolume: '50', side: 'COLLSELL' }
      ],
      increaseStrategies: [],
      manualNotes: '券商龙头'
    }
  ];
  const existingStrategies = await strategyService.getAllStrategies();
  if (existingStrategies.length === 0) {
    for (const strategy of mockStrategies) {
      await strategyService.addStrategy(strategy);
    }
  }
};

// 缓存趋势数据，避免重复请求
let cachedTrendData = null;
let trendDataPromise = null;

// 获取趋势数据（带缓存，但检查 stockAnalysis 是否存在）
const getTrendData = async () => {
  if (cachedTrendData) {
    // 检查缓存数据是否包含 stockAnalysis，如果不包含则刷新缓存
    const sampleKey = Object.keys(cachedTrendData)[0];
    const hasStockAnalysis = sampleKey && cachedTrendData[sampleKey] && cachedTrendData[sampleKey].stockAnalysis !== undefined;
    if (hasStockAnalysis) {
      console.log('[调试-getTrendData] 使用缓存的趋势数据（包含 stockAnalysis）, keys 数量:', Object.keys(cachedTrendData).length);
      return cachedTrendData;
    }
    console.log('[调试-getTrendData] 缓存数据不包含 stockAnalysis，刷新缓存...');
    cachedTrendData = null;
    trendDataPromise = null;
  }
  if (trendDataPromise) {
    console.log('[调试-getTrendData] 等待进行中的趋势数据请求...');
    return trendDataPromise;
  }

  trendDataPromise = (async () => {
    try {
      const { webdavImportService } = await import('../services/WebDAVImportService');
      console.log('[调试-getTrendData] WebDAV 配置状态 - isConfigured:', webdavImportService.isConfigured(), 'trendBaseUrl:', webdavImportService.trendBaseUrl);
      cachedTrendData = await webdavImportService.fetchTrendJudgments();

      if (cachedTrendData) {
        console.log('[调试-getTrendData] 获取趋势数据成功, keys 数量:', Object.keys(cachedTrendData).length);
        // 【调试】打印前3条数据的结构，检查是否包含 price_drop_ratio 和 decreasePercentage
        const sampleKeys = Object.keys(cachedTrendData).slice(0, 3);
        for (const key of sampleKeys) {
          console.log(`[调试-getTrendData] 样本数据 [${key}]:`, JSON.stringify(cachedTrendData[key]));
        }
        // 【调试】统计包含 price_drop_ratio / decreasePercentage 的数据条数
        let hasPriceDropRatio = 0;
        let hasDecreasePercentage = 0;
        for (const k of Object.keys(cachedTrendData)) {
          if (cachedTrendData[k].price_drop_ratio) hasPriceDropRatio++;
          if (cachedTrendData[k].decreasePercentage) hasDecreasePercentage++;
        }
        console.log(`[调试-getTrendData] 统计: 含 price_drop_ratio 的条数: ${hasPriceDropRatio}, 含 decreasePercentage 的条数: ${hasDecreasePercentage}, 总条数: ${Object.keys(cachedTrendData).length}`);
      } else {
        console.warn('[调试-getTrendData] 获取趋势数据返回 null! 请检查:');
        console.warn('  1. WebDAV 是否已配置');
        console.warn('  2. WebDAV 服务器是否可访问');
        console.warn('  3. 趋势判断目录是否存在文件: trend_judgment_*.json');
      }

      return cachedTrendData;
    } catch (error) {
      console.error('[调试-getTrendData] 获取趋势数据异常:', error);
      return null;
    }
  })();

  return trendDataPromise;
};

// 标准化趋势值（添加 trend_ 前缀）
const normalizeTrendValue = (value) => {
  if (!value) return 'unset';
  if (value.startsWith('trend_') || value === 'unset' || value === 'high_volatility' || value === 'medium_volatility' || value === 'low_volatility' || value === 'trend_breakdown' || value === 'trend_unknown') {
    return value;
  }
  return `trend_${value}`;
};

// 根据 stockCode 获取趋势信息（包含趋势值和下跌百分比）
const getTrendByStockCode = (stockCode, trendData) => {
  if (!trendData || !stockCode) {
    console.log(`[调试-getTrendByStockCode] 参数为空 - stockCode: ${stockCode}, trendData: ${!!trendData}`);
    return null;
  }

  // 尝试多种匹配方式
  let trendInfo = trendData[stockCode];
  let matchMethod = trendInfo ? '直接匹配' : null;

  if (!trendInfo && stockCode.includes('.')) {
    const key = stockCode.split('.')[0];
    trendInfo = trendData[key];
    if (trendInfo) matchMethod = `去后缀匹配 (${key})`;
  }

  if (!trendInfo) {
    const key = stockCode + '.SH';
    trendInfo = trendData[key];
    if (trendInfo) matchMethod = `加.SH匹配 (${key})`;
  }

  if (!trendInfo) {
    const key = stockCode + '.SZ';
    trendInfo = trendData[key];
    if (trendInfo) matchMethod = `加.SZ匹配 (${key})`;
  }

  if (!trendInfo && /\.\w+$/.test(stockCode)) {
    const key = stockCode.replace(/\.\w+$/, '');
    trendInfo = trendData[key];
    if (trendInfo) matchMethod = `去后缀匹配 (${key})`;
  }

  if (trendInfo) {
    const result = {
      trendValue: trendInfo.autoTrendJudgment || trendInfo.trendJudgment,
      // 修复：使用 != null 判断，避免 0 被当作 falsy 值处理
      decreasePercentage: trendInfo.decreasePercentage != null ? trendInfo.decreasePercentage : null,
      price_drop_ratio: trendInfo.price_drop_ratio != null ? trendInfo.price_drop_ratio : null,
      // 添加当前价格和15日波动率
      currentPrice: trendInfo.currentPrice != null ? trendInfo.currentPrice : null,
      volatility15d: trendInfo.volatility15d != null ? trendInfo.volatility15d : null,
      // 买卖建议
      stockAnalysis: trendInfo.stockAnalysis || null
    };
    console.debug(`[调试-getTrendByStockCode] 匹配成功: stockCode=${stockCode}, 方法=${matchMethod}, result=`, JSON.stringify(result));
    return result;
  }

  console.warn(`[调试-getTrendByStockCode] 匹配失败: stockCode=${stockCode}, 尝试了所有匹配方式均未找到`);
  return null;
};

onMounted(async () => {
  console.log('HomeView: 开始初始化...');

  // 监听全屏状态变化
  _onFullscreenChange = () => {
    isFullscreen.value = !!document.fullscreenElement;
  };
  document.addEventListener('fullscreenchange', _onFullscreenChange);

  // 尝试连接 MQTT
  try {
    mqttConditionService.connect().then(() => {
      mqttConnected.value = true;
    }).catch(err => {
      console.log('[HomeView] MQTT 连接失败（不影响主功能）:', err.message);
      mqttConnected.value = false;
      agentOnline.value = false;
    });
  } catch (e) {
    console.log('[HomeView] MQTT 初始化失败:', e.message);
  }

  // 监听 MQTT 消息
  mqttConditionService.onMessage((data, msgData) => {
    console.log('[HomeView] MQTT消息:', data, msgData);

    // 解析 Agent 响应格式
    // Agent 采用统一响应格式: { action: "response", data: { action: "原命令", status, data, stockCode, message } }
    // 兼容扁平格式: { action: "get_holdings", status, data, ... }
    const isResponse = msgData?.action === 'response';
    const resp = isResponse ? (msgData.data || {}) : (msgData || {});
    const commandAction = resp.action || msgData?.action;
    const status = resp.status || msgData?.status;
    const payload = resp.data;
    const stockCode = resp.stockCode;
    const errorMessage = resp.message;

    // ========== 处理策略列表响应（条件单 + 网格） ==========
    if (commandAction === 'list_strategies') {
      if (status === 'success') {
        const tracked = listStrategiesMsgIdMap.get(data.msgId);
        const provider = (payload && payload.provider)
          || (tracked && tracked.provider)
          || 'founder';
        const accountType = (tracked && tracked.accountType) || null;
        listStrategiesMsgIdMap.delete(data.msgId);

        const strategies = (payload && payload.strategies) || [];
        const total = (payload && payload.total) || strategies.length;

        if (provider === 'founder' && accountType) {
          // 方正按账户类型分别存储
          remoteStrategies.value = {
            ...remoteStrategies.value,
            founder: {
              ...remoteStrategies.value.founder,
              [accountType]: { total, strategies, updatedAt: Date.now() }
            }
          };
          const label = accountType === 'credit' ? '信用账户' : '普通账户';
          showToast(`已获取 方正-${label} 策略：共 ${total} 条`, 'success', 3000);
        } else {
          // 平安直接存储
          remoteStrategies.value = {
            ...remoteStrategies.value,
            [provider]: { total, strategies, updatedAt: Date.now() }
          };
          showToast(`已获取 ${provider === 'pingan' ? '平安' : '方正'} 策略：共 ${total} 条`, 'success', 3000);
        }
        loadingRemoteStrategies.value = false;
      } else if (status === 'error') {
        showToast('获取策略失败: ' + (errorMessage || '未知错误'), 'error', 0);
        loadingRemoteStrategies.value = false;
      }
      return;
    }

    // ========== 处理持仓响应 ==========
    if (commandAction === 'get_holdings') {
      loadingDynamicHoldings.value = false;
      console.log('[HomeView] get_holdings 响应:', JSON.stringify(msgData));

      if (status === 'success') {
        if (payload && Array.isArray(payload.holdings)) {
          // 识别 provider：优先读响应 payload 中的 provider 字段（平安返回 "pingan"）
          // 其次用 msgId 查找（方正），最后回退到 'founder'
          const provider = payload.provider
            || holdingsMsgIdMap.get(data.msgId)
            || 'founder';
          holdingsMsgIdMap.delete(data.msgId); // 用完清理
          const newMap = new Map(holdingsMap.value);

          // 按 accountType 分组存储，避免不同账户类型互相覆盖
          // accountType 依据文档：normal（普通）/ credit（信用），默认 normal
          for (const h of payload.holdings) {
            if (!h.stockCode) continue;
            const accountType = h.accountType || 'normal';
            const key = `${provider}:${accountType}`;
            if (!newMap.has(key)) {
              newMap.set(key, new Map());
            }
            newMap.get(key).set(h.stockCode, h);
          }

          holdingsMap.value = newMap;

          // 统计本次更新的分组数量
          let totalCount = 0;
          for (const h of payload.holdings) {
            if (h.stockCode) totalCount++;
          }

          if (totalCount === 0) {
            showToast('该账户当前无持仓', 'info', 3000);
          } else {
            showToast(`已更新 ${totalCount} 只持仓 (${provider})`, 'success', 3000);
          }
        } else {
          console.error('[HomeView] get_holdings 响应格式异常:', msgData);
          showToast('获取持仓失败: 响应格式异常（缺少 holdings 字段）', 'error', 0);
        }
      } else if (status === 'error') {
        showToast('获取持仓失败: ' + (errorMessage || '未知错误'), 'error', 0);
      }
      return;
    }

    // ========== 处理条件单操作响应 ==========
    const ORDER_ACTIONS = ['buy', 'sell', 'create', 'add', 'remove', 'stop', 'cancel', 'create_grid', 'remove_grid', 'list_strategies', 'refresh_grid'];
    if (ORDER_ACTIONS.includes(commandAction) && status) {
      const actionLabels = {
        buy: '买入条件单', sell: '卖出条件单', create: '创建条件单',
        add: '添加股票', remove: '移除', stop: '停止条件单',
        cancel: '取消条件单', create_grid: '创建网格', remove_grid: '删除网格',
        list_strategies: '获取策略列表', refresh_grid: '刷新网格数据'
      };
      const label = actionLabels[commandAction] || commandAction;
      const stockInfo = stockCode ? `【${stockCode}】` : '';

      if (status === 'success') {
        showToast(`${label} ${stockInfo}执行成功`, 'success', 3000);
      } else if (status === 'error') {
        const errMsg = stockInfo + (errorMessage || '未知错误');
        showToast(`${label} 失败: ${errMsg}`, 'error', 0);
        bannerText.value = `⚠ ${label} 失败: ${errMsg}`;
        // 登录态过期
        if (resp.loginExpired) {
          agentOnline.value = false;
          console.error('[HomeView] Agent 登录态已过期:', msgData);
        }
      }
      return;
    }

    // ========== 兜底：扁平格式错误（兼容旧版 Agent） ==========
    if (msgData && msgData.action && msgData.status === 'error') {
      const errStockCode = msgData.stockCode || msgData.orderId || '';
      const errDetail = errStockCode ? `【${errStockCode}】${msgData.message || '未知错误'}` : (msgData.message || '未知错误');
      bannerText.value = `⚠ ${errDetail}`;
      if (msgData.loginExpired) {
        agentOnline.value = false;
      }
      showToast('MQTT 错误: ' + errDetail, 'error', 0);
    }
  });

  // 监听 Agent 在线状态
  mqttConditionService.onAgentStatus((online) => {
    agentOnline.value = online;
  });

  await loadMockData();
  console.log('HomeView: loadMockData 完成');

  // 提前开始获取趋势数据（不等待）
  console.log('HomeView: 开始预加载趋势数据...');
  getTrendData();

  // 页面加载时自动从 WebDAV 同步策略数据
  console.log('HomeView: 开始从 WebDAV 同步策略...');
  try {
    const result = await webdavImportService.importFromWebDAV(true);
    if (result.success) {
      console.log('HomeView: WebDAV 同步成功:', result.message);
      // 如果 WebDAV 上有 MQTT 配置，加载并应用
      if (result.mqttConfig) {
        // WebDAV 配置可能不包含 encryptMessages 等新字段，保留本地已有的值
        const currentConfig = mqttConditionService.getConfig()
        const safeMqttConfig = { ...currentConfig, ...result.mqttConfig }
        mqttConditionService.updateConfig(safeMqttConfig)
        console.log('已从 WebDAV 加载 MQTT 配置')
      }
    } else {
      console.warn('HomeView: WebDAV 同步失败:', result.message);
    }
  } catch (error) {
    console.error('HomeView: WebDAV 同步出错:', error);
  }

  // 加载策略（从本地数据库）
  console.log('HomeView: 开始加载策略...');
  await loadStrategies();

  // 策略加载完成后再下载应用配置，避免并发修改 strategies 导致 Vue 组件树混乱
  webdavImportService.downloadAppConfig().then(async success => {
    if (success) {
      console.log('HomeView: 应用配置已从 WebDAV 同步（包括 Banner）');
      bannerText.value = appConfigService.getBannerText();
    }
  });

  // 策略加载完成后，异步同步趋势到数据库（不阻塞界面）
  trendService.syncTrendJudgmentsFromWebDAV().then(result => {
    console.log('HomeView: 后台趋势同步完成:', result);
  });

  // 监听配置更新事件，重新加载策略以应用新的趋势映射
  window.addEventListener('appConfigUpdated', async () => {
    console.log('HomeView: 检测到配置更新，重新加载策略...');
    // 更新 banner 显示
    bannerText.value = appConfigService.getBannerText();
    console.log('HomeView: Banner 已更新:', bannerText.value);
    // 使用 nextTick 延迟加载策略，避免在 Vue flush 周期中同步修改响应式数据
    await nextTick();
    await loadStrategies();
  });

  console.log('HomeView: 初始化完成（界面已可交互）');
});
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #1a1a2e;
}

.app-header {
  background-color: #16213e;
  padding: 12px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
}

.logo-link:hover h1 {
  opacity: 0.8;
}

.logo-section h1 {
  margin: 0;
  font-size: 20px;
  color: #4ecdc4;
  font-weight: bold;
}

.search-section {
  flex: 1;
  max-width: 400px;
  margin: 0 20px;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 8px 36px 8px 12px;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 20px;
  background-color: rgba(255,255,255,0.1);
  color: white;
  font-size: 14px;
}

.search-input::placeholder {
  color: rgba(255,255,255,0.5);
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.2);
  border: none;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(255,255,255,0.7);
  padding: 0;
}

.clear-search-btn:hover {
  background: rgba(255,255,255,0.3);
  color: white;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.action-buttons .btn {
  text-decoration: none;
}

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
  background-color: rgba(255,255,255,0.2);
  color: white;
}

.btn-secondary:hover {
  background-color: rgba(255,255,255,0.3);
}

.import-btn {
  cursor: pointer;
}

.filter-bar {
  background-color: rgba(0,0,0,0.2);
  padding: 8px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.filter-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.filter-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  font-size: 14px;
  padding: 4px 0;
  margin-bottom: 4px;
}

.filter-toggle:hover {
  color: white;
}

.filter-toggle svg {
  transition: transform 0.3s ease;
}

.filter-content {
  max-height: 50px;
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.3s ease;
  opacity: 1;
  display: flex;
  gap: 20px;
}

.filter-content.collapsed {
  max-height: 0;
  opacity: 0;
}

/* Banner 样式 */
.banner-section {
  background: linear-gradient(90deg, rgba(255, 165, 0, 0.15), rgba(255, 165, 0, 0.05));
  border-left: 3px solid #ffa500;
  padding: 8px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
}

.banner-content:hover {
  color: white;
}

.banner-content svg {
  color: #ffa500;
  flex-shrink: 0;
}

.banner-placeholder {
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

.banner-clear-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.banner-clear-btn:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
}

/* 内联 Banner 样式 */
.banner-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding: 4px 10px;
  background: rgba(255, 165, 0, 0.15);
  border: 1px solid rgba(255, 165, 0, 0.3);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  min-width: 120px;
  flex: 1;
  max-width: 100%;
  overflow: visible;
}

.banner-inline:hover {
  background: rgba(255, 165, 0, 0.25);
  border-color: rgba(255, 165, 0, 0.5);
}

.banner-inline svg {
  color: #ffa500;
  flex-shrink: 0;
}

.banner-inline .banner-text-wrapper {
  flex: 1;
  overflow: hidden;
  min-width: 0;
  max-width: 100%;
}

.banner-inline .banner-text {
  display: block;
  white-space: nowrap;
}

.banner-inline .banner-text-wrapper.scrolling {
  position: relative;
}

.banner-inline .banner-text-wrapper.scrolling .banner-text {
  display: inline-flex;
  animation: banner-scroll 12s linear infinite;
}

.banner-inline .banner-text-wrapper.scrolling .banner-text-item {
  padding-right: 30px;
  white-space: nowrap;
}

.banner-inline .banner-text-wrapper.scrolling .banner-text::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  width: 50px;
  height: 100%;
  background: linear-gradient(to right, transparent, rgba(255, 165, 0, 0.15));
}

@keyframes banner-scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.banner-inline .banner-placeholder {
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.banner-clear-inline {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  margin-left: 4px;
}

.banner-clear-inline:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.2);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  color: rgba(255,255,255,0.7);
  font-size: 14px;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 4px;
  background-color: rgba(255,255,255,0.1);
  color: white;
  font-size: 14px;
  cursor: pointer;
}

.main-content {
  flex: 1;
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.app-footer {
  background-color: #16213e;
  padding: 12px 20px;
  border-top: 1px solid rgba(255,255,255,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-footer p {
  margin: 0;
  color: rgba(255,255,255,0.5);
  font-size: 12px;
}

.app-footer .version-info {
  color: rgba(78, 205, 196, 0.7);
  font-size: 11px;
}

@media (max-width: 768px) {
  .app-header {
    padding: 8px 12px;
  }

  .header-content {
    flex-wrap: wrap;
    gap: 8px;
  }

  .logo-section h1 {
    font-size: 16px;
  }

  .logo-section svg {
    width: 20px;
    height: 20px;
  }

  .search-section {
    order: 3;
    width: 100%;
    max-width: 100%;
    margin: 0;
  }

  .search-input {
    padding: 6px 10px;
    font-size: 14px;
  }

  .action-buttons {
    gap: 4px;
  }

  .action-buttons .btn {
    padding: 4px 8px;
    font-size: 11px;
  }

  .action-buttons .btn svg {
    width: 12px;
    height: 12px;
  }

  .filter-bar {
    padding: 6px 12px;
  }

  .filter-toggle {
    font-size: 12px;
    padding: 2px 0;
  }

  .filter-toggle svg {
    width: 14px;
    height: 14px;
  }

  .filter-options {
    gap: 6px;
  }

  .filter-options label {
    font-size: 11px;
    padding: 2px 6px;
  }

  .filter-options input[type="checkbox"] {
    width: 12px;
    height: 12px;
  }
}

/* 浮动笔记窗口 */
.floating-note {
  position: fixed;
  min-width: 200px;
  min-height: 120px;
  background: rgba(30, 30, 50, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  backdrop-filter: blur(8px);
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px 8px 0 0;
  cursor: move;
  user-select: none;
}

.note-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

.note-close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  padding: 2px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.note-close:hover {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.1);
}

.note-textarea {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);
  resize: none;
  font-family: inherit;
}

.note-textarea::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.note-textarea:focus {
  background: rgba(255, 255, 255, 0.02);
}

.resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 16px;
  height: 16px;
  cursor: se-resize;
  background: linear-gradient(135deg, transparent 50%, rgba(255, 255, 255, 0.2) 50%);
  border-bottom-right-radius: 8px;
}

.resize-handle:hover {
  background: linear-gradient(135deg, transparent 50%, rgba(78, 205, 196, 0.5) 50%);
}

/* 笔记按钮激活状态 */
.btn.active {
  background: rgba(78, 205, 196, 0.2);
  border-color: rgba(78, 205, 196, 0.4);
  color: #4ecdc4;
}

/* 旋转动画 */
.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Toast 提示 */
.toast-container {
  position: fixed;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  z-index: 2000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  max-width: 400px;
}

.toast-error {
  background: rgba(220, 53, 69, 0.95);
  border: 1px solid rgba(220, 53, 69, 0.5);
  color: white;
}

.toast-success {
  background: rgba(40, 167, 69, 0.95);
  border: 1px solid rgba(40, 167, 69, 0.5);
  color: white;
}

.toast-info {
  background: rgba(30, 30, 50, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
}

.toast-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.toast-text {
  flex: 1;
  word-break: break-word;
}

.toast-close {
  background: none;
  border: none;
  color: inherit;
  opacity: 0.6;
  cursor: pointer;
  padding: 2px 4px;
  font-size: 12px;
  flex-shrink: 0;
}

.toast-close:hover {
  opacity: 1;
}

.toast-fade-enter-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.toast-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.toast-fade-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
