# UI-слой: views и компоненты

---

## Views

Все view-компоненты находятся в [`frontend/src/views/`](../../frontend/src/views/). Все маршруты используют lazy-import (`() => import(...)`).

| Маршрут | View | Сторы / composables | Ключевые дочерние компоненты |
|---------|------|----------------------|------------------------------|
| `/login` | `Login.vue` | `auth.store` | `LoginForm` |
| `/register` | `Register.vue` | `auth.store` | `RegisterForm` |
| `/forgot-password` | `ForgotPassword.vue` | — | *(только ссылка на логин)* |
| `/dashboard` | `Dashboard.vue` | `project.store`, `report.store` | `ActivityFeed`, `StatsCard`, `UiBreadcrumb`, `UiCard`, `UiSkeleton` |
| `/projects` | `Projects.vue` | `auth.store`, `project.store`, `useConfirm` | `ProjectList`, `ProjectForm`, `UiModal`, `UiEmptyState` |
| `/projects/:id` | `ProjectDetail.vue` | + `note.store`, `trashTasks.store`, `trashNotes.store` | Вкладки **Tasks / Notes / Trash** (`UiSegmentedControl`); заметки: `NoteSectionList`, `NoteList`, `NoteDetailModal`, `ProjectTrashPanel`; задачи — как раньше |
| `/projects/:id/settings` | `ProjectSettings.vue` | `auth.store`, `project.store` | `ProjectMembers`, `AddMemberModal`, `TransferOwnershipModal` |
| `/tasks` | `Tasks.vue` | `task.store`, `note.store`, `project.store` | `TaskFiltersPanel`, `ProjectItemList` (группировка по секциям + DnD при фильтре проекта, затем `reorderSectionItems`), `TaskList` (без секций / другие группировки), `TaskDetailModal`, `NoteDetailModal` |
| `/notes` | `Notes.vue` | `note.store` (`fetchAll`), `project.store`, `task.store`, `useNoteListPresentation` | `NoteFiltersPanel`, `NoteCard`, `NoteDetailModal`, создание через `NoteForm` с выбором проекта |
| `/reports` | `Reports.vue` | `report.store`, `useConfirm`, `useToast` | `ReportSettings`, `ReportViewer`, `UiCard`, `UiModal`, `UiTable` |
| `/profile` | `Profile.vue` | `auth.store`, `ui.store`, `useToast` | `UiBreadcrumb`, `UiButton`, `UiCard`, `UiInput`, `UiSegmentedControl` |
| `/admin/users` | `Admin/Users.vue` | `auth.store`, `user.store`, `useConfirm`, `useToast` | `AdminUserModal`, `UiAvatar`, `UiMenuButton`, `UiEmptyState` |
| `/ui-kit` | `UiShowcase.vue` | `useConfirm`, `useToast` | Все `Ui*`-компоненты (демо-галерея) |

### Конвенции views

