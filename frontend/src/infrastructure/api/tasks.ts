import type { Subtask, Task, TaskPriority, TaskStatus } from '@domain/task/types'
import { api } from '@infra/http/client'

/**
 * HTTP-клиент для ресурса `/tasks` и вложенных подзадач.
 */
export const tasksApi = {
  /**
   * Список задач с опциональной фильтрацией.
   * @http GET /tasks
   */
  list: (params?: { project_id?: number; status?: TaskStatus }) =>
    api.get<{ tasks: Task[] }>('/tasks', { params }),

  /**
   * Одна задача по id.
   * @http GET /tasks/:id
   */
  get: (id: number) => api.get<{ task: Task }>(`/tasks/${id}`),

  /**
   * Создать задачу.
   * @http POST /tasks
   */
  create: (payload: {
    title: string
    description?: string
    project_id: number
    section_id?: number
    status?: TaskStatus
    priority?: TaskPriority
  }) => api.post<{ task: Task }>('/tasks', payload),

  /**
   * Обновить задачу (частичное тело по контракту бэкенда).
   * @http PUT /tasks/:id
   */
  update: (
    id: number,
    payload: Partial<{
      title: string
      description: string
      status: TaskStatus
      priority: TaskPriority
      project_id: number
      due_date: string
    }>,
  ) => api.put<{ task: Task }>(`/tasks/${id}`, payload),

  /**
   * Удалить задачу.
   * @http DELETE /tasks/:id
   */
  remove: (id: number) => api.delete(`/tasks/${id}`),

  /**
   * Назначить исполнителя.
   * @http POST /tasks/:id/assign
   */
  assign: (id: number, assignee_id: number) =>
    api.post<{ task: Task }>(`/tasks/${id}/assign`, { assignee_id }),

  /**
   * Отметить задачу выполненной.
   * @http POST /tasks/:id/complete
   */
  complete: (id: number) =>
    api.post<{ task: Task }>(`/tasks/${id}/complete`),

  /**
   * Подзадачи внутри задачи (`/tasks/:taskId/subtasks`).
   */
  subtasks: {
    /**
     * Создать подзадачу.
     * @http POST /tasks/:taskId/subtasks
     */
    create: (taskId: number, title: string) =>
      api.post<{ subtask: Subtask }>(`/tasks/${taskId}/subtasks`, { title }),

    /**
     * Задать порядок подзадач (полный список id).
     * @http POST /tasks/:taskId/subtasks/reorder
     */
    reorder: (taskId: number, subtaskIds: number[]) =>
      api.post<void>(`/tasks/${taskId}/subtasks/reorder`, {
        subtask_ids: subtaskIds,
      }),

    /**
     * Обновить подзадачу.
     * @http PUT /tasks/:taskId/subtasks/:subtaskId
     */
    update: (
      taskId: number,
      subtaskId: number,
      patch: Partial<{ title: string; done: boolean; position: number }>,
    ) =>
      api.put<{ subtask: Subtask }>(
        `/tasks/${taskId}/subtasks/${subtaskId}`,
        patch,
      ),

    /**
     * Переключить состояние «выполнено» подзадачи.
     * @http POST /tasks/:taskId/subtasks/:subtaskId/toggle
     */
    toggle: (taskId: number, subtaskId: number) =>
      api.post<{ subtask: Subtask }>(
        `/tasks/${taskId}/subtasks/${subtaskId}/toggle`,
      ),

    /**
     * Удалить подзадачу.
     * @http DELETE /tasks/:taskId/subtasks/:subtaskId
     */
    remove: (taskId: number, subtaskId: number) =>
      api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`),
  },
}
