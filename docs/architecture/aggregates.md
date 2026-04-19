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

Персистентность: [`backend/internal/infrastructure/persistence/userstore`](../../backend/internal/infrastructure/persistence/userstore) (таблица `users`). Связи с проектами/задачами выражены id-полями в `*store` record-типах и доменных агрегатах; отдельного пакета `internal/models` нет.

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

**Корень:** `Project` — [`backend/internal/domain/project`](../../backend/internal/domain/project) (агрегат: `Project`, `Member`, `Section`; VO `Kind`, `Role`).

**Персистентность:** [`backend/internal/infrastructure/persistence/projectstore`](../../backend/internal/infrastructure/persistence/projectstore) (`ProjectRecord` / `MemberRecord` / `SectionRecord`; схема в миграциях / `database.AutoMigrate`).

**Сценарии HTTP:** [`application/project_service.go`](../../backend/internal/application/project_service.go) и [`application/member_removal_service.go`](../../backend/internal/application/member_removal_service.go).

**Внутренние сущности:** `Member`, `Section` (в БД — `project_members`, `task_sections`).

### Value-objects

| Тип | Значения |
|-----|----------|
| `Kind` | `personal`, `team` |
| `Role` | `manager`, `executor`, `viewer` |

### Локальные инварианты

- `personal`-проект не может иметь `Members` — только `Owner`.
- Владелец (`ownerId`) не хранится в `Members`; его права шире любой роли `Role` участника.
- `Members` уникальны по `(projectId, userId)`.
- `Sections` внутри проекта имеют уникальные `position`; перенумерация — единственная транзакция проекта.
- `team`-проект может создать только пользователь с ролью `creator` или выше.

### Команды

`Create(ownerId, name, kind)`, `Rename(name)`, `UpdateDescription(text)`,
`AddMember(userId, role)`, `UpdateMemberRole(userId, role)`, `RemoveMember(userId, policy)`,
`TransferOwnership(newOwnerId)`,
`AddSection(name, position)`, `RenameSection(id, name)`, `ReorderSections(order)`, `RemoveSection(id)`,
Soft-delete через `ProjectService.Delete` / `project.Repository.SoftDelete`; жёсткое удаление — `ProjectDeletionService.HardDelete`

---

## Task Aggregate

**Корень:** `Task` — пакет [`backend/internal/domain/task`](../../backend/internal/domain/task).

**Внутренняя сущность:** `Subtask` — там же.

**Персистентность:** [`backend/internal/infrastructure/persistence/taskstore`](../../backend/internal/infrastructure/persistence/taskstore) (`TaskRecord` / `SubtaskRecord`, GORM-репозиторий: `Save`, `Delete`, `DeleteByProject`, `ListVisible`, `NextPosition`, `ListByAssignee`, `ReassignByAssignee`, `ReassignOne`).

**Сценарии API:** [`application.TaskService`](../../backend/internal/application/task_service.go) (CRUD, подзадачи, ACL, порт `VisibleProjectIDs` для отчётов), [`application.TaskMoveService`](../../backend/internal/application/task_move_service.go), [`application.TaskAssignService`](../../backend/internal/application/task_assign_service.go).

Отчёты и списки задач используют `taskstore` / доменные read-модели (`report.TaskProjection` и т.д.) без ORM-shells в `models`.

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
| PATCH /projects/:id/owner | `ProjectService.TransferOwnership` | 1 × Project |
| DELETE /projects/:id?permanent=true | `ProjectDeletionService.HardDelete` | Task(N) + Member(K) + Section(M) + Project |
| DELETE /projects/:id (без permanent) | `ProjectService.Delete` → `project.Repository.SoftDelete` | 1 × Project (`deleted_at`) |
| POST /projects/:id/restore | `ProjectDeletionService.Restore` | 1 × Project |
| POST /tasks | `TaskService.Create` | 1 × Task |
| PUT /tasks/:id | `TaskService.UpdateDetails` | 1 × Task |
| POST /tasks/:id/assign | `TaskAssignService.Assign` | 1 × Task (+ read `project.Repository`) |
| POST /tasks/:id/complete | `TaskService.ChangeStatus` | 1 × Task |
| POST /projects/:id/tasks/move | `TaskMoveService` | 1 × Task (+ RO Project/Section) |
| POST /tasks/:id/subtasks | `TaskService.AddSubtask` | 1 × Task |
| POST /reports/generate | `ReportingService.Generate` | 1 × Report |

---

## Политика удаления проекта

**Решение принято: soft-delete.**

