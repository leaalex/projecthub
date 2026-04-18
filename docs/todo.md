# Открытые вопросы и доработки

## Безопасность аутентификации

1. **Ротация refresh-токенов** — сейчас refresh многоразовый до истечения TTL. Вариант усиления: single-use refresh, обнаружение повторного использования старого токена и инвалидация всех сессий пользователя.
2. **CSRF для cookie-based refresh** — при `SameSite=Lax` часть сценариев уже смягчена; обсудить переход на `Strict` и/или double-submit CSRF для `POST /auth/refresh` и `POST /auth/logout`.
3. **Rate-limit** — добавить лимиты на `POST /auth/login`, `/auth/register`, `/auth/refresh` (IP + при необходимости по email).

**Сделано:** при `ChangePassword` вызывается `session.Repository.RevokeAllByUser` — все refresh-сессии пользователя отзываются до истечения TTL.

## Прочее

- По мере переноса остальных агрегатов обновлять раздел «Таблица переезда сервисов» в `docs/architecture/aggregates.md`.
