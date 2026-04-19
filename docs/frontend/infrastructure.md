# Инфраструктурный слой (`infrastructure/`)

Слой инкапсулирует всё, что зависит от внешних систем: HTTP, i18n, форматирование дат. Может импортировать `domain/`. Не импортирует `application/`.

---

## HTTP-клиент

### [`infrastructure/http/client.ts`](../../frontend/src/infrastructure/http/client.ts)

Экспортирует единственный объект `api` — настроенный Axios-инстанс.

**Конфигурация:**
- `baseURL: '/api'` (проксируется Vite на бэкенд)
- `withCredentials: true`
- `Content-Type: application/json`

**Request interceptor:** добавляет заголовок `Authorization: Bearer <token>` из `localStorage[AUTH_TOKEN_KEY]`.

**Response interceptor (refresh retry):**

```
response 401
  └── не auth-путь, не _retry
        ├── refreshAccessToken() — POST /auth/refresh (X-Skip-Refresh: 1)
        │     ├── успех → сохранить новый токен → повторить оригинальный запрос
        │     └── неудача → удалить токен → reject
        └── уже _retry → reject
```

Функция `refreshAccessToken` использует паттерн **single-inflight** (`refreshInflight`): параллельные 401 не порождают множественные refresh-запросы — все ждут одного промиса.

---

## API-срезы

Каждый файл в `infrastructure/api/` экспортирует **plain object** (например `usersApi`, `projectsApi`) с методами-обёртками над `api` из `client.ts`. Пути указаны относительно `baseURL = /api`.

В исходниках каждый метод документирован JSDoc-ом с тегом `@http METHOD /path` (удобно искать по `@http`).

### Конвенции именования API

| Правило | Пример |
|---------|--------|
| Коллекция | `list` — `GET` список |
| Одна сущность | `get` — `GET` по id |
| Создание / обновление / удаление | `create` (`POST`), `update` (`PUT`), `remove` (`DELETE`) |
| Нестандартные действия по URL | глагол из намерения: `setRole`, `assign`, `complete`, `move`, `reorder`, `transfer`, `transferTasks`, `toggle`, `check`, `changePassword`, `login`, … |
| Вложенность объекта | отражает вложенность URL: `projectsApi.sections.list`, `reportsApi.exports.download` |

### [`api/auth.ts`](../../frontend/src/infrastructure/api/auth.ts)

| Метод | Объект | HTTP | Путь |
|-------|--------|------|------|
| `login(email, password)` | `authApi` | POST | `/auth/login` |
| `register(email, password, name)` | `authApi` | POST | `/auth/register` |
| `refresh()` | `authApi` | POST | `/auth/refresh` |
| `logout()` | `authApi` | POST | `/auth/logout` |
| `get()` | `meApi` | GET | `/me` |
| `changePassword(body)` | `meApi` | POST | `/me/password` |

### [`api/users.ts`](../../frontend/src/infrastructure/api/users.ts)

| Метод | HTTP | Путь |
|-------|------|------|
| `usersApi.list()` | GET | `/users` |
| `usersApi.create(body)` | POST | `/users` |
| `usersApi.update(userId, patch)` | PUT | `/users/:userId` |
| `usersApi.setRole(userId, role)` | PATCH | `/users/:userId/role` |
| `usersApi.remove(userId)` | DELETE | `/users/:userId` |

### [`api/projects.ts`](../../frontend/src/infrastructure/api/projects.ts)

| Метод | HTTP | Путь |
|-------|------|------|
| `projectsApi.list()` | GET | `/projects` |
| `projectsApi.get(id)` | GET | `/projects/:id` |
| `projectsApi.create(body)` | POST | `/projects` |
| `projectsApi.update(id, body)` | PUT | `/projects/:id` |
| `projectsApi.remove(id)` | DELETE | `/projects/:id` |
| `projectsApi.tasks.list(projectId)` | GET | `/projects/:projectId/tasks` |
| `projectsApi.tasks.move(projectId, payload)` | POST | `/projects/:projectId/tasks/move` |
| `projectsApi.sections.list(projectId)` | GET | `/projects/:projectId/task-sections` |
| `projectsApi.sections.create(projectId, name)` | POST | `/projects/:projectId/task-sections` |
| `projectsApi.sections.update(projectId, sectionId, name)` | PUT | `/projects/:projectId/task-sections/:sectionId` |
| `projectsApi.sections.remove(projectId, sectionId)` | DELETE | `/projects/:projectId/task-sections/:sectionId` |
| `projectsApi.sections.reorder(projectId, section_ids)` | POST | `/projects/:projectId/task-sections/reorder` |
| `projectsApi.members.list(projectId)` | GET | `/projects/:projectId/members` |
| `projectsApi.members.add(projectId, body)` | POST | `/projects/:projectId/members` |
| `projectsApi.members.setRole(projectId, userId, role)` | PUT | `/projects/:projectId/members/:userId` |
| `projectsApi.members.remove(projectId, userId, data)` | DELETE | `/projects/:projectId/members/:userId` |
| `projectsApi.members.transferTasks(projectId, userId, transfers)` | POST | `/projects/:projectId/members/:userId/transfer-tasks` |
| `projectsApi.owner.transfer(projectId, new_owner_id)` | PATCH | `/projects/:projectId/owner` |

