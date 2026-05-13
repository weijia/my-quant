<template>
  <div v-if="visible" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog-content" @click.stop>
      <div class="dialog-header">
        <h3>批量条件单管理</h3>
        <button class="close-button" @click="$emit('update:visible', false)">×</button>
      </div>
      
      <div class="dialog-body">
        <div v-if="stockInfo" class="stock-info">
          <h4>{{ stockInfo.name }}</h4>
          <p>股票代码: {{ stockInfo.stockCode }}</p>
          <p>账户类型: {{ stockInfo.accountType === 'credit' ? '信用账户' : '普通账户' }}</p>
        </div>
        
        <div class="condition-tabs">
          <button 
            :class="['tab-btn', { active: activeTab === 'decrease' }]"
            @click="activeTab = 'decrease'"
          >
            下跌减仓策略 ({{ existingDecreaseStrategies.length }})
          </button>
          <button 
            :class="['tab-btn', { active: activeTab === 'increase' }]"
            @click="activeTab = 'increase'"
          >
            上涨加仓策略 ({{ existingIncreaseStrategies.length }})
          </button>
        </div>
        
        <div class="condition-form">
          <div v-if="activeTab === 'decrease'" class="tab-content">
            <h4>添加下跌减仓条件单</h4>
            <div class="form-row">
              <label>下跌百分比(%)</label>
              <input 
                v-model="decreaseForm.deltaPercentage"
                type="number"
                step="0.5"
                placeholder="如: 5"
                class="form-input"
              />
            </div>
            <div class="form-row">
              <label>减仓数量(股)</label>
              <input 
                v-model="decreaseForm.tradeVolume"
                type="number"
                step="100"
                placeholder="如: 200"
                class="form-input"
              />
            </div>
            <div class="form-row" v-if="stockInfo?.accountType === 'credit'">
              <label>交易方向</label>
              <select v-model="decreaseForm.side" class="form-select">
                <option value="COLLSELL">担保品卖出</option>
                <option value="MARGINSELL">融券卖出</option>
              </select>
            </div>
            <button @click="addDecreaseCondition" class="btn btn-primary">添加</button>
          </div>
          
          <div v-else class="tab-content">
            <h4>添加上涨加仓条件单</h4>
            <div class="form-row">
              <label>上涨百分比(%)</label>
              <input 
                v-model="increaseForm.deltaPercentage"
                type="number"
                step="0.5"
                placeholder="如: 8"
                class="form-input"
              />
            </div>
            <div class="form-row">
              <label>加仓数量(股)</label>
              <input 
                v-model="increaseForm.tradeVolume"
                type="number"
                step="100"
                placeholder="如: 300"
                class="form-input"
              />
            </div>
            <button @click="addIncreaseCondition" class="btn btn-primary">添加</button>
          </div>
        </div>
        
        <div class="condition-list">
          <h4>已添加的条件单</h4>
          <div v-if="activeTab === 'decrease'" class="strategy-list-container">
            <div 
              v-for="(strategy, index) in existingDecreaseStrategies" 
              :key="index"
              class="strategy-item"
            >
              <span>下跌 {{ strategy.deltaPercentage }}%，卖出 {{ strategy.tradeVolume }} 股</span>
              <button @click="removeDecreaseCondition(index)" class="remove-btn">删除</button>
            </div>
            <p v-if="existingDecreaseStrategies.length === 0" class="empty-text">暂无下跌减仓条件单</p>
          </div>
          <div v-else class="strategy-list-container">
            <div 
              v-for="(strategy, index) in existingIncreaseStrategies" 
              :key="index"
              class="strategy-item"
            >
              <span>上涨 {{ strategy.deltaPercentage }}%，买入 {{ strategy.tradeVolume }} 股</span>
              <button @click="removeIncreaseCondition(index)" class="remove-btn">删除</button>
            </div>
            <p v-if="existingIncreaseStrategies.length === 0" class="empty-text">暂无上涨加仓条件单</p>
          </div>
        </div>
      </div>
      
      <div class="dialog-footer">
        <button @click="$emit('update:visible', false)" class="btn btn-secondary">取消</button>
        <button @click="submitConditions" class="btn btn-primary">提交</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  stockInfo: {
    type: Object,
    default: () => ({})
  },
  existingDecreaseStrategies: {
    type: Array,
    default: () => []
  },
  existingIncreaseStrategies: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:visible', 'submit', 'cancel'])

const activeTab = ref('decrease')

