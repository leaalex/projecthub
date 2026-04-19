# Доменный слой (`domain/`)

Доменный слой содержит только чистый TypeScript: интерфейсы, type-алиасы и pure-функции. Никаких зависимостей на Vue, Pinia, Axios, vue-i18n. Файлы слоя могут импортировать только друг друга.

---

## `domain/user/`

### [`types.ts`](../../frontend/src/domain/user/types.ts)

Базовые типы пользователя.

| Экспорт | Тип | Описание |
|---------|-----|----------|
| `UserRole` | union | `'admin' \| 'staff' \| 'creator' \| 'user'` |
| `User` | interface | DTO пользователя: `id`, `email`, `name`, `role`, `first_name`, `last_name`, `patronymic`, `department`, `job_title`, `phone`, `locale` |

### [`role.ts`](../../frontend/src/domain/user/role.ts)

Предикаты ролей.

| Экспорт | Описание |
|---------|----------|
| `isAdminRole(role)` | `true` для роли `'admin'` |
| `isPrivilegedRole(role)` | `true` для `'admin'` или `'staff'` |

---

## `domain/project/`

### [`types.ts`](../../frontend/src/domain/project/types.ts)

Типы проекта, членства и переноса задач.

| Экспорт | Описание |
|---------|----------|
| `ProjectOwner` | Владелец проекта (`id`, `email`, `name`) |
| `ProjectMemberRole` | `'manager' \| 'executor' \| 'viewer'` |
| `ProjectMemberUser` | Пользователь в контексте членства |
| `ProjectKind` | `'personal' \| 'team'` |
| `ProjectMember` | Участник: `user`, `role`, `joined_at` |
| `Project` | Полный DTO проекта; включает `owner`, `kind`, `members?` |
| `TaskSection` | Секция задач: `id`, `project_id`, `name`, `position` |
| `TaskMovePayload` | Параметры перемещения задачи (section, position, target project) |
| `TaskTransferMode` | `'none' \| 'unassigned' \| 'to_user'` |
| `TaskTransferRequest` | Запрос на перенос задач при удалении участника |
| `TaskTransfer` | Результат переноса |
| `RemoveMemberResult` | Ответ API на удаление участника (`tasks_affected?`) |

### [`permissions.ts`](../../frontend/src/domain/project/permissions.ts)

Доменные проверки прав на задачи (без Vue/Pinia).

| Экспорт | Описание |
|---------|----------|
| `ProjectListRow` | Минимальный срез проекта для проверок (`id`, `owner.id`, `kind`) |
| `CurrentProjectRow` | Добавляет `can_manage_tasks`, `can_change_task_status` из API-флагов |
| `TaskPermissionContext` | Объединяет пользователя, project list, current project |
| `canManageTask(ctx, task)` | Может ли пользователь редактировать поля задачи |
| `canChangeTaskStatus(ctx, task)` | Может ли изменить статус |

### [`membership.ts`](../../frontend/src/domain/project/membership.ts)

Вычисление списка доступных исполнителей.

| Экспорт | Описание |
|---------|----------|
| `AssignableUserOption` | `{ id, email, name? }` — строка для пикера исполнителя |
| `mergeOwnerAndMembers(owner, members)` | Объединяет владельца + `ProjectMember[]` в дедуплицированный список `AssignableUserOption[]` |

---

## `domain/task/`

### [`types.ts`](../../frontend/src/domain/task/types.ts)

Базовые типы задач.

| Экспорт | Описание |
|---------|----------|
| `TaskStatus` | `'todo' \| 'in_progress' \| 'review' \| 'done'` |
| `TaskPriority` | `'low' \| 'medium' \| 'high' \| 'critical'` |
| `Subtask` | `{ id, task_id, title, done, position }` |
| `Task` | Полный DTO задачи; включает `assignee?`, `subtasks?`, `can_manage?`, `can_change_status?`, `section_id?`, `due_date?` |

### [`status.ts`](../../frontend/src/domain/task/status.ts)

| Экспорт | Описание |
|---------|----------|
| `STATUS_ORDER` | Каноничный порядок статусов для группировки и UI (`todo → in_progress → review → done`) |

### [`priority.ts`](../../frontend/src/domain/task/priority.ts)

| Экспорт | Описание |
|---------|----------|
| `PRIORITY_RANK` | `Record<TaskPriority, number>` — числовой ранг для сортировки |
| `PRIORITY_ORDER` | Каноничный порядок приоритетов (`critical → high → medium → low`) |