### [`api/tasks.ts`](../../frontend/src/infrastructure/api/tasks.ts)

| Метод | HTTP | Путь |
|-------|------|------|
| `tasksApi.list(params?)` | GET | `/tasks` |
| `tasksApi.get(id)` | GET | `/tasks/:id` |
| `tasksApi.create(body)` | POST | `/tasks` |
| `tasksApi.update(id, body)` | PUT | `/tasks/:id` |
| `tasksApi.remove(id)` | DELETE | `/tasks/:id` |
| `tasksApi.assign(id, assignee_id)` | POST | `/tasks/:id/assign` |
| `tasksApi.complete(id)` | POST | `/tasks/:id/complete` |
| `tasksApi.subtasks.create(taskId, title)` | POST | `/tasks/:taskId/subtasks` |
| `tasksApi.subtasks.toggle(taskId, subtaskId)` | POST | `/tasks/:taskId/subtasks/:subtaskId/toggle` |
| `tasksApi.subtasks.update(taskId, subtaskId, patch)` | PUT | `/tasks/:taskId/subtasks/:subtaskId` |
| `tasksApi.subtasks.remove(taskId, subtaskId)` | DELETE | `/tasks/:taskId/subtasks/:subtaskId` |

### [`api/reports.ts`](../../frontend/src/infrastructure/api/reports.ts)

| Метод | HTTP | Путь |
|-------|------|------|
| `healthApi.check()` | GET | `/health` |
| `reportsApi.weekly()` | GET | `/reports/weekly` |
| `reportsApi.exports.list()` | GET | `/reports/exports` |
| `reportsApi.exports.generate(cfg)` | POST | `/reports/generate` |
| `reportsApi.exports.download(exportId)` | GET | `/reports/exports/:exportId/download` |
| `reportsApi.exports.remove(exportId)` | DELETE | `/reports/exports/:exportId` |

`reportsApi.exports.download` использует `responseType: 'blob'`.

---

## i18n

### [`infrastructure/i18n/index.ts`](../../frontend/src/infrastructure/i18n/index.ts)

| Экспорт | Описание |
|---------|----------|
| `i18n` | Инстанс `createI18n` с bundled-сообщениями `en` и `ru` |
| `setI18nLocale(locale)` | Устанавливает активную локаль и обновляет `document.documentElement.lang` |

Поддерживаемые локали: `ru` (по умолчанию), `en`.

### [`infrastructure/i18n/labels.ts`](../../frontend/src/infrastructure/i18n/labels.ts)

| Экспорт | Описание |
|---------|----------|
| `taskStatusLabel(t, status)` | Разрешает `enums.taskStatus.<status>` через i18n |
| `taskPriorityLabel(t, priority)` | Разрешает `enums.taskPriority.<priority>` через i18n |

### Проверка ключей i18n

Скрипт `frontend/scripts/i18n-check.mjs` запускается как часть `npm run build`. Проверяет:
- совпадение ключей между `locales/en.json` и `locales/ru.json`
- совпадение плейсхолдеров (`{name}`) и plural-pipe-присутствия

---

## Форматирование

### [`infrastructure/formatters/date.ts`](../../frontend/src/infrastructure/formatters/date.ts)

| Экспорт | Описание |
|---------|----------|
| `formatDate(date, locale)` | Полная дата через `toLocaleString` |
| `formatDateShort(date, locale)` | Краткая дата через `toLocaleDateString` |
| `timeAgo(date, t)` | Относительное время (`«1 час назад»`) через i18n-ключи |

---

## Routing

Конфигурация: [`frontend/src/router/index.ts`](../../frontend/src/router/index.ts). Использует `createWebHistory`.

### Таблица маршрутов

| Path | Name | Layout / Meta | Guard |
|------|------|---------------|-------|
| `/` | `home` | — | redirect → `/dashboard` или `/login` |
| `/login` | `login` | `auth` | redirect → `/dashboard` если уже залогинен |
| `/register` | `register` | `auth` | redirect → `/dashboard` если уже залогинен |
| `/forgot-password` | `forgot-password` | `auth` | — |
| `/dashboard` | `dashboard` | app | `requiresAuth` |
| `/projects` | `projects` | app | `requiresAuth` |
| `/projects/:id` | `project-detail` | app | `requiresAuth` |
| `/projects/:id/settings` | `project-settings` | app | `requiresAuth` |
| `/projects/:id/members` | — | — | redirect → `/projects/:id/settings` |
| `/tasks` | `tasks` | app | `requiresAuth` |
| `/reports` | `reports` | app | `requiresAuth` |
| `/profile` | `profile` | app | `requiresAuth` |
| `/ui-kit` | `ui-kit` | app | `requiresAuth` + `requiresStaffOrAdmin` |
| `/admin/users` | `admin-users` | app | `requiresAuth` + `requiresStaffOrAdmin` |

### `router.beforeEach` guards

1. `requiresAuth` + нет токена → `{ name: 'login', query: { redirect: to.fullPath } }`
2. `requiresAdmin` + роль ≠ `'admin'` → `{ name: 'dashboard' }`
3. `requiresStaffOrAdmin` + роль не `'admin'`/`'staff'` → `{ name: 'dashboard' }`
4. auth-layout (`/login`, `/register`) при наличии токена → `{ name: 'dashboard' }`
