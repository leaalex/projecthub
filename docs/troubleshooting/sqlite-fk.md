# SQLite: FOREIGN KEY constraint failed (диагностика)

Сообщение SQLite `FOREIGN KEY constraint failed` **не содержит** имя таблицы или колонки — это ограничение движка. Чтобы найти причину, используйте локальный файл БД (см. `DATABASE_PATH` в `.env`, по умолчанию `./storage/app.db`).

## Быстрая проверка целостности

```sql
PRAGMA foreign_keys = ON;
PRAGMA foreign_key_check;
```

Ненулевой результат — строки, нарушающие FK (таблица, rowid).

## Какие внешние ключи объявлены

```sql
PRAGMA foreign_key_list(tasks);
PRAGMA foreign_key_list(subtasks);
```

## Типичные «сироты» для задач

Подзадачи хранятся в `subtasks` с полем `task_id`. При сохранении родительская строка `tasks` тоже перезаписывается; если в `tasks` остались ссылки на удалённые сущности, сработает FK.

```sql
-- Секция удалена, а task.section_id всё ещё указывает на неё
SELECT t.id, t.project_id, t.section_id, t.assignee_id
FROM tasks t
WHERE t.section_id IS NOT NULL
  AND t.section_id NOT IN (SELECT id FROM project_sections);

-- Исполнитель не существует
SELECT t.id, t.assignee_id
FROM tasks t
WHERE t.assignee_id IS NOT NULL
  AND t.assignee_id NOT IN (SELECT id FROM users);

-- Проект
SELECT t.id, t.project_id
FROM tasks t
WHERE t.project_id NOT IN (SELECT id FROM projects);
```

После правки данных повторите операцию с подзадачей.

## API при ошибке ограничения

Бэкенд может ответить `409 Conflict` с телом `{"error":"foreign_key_violation"}` (и опционально `detail` в не-release режиме). Клиент показывает локализованное сообщение вместо сырого текста SQLite.
