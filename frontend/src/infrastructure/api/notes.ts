import type { Note, CreateNotePayload, UpdateNotePayload } from '@domain/note/types'
import { api } from '@infra/http/client'

/**
 * HTTP-клиент для ресурса `/projects/:projectId/notes` и связанных заметок задач.
 */
export const notesApi = {
  /**
   * Список живых заметок по всем видимым проектам.
   * @http GET /notes
   */
  listAll: (params?: { project_id?: number }) =>
    api.get<{ notes: Note[] }>('/notes', { params }),

  /**
   * Список живых заметок проекта.
   * @http GET /projects/:projectId/notes
   */
  list: (projectId: number) =>
    api.get<{ notes: Note[] }>(`/projects/${projectId}/notes`),

  /**
   * Детали заметки (включает linked_task_ids).
   * @http GET /projects/:projectId/notes/:noteId
   */
  get: (projectId: number, noteId: number) =>
    api.get<{ note: Note }>(`/projects/${projectId}/notes/${noteId}`),

  /**
   * Создать заметку в проекте.
   * @http POST /projects/:projectId/notes
   */
  create: (projectId: number, payload: CreateNotePayload) =>
    api.post<{ note: Note }>(`/projects/${projectId}/notes`, payload),

  /**
   * Обновить заметку (title и/или body).
   * @http PUT /projects/:projectId/notes/:noteId
   */
  update: (projectId: number, noteId: number, payload: UpdateNotePayload) =>
    api.put<{ note: Note }>(`/projects/${projectId}/notes/${noteId}`, payload),

  /**
   * Мягко удалить заметку (отправить в корзину).
   * @http DELETE /projects/:projectId/notes/:noteId
   */
  remove: (projectId: number, noteId: number) =>
    api.delete(`/projects/${projectId}/notes/${noteId}`),

  /**
   * Восстановить заметку из корзины.
   * @http POST /projects/:projectId/notes/:noteId/restore
   */
  restore: (projectId: number, noteId: number) =>
    api.post(`/projects/${projectId}/notes/${noteId}/restore`),

  /**
   * Полностью удалить заметку без возможности восстановления.
   * @http DELETE /projects/:projectId/notes/:noteId?permanent=true
   */
  permanentDelete: (projectId: number, noteId: number) =>
    api.delete(`/projects/${projectId}/notes/${noteId}?permanent=true`),

  /**
   * Управление связями заметки с задачами.
   */
  links: {
    /**
     * Список id задач, связанных с заметкой.
     * @http GET /projects/:projectId/notes/:noteId (возвращается в поле linked_task_ids)
     */
    list: (projectId: number, noteId: number) =>
      notesApi.get(projectId, noteId).then(r => r.data.note.linked_task_ids ?? []),

    /**
     * Добавить связь заметки с задачей.
     * @http POST /projects/:projectId/notes/:noteId/links
     */
    add: (projectId: number, noteId: number, taskId: number) =>
      api.post(`/projects/${projectId}/notes/${noteId}/links`, { task_id: taskId }),

    /**
     * Удалить связь заметки с задачей.
     * @http DELETE /projects/:projectId/notes/:noteId/links/:taskId
     */
    remove: (projectId: number, noteId: number, taskId: number) =>
      api.delete(`/projects/${projectId}/notes/${noteId}/links/${taskId}`),
  },

  /**
   * Список заметок, связанных с задачей (для отображения на карточке / в детальном виде).
   * @http GET /tasks/:taskId/notes
   */
  linkedByTask: (taskId: number) =>
    api.get<{ notes: Note[] }>(`/tasks/${taskId}/notes`),
}
