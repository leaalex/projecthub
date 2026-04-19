import type { User, UserRole } from '@domain/user/types'
import { api } from '@infra/http/client'

/**
 * HTTP-клиент для ресурса `/users` (админские операции над пользователями).
 *
 * Все методы возвращают `AxiosResponse`.
 */
export const usersApi = {
  /**
   * Список пользователей.
   * @http GET /users
   */
  list: () =>
    api.get<{ users?: User[] | null } | { users: User[] }>('/users'),

  /**
   * Создать пользователя.
   * @http POST /users
   */
  create: (body: Record<string, unknown>) =>
    api.post<{ user: User }>('/users', body),

  /**
   * Полное обновление профиля пользователя.
   * @http PUT /users/:id
   */
  update: (userId: number, patch: Record<string, unknown>) =>
    api.put<{ user: User }>(`/users/${userId}`, patch),

  /**
   * Сменить глобальную роль пользователя.
   * @http PATCH /users/:id/role
   */
  setRole: (userId: number, role: UserRole) =>
    api.patch<{ user: User }>(`/users/${userId}/role`, { role }),

  /**
   * Удалить пользователя.
   * @http DELETE /users/:id
   */
  remove: (userId: number) => api.delete(`/users/${userId}`),
}