### [`move.ts`](../../frontend/src/domain/task/move.ts)

| Экспорт | Описание |
|---------|----------|
| `applyMoveLocally(tasks, payload)` | Оптимистично переставляет задачи в локальном списке, зеркалируя логику backend. Используется в `task.store.ts` для мгновенного обновления UI до ответа API. |

### [`presentation.ts`](../../frontend/src/domain/task/presentation.ts)

Пайплайн отображения списка задач.

| Экспорт | Описание |
|---------|----------|
| `TaskSortKey` | Поле сортировки: `'priority' \| 'due_date' \| 'created_at' \| 'title'` |
| `SortDir` | `'asc' \| 'desc'` |
| `TaskGroupBy` | Поле группировки: `'status' \| 'priority' \| 'section' \| ''` |
| `AssigneeFilterValue` | `number \| 'me' \| ''` |
| `TaskGroup` | `{ key, label, tasks[] }` |
| `TaskGroupLabels` | Маппинг ключей на строки (i18n-метки) |
| `filterTasks(tasks, filters)` | Pure-фильтрация по статусу, приоритету, исполнителю, поиску |
| `sortTasks(tasks, key, dir)` | Pure-сортировка |
| `groupTasks(tasks, by, labels)` | Группировка по ключу с i18n-метками |
| `presentTasks(tasks, opts)` | Единая точка входа: filter → sort → group |

### [`stats.ts`](../../frontend/src/domain/task/stats.ts)

| Экспорт | Описание |
|---------|----------|
| `taskSectionHeaderStats(tasks)` | Строка-суммари для заголовка секции: `"N задач, X выполнено (Y%)"` |

---

## `domain/note/`

### [`types.ts`](../../frontend/src/domain/note/types.ts)

| Экспорт | Описание |
|---------|----------|
| `NoteSection` | Секция заметок проекта (`note_sections`): `id`, `project_id`, `name`, `position`, даты |
| `Note` | Заметка: `section_id` — **id note-секции** (не task-section), `body` — markdown, опционально `linked_task_ids` на детальном GET |
| `NoteTrashItem` | Запись в корзине (без `body`) |
| `CreateNotePayload` / `UpdateNotePayload` | Поля для API create/update |

### [`preview.ts`](../../frontend/src/domain/note/preview.ts)

| Экспорт | Описание |
|---------|----------|
| `noteBodyPlainPreview(md, maxLen)` | Облегчённое текстовое превью из markdown для карточек (без рендера Tiptap) |

### [`permissions.ts`](../../frontend/src/domain/note/permissions.ts)

| Экспорт | Описание |
|---------|----------|
| `NotePermissionContext` | `{ projects: { id, owner_id, caller_project_role? }[], current?: … }` — роль участника в элементe `projects` нужна для глобальной страницы `/notes` |
| `canManageNote(userId, userRole, ctx, projectId)` | `admin`/`staff`, владелец, `manager`/`owner` по `caller_project_role` в списке проектов или по `current` |

---

## `domain/report/`

### [`types.ts`](../../frontend/src/domain/report/types.ts)

| Экспорт | Описание |
|---------|----------|
| `WeeklyReport` | `{ week_start, total_tasks, completed_in_week, projects_count }` |
| `ReportFormat` | `'csv' \| 'xlsx' \| 'pdf' \| 'txt'` |
| `ReportPdfLayout` | `'table' \| 'list'` |
| `ReportGroupBy` | `'' \| 'project' \| 'status' \| 'priority' \| 'assignee'` |
| `SavedReport` | DTO сохранённого экспорта: `id`, `display_name`, `format`, `size_bytes`, `created_at` |
| `ReportConfig` | Параметры генерации: `format`, `date_from?`, `date_to?`, `project_ids[]`, `user_ids[]`, `statuses[]`, `priorities[]`, `fields[]`, `group_by`, `pdf_layout?` |

---

## `domain/session/`

### [`locale.ts`](../../frontend/src/domain/session/locale.ts)

Управление локалью на стороне клиента.

| Экспорт | Описание |
|---------|----------|
| `AppLocale` | `'ru' \| 'en'` |
| `LOCALE_STORAGE_KEY` | Ключ `localStorage` для сохранённой локали |
| `isAppLocale(v)` | Type guard |
| `readStoredLocale()` | Читает `localStorage[LOCALE_STORAGE_KEY]` |
| `resolveAppLocale()` | Приоритет: `localStorage` → `navigator.language` → `'ru'` |
