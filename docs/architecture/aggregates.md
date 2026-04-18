# Domain Aggregates

Этот документ фиксирует агрегаты предметной области, их инварианты и транзакционные границы.
Все изменения в границах агрегатов должны отражаться в разделе [Changelog](#changelog).

## Содержание

- [Карта агрегатов](#карта-агрегатов)
- [IAM Aggregate — User](#iam-aggregate--user)
- [Project Aggregate](#project-aggregate)
- [Task Aggregate](#task-aggregate)
- [Report Aggregate](#report-aggregate)
- [Инварианты по уровням](#инварианты-по-уровням)
- [Транзакционные границы](#транзакционные-границы)
- [Политика удаления проекта](#политика-удаления-проекта)
- [Целевая структура пакетов](#целевая-структура-пакетов)
- [Таблица переезда сервисов](#таблица-переезда-сервисов)
- [Changelog](#changelog)

---

## Карта агрегатов

```
╔══════════════════════════╗        ╔══════════════════════════════════╗
║     IAM Aggregate        ║        ║     Project Aggregate            ║
║──────────────────────────║        ║──────────────────────────────────║
║  User  (root)            ║        ║  Project  (root)                 ║
║   • id                   ║        ║   • id                           ║
║   • email (unique)       ║        ║   • kind  (personal | team)      ║
║   • role (admin|staff|…) ║        ║   • ownerId  → User (id-ref)     ║
║   • FullName value-obj   ║        ║                                  ║
║   • locale               ║        ║  Members [ ProjectMember ]       ║
║                          ║        ║   • userId (id-ref), projectRole ║
║                          ║        ║                                  ║
║                          ║        ║  Sections [ TaskSection ]        ║
║                          ║        ║   • name, position               ║
╚══════════════════════════╝        ╚══════════════════════════════════╝
          ▲                                         ▲
          │ id-ref                                  │ id-ref
          │                                         │
╔═════════╧═══════════════════════════════════════╧═════════════════╗
║                       Task Aggregate                               ║
║───────────────────────────────────────────────────────────────────║
║  Task  (root)                                                      ║
║   • id                                                             ║
║   • projectId   → Project   (id-ref, NOT NULL)                     ║
║   • sectionId?  → Section   (id-ref, nullable)                     ║
║   • assigneeId? → User      (id-ref, nullable)                     ║
║   • status, priority, dueDate, title, description, position        ║
║                                                                    ║
║  Subtasks [ Subtask ]                                              ║
║   • title, done, position                                          ║
╚════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════╗
║     Report Aggregate         ║
║──────────────────────────────║
║  SavedReport  (root)         ║
║   • params, generatedByUserId║
║   • filePath (PDF / XLSX)    ║
╚══════════════════════════════╝
```

**Ключевые принципы:**

- `Task` — самостоятельный агрегат, **не** часть `Project`. Связь выражена id-ссылкой `projectId`.
- `Project` ничего не знает о списке задач; запрос «задачи проекта» — это query к `Task`-репозиторию с фильтром `projectId = ?`.
- Внешний мир обращается к агрегату **только через его корень**.
- `ProjectMember` и `TaskSection` живут внутри `Project`, потому что их инварианты уникальности и порядка локальны для проекта.
- `Subtask` живёт внутри `Task` по той же причине.

---

## IAM Aggregate — User

**Корень:** `User` — реализован в пакете [`backend/internal/domain/user`](../../backend/internal/domain/user).

Сценарии HTTP: [`backend/internal/application/auth_service.go`](../../backend/internal/application/auth_service.go) (регистрация, вход, refresh, выход, смена пароля, `/me`) и [`backend/internal/application/user_service.go`](../../backend/internal/application/user_service.go) (`/users`).

Персистентность: [`backend/internal/infrastructure/persistence/userstore`](../../backend/internal/infrastructure/persistence/userstore) (таблица `users`). Для связей GORM в `models.Project` / `Task` / `ProjectMember` оставлена минимальная ORM-обёртка [`models.User`](../../backend/internal/models/user_orm.go).

### Value-objects

| Тип | Поля |
|-----|------|
| `FullName` | `LastName`, `FirstName`, `Patronymic`, legacy `Name` |
| `Email` | нормализованная строка, уникальный индекс в БД |
| `Role` | enum: `admin`, `staff`, `creator`, `user` |
| `Locale` | ограниченное множество (`ru`, `en`) |
| `PasswordHash` | bcrypt-хеш |

### Локальные инварианты

- Email уникален в системе.
- Отображаемое имя выводится из ФИО или legacy `Name` (см. `FullName.DisplayName` / синхронизация).
- Смену глобальной `Role` выполняет только `admin` и не на себя.
- `Locale` только из разрешённого множества.

### Команды

`Register`, `ChangePassword`, `UpdateProfile`, `SetRole(adminOnly)`, `Delete(adminOnly)` — через `application.UserService` и `application.AuthService`.

---

## Session Aggregate (refresh)

**Корень:** `Session` — [`backend/internal/domain/session`](../../backend/internal/domain/session).

Хранит **только SHA-256** от opaque refresh-токена; в HttpOnly-cookie клиенту отдаётся исходная строка (см. `Session.Issue`). Таблица `user_sessions`, репозиторий: [`backend/internal/infrastructure/persistence/sessionstore`](../../backend/internal/infrastructure/persistence/sessionstore).

### Локальные инварианты

- Сессия привязана к `user_id`; при удалении пользователя строки сессий каскадно удаляются (FK).
- До `expires_at` сессия может обновлять access-JWT (`POST /auth/refresh`); после `logout` выставляется `revoked_at` (текущая реализация без ротации токена — см. `docs/todo.md`).

### Транзакционная граница

Одна операция `Save` сессии или отзыв — атомарная запись в БД; связка «выпустить access + сохранить refresh» выполняется в прикладном слое последовательно (при необходимости позже обернуть в явную транзакцию БД).

---

## Project Aggregate

**Корень:** `Project`

**Внутренние сущности:** `ProjectMember`, `TaskSection`

### Value-objects

| Тип | Значения |
|-----|----------|
| `ProjectKind` | `personal`, `team` |
| `ProjectRole` | `manager`, `executor`, `viewer` |

### Локальные инварианты

- `personal`-проект не может иметь `Members` — только `Owner`.
- Владелец (`ownerId`) не хранится в `Members`; его права шире любого `ProjectRole`.
- `Members` уникальны по `(projectId, userId)`.
- `Sections` внутри проекта имеют уникальные `position`; перенумерация — единственная транзакция проекта.
- `team`-проект может создать только пользователь с ролью `creator` или выше.

### Команды

`Create(ownerId, name, kind)`, `Rename(name)`, `UpdateDescription(text)`,
`AddMember(userId, role)`, `UpdateMemberRole(userId, role)`, `RemoveMember(userId, policy)`,
`TransferOwnership(newOwnerId)`,
`AddSection(name, position)`, `RenameSection(id, name)`, `ReorderSections(order)`, `RemoveSection(id)`,
`Archive()` *(soft-delete, планируется)*, `Delete(policy)` *(через `ProjectDeletionService`)*

---

## Task Aggregate

**Корень:** `Task`

**Внутренняя сущность:** `Subtask`

### Id-ссылки (не объекты внутри агрегата)

| Поле | Цель | Nullable |
|------|------|----------|
| `projectId` | `Project` root | **нет** |
| `sectionId` | `TaskSection` | да |
| `assigneeId` | `User` | да |

### Локальные инварианты

- `projectId` задан и не меняется «просто так» — только через команду `MoveToProject`.
- `sectionId`, если задан, должен принадлежать тому же `projectId` — проверяется в `TaskMoveService`.
- `status` изменяется только через `ChangeStatus`; переходы могут быть ограничены бизнес-правилами (напр., нельзя закрыть при незакрытых обязательных сабтасках).
- `Subtask.taskId == this.id` — сабтаски принадлежат только одной задаче.
- Порядок сабтасков задаётся `position`.

### Команды

`Create(projectId, sectionId?, title, priority, status, dueDate?)`,
`UpdateDetails(title, description, priority, dueDate)`,
`ChangeStatus(next)`,
`Assign(userId?)`,
`MoveToSection(sectionId?, position)`,
`MoveToProject(projectId, sectionId?, position)`,
`AddSubtask(title)`, `ToggleSubtask(id)`, `RenameSubtask(id, title)`,
`ReorderSubtask(id, position)`, `RemoveSubtask(id)`,
`Delete()`

---

## Report Aggregate

**Корень:** `SavedReport`

### Локальные инварианты

- Артефакт (PDF/XLSX-файл) и его метаданные живут и удаляются вместе.
- Параметры генерации иммутабельны после создания — это снимок состояния на момент генерации.

### Команды

`Generate(params, generatedByUserId)`, `Delete(callerPolicy)`

---

## Инварианты по уровням

### A. Локальные — поддерживаются одной транзакцией агрегата

| Инвариант | Агрегат |
|-----------|---------|
| Email уникален | IAM |
| Name синхронизирован с FullName | IAM |
| Members уникальны по userId | Project |
| personal-проект не имеет Members | Project |
| Sections уникальны по position | Project |
| Subtask.taskId == Task.id | Task |
| Task.projectId задан | Task |
| Report-артефакт неизменяем после создания | Report |

### B. Cross-aggregate — через доменный сервис в одной транзакции

Доменный сервис — тонкий оркестратор в `internal/application/`, который координирует два агрегата.

| Инвариант | Сервис |
|-----------|--------|
| При удалении проекта задачи обрабатываются по политике | `ProjectDeletionService` |
| При удалении участника его задачи переназначаются | `MemberRemovalService` |
| Task.sectionId принадлежит Task.projectId | `TaskMoveService` |
| Task.assigneeId — участник Task.projectId (или nil) | `TaskAssignService` |

### C. Eventual — допустима временная рассинхронизация

| Инвариант | Как поддерживается |
|-----------|-------------------|
| Дашборды / отчёты отражают текущее состояние | Read-model, строится отдельным query |
| «Список всех задач пользователя» | Query-репозиторий, не агрегат |

---

## Транзакционные границы

**Основное правило:** одна транзакция = один агрегат.
Исключения — только через сервисы уровня `application/`, и они должны быть короткими.

| Use-case | Сервис | Транзакция |
|----------|--------|------------|
| POST /projects | `ProjectService.Create` | 1 × Project |
| PUT /projects/:id | `ProjectService.Rename` | 1 × Project |
| POST /projects/:id/members | `ProjectService.AddMember` | 1 × Project |
| DELETE /projects/:id/members/:uid (с transfer) | `MemberRemovalService` | Project + Task(N) |
| PATCH /projects/:id/owner | `ProjectOwnershipTransferService` | 1 × Project |
| DELETE /projects/:id | `ProjectDeletionService` | Project + Task(N) + Section(M) + Member(K) |
| POST /tasks | `TaskService.Create` | 1 × Task |
| PUT /tasks/:id | `TaskService.UpdateDetails` | 1 × Task |
| POST /tasks/:id/assign | `TaskAssignService` | 1 × Task (+ RO Project) |
| POST /tasks/:id/complete | `TaskService.ChangeStatus` | 1 × Task |
| POST /projects/:id/tasks/move | `TaskMoveService` | 1 × Task (+ RO Project/Section) |
| POST /tasks/:id/subtasks | `TaskService.AddSubtask` | 1 × Task |
| POST /reports/generate | `ReportService.Generate` | 1 × Report |

---

## Политика удаления проекта

**Решение принято: soft-delete.**

При вызове «удалить проект» (`DELETE /projects/:id`) проект **не удаляется физически**,
а помечается как удалённый посредством `DeletedAt gorm.DeletedAt`.

### Следствия

- Задачи, секции и участники проекта физически **не трогаются** при мягком удалении.
- GORM автоматически исключает записи с `DeletedAt != NULL` из обычных запросов (через `Unscoped` при необходимости).
- Задачи мягко-удалённого проекта **скрываются** во всех листингах (`ListForCaller`, `TaskService.List`) — фильтр через JOIN/subquery на `projects.deleted_at IS NULL`.
- Появляется действие **«Восстановить проект»** в UI (в раздел «Архив»).
- Появляется действие **«Удалить окончательно»** (только admin/owner) — это уже физическое удаление через `ProjectDeletionService` с каскадом.

### Что потребуется для реализации (следующая итерация)

1. Добавить поле `DeletedAt gorm.DeletedAt` в `models.Project` + миграция.
2. Завести `ProjectRepository` с методами `SoftDelete`, `Restore`, `HardDelete`.
3. Реализовать `ProjectDeletionService` (для hard delete) в `internal/application/`.
4. Обновить `ProjectService.ListForCaller` и `TaskService.List` — фильтровать задачи по `projects.deleted_at IS NULL`.
5. Добавить эндпоинты `POST /projects/:id/restore` и `DELETE /projects/:id?permanent=true`.
6. UI: раздел «Архив» в списке проектов, кнопки «Восстановить» / «Удалить навсегда».

---

## Целевая структура пакетов

```
backend/internal/
├── domain/
│   ├── user/           # IAM aggregate: User, FullName, Role
│   ├── project/        # Project aggregate: Project, ProjectMember, TaskSection
│   ├── task/           # Task aggregate: Task, Subtask
│   └── report/         # Report aggregate: SavedReport
├── application/
│   ├── project_deletion_service.go   # cross-aggregate: delete + cascade policy
│   ├── member_removal_service.go     # cross-aggregate: remove + task transfer
│   ├── task_move_service.go          # cross-aggregate: move task across sections/projects
│   ├── task_assign_service.go        # cross-aggregate: assign + membership check
│   └── reporting_service.go          # orchestrates Report creation from Task/Project data
├── infrastructure/
│   └── repository/     # GORM-репозитории, по одному на aggregate root
├── interface/
│   └── http/           # Gin handlers (тонкий слой: parse → call application/domain → respond)
├── middleware/         # (остаётся на месте)
├── config/             # (остаётся на месте)
└── database/           # (остаётся на месте)
```

**Текущее состояние:**

```
backend/internal/
├── models/     ← все модели здесь (переедут в domain/* постепенно)
├── services/   ← вся логика здесь (разойдётся между domain/* и application/)
├── handlers/   ← HTTP (переедет в interface/http/)
├── middleware/
├── config/
└── database/
```

Переезд происходит **инкрементально**: каждый PR компилируется и проходит тесты.
Пока новый пакет не завершён — старый остаётся и используется.

---

## Таблица переезда сервисов

| Текущий файл | Строк | Куда переедет |
|-------------|-------|---------------|
| `models/user.go` | 61 | `domain/user` |
| `models/project.go` | 59 | `domain/project` |
| `models/project_member.go` | 35 | `domain/project` |
| `models/task_section.go` | 14 | `domain/project` |
| `models/task.go` | 44 | `domain/task` |
| `models/subtask.go` | 13 | `domain/task` |
| `models/saved_report.go` | ~30 | `domain/report` |
| `services/auth_service.go` | 115 | `domain/user` (логика хэширования) + `infrastructure/` (JWT) |
| `services/project_service.go` | 180 | `domain/project` (команды агрегата) + `infrastructure/repository` |
| `services/member_service.go` | 483 | `domain/project` (AddMember, UpdateRole) + `application/member_removal_service.go` |
| `services/task_service.go` | 603 | `domain/task` (команды агрегата) + `application/task_move_service.go`, `task_assign_service.go` |
| `services/task_section_service.go` | 184 | `domain/project` (управление секциями) |
| `services/subtask_service.go` | 166 | `domain/task` (команды сабтасков) |
| `services/user_service.go` | 243 | `domain/user` |
| `services/report_service.go` | 386 | `domain/report` + `application/reporting_service.go` |
| `services/report_export.go` | 500 | `domain/report` (экспорт как доменный сервис) |
| `handlers/*` | ~1700 | `interface/http/` |

---

## Changelog

| Дата | Изменение |
|------|-----------|
| 2026-04-18 | Первичная фиксация границ агрегатов: User, Project, Task, Report. Принято решение о soft-delete для Project. |
| 2026-04-18 | IAM `User` перенесён в `domain/user` + `application` + `userstore`; добавлен агрегат `Session` для refresh-токенов; access-JWT короткоживущий, refresh в HttpOnly-cookie. |
