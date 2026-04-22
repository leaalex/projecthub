# Application-слой: сторы и composables

Слой реализует сценарии приложения. Импортирует `@domain/*` и `@infra/*`. UI-слой обращается к состоянию и действиям через этот слой.

---

## Pinia-сторы

### [`auth.store.ts`](../../frontend/src/application/auth.store.ts)

**Id:** `auth`

**State:**

| Поле | Тип | Описание |
|------|-----|----------|
| `token` | `string \| null` | JWT access-token; хранится в `localStorage[AUTH_TOKEN_KEY]` |
| `user` | `User \| null` | Текущий аутентифицированный пользователь |

**Computed:** `isAuthenticated: boolean`

**Actions:**

| Action | Описание |
|--------|----------|
| `setToken(token)` | Сохранить/очистить токен в state и localStorage |
| `login(body)` | `POST /auth/login` → setToken + установить user |
| `register(body)` | `POST /auth/register` → setToken + установить user |
| `fetchMe()` | `GET /me` → обновить user |
| `restoreSession()` | Если нет токена — refresh; затем fetchMe; при ошибке — очистить сессию |
| `logout()` | `POST /auth/logout` → очистить token и user |
| `updateProfile(patch)` | `PUT /users/:id` → смержить в user |
| `changePassword(body)` | `POST /me/password` |

**Внешние зависимости:** `@infra/api/auth` (`authApi`, `meApi`), `@infra/api/users` (`usersApi.update` для профиля), `localStorage[AUTH_TOKEN_KEY]`.

---

### [`project.store.ts`](../../frontend/src/application/project.store.ts)

**Id:** `project`

**State:**

| Поле | Тип | Описание |
|------|-----|----------|
| `projects` | `Project[]` | Список всех доступных проектов |
| `current` | `Project \| null` | Текущий открытый проект |
| `tasks` | `Task[]` | Задачи текущего проекта |
| `sections` | `TaskSection[]` | Секции текущего проекта |
| `members` | `ProjectMember[]` | Участники |
| `membersProjectId` | `number \| null` | Id проекта, для которого загружены `members` |
| `loading` | `boolean` | |
| `error` | `string \| null` | |

**Computed:** `assignableUsers` — `mergeOwnerAndMembers(current.owner, members)`.

**Actions (выборка):**

| Action | Описание |
|--------|----------|
| `fetchList()` | `GET /projects` |
| `fetchOne(id)` | `GET /projects/:id` → current |
| `fetchTasks(projectId)` | `GET /projects/:id/tasks` |
| `fetchSections(projectId)` | `GET /projects/:id/task-sections` |
| `fetchMembers(projectId)` | `GET /projects/:id/members` |
| `create/update/remove` | CRUD проекта |
| `createSection/updateSection/deleteSection/reorderSections` | CRUD секций |
| `addMember/updateMemberRole/removeMember` | Управление участниками |
| `applyTaskTransfers` | Перенос задач при удалении участника |
| `transferOwnership` | `PATCH /projects/:id/owner` |
| `resetProjectDetailView()` | Очистить `tasks`, `sections`, `members`, `current` |
| `patchTask/removeTask/replaceTasks` | Синхронизация с `task.store` |

**Внешние зависимости:** `@infra/api/projects` только.

---

### [`task.store.ts`](../../frontend/src/application/task.store.ts)

**Id:** `task`

**State:** `tasks: Task[]`, `loading: boolean`, `error: string | null`

**Actions:**

| Action | Описание |
|--------|----------|
| `fetchList(params?)` | `GET /tasks` с фильтрами `project_id?`, `status?` |
| `fetchOne(id)` | `GET /tasks/:id` |
| `create(payload)` | `POST /tasks` → prepend в список |
| `update(id, payload)` | `PUT /tasks/:id` → patch в списке + `projectStore.patchTask` |
| `remove(id)` | `DELETE /tasks/:id` → удалить из списка + `projectStore.removeTask` |
| `assign(id, assignee_id)` | `POST /tasks/:id/assign` |
| `complete(id)` | `POST /tasks/:id/complete` |
| `moveTask(projectId, payload)` | Оптимистично: `applyMoveLocally` → `POST /projects/:id/tasks/move`; откат на ошибке |
| `createSubtask/toggleSubtask/updateSubtask/deleteSubtask` | CRUD подзадач |

