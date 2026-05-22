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
          <button @click="showAddDialog" class="btn btn-primary" title="添加策略">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14"/>
              <path d="M5 12h14"/>
            </svg>
          </button>
          <button @click="showToolsPanel = !showToolsPanel" class="btn btn-secondary toggle-btn" :class="{ active: showToolsPanel }" title="工具">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
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
      <div class="tools-panel" :class="{ collapsed: !showToolsPanel }">
        <div class="tools-panel-content">
          <button @click="exportData" class="btn btn-secondary" title="导出数据">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" x2="12" y1="15" y2="3"/>
            </svg>

          </button>
          <label class="import-btn btn btn-secondary" title="导入数据">
            <input type="file" accept=".json" @change="importData" style="display: none;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" x2="12" y1="3" y2="15"/>
            </svg>

          </label>
          <button @click="importFromWebDAV" class="btn btn-secondary" title="同步WebDAV">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 16h5v5"/>
            </svg>

          </button>
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
          <span v-if="bannerText" class="banner-text">{{ bannerText }}</span>
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
        @edit-strategy="editStrategy"
        @delete-strategy="deleteStrategy"
        @update-trend-judgment="updateTrendJudgment"
        @batch-condition="openBatchConditionDialog"
        @execute-strategy="handleExecuteStrategy"
        @execute-strategy-by-amount="handleExecuteStrategyByAmount"
        @update-strategy-selection="handleStrategySelection"
        @update-trade-settings="handleTradeSettings"
        @update-condition-config="handleConditionConfig"
        @update-trend-filter="(trend) => { filter.trend = trend; loadStrategies() }"
        @update-sort="(sortInfo) => { filter.sortBy = sortInfo.sortBy; filter.sortOrder = sortInfo.sortOrder; loadStrategies() }"
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
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
const showToolsPanel = ref(false);
const bannerText = ref(appConfigService.getBannerText());
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
const loadStrategies = async () => {
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
        console.log(`[调试-decreasePercentage] 策略: ${strategy.name}(${strategy.stockCode}), 注入前 decreasePercentage: ${strategy.decreasePercentage}, 本地值: ${strategy.decreasePercentage}`);

        // 注入实时趋势值和下跌百分比
        if (trendData) {
          const trend = getTrendByStockCode(strategy.stockCode, trendData);
          if (trend) {
            strategy.trendJudgment = normalizeTrendValue(trend.trendValue);

            // 【调试】打印完整的 trend 对象
            console.log(`[调试-decreasePercentage] 策略: ${strategy.name}(${strategy.stockCode}), trend 对象:`, JSON.stringify(trend));

            // 始终用趋势数据覆盖下跌百分比
            // 优先使用 price_drop_ratio（90天内最高价与当前价的下跌百分比）
            // 根据最新文档格式：price_drop_ratio 位于 volatilityMetrics 内，且已经是百分比格式（如 19.77）
            // 修复：使用 != null 判断，避免 0 被当作 falsy 值处理
            if (trend.price_drop_ratio != null) {
              // price_drop_ratio 已经是百分比格式，直接使用
              strategy.decreasePercentage = Math.round(trend.price_drop_ratio * 100) / 100;
              decreaseInjectedCount++;
              console.log(`[调试-decreasePercentage] 策略: ${strategy.name}(${strategy.stockCode}), 使用 price_drop_ratio: ${trend.price_drop_ratio}%`);
            } else if (trend.decreasePercentage != null) {
              strategy.decreasePercentage = trend.decreasePercentage;
              decreaseInjectedCount++;
              console.log(`[调试-decreasePercentage] 策略: ${strategy.name}(${strategy.stockCode}), 使用 trend.decreasePercentage: ${strategy.decreasePercentage}`);
            } else {
              decreaseMissingCount++;
              console.warn(`[调试-decreasePercentage] 策略: ${strategy.name}(${strategy.stockCode}), trend 匹配成功但 price_drop_ratio 和 decreasePercentage 均为空! trend 对象:`, JSON.stringify(trend));
            }

            // 注入15日平均波动率
            if (trend.volatility15d != null) {
              strategy.volatility15d = trend.volatility15d;
            }

            // 注入当前价格
            if (trend.currentPrice != null) {
              strategy.currentPrice = trend.currentPrice;
            }

            matchedCount++;
          } else {
            // 【调试】trend 匹配失败
            console.warn(`[调试-decreasePercentage] 策略: ${strategy.name}(${strategy.stockCode}), 未能匹配到趋势数据! trendData 的 keys:`, Object.keys(trendData).slice(0, 10));
          }
        } else {
          // 【调试】trendData 为空
          console.warn(`[调试-decreasePercentage] 策略: ${strategy.name}(${strategy.stockCode}), trendData 为空，无法注入下跌百分比`);
        }

        // 【调试】记录注入后的最终值
        console.log(`[调试-decreasePercentage] 策略: ${strategy.name}(${strategy.stockCode}), 注入后 decreasePercentage: ${strategy.decreasePercentage}`);
      }
      console.log(`[调试-decreasePercentage] ===== 汇总 =====`);
      console.log(`[调试-decreasePercentage] 策略总数: ${result.length}, 趋势匹配数: ${matchedCount}, 下跌百分比注入数: ${decreaseInjectedCount}, 下跌百分比缺失数: ${decreaseMissingCount}`);
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
const executeStrategyInternal = async (strategy, useAmount = false) => {
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
  const defaultAmount = 20000

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
    provider: strategy.provider || 'pingan',
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

  if (totalMessages.length === 0) {
    alert('策略脚本未生成任何条件单消息')
    return
  }

  // 5. 按额模式：将 tradeVolume 转换为 tradeAmount
  if (useAmount) {
    totalMessages = totalMessages.map(msg => {
      const data = { ...msg.data }
      if (data.tradeVolume && !data.tradeAmount) {
        data.tradeAmount = data.tradeVolume * currentPrice
        delete data.tradeVolume
      }
      return { ...msg, data }
    })
  }

  // 6. 确认并发送
  const modeLabel = useAmount ? ' [按额模式]' : ' [按量模式]'
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

  for (const msg of totalMessages) {
    try {
      const data = msg.data
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
      successCount++
    } catch (e) {
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

const exportData = async () => {
  try {
    const data = await database.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-quant-strategies-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  catch (error) {
    console.error('失败:', error);
    alert('失败');
  }
};
const importData = async (event) => {
  const file = event.target.files[0];
  if (!file)
    return;
  try {
    const text = await file.text();
    let result;

    try {
      const jsonData = JSON.parse(text);
      if (jsonData.stockData || jsonData.advancedStrategies || jsonData.conditionalStrategies) {
        result = await webdavImportService.importFromJSON(jsonData);
      } else {
        const count = await database.importData(text);
        result = {
          success: true,
          count: count,
          message: `成功导入 ${count} 条数据`
        };
      }
    } catch (parseError) {
      const count = await database.importData(text);
      result = {
        success: true,
        count: count,
        message: `成功导入 ${count} 条数据`
      };
    }

    await loadStrategies();
    alert(result.message);
  }
  catch (error) {
    console.error('失败:', error);
    alert('失败，请确保文件格式正确');
  }
  event.target.value = '';
};

const importFromWebDAV = async () => {
  const confirmed = confirm('确定要从 WebDAV 同步数据吗？\n\n此操作将清空当前所有策略数据，然后从 WebDAV 重新导入。');
  if (!confirmed) {
    return;
  }

  try {
    const result = await webdavImportService.importFromWebDAV(true);
    if (result.success) {
      await loadStrategies();

      // 如果 WebDAV 上有 MQTT 配置，加载并应用
      if (result.mqttConfig) {
        mqttConditionService.updateConfig(result.mqttConfig);
        console.log('已从 WebDAV 加载 MQTT 配置');
      }

      alert(result.message);
    }
    else {
      alert(result.message);
    }
  }
  catch (error) {
    console.error('从WebDAV失败:', error);
    alert('从WebDAV失败');
  }
};
const handleSearch = () => {
};

const clearSearch = () => {
  searchQuery.value = '';
  searchInput.value?.focus();
};

// Banner 编辑和清除
const editBanner = () => {
  const newText = prompt('请输入提醒内容:', bannerText.value);
  if (newText !== null) {
    bannerText.value = newText.trim();
    appConfigService.setBannerText(bannerText.value);
  }
};

const clearBanner = () => {
  bannerText.value = '';
  appConfigService.clearBanner();
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

// 获取趋势数据（带缓存）
const getTrendData = async () => {
  if (cachedTrendData) {
    console.log('[调试-getTrendData] 使用缓存的趋势数据, keys 数量:', Object.keys(cachedTrendData).length);
    return cachedTrendData;
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
      volatility15d: trendInfo.volatility15d != null ? trendInfo.volatility15d : null
    };
    console.log(`[调试-getTrendByStockCode] 匹配成功: stockCode=${stockCode}, 方法=${matchMethod}, result=`, JSON.stringify(result));
    return result;
  }

  console.warn(`[调试-getTrendByStockCode] 匹配失败: stockCode=${stockCode}, 尝试了所有匹配方式均未找到`);
  return null;
};

onMounted(async () => {
  console.log('HomeView: 开始初始化...');

  // 监听全屏状态变化
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement;
  });

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
        mqttConditionService.updateConfig(result.mqttConfig);
        console.log('已从 WebDAV 加载 MQTT 配置');
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

  // 策略加载完成后，异步同步趋势到数据库（不阻塞界面）
  trendService.syncTrendJudgmentsFromWebDAV().then(result => {
    console.log('HomeView: 后台趋势同步完成:', result);
  });

  // 监听配置更新事件，重新加载策略以应用新的趋势映射
  window.addEventListener('appConfigUpdated', async () => {
    console.log('HomeView: 检测到配置更新，重新加载策略...');
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

.toggle-btn.active {
  background-color: rgba(78, 205, 196, 0.3);
  border: 1px solid rgba(78, 205, 196, 0.5);
}

.tools-panel {
  max-height: 60px;
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease;
  opacity: 1;
  padding: 8px 20px;
  background-color: rgba(0, 0, 0, 0.15);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tools-panel.collapsed {
  max-height: 0;
  opacity: 0;
  padding: 0 20px;
  border-bottom: none;
}

.tools-panel-content {
  display: flex;
  gap: 10px;
  max-width: 1400px;
  margin: 0 auto;
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
  max-width: 300px;
  flex-shrink: 0;
}

.banner-inline:hover {
  background: rgba(255, 165, 0, 0.25);
  border-color: rgba(255, 165, 0, 0.5);
}

.banner-inline svg {
  color: #ffa500;
  flex-shrink: 0;
}

.banner-inline .banner-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.banner-inline .banner-placeholder {
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
  white-space: nowrap;
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

  .tools-panel {
    padding: 6px 12px;
  }

  .tools-panel-content {
    flex-wrap: wrap;
    gap: 6px;
  }

  .tools-panel-content .btn,
  .tools-panel-content .import-btn {
    padding: 4px 8px;
    font-size: 11px;
  }

  .tools-panel-content .btn svg,
  .tools-panel-content .import-btn svg {
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
</style>