При вызове «удалить проект» (`DELETE /projects/:id`) проект **не удаляется физически**,
а помечается как удалённый посредством `DeletedAt gorm.DeletedAt`.

### Следствия

- Задачи, секции и участники проекта физически **не трогаются** при мягком удалении.
- GORM автоматически исключает записи с `DeletedAt != NULL` из обычных запросов (через `Unscoped` при необходимости).
- Задачи мягко-удалённого проекта **скрываются** во всех листингах (`ListForCaller`, `application.TaskService.List` / видимые project id) — фильтр через JOIN/subquery на `projects.deleted_at IS NULL` и исключение soft-deleted из членств/владения.
- Появляется действие **«Восстановить проект»** в UI (в раздел «Архив»).
- Появляется действие **«Удалить окончательно»** (только admin/owner) — это уже физическое удаление через `ProjectDeletionService` с каскадом.

### Реализовано в коде

- `DeletedAt` на `projectstore.ProjectRecord`; `SoftDelete` / `Restore` / `HardDelete` в репозитории.
- `application.ProjectDeletionService` и эндпоинты `POST /projects/:id/restore`, `DELETE /projects/:id?permanent=true`.
- Списки задач и участие в проектах учитывают soft-delete (`ListMemberships` с join на живые проекты, GORM-фильтр в `ListOwnedProjectIDs` / `FindByID`).

**UI (архив / кнопки):** по-прежнему в планах фронтенда.

---

## Целевая структура пакетов

```
backend/internal/
├── domain/
│   ├── user/           # IAM aggregate: User, FullName, Role
│   ├── session/        # refresh-сессии (opaque token → hash в БД)
│   ├── project/        # Project aggregate: Project, Member, Section
│   ├── task/           # Task aggregate: Task, Subtask
│   └── report/         # Report aggregate: SavedReport
├── application/
│   ├── project_deletion_service.go   # cross-aggregate: delete + cascade policy
│   ├── member_removal_service.go     # cross-aggregate: remove + task transfer
│   ├── task_move_service.go          # cross-aggregate: move task across sections/projects
│   ├── task_assign_service.go        # cross-aggregate: assign + membership check
│   └── reporting_service.go          # orchestrates Report creation from Task/Project data
├── infrastructure/
│   ├── persistence/    # GORM-репозитории по aggregate root
│   ├── auth/           # JWT (access-токен)
│   └── reportexport/   # форматтеры CSV/XLSX/PDF (read-модель для Report)
├── interface/
│   └── http/           # Gin handlers (тонкий слой: parse → call application/domain → respond)
├── middleware/         # (остаётся на месте)
├── config/             # (остаётся на месте)
└── database/           # (остаётся на месте)
```

**Текущее состояние (фрагмент):**

```
backend/internal/
├── domain/user, domain/project, domain/session, domain/report, domain/task
├── application/   ← Auth, User, Project, MemberRemoval, Task*, ReportingService, … (+ общие ошибки в errors.go)
├── infrastructure/persistence/{userstore,sessionstore,projectstore,taskstore,reportstore}
├── infrastructure/reportexport  ← CSV/XLSX/PDF/TXT (read-модель из domain/report)
├── infrastructure/auth  ← JWT (SignJWT / ParseJWT)
├── interface/http/  ← package handler (Gin handlers)
├── middleware/
├── config/
└── database/
```

Переезд происходит **инкрементально**: каждый PR компилируется и проходит тесты.

---

## Таблица переезда сервисов

