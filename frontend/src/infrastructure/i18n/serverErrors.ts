/**
 * Маппинг текстовых сообщений об ошибках с бэкенда на i18n-ключи.
 *
 * Бэкенд возвращает в теле ответа `{ error: "<plain english>" }` (см.
 * `backend/internal/interface/http/context.go`). Чтобы не показывать
 * пользователю сырой английский текст, сопоставляем известные сообщения
 * с ключами раздела `serverErrors.*` в локалях.
 *
 * Ключи словаря должны дословно совпадать со строками `errors.New(...)`
 * в доменных пакетах бэкенда.
 */
const SERVER_ERROR_KEY_BY_MESSAGE: Record<string, string> = {
  'user is already a project member': 'serverErrors.alreadyMember',
}

/**
 * Преобразует серверный текст ошибки в локализованный.
 *
 * Если сообщение неизвестно — возвращает исходную строку, чтобы
 * не скрывать диагностическую информацию от пользователя/разработчика.
 *
 * @param message Текст из `response.data.error`.
 * @param t Функция перевода из `useI18n()`.
 */
export function translateServerError(
  message: string,
  t: (key: string) => string,
): string {
  const key = SERVER_ERROR_KEY_BY_MESSAGE[message.trim().toLowerCase()]
  return key ? t(key) : message
}
