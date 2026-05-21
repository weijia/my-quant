import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'
import marketCloseBuyService from './services/MarketCloseBuyService.js'

const app = createApp(App)
app.use(router)
app.mount('#app')

// 启动收市买入定时任务服务
marketCloseBuyService.start()
