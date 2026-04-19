# Frontend — документация клиентского приложения

Этот раздел содержит подробное описание структуры, архитектуры и устройства Vue 3-приложения **projecthub**.

## Содержание

| Документ | О чём |
|----------|-------|
| [overview.md](overview.md) | Технологический стек, bootstrap-последовательность, дерево папок, path-алиасы, npm-скрипты |
| [architecture.md](architecture.md) | DDD-слои, правила импортов между слоями, диаграмма потока зависимостей |
| [domain.md](domain.md) | Доменный слой: типы, чистые функции и бизнес-правила по агрегатам |
| [infrastructure.md](infrastructure.md) | HTTP-клиент, API-срезы (таблицы эндпоинтов), i18n, formatters, routing |
| [application.md](application.md) | Pinia-сторы и composables: состояние, действия, внешние зависимости |
| [ui.md](ui.md) | Views (маршруты → сторы → компоненты) и каталог компонентов (UI kit vs feature) |
| [flows.md](flows.md) | Ключевые сценарии: auth/token refresh, перемещение задачи, скачивание отчёта |

## Связанные документы

- [docs/architecture/frontend.md](../architecture/frontend.md) — источник истины по DDD-слоям (rule-source для `.cursor/rules/14-frontend-ddd.mdc`)
- [docs/architecture/aggregates.md](../architecture/aggregates.md) — агрегаты и их соответствие backend/frontend
