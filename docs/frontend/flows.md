# Ключевые data-flows

Три сценария, в которых важна последовательность вызовов через несколько слоёв.

---

## 1. Аутентификация и автоматическое обновление токена

### Bootstrap (при загрузке страницы)

```mermaid
sequenceDiagram
  participant main as main.ts
  participant auth as auth.store
  participant client as http/client.ts
  participant api as POST /auth/refresh

  main->>auth: restoreSession()
  auth->>client: нет токена в localStorage?
  alt токен есть
    auth->>client: GET /me
    client-->>auth: User
  else токена нет
    auth->>api: POST /auth/refresh
    api-->>auth: access_token
    auth->>auth: setToken(token)
    auth->>client: GET /me
    client-->>auth: User
  end
  auth-->>main: готово
  main->>main: app.use(router) + mount
```

### Single-inflight refresh при 401

```mermaid
sequenceDiagram
  participant A as Запрос A (401)
  participant B as Запрос B (параллельный 401)
  participant interceptor as response interceptor
  participant refresh as POST /auth/refresh

  A->>interceptor: 401, _retry=false
  B->>interceptor: 401, _retry=false
  interceptor->>refresh: POST /auth/refresh (refreshInflight создан)
  B-->>interceptor: ждёт тот же refreshInflight
  refresh-->>interceptor: access_token
  interceptor->>interceptor: localStorage.setItem(token)
  interceptor->>A: повторить A с новым токеном
  interceptor->>B: повторить B с новым токеном
```

При неудаче `POST /auth/refresh` — `localStorage.removeItem(AUTH_TOKEN_KEY)`, оба запроса отклоняются.

---

## 2. Перемещение задачи (optimistic update + rollback)

Реализовано в [`task.store.ts`](../../frontend/src/application/task.store.ts) — `moveTask(projectId, payload)`.

```mermaid
sequenceDiagram
  participant UI as View (drag / move)
  participant taskStore as task.store
  participant projectStore as project.store
  participant domain as applyMoveLocally
  participant api as POST /projects/:id/tasks/move

  UI->>taskStore: moveTask(projectId, payload)

  taskStore->>taskStore: snapshot = tasks.value
  taskStore->>domain: applyMoveLocally(tasks, payload)
  domain-->>taskStore: новый порядок
  taskStore->>taskStore: tasks.value = новый порядок (UI обновлён мгновенно)

  taskStore->>projectStore: replaceTasks(applyMoveLocally(projectStore.tasks, payload))

  taskStore->>api: POST /projects/:id/tasks/move
  alt успех
    api-->>taskStore: Task (актуальные данные)
    taskStore->>taskStore: обновить задачу в списке
    taskStore->>projectStore: patchTask(task)
  else ошибка
    api-->>taskStore: error
    taskStore->>taskStore: tasks.value = snapshot (откат)
    taskStore->>projectStore: replaceTasks(snapshotProjectTasks)
    taskStore-->>UI: throw error
  end
```

---

## 3. Скачивание сохранённого отчёта

Разбит на стор и view: стор возвращает blob или описание ошибки; DOM-операцию (`<a>.click()`) делает view.

```mermaid
sequenceDiagram
  participant UI as Reports.vue
  participant store as report.store
  participant api as GET /reports/exports/:id/download

  UI->>store: downloadFile(id, fallbackName)
  store->>api: GET /reports/exports/:id/download (responseType: blob)

  alt HTTP 200 + Content-Type не JSON
    api-->>store: Blob
    store->>store: parseFilename(Content-Disposition) → filename
    store-->>UI: { ok: true, blob, filename }
    UI->>UI: URL.createObjectURL(blob)
    UI->>UI: <a>.click() → скачать
    UI->>UI: URL.revokeObjectURL(url)

  else HTTP 200 + Content-Type: application/json (ошибка в теле)
    api-->>store: Blob (JSON)
    store->>store: blob.text() → JSON.parse → error
    store-->>UI: { ok: false, apiMessage? }
    UI->>UI: msg.value = apiMessage ?? t('reports.toasts.downloadFailed')

  else HTTP error (axios reject)
    api-->>store: AxiosError (response.data = Blob)
    store->>store: blob.text() → JSON.parse → error
    store-->>UI: { ok: false, apiMessage? }
    UI->>UI: msg.value = apiMessage ?? t('reports.toasts.downloadFailed')
  end
```

Имя файла из заголовка `Content-Disposition` разбирается `parseFilename` (приватная функция в `report.store.ts`):
1. `filename="..."` — прямое имя
2. `filename*=UTF-8''...` — RFC 5987, `decodeURIComponent`
3. fallback — `display_name || 'report.<format>'`

---

## 4. Заметки: создание, связь с задачей, корзина, порядок

### Глобальный список (`/notes`)

```mermaid
sequenceDiagram
  participant UI as Notes.vue
  participant store as note.store
  participant api as notesApi
  UI->>store: fetchAll({ project_id? })
  store->>api: GET /notes
  api-->>store: notes[]
  UI->>UI: presentNotes — поиск, сортировка и группировка на клиенте
```

Создание с страницы: `NoteForm` с `projects[]` → `POST /projects/:id/notes` для выбранного проекта. Реордер на этой странице не показывается (он остаётся в контексте проекта).

### Создание и привязка задачи

```mermaid
sequenceDiagram
  participant UI as NoteDetailModal / NoteList
  participant store as note.store
  participant api as notesApi
  participant BE as NoteService

  UI->>store: create(projectId, { title, body, section_id? })
  store->>api: POST /projects/:id/notes
  api->>BE: Create
  BE-->>api: note
  api-->>store: note
  store-->>UI: обновлённый список

  UI->>store: linkTask(projectId, noteId, taskId)
  store->>api: POST /projects/:id/notes/:noteId/links
  api->>BE: LinkTask (один проект)
  BE-->>api: 204
```

### Мягкое удаление и восстановление

- `DELETE /projects/:id/notes/:noteId` — заметка в корзине (soft-delete).
- `POST /projects/:id/notes/:noteId/restore` — восстановление.
- `DELETE ...?permanent=true` — безвозвратно. Список удалённых: `GET /projects/:id/trash/notes`.

### Drag-and-drop порядка внутри / между секциями

`NoteList` собирает новый порядок id по секциям и вызывает `reorderNotes`: для затронутых секций позиции применяются **снизу вверх**, затем `fetchList` для согласования с БД.
