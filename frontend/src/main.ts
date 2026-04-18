import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import router from './router'
import { useAuthStore } from './stores/auth.store'
import { useUiStore } from './stores/ui.store'
import './style.css'

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)
  app.use(i18n)

  const ui = useUiStore()

  const auth = useAuthStore()
  await auth.restoreSession()
  if (auth.user?.locale === 'en' || auth.user?.locale === 'ru') {
    if (auth.user.locale !== ui.locale) {
      ui.setLocale(auth.user.locale)
    }
  }

  app.use(router)
  app.mount('#app')
}

void bootstrap()
