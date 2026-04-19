/**
 * Единый HTTP-клиент приложения (Axios).
 *
 * Ответственности:
 * 1. Базовая конфигурация Axios (`baseURL`, `withCredentials`, `Content-Type`).
 * 2. Request-интерцептор: подставляет `Authorization: Bearer <token>` из `localStorage`.
 * 3. Response-интерцептор: при `401` пытается обновить access-token и повторяет оригинальный запрос.
 * 4. Паттерн single-inflight для refresh: параллельные 401 не порождают несколько POST `/auth/refresh`.
 *
 * Все API-срезы в `@infra/api/*` импортируют именно `api` отсюда — это единственная точка
 * конфигурации сетевого слоя.
 */
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { AUTH_TOKEN_KEY } from '@/constants'

/**
 * Сконфигурированный Axios-инстанс приложения.
 *
 * - `baseURL: '/api'` — все пути в API-срезах относительны, префикс добавляется автоматически
 *   (в dev — проксируется Vite на backend, в prod — раздаётся тем же origin).
 * - `withCredentials: true` — отправка cookie для refresh-токена (httpOnly cookie на backend).
 * - `Content-Type: application/json` — default для тела запроса; для blob-скачиваний
 *   `responseType: 'blob'` задаётся точечно в вызывающей функции.
 */
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Request-интерцептор: подставляет `Authorization: Bearer <token>` из `localStorage`.
 * Если токена нет — заголовок не добавляется (запрос уходит анонимным;
 * backend ответит 401, дальше сработает refresh-логика ниже).
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Текущий in-flight промис обновления токена.
 *
 * Используется для паттерна single-inflight: если несколько запросов одновременно получили 401,
 * они должны дожидаться одного общего POST `/auth/refresh`, а не выполнять его по несколько раз.
 * После завершения (успех или ошибка) сбрасывается в `null` — следующий 401 начнёт новый цикл.
 */
let refreshInflight: Promise<string | null> | null = null

/**
 * Запрашивает новый access-token у backend и сохраняет его в `localStorage`.
 *
 * - Single-inflight: повторные вызовы во время активного refresh возвращают тот же промис.
 * - Заголовок `X-Skip-Refresh: 1` выключает обработку 401 этим же интерцептором
 *   (иначе на провалившемся refresh получили бы бесконечный цикл).
 * - При ошибке токен очищается из `localStorage` и возвращается `null` — вызывающий код
 *   должен отклонить исходный запрос (и UI обычно редиректит на `/login`).
 *
 * @returns Новый access-token или `null`, если refresh не удался.
 */
async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInflight) {
    refreshInflight = (async () => {
      try {
        const { data } = await api.post<{ access_token: string }>(
          '/auth/refresh',
          {},
          { headers: { 'X-Skip-Refresh': '1' } },
        )
        const t = data.access_token
        localStorage.setItem(AUTH_TOKEN_KEY, t)
        return t
      } catch {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        return null
      } finally {
        refreshInflight = null
      }
    })()
  }
  return refreshInflight
}

/**
 * Признак «это запрос в сам эндпоинт аутентификации» — такие запросы не нужно
 * повторять через refresh: их 401 означает именно неверные credentials / отсутствие
 * сессии, а не истёкший access-token.
 */
function isAuthPath(url: string | undefined) {
  if (!url) return false
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/logout')
  )
}

/**
 * Response-интерцептор: прозрачно обновляет access-token при 401 и повторяет оригинальный запрос.
 *
 * Логика:
 * 1. Если `config` отсутствует — reject (нестандартный случай, нечего повторять).
 * 2. Если в запросе явно проставлен `X-Skip-Refresh` — reject (используется самим refresh/logout).
 * 3. Если это auth-эндпоинт (login/register/refresh/logout) — reject (их 401 — это бизнес-ошибка).
 * 4. Если статус 401 и запрос ещё не повторялся (`_retry`):
 *    - ставим `_retry = true` (защита от цикла),
 *    - запускаем `refreshAccessToken()` (single-inflight),
 *    - при успехе — подставляем новый токен в заголовок и повторяем оригинальный запрос,
 *    - при неуспехе — reject.
 * 5. Иначе — пробрасываем ошибку дальше.
 */
api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const cfg = err.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }
    if (!cfg) return Promise.reject(err)
    if (cfg.headers?.['X-Skip-Refresh']) return Promise.reject(err)
    if (isAuthPath(cfg.url)) return Promise.reject(err)

    const status = err.response?.status
    if (status === 401 && !cfg._retry) {
      cfg._retry = true
      const newToken = await refreshAccessToken()
      if (!newToken) return Promise.reject(err)
      cfg.headers.Authorization = `Bearer ${newToken}`
      return api(cfg)
    }
    return Promise.reject(err)
  },
)
