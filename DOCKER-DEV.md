# Развёртывание dev-сборки в Docker

Инструкция для стека из [`docker-compose.dev.yml`](docker-compose.dev.yml): hot reload бэкенда (Go + [Air](https://github.com/air-verse/air)) и фронтенда (Vite). Обычный [`docker-compose.yml`](docker-compose.yml) в репозитории подключает только production-конфигурацию; для разработки файл dev нужно указывать явно.

## Требования

- **Docker Engine** и **Docker Compose v2.20+** (нужна актуальная спецификация Compose).

## Подготовка

1. В **корне репозитория** скопируйте пример окружения:

   ```bash
   cp .env.example .env
   ```

2. Отредактируйте `.env` по необходимости:

   - **`JWT_SECRET`** — задайте свой секрет (не оставляйте значение по умолчанию в общих средах).
   - **`ADMIN_EMAIL`**, **`ADMIN_PASSWORD`**, **`ADMIN_NAME`** — учётка администратора создаётся при первом запуске бэкенда, если пользователя с таким email ещё нет. Вход: `/login`.

   Файл `.env` подхватывается сервисом `backend` через `env_file` (если файла нет, бэкенд всё равно стартует, но секреты и админ лучше задать явно).

3. Опционально: **`FRONTEND_PORT`** — порт на хосте для Vite (по умолчанию `5173`). В compose для бэкенда выставляется `CORS_ORIGIN` под этот порт.

## Запуск

Из корня репозитория:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Или через Makefile:

```bash
make docker-up-dev
```

По умолчанию контейнеры работают в foreground (логи в терминале). Запуск в фоне:

```bash
docker compose -f docker-compose.dev.yml up --build -d
```

## Адреса

| Что | URL |
|-----|-----|
| UI (Vite) | `http://localhost:5173` или `http://localhost:${FRONTEND_PORT}` |
| API бэкенда | `http://localhost:8080` |
| Проверка здоровья | `http://localhost:8080/api/health` |

Фронтенд в контейнере проксирует API на сервис `backend` (`VITE_API_PROXY_TARGET` задан в compose).

## Как устроен стек

- Каталоги **`./backend`** и **`./frontend`** смонтированы в контейнеры — изменения кода подхватываются без пересборки образа.
- Зависимости Node лежат в именованном томе **`frontend_node_modules`**, чтобы bind-mount с хоста не подменял `node_modules` (иначе на macOS/Windows бинарники могут не совпадать с Linux в контейнере).
- Сервис `frontend` стартует после того, как `backend` проходит healthcheck.

## Остановка

```bash
docker compose -f docker-compose.dev.yml down
```

или `make docker-down-dev`.

Логи (если запускали в фоне):

```bash
docker compose -f docker-compose.dev.yml logs -f
```

или `make docker-logs-dev`.

## Частые ситуации

- **Сменился `package-lock.json`:** при старте контейнера `frontend` entrypoint сам выполнит `npm ci`, если lockfile изменился или `node_modules` пустой.
- **Принудительная переустановка зависимостей:**

  ```bash
  docker compose -f docker-compose.dev.yml run --rm frontend npm ci
  ```

- **Странные ошибки npm / несовместимые модули:** удалите том с `node_modules` и поднимите стек снова:

  ```bash
  docker compose -f docker-compose.dev.yml down -v
  docker compose -f docker-compose.dev.yml up --build
  ```

  Флаг `-v` удалит именованные тома, включая `frontend_node_modules` и `backend_storage_dev` (**данные SQLite в dev-томе тоже пропадут**).
