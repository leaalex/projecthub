# Обзор клиентского приложения

## Технологический стек

| Категория | Пакет | Версия |
|-----------|-------|--------|
| UI-фреймворк | vue | ^3.5.30 |
| Маршрутизация | vue-router | ^5.0.4 |
| Состояние | pinia | ^3.0.4 |
| i18n | vue-i18n | ^9.14.5 |
| HTTP | axios | ^1.14.0 |
| Графики | chart.js | ^4.5.1 |
| Иконки | @heroicons/vue | ^2.2.0 |
| Стили | tailwindcss | ^4.2.2 (Vite-плагин) |
| Сборка | vite | ^8.0.1 |
| Типы | typescript | ~5.9.3, vue-tsc ^3.2.5 |

Конфигурация сборки: [`frontend/vite.config.ts`](../../frontend/vite.config.ts).

## Скрипты

```bash
npm run dev          # Vite dev-сервер (HMR), порт 5173
npm run build        # i18n-check → vue-tsc → vite build
npm run i18n:check   # проверить совпадение ключей/плейсхолдеров en.json ↔ ru.json
npm run preview      # предпросмотр production-сборки
```

## Bootstrap-последовательность

Точка входа: [`frontend/src/main.ts`](../../frontend/src/main.ts).

```
createApp(App)
  ↓ app.use(pinia)
  ↓ app.use(i18n)          — createI18n с bundled en/ru
  ↓ useAuthStore()
  ↓   auth.restoreSession() — POST /auth/refresh если нет токена,
  |                           затем GET /me; при неудаче — очищает localStorage
  ↓ ui.setLocale(...)       — синхронизация <html lang> если локаль из профиля
  ↓ app.use(router)
  ↓ app.mount('#app')
```

### `App.vue`

[`frontend/src/App.vue`](../../frontend/src/App.vue) определяет два layout-режима:

- **auth-layout** (`route.meta.layout === 'auth'`): центрированный экран без sidebar, `<router-view>` с page-transition.
- **app-layout** (все остальные маршруты): sidebar + основная область прокрутки; кнопка мобильного меню (фиксированная, `md:hidden`).

Глобальные компоненты, монтируемые в `App.vue` вне `<router-view>`:

- `<Toast />` — вывод тостов из `toast.store`
- `<ConfirmDialog />` — диалог подтверждения из `confirm.store`
- `<CommandPalette />` — быстрая навигация / `ui.store`

Ватчер `refreshMemberProjects`: при смене `auth.user` или `route.fullPath` перегружает список проектов для роли `user` (не admin/staff). Также слушает `visibilitychange`.

## Дерево папок `frontend/src/`

```text
frontend/src/
├── main.ts                    # bootstrap
├── App.vue                    # корневой компонент; layout-переключатель
├── style.css                  # базовые Tailwind-директивы
├── constants.ts               # AUTH_TOKEN_KEY и другие константы
├── env.d.ts                   # Vite env typings
│
├── domain/                    # чистый TypeScript: типы + бизнес-логика
│   ├── user/
│   ├── project/
│   ├── task/
│   ├── report/
│   └── session/
│
├── infrastructure/            # внешние зависимости
│   ├── http/client.ts         # axios + JWT + refresh-retry
│   ├── api/                   # HTTP-обёртки по срезам
│   ├── i18n/                  # createI18n, labels, locales
│   └── formatters/            # date formatters
│
├── application/               # сценарии: Pinia-сторы + composables
│   ├── *.store.ts
│   └── composables/
│
├── components/                # UI: презентационные и feature-компоненты
│   ├── admin/
│   ├── auth/
│   ├── dashboard/
│   ├── layout/
│   ├── projects/
│   ├── reports/
│   ├── tasks/
│   └── ui/                    # UI kit (примитивы)
│
├── views/                     # страницы, привязанные к маршрутам
│   ├── Admin/
│   ├── Dashboard.vue
│   ├── Projects.vue / ProjectDetail.vue / ProjectSettings.vue
│   ├── Tasks.vue
│   ├── Reports.vue
│   ├── Profile.vue
│   ├── Login.vue / Register.vue / ForgotPassword.vue
│   └── UiShowcase.vue
│
└── router/
    └── index.ts               # createRouter, beforeEach guards
```

## Path-алиасы

Определены в [`frontend/vite.config.ts`](../../frontend/vite.config.ts) и [`frontend/tsconfig.app.json`](../../frontend/tsconfig.app.json):

| Алиас | Раскрывается в |
|-------|---------------|
| `@/*` | `src/*` |
| `@domain/*` | `src/domain/*` |
| `@infra/*` | `src/infrastructure/*` |
| `@app/*` | `src/application/*` |
