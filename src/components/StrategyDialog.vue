<template>
  <div v-if="show" class="dialog-overlay" @click="closeDialogOnOverlayClick">
    <div class="dialog-content" @click.stop>
      <div class="dialog-header">
        <h3>{{ isEditing ? '编辑高级策略' : '添加新高级策略' }}</h3>
        <button class="close-button" @click="$emit('close')">×</button>
      </div>
      
      <div class="dialog-body">
        <div class="strategy-inputs">
          <div class="input-group">
            <label>策略名称</label>
            <input 
              v-model="form.name"
              placeholder="策略名称" 
              class="form-input"
            />
          </div>

          <div class="input-group">
            <label>股票代码</label>
            <input 
              v-model="form.stockCode"
              placeholder="如: 600000" 
              class="form-input"
            />
          </div>
          
          <div class="input-group">
            <label>账户类型</label>
            <div class="account-type-selector">
              <label class="radio-label">
                <input 
                  type="radio" 
                  :value="'default'" 
                  v-model="form.accountType"
                  name="accountType"
                />
                普通账户
              </label>
              <label class="radio-label">
                <input 
                  type="radio" 
                  :value="'credit'" 
                  v-model="form.accountType"
                  name="accountType"
                />
                融资融券
              </label>
            </div>
          </div>
          
          <div class="input-group">
            <label>震荡时网格大小(元)</label>
            <input 
              v-model="form.oscillationGridSize"
              placeholder="如: 0.2" 
              class="form-input"
              type="number"
              step="0.01"
            />
          </div>
          
          <div class="input-group">
            <label>震荡时交易数量(股)</label>
            <input 
              v-model="form.oscillationTradeAmount"
              placeholder="如: 100" 
              class="form-input"
              type="number"
              step="100"
            />
          </div>
          
          <div class="input-group">
            <label>突破后网格大小(元)</label>
            <input 
              v-model="form.breakoutGridSize"
              placeholder="如: 0.5" 
              class="form-input"
              type="number"
              step="0.01"
            />
          </div>
          
          <div class="input-group">
            <label>突破后交易数量(股)</label>
            <input 
              v-model="form.breakoutTradeAmount"
              placeholder="如: 200" 
              class="form-input"
              type="number"
              step="100"
            />
          </div>
          
          <div class="input-group">
            <label>下跌百分比(%)</label>
            <input 
              v-model="form.decreasePercentage"
              placeholder="如: 5" 
              class="form-input"
              type="number"
              step="0.5"
            />
          </div>
          
          <div class="input-group">
            <label>减仓数量(股)</label>
            <input 
              v-model="form.decreaseAmount"
              placeholder="如: 200" 
              class="form-input"
              type="number"
              step="100"
            />
          </div>
          
          <div v-if="form.accountType === 'credit' && form.decreasePercentage && form.decreaseAmount" class="input-group">
            <label>下跌卖出交易方向</label>
            <select 
              v-model="form.decreaseSide"
              class="form-select"
            >
              <option value="COLLSELL">担保品卖出</option>
              <option value="MARGINSELL">融券卖出</option>
            </select>
          </div>
          
          <div class="input-group">
            <label>上涨百分比(%)</label>
            <input 
              v-model="form.increasePercentage"
              placeholder="如: 8" 
              class="form-input"
              type="number"
              step="0.5"
            />
          </div>
          
          <div class="input-group">
            <label>加仓数量(股)</label>
            <input 
              v-model="form.increaseAmount"
              placeholder="如: 300" 
              class="form-input"
              type="number"
              step="100"
            />
          </div>
          
          <div class="input-group">
            <label>市值</label>
            <input 
              v-model="form.marketValue"
              placeholder="股票市值" 
              class="form-input"
            />
          </div>
          
          <div class="input-group">
            <label>持仓数量(股)</label>
            <input 
              v-model="form.netPosition"
              placeholder="持仓数量" 
              class="form-input"
              type="number"
            />
          </div>
          
          <div class="input-group">
            <label>5年平均股息率(%)</label>
            <input 
              v-model="form.fiveYearAvgDividendYield"
              placeholder="如: 3.5" 
              class="form-input"
              type="number"
              step="0.1"
            />
          </div>
          
          <div class="input-group">
            <label>趋势判断</label>
            <select 
              v-model="form.trendJudgment"
              class="form-select"
            >
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
          
          <div class="input-group">
            <label>到期时间</label>
            <input 
              v-model="form.expiryDate"
              type="date"
              class="form-input"
            />
          </div>
          
          <div class="input-group full-width">
            <label>手工备注</label>
            <textarea 
              v-model="form.manualNotes"
              placeholder="请输入手工备注信息" 
              class="form-textarea"
            ></textarea>
          </div>
          
          <div class="input-group full-width">
            <label>自动备注</label>
            <textarea 
              v-model="form.notes"
              placeholder="自动生成的备注信息" 
              class="form-textarea"
              readonly
            ></textarea>
          </div>
        </div>
      </div>
      
      <div class="dialog-footer">
        <button
          @click="$emit('close')"
          class="btn btn-secondary"
        >
          取消
        </button>
        <button
          @click="saveStrategy"
          class="btn btn-primary"
        >
          {{ isEditing ? '保存修改' : '添加策略' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  isEditing: {
    type: Boolean,
    default: false
  },
  strategy: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'save'])