- **Layout:** `route.meta.layout === 'auth'` → auth-layout (нет sidebar); иначе — app-layout с `AppSidebar`.
- **Page transition:** `<Transition name="page" mode="out-in">` в `App.vue`; вход снизу (8px), уход вверх (−4px).
- **Защита роутов:** guards в [`router/index.ts`](../../frontend/src/router/index.ts) — подробнее в [infrastructure.md](infrastructure.md#routing).

---

## Компоненты

Все компоненты в [`frontend/src/components/`](../../frontend/src/components/). Именование: `UiXxx` — UI kit (презентационные примитивы без бизнес-логики); остальные — feature-компоненты.

### `components/ui/` — UI kit

Презентационные примитивы без прямых вызовов API и без зависимостей на domain-сторы.

| Компонент | Назначение |
|-----------|-----------|
| `UiAvatar.vue` | Аватар пользователя или инициалы |
| `UiBadge.vue` | Небольшой цветной значок/лейбл |
| `UiBreadcrumb.vue` | Хлебные крошки с router-link |
| `UiButton.vue` | Кнопка: варианты `primary`, `secondary`, `ghost-danger`, `ghost`; состояние `loading` |
| `UiCard.vue` | Поверхность-контейнер с бордером и отступами |
| `UiCheckboxRow.vue` | Чекбокс-строка для мульти-выбора |
| `UiCommandPalette.vue` | Оверлей быстрой навигации; управляется `ui.store` |
| `UiConfirmDialog.vue` | Диалог подтверждения; управляется `confirm.store` |
| `UiDateMenuButton.vue` | Кнопка-триггер для выбора даты |
| `UiEmptyState.vue` | Заглушка пустого состояния (заголовок, описание, слот для CTA) |
| `UiFilterChip.vue` | Снимаемый фильтр-чип |
| `UiFormSection.vue` | Секция формы с заголовком и слотом `#actions` |
| `UiInput.vue` | Текстовое поле с label и сообщением об ошибке |
| `UiMenuButton.vue` | Кнопка, открывающая выпадающий список действий |
| `UiModal.vue` | Модальное окно: заголовок, `v-model` open, `wide`-вариант |
| `UiScrollPanel.vue` | Скролируемая панель-обёртка |
| `UiSegmentedControl.vue` | Сегментированный переключатель |
| `UiSelect.vue` | Выпадающий список / multi-select |
| `UiSkeleton.vue` | Плейсхолдер загрузки: варианты `line`, `card`, `avatar` |
| `UiTable.vue` | Таблица со слотом заголовка |
| `UiTextAction.vue` | Текстовая ссылка-кнопка |
| `UiTextarea.vue` | Многострочное поле ввода |
| `UiToast.vue` | Тост-уведомление; управляется `toast.store` |

### `components/admin/` — Администрирование

| Компонент | Назначение |
|-----------|-----------|
| `AdminUserModal.vue` | Модальное окно создания / редактирования / просмотра пользователя. Использует `user.store` и `extractUserAxiosError`. |

### `components/auth/` — Аутентификация

| Компонент | Назначение |
|-----------|-----------|
| `LoginForm.vue` | Форма входа (email + пароль); сабмит через `auth.store.login` |
| `RegisterForm.vue` | Форма регистрации; сабмит через `auth.store.register` |

### `components/dashboard/` — Дашборд

| Компонент | Назначение |
|-----------|-----------|
| `ActivityFeed.vue` | Список активности (label + дата/строка) |
| `StatsCard.vue` | Карточка метрики (заголовок, значение, подсказка) |

### `components/layout/` — Разметка

| Компонент | Назначение |
|-----------|-----------|
| `AppSidebar.vue` | Sidebar + мобильный drawer; закрывается при смене маршрута |
| `SidebarNav.vue` | Навигационные ссылки; коллапс по `ui.store.sidebarCollapsed` |

### `components/projects/` — Проекты

| Компонент | Назначение |
|-----------|-----------|
| `AddMemberModal.vue` | Добавить участника проекта (по email или пикер из `user.store`) |
| `ManualTaskTransfer.vue` | UI для ручного переноса задач при удалении участника (per-task выбор) |
| `ProjectCard.vue` | Карточка проекта в списке |
| `ProjectForm.vue` | Форма создания / редактирования проекта |
| `ProjectList.vue` | Сетка карточек проектов |
| `ProjectMembers.vue` | Таблица участников с действиями (удалить, перенести задачи) |
| `TaskTransferModal.vue` | Выбор режима переноса задач при удалении участника |
| `TransferOwnershipModal.vue` | Передача владения проектом |

### `components/reports/` — Отчёты

| Компонент | Назначение |
|-----------|-----------|
| `ReportSettings.vue` | Форма конфигурации нового отчёта; использует `user.store` для фильтра по пользователям |
| `ReportViewer.vue` | Отображение недельного отчёта (текст + хост для графика) |
| `Charts/WeeklyChart.vue` | График недельных метрик (chart.js) |

### `components/notes/` — Заметки

| Компонент | Назначение |
|-----------|-----------|
| `NoteMarkdownEditor.vue` | WYSIWYG-редактор тела заметки (Tiptap + `tiptap-markdown`, сериализация в MD); тулбар с `aria-label`/`title` и строками `notes.editor.toolbar.*` (i18n) |
| `NoteMarkdownView.vue` | Только чтение того же содержимого в стиле редактора |
| `markdown.css` | Базовые стили ProseMirror для редактора/превью |
| `NoteForm.vue` | Заголовок, секция, тело (markdown) |
| `NoteCard.vue` | Карточка в списке: превью, дата, меню |
| `Notes.vue` (страница) | При группировке по секциям — `ProjectItemList` + DnD, `projectStore.reorderSectionItems` (смешанный порядок с задачами) |
| `NoteFiltersPanel.vue` | Панель фильтров глобальной страницы `/notes`: проект, сортировка, группировка (секция — только при фильтре по одному проекту) |
| `NoteSectionList.vue` | CRUD и порядок секций заметок |
| `NoteInlineComposer.vue` | Быстрое создание в шапке секции |
| `NoteDetailModal.vue` | Просмотр/редактирование, связанные задачи, `NoteLinkedTasksPicker` |
| `NoteLinkedTasksPicker.vue` | Поиск задач проекта и кнопка «Связать» |
| `ProjectTrashPanel.vue` | Удалённые задачи и заметки проекта (restore / delete forever) |

### `components/tasks/` — Задачи

| Компонент | Назначение |
|-----------|-----------|
| `TaskCard.vue` | Компактная карточка задачи; при наличии `linked_notes` — строка со ссылкой на заметку (`openNote`) |
| `TaskDetailModal.vue` | Полный редактор задачи; блок «Связанные заметки», линк через `note.store` |
| `TaskFiltersPanel.vue` | Панель фильтров (поиск, статус, приоритет, исполнитель, сортировка, группировка) |
| `TaskForm.vue` | Поля создания / редактирования задачи |
| `TaskInlineComposer.vue` | Инлайн-композер для быстрого создания задачи прямо в списке |
| `TaskList.vue` | Плоский список задач через `TaskCard` |
| `TaskSectionList.vue` | Список задач, сгруппированный по секциям |
| `TaskSubtasksPanel.vue` | Панель подзадач внутри детального просмотра |

---

## Конвенции UI-слоя

- **Иконки:** `@heroicons/vue/24/outline` (stroke-иконки). Использовать компоненты как `<TrashIcon class="h-4 w-4" />`.
- **Глобальные синглтоны в `App.vue`:** `<Toast />`, `<ConfirmDialog />`, `<CommandPalette />` монтируются один раз в корне приложения вне `<router-view>`.
- **Toast:** вызывается через `useToast()` из `@app/composables/useToast`; не обращаться к `toast.store` напрямую из views.
- **Confirm:** вызывается через `useConfirm()` из `@app/composables/useConfirm`; возвращает `Promise<boolean>`.
- **Transition:** page-переходы через CSS-классы `.page-enter-*` / `.page-leave-*` в `App.vue`.
- **Заметки:** источник правды для текста — **Markdown** на сервере; в браузере Tiptap с `tiptap-markdown` (`getMarkdown()` при сохранении).
