import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { useThemeStore } from './stores/theme'
import './assets/main.css'
import 'vue-virtual-scroller/index.css'

const pinia = createPinia()

useThemeStore(pinia).init()

createApp(App).use(pinia).use(router).mount('#app')