| Текущий файл | Строк | Куда переедет |
|-------------|-------|---------------|
| ~~`models/user.go`~~ | — | **сделано:** `domain/user` (+ `userstore` для персистентности); каталог `internal/models` удалён |
| ~~`models/project.go`~~ → `models/project_orm.go` | — | **сделано:** домен в `domain/project`, схема в `projectstore`, preload через ORM-shell |
| ~~`models/project_member.go`~~ → `models/project_member_orm.go` | — | **сделано:** как выше |
| ~~`models/task_section.go`~~ → `models/task_section_orm.go` | — | **сделано:** как выше |
| ~~`models/task.go`~~ → `models/task_orm.go` | — | **сделано:** домен в `domain/task`, схема в `taskstore`, сценарии в `application` |
| ~~`models/subtask.go`~~ → `models/subtask_orm.go` | — | **сделано:** как выше |
| ~~`models/*_orm.go`~~ (весь каталог `internal/models`) | — | **сделано:** удалено; переназначение задач при удалении участника через `task.Repository` (`ListByAssignee`, `ReassignByAssignee`, `ReassignOne`); `ProjectService` без прямого GORM к задачам |
| ~~`models/saved_report.go`~~ | — | **сделано:** `domain/report` + `reportstore.SavedReportRecord` |
| ~~`services/auth_service.go`~~ | — | **сделано:** `application.AuthService` + `domain/user` (хэширование) + `infrastructure/auth` (JWT) |
| ~~`services/project_service.go`~~ | — | **сделано:** `application/project_service.go` + `projectstore` |
| ~~`services/member_service.go`~~ | — | **сделано:** `application/member_removal_service.go` + доменные команды на агрегате |
| ~~`services/task_service.go`~~ | — | **сделано:** `domain/task` + `taskstore` + `application.TaskService` / `TaskMoveService` / `TaskAssignService` |
| ~~`services/task_section_service.go`~~ | — | **сделано:** секции в `application/project_service.go` |
| ~~`services/subtask_service.go`~~ | — | **сделано:** подзадачи в `application.TaskService` + домен `domain/task` |
| ~~`services/user_service.go`~~ | — | **сделано:** `application.UserService` + `domain/user` |
| ~~`services/report_service.go`~~ | — | **сделано:** `application.ReportingService` + `reportstore` + `taskstore.ReportQuery` |
| ~~`services/report_export.go`~~ + ~~`services/pdffonts/`~~ | — | **сделано:** `infrastructure/reportexport` (+ pdffonts) |
| ~~`handlers/*`~~ | — | **сделано:** `backend/internal/interface/http/` (`package handler`) |
| ~~`services/errors.go`~~ | — | **сделано:** `application/errors.go` (`ErrForbidden`, `ErrInvalidInput`) |
| ~~`utils/jwt.go`~~ | — | **сделано:** `infrastructure/auth` (package `auth`) |

---

## Changelog

| Дата | Изменение |
|------|-----------|
| 2026-04-18 | Первичная фиксация границ агрегатов: User, Project, Task, Report. Принято решение о soft-delete для Project. |
| 2026-04-18 | IAM `User` перенесён в `domain/user` + `application` + `userstore`; добавлен агрегат `Session` для refresh-токенов; access-JWT короткоживущий, refresh в HttpOnly-cookie. |
| 2026-04-18 | **Project aggregate:** логика в `domain/project`, персистентность `projectstore`, сценарии `application.ProjectService` / `MemberRemovalService`; старые `services/project_*` / `member_service` / `task_section_service` удалены; ORM-shells в `models/*_orm.go` для preload `Task`. |
| 2026-04-18 | **Task aggregate** перенесён в `domain/task` + `taskstore` + `application` (`TaskService`, `TaskMoveService`, `TaskAssignService`); удалены `services/task_service.go` и `services/subtask_service.go`. **Проект:** soft-delete (`deleted_at`), `ProjectDeletionService`, эндпоинты restore и `?permanent=true`. |
| 2026-04-18 | **Report aggregate:** `domain/report` (`SavedReport`, порты `Repository` / `TaskQuery`), `reportstore`, `taskstore.ReportQuery`, `infrastructure/reportexport`, `application.ReportingService` (порт видимости — `TaskService.VisibleProjectIDs`); удалены `services/report_service.go`, `services/report_export.go`, `models/saved_report.go`. |
| 2026-04-18 | Удалён каталог **`internal/models`** (ORM-shells). `MemberRemovalService` использует `task.Repository`; `ProjectHandler.ListProjectTasks` подставляет `section` из агрегата `Project`; тестовый `testutil` сидирует через доменные репозитории. |
| 2026-04-18 | Удалён каталог **`internal/services`** (общие ошибки перенесены в `application/errors.go`). JWT вынесен из **`internal/utils`** в **`infrastructure/auth`** (package `auth`). |
| 2026-04-18 | Актуализирована таблица переезда: `models/user.go`, `services/auth_service.go`, `services/user_service.go` отмечены выполненными. |
| 2026-04-18 | `handlers/` перенесён в `interface/http/` (`package handler`); `httpserver/router.go` импортирует новый путь. |
| 2026-04-18 | DDD-миграция закрыта: из git-индекса удалены остатки `internal/models/`, `internal/services/`, `internal/utils/`; правило `10-backend-ddd.mdc` приведено к `infrastructure/persistence/`; `plans/directory-structure.md` помечен deprecated. |
| 2026-04-18 | **Frontend:** введены слои `frontend/src/domain`, `infrastructure`, `application`; документ [docs/architecture/frontend.md](./frontend.md); правило `.cursor/rules/14-frontend-ddd.mdc`. |