**Внешние зависимости:** `@infra/api/tasks` (`tasksApi`), `@infra/api/projects` (`projectsApi.tasks.move`); `project.store` (`patchTask`, `removeTask`, `replaceTasks`).

---

### [`note.store.ts`](../../frontend/src/application/note.store.ts)

**Id:** `note`

**State:** `notes`, `sections` (note-секции), `currentProjectId`, `loading`, `sectionsLoading`, `error`, `savingId`, `deletingId`, `linksByTaskId` (кэш `GET /tasks/:id/notes`).

**Actions:** **`fetchAll(params?)`** — `GET /notes` (опционально `project_id`); **`currentProjectId = null`**; остальное как у списка проекта. **`fetchList`**, `fetchOne`, `create`, `update`, `remove`, `restore`, `permanentDelete`, `move` (опционально `refetch: false` для пакетного DnD). Порядок заметок в секции вместе с задачами — **`projectStore.reorderSectionItems`**. `linkTask`, `unlinkTask`, `fetchLinkedByTask`, `invalidateTaskLinks`; **`patchNoteInList(noteId, patch)`** — точечное обновление строки в `notes` (например `linked_task_ids` после загрузки в модалке).

**Экспорт:** `extractNoteAxiosError`.

**Зависимости:** `@infra/api/notes`, `@infra/api/projects` (`noteSections`).

---

### [`trashTasks.store.ts`](../../frontend/src/application/trashTasks.store.ts)

**Id:** `trashTasks`

**State:** `tasks`, `loading`, `error` (сырая ошибка последнего запроса).

**Actions:** `fetchTasks`, `restoreTask`, `permanentDeleteTask` — `projectsApi.trash` для удалённых задач.

### [`trashNotes.store.ts`](../../frontend/src/application/trashNotes.store.ts)

**Id:** `trashNotes`

**State:** `notes`, `loading`, `error`.

**Actions:** `fetchNotes`, `restoreNote`, `permanentDeleteNote` — корзина заметок того же проекта.

---

### [`user.store.ts`](../../frontend/src/application/user.store.ts)

**Id:** `user`

**State:** `users: User[]`, `loading: boolean`, `creating: boolean`, `savingId: number | null`, `deletingId: number | null`

**Actions:**

| Action | Описание |
|--------|----------|
| `fetchList({ quiet? })` | `GET /users`; при `quiet: true` не меняет `loading` (не мигает скелетон после мутаций) |
| `create(body)` | `POST /users` → `fetchList({ quiet: true })` → вернуть `User` |
| `update(id, patch)` | `PUT /users/:id` → `fetchList({ quiet: true })` → вернуть `User` |
| `updateRole(id, role)` | `PATCH /users/:id/role` → `fetchList({ quiet: true })` |
| `remove(id)` | `DELETE /users/:id` → `fetchList({ quiet: true })` |

**Экспортированный хелпер:** `extractUserAxiosError(e, fallback): string` — извлекает `response.data.error` из axios-ошибки.

**Внешние зависимости:** `@infra/api/users` (`usersApi`) только.

---

### [`report.store.ts`](../../frontend/src/application/report.store.ts)

**Id:** `report`

**State:**

| Поле | Тип |
|------|-----|
| `weekly` | `WeeklyReport \| null` |
| `savedReports` | `SavedReport[]` |
| `health` | `string \| null` |
| `weeklyLoading`, `exportsLoading`, `healthLoading`, `generating` | `boolean` |
| `deletingId` | `number \| null` |

**Actions:**

| Action | Описание |
|--------|----------|
| `loadWeekly()` | `GET /reports/weekly` → `weekly`; кидает ошибку наверх |
| `loadExports()` | `GET /reports/exports` → `savedReports` |
| `loadHealth()` | `GET /health` → `health` |
| `generate(cfg)` | `POST /reports/generate` → `loadExports()` |
| `remove(id)` | `DELETE /reports/exports/:id` → `loadExports()` |
| `downloadFile(id, fallbackName)` | `GET /reports/exports/:id/download` (blob); возвращает `ReportDownloadResult` |

**Экспортированные типы/хелперы:**
- `ReportDownloadResult` = `{ ok: true; blob: Blob; filename: string } | { ok: false; apiMessage?: string }`
- `extractReportAxiosError(e, fallback): string`

