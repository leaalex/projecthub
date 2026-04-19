import type { User } from '@domain/user/types'
import { api } from '@infra/http/client'

/**
 * HTTP-клиент для ресурса `/auth` (логин, регистрация, refresh, logout).
 *
 * Для `refresh` и `logout` передаётся заголовок `X-Skip-Refresh: 1`, чтобы не зациклить
 * перехватчик обновления токена.
 */
export const authApi = {
  /**
   * Вход по email и паролю.
   * @http POST /auth/login
   */
  login: (email: string, password: string) =>
    api.post<{ access_token: string; user: User }>('/auth/login', {
      email,
      password,
    }),

  /**
   * Регистрация нового пользователя.
   * @http POST /auth/register
   */
  register: (email: string, password: string, name: string) =>
    api.post<{ access_token: string; user: User }>('/auth/register', {
      email,
      password,
      name,
    }),

  /**
   * Обновить access token по refresh-cookie.
   * @http POST /auth/refresh
   */
  refresh: () =>
    api.post<{ access_token: string }>(
      '/auth/refresh',
      {},
      { headers: { 'X-Skip-Refresh': '1' } },
    ),

  /**
   * Выход (инвалидация сессии на сервере).
   * @http POST /auth/logout
   */
  logout: () =>
    api.post('/auth/logout', {}, { headers: { 'X-Skip-Refresh': '1' } }),
}

/**
 * HTTP-клиент для ресурса `/me` (текущий пользователь и смена пароля).
 */
export const meApi = {
  /**
   * Профиль текущего авторизованного пользователя.
   * @http GET /me
   */
  get: () => api.get<{ user: User }>('/me'),

  /**
   * Сменить пароль текущего пользователя.
   * @http POST /me/password
   */
  changePassword: (body: {
    current_password: string
    new_password: string
  }) => api.post('/me/password', body),
}