const form = reactive({
  name: '',
  stockCode: '',
  accountType: 'default',
  isMarginAccount: false,
  netPosition: 0,
  marketValue: '',
  fiveYearAvgDividendYield: '',
  trendJudgment: 'unset',
  expiryDate: '',
  oscillationGridSize: '',
  oscillationTradeAmount: '',
  breakoutGridSize: '',
  breakoutTradeAmount: '',
  decreasePercentage: '',
  decreaseAmount: '',
  decreaseSide: 'COLLSELL',
  increasePercentage: '',
  increaseAmount: '',
  notes: '',
  manualNotes: ''
})

watch(() => props.strategy, (newStrategy) => {
  if (newStrategy && Object.keys(newStrategy).length > 0) {
    Object.assign(form, {
      ...form,
      ...newStrategy
    })
  }
}, { immediate: true, deep: true })

watch(() => props.show, (newShow) => {
  if (!newShow) {
    resetForm()
  }
})

const resetForm = () => {
  Object.keys(form).forEach(key => {
    form[key] = ''
  })
  form.accountType = 'default'
  form.isMarginAccount = false
  form.netPosition = 0
  form.trendJudgment = 'unset'
  form.decreaseSide = 'COLLSELL'
}

const closeDialogOnOverlayClick = (event) => {
  if (event.target.classList.contains('dialog-overlay')) {
    emit('close')
  }
}

const saveStrategy = () => {
  if (!form.name) {
    alert('请输入策略名称')
    return
  }
  
  emit('save', { ...form })
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
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: rgba(255,255,255,0.1);
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
  overflow-y: auto;
  max-height: 60vh;
}

.dialog-footer {
  padding: 15px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid rgba(255,255,255,0.2);
  background-color: rgba(255,255,255,0.05);
}

.strategy-inputs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.input-group {
  display: flex;
  flex-direction: column;
}

.input-group.full-width {
  grid-column: 1 / -1;
}

.input-group label {
  color: white;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-input,
.form-select,
.form-textarea {
  padding: 8px;
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 4px;
  font-size: 14px;
  background: rgba(255,255,255,0.1);
  color: white;
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

.account-type-selector {
  display: flex;
  gap: 15px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  color: white;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-primary {
  background-color: #4ecdc4;
  color: white;
}

.btn:hover {
  opacity: 0.9;
}

@media (max-width: 768px) {
  .strategy-inputs {
    grid-template-columns: 1fr;
  }
  
  .dialog-content {
    width: 95%;
    max-height: 95vh;
  }
  
  .dialog-footer {
    flex-direction: column;
  }
  
  .dialog-footer button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .account-type-selector {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