const decreaseForm = reactive({
  deltaPercentage: '',
  tradeVolume: '',
  side: 'COLLSELL'
})

const increaseForm = reactive({
  deltaPercentage: '',
  tradeVolume: ''
})

const decreaseStrategies = ref([...props.existingDecreaseStrategies])
const increaseStrategies = ref([...props.existingIncreaseStrategies])

watch(() => props.existingDecreaseStrategies, (newVal) => {
  decreaseStrategies.value = [...newVal]
}, { deep: true })

watch(() => props.existingIncreaseStrategies, (newVal) => {
  increaseStrategies.value = [...newVal]
}, { deep: true })

const handleOverlayClick = (event) => {
  if (event.target.classList.contains('dialog-overlay')) {
    emit('update:visible', false)
  }
}

const addDecreaseCondition = () => {
  if (!decreaseForm.deltaPercentage || !decreaseForm.tradeVolume) {
    alert('请填写完整信息')
    return
  }
  
  decreaseStrategies.value.push({
    deltaPercentage: decreaseForm.deltaPercentage,
    tradeVolume: decreaseForm.tradeVolume,
    side: decreaseForm.side,
    createDate: new Date().toISOString().split('T')[0]
  })
  
  decreaseForm.deltaPercentage = ''
  decreaseForm.tradeVolume = ''
}

const addIncreaseCondition = () => {
  if (!increaseForm.deltaPercentage || !increaseForm.tradeVolume) {
    alert('请填写完整信息')
    return
  }
  
  increaseStrategies.value.push({
    deltaPercentage: increaseForm.deltaPercentage,
    tradeVolume: increaseForm.tradeVolume,
    createDate: new Date().toISOString().split('T')[0]
  })
  
  increaseForm.deltaPercentage = ''
  increaseForm.tradeVolume = ''
}

const removeDecreaseCondition = (index) => {
  decreaseStrategies.value.splice(index, 1)
}

const removeIncreaseCondition = (index) => {
  increaseStrategies.value.splice(index, 1)
}

const submitConditions = () => {
  emit('submit', {
    decreaseStrategies: decreaseStrategies.value,
    increaseStrategies: increaseStrategies.value
  })
  emit('update:visible', false)
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background-color: #2c3e50;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(255,255,255,0.2);
}

.dialog-header h3 {
  margin: 0;
  color: white;
  font-size: 18px;
}

.close-button {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-button:hover {
  background-color: rgba(255,255,255,0.1);
}

.dialog-body {
  padding: 20px;
  max-height: 50vh;
  overflow-y: auto;
}

.stock-info {
  background-color: rgba(255,255,255,0.1);
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.stock-info h4 {
  margin: 0 0 8px 0;
  color: #4ecdc4;
}

.stock-info p {
  margin: 4px 0;
  color: rgba(255,255,255,0.8);
  font-size: 14px;
}

.condition-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tab-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 4px;
  background-color: rgba(255,255,255,0.1);
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.tab-btn.active {
  background-color: #4ecdc4;
  color: white;
}

.tab-btn:hover:not(.active) {
  background-color: rgba(255,255,255,0.2);
}

.tab-content {
  margin-bottom: 20px;
}

.tab-content h4 {
  margin: 0 0 12px 0;
  color: white;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.form-row label {
  color: rgba(255,255,255,0.8);
  font-size: 14px;
}

.form-input,
.form-select {
  padding: 8px 12px;
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 4px;
  font-size: 14px;
  background: rgba(255,255,255,0.1);
  color: white;
}

.condition-list {
  margin-top: 20px;
}

.condition-list h4 {
  margin: 0 0 12px 0;
  color: white;
}

.strategy-list-container {
  max-height: 200px;
  overflow-y: auto;
}

.strategy-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: rgba(255,255,255,0.1);
  border-radius: 4px;
  margin-bottom: 8px;
}

.strategy-item span {
  color: white;
  font-size: 14px;
}

.remove-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.empty-text {
  color: rgba(255,255,255,0.5);
  text-align: center;
  padding: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px;
  border-top: 1px solid rgba(255,255,255,0.2);
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-secondary {
  background-color: rgba(255,255,255,0.2);
  color: white;
}

.btn-secondary:hover {
  background-color: rgba(255,255,255,0.3);
}

.btn-primary {
  background-color: #4ecdc4;
  color: white;
}

.btn-primary:hover {
  background-color: #45b7aa;
}
</style>