**Внешние зависимости:** `@infra/api/reports` (`healthApi`, `reportsApi`) только.

---

### [`ui.store.ts`](../../frontend/src/application/ui.store.ts)

**Id:** `ui`

**State:** `sidebarCollapsed`, `mobileMenuOpen`, `theme: ThemeMode`, `locale: AppLocale`, `commandPaletteOpen`

**Actions:** `toggleSidebarCollapsed`, `toggleMobileMenu`, `closeMobileMenu`, `cycleTheme`, `setTheme`, `setLocale`, `openCommandPalette`, `closeCommandPalette`, `toggleCommandPalette`

**localStorage:** `tm-ui-sidebar-collapsed`, `tm-ui-theme`, `LOCALE_STORAGE_KEY`

---

### [`toast.store.ts`](../../frontend/src/application/toast.store.ts)

**Id:** `toast`

**State:** `items: ToastItem[]`

Автоматически удаляет тост через `duration` мс (по умолчанию 4000). Не зависит от API.

---

### [`confirm.store.ts`](../../frontend/src/application/confirm.store.ts)

**Id:** `confirm`

**State:** `open: boolean`, `options: ConfirmOptions | null`

**Паттерн:** `request(opts)` → показывает диалог → возвращает `Promise<boolean>`. `answer(result)` разрешает промис и закрывает диалог.

---

## Composables

### [`composables/useToast.ts`](../../frontend/src/application/composables/useToast.ts)

Тонкая обёртка над `toast.store`. Экспортирует `useToast()` с методами `show`, `dismiss`, `success`, `error`, `info`.

### [`composables/useConfirm.ts`](../../frontend/src/application/composables/useConfirm.ts)

Тонкая обёртка над `confirm.store`. Экспортирует `useConfirm()` с методом `confirm(opts)`.

### [`composables/useProjectNavVisibility.ts`](../../frontend/src/application/composables/useProjectNavVisibility.ts)

Экспортирует `useProjectNavVisibility()` → `{ showProjectsAndTasks: ComputedRef<boolean> }`. Показывать ли секции «Проекты» и «Задачи» в навигации (зависит от роли из `auth.store`).

### [`composables/useCanEditTask.ts`](../../frontend/src/application/composables/useCanEditTask.ts)

| Экспорт | Описание |
|---------|----------|
| `canManageTaskRecord` | Чистая проверка с переданным контекстом |
| `canChangeTaskStatusRecord` | Аналогично для смены статуса |
| `useCanEditTask(taskRef)` | `ComputedRef<boolean>` — может ли текущий пользователь редактировать задачу |
| `useTaskEditPermission()` | Объект per-task функций для списков задач |

Использует `auth.store` и `project.store` для построения `TaskPermissionContext`.

### [`composables/useAdminAssignableUsers.ts`](../../frontend/src/application/composables/useAdminAssignableUsers.ts)

| Экспорт | Описание |
|---------|----------|
| `useProjectScopedAssignableUsers(projectIdRef)` | Список исполнителей из `project.store.assignableUsers`; следит за сменой `projectId` |
| `useTasksPageAssignableUsers(filterProjectIdRef)` | Список для страницы задач: участники проекта при фильтре по проекту; `usersApi.list()` для privileged без фильтра |

Единственный composable в `application/`, вызывающий `@infra/api/users` (`usersApi`) напрямую (допустимо, т.к. файл в слое `application/`).

### [`composables/useTaskListPresentation.ts`](../../frontend/src/application/composables/useTaskListPresentation.ts)

Обёртка над `domain/task/presentation` с i18n-метками групп. Экспортирует `groupTasks`, `presentTasks` (с i18n-переводами групп), а также реэкспортирует типы из `@domain/task/presentation`.

### [`composables/useNoteListPresentation.ts`](../../frontend/src/application/composables/useNoteListPresentation.ts)

Клиентский **поиск** (заголовок + plain-превью тела), **сортировка** (`updated_at` / `title`) и **группировка** (`none` | `project` | `section`) для страницы `/notes`. Экспорт: `presentNotes`, `filterNotes`, `sortNotes`, типы `NoteSortKey`, `NoteGroupBy`, `SortDir`, `NoteGroup`.
