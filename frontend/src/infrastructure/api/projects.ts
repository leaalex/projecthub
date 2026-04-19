import type {
  Project,
  ProjectMember,
  ProjectMemberRole,
  ProjectSection,
  RemoveMemberResult,
  TaskTransfer,
  TaskTransferMode,
} from '@domain/project/types'
import type { NoteTrashItem } from '@domain/note/types'
import type { Task } from '@domain/task/types'
import { api } from '@infra/http/client'

/**
 * HTTP-клиент для ресурса `/projects` и вложенных сущностей
 * (задачи проекта, секции, участники, смена владельца).
 */
export const projectsApi = {
  /**
   * Список проектов текущего пользователя.
   * @http GET /projects
   */
  list: () =>
    api.get<{ projects?: Project[] | null }>('/projects'),

  /**
   * Детали проекта и роль вызывающего в нём.
   * @http GET /projects/:id
   */
  get: (id: number) =>
    api.get<{
      project?: Project
      caller_project_role?: Project['caller_project_role']
    }>(`/projects/${id}`),

  /**
   * Создать проект.
   * @http POST /projects
   */
  create: (payload: {
    name: string
    description: string
    kind: Project['kind']
  }) =>
    api.post<{
      project?: Project
      caller_project_role?: Project['caller_project_role']
    }>('/projects', payload),

  /**
   * Обновить метаданные проекта.
   * @http PUT /projects/:id
   */
  update: (id: number, payload: { name: string; description: string }) =>
    api.put<{ project: Project }>(`/projects/${id}`, payload),

  /**
   * Удалить проект.
   * @http DELETE /projects/:id
   */
  remove: (id: number) => api.delete(`/projects/${id}`),

  /**
   * Задачи в контексте проекта (`/projects/:id/tasks`).
   */
  tasks: {
    /**
     * Список задач проекта.
     * @http GET /projects/:projectId/tasks
     */
    list: (projectId: number) =>
      api.get<{ tasks?: Task[] | null }>(`/projects/${projectId}/tasks`),

    /**
     * Переместить задачу между секциями / позициями внутри проекта.
     *
     * @param projectId — id проекта
     * @param payload — `task_id`, опционально `section_id`, `position`
     * @http POST /projects/:projectId/tasks/move
     */
    move: (
      projectId: number,
      payload: {
        task_id: number
        section_id?: number | null
        position?: number
      },
    ) =>
      api.post<{ task: Task }>(
        `/projects/${projectId}/tasks/move`,
        payload,
      ),
  },

  /**
   * Общие секции проекта (`/projects/:id/sections`).
   */
  sections: {
    /**
     * Список секций проекта.
     * @http GET /projects/:projectId/sections
     */
    list: (projectId: number) =>
      api.get<{ sections?: ProjectSection[] | null }>(
        `/projects/${projectId}/sections`,
      ),

    /**
     * Создать секцию.
     * @http POST /projects/:projectId/sections
     */
    create: (projectId: number, name: string) =>
      api.post<{ section: ProjectSection }>(
        `/projects/${projectId}/sections`,
        { name },
      ),

    /**
     * Переименовать секцию.
     * @http PUT /projects/:projectId/sections/:sectionId
     */
    update: (projectId: number, sectionId: number, name: string) =>
      api.put<{ section: ProjectSection }>(
        `/projects/${projectId}/sections/${sectionId}`,
        { name },
      ),

    /**
     * Удалить секцию.
     * @http DELETE /projects/:projectId/sections/:sectionId
     */
    remove: (projectId: number, sectionId: number) =>
      api.delete(`/projects/${projectId}/sections/${sectionId}`),

    /**
     * Задать порядок секций.
     * @http POST /projects/:projectId/sections/reorder
     */
    reorder: (projectId: number, section_ids: number[]) =>
      api.post(`/projects/${projectId}/sections/reorder`, {
        section_ids,
      }),

    /**
     * Порядок задач и заметок внутри секции (sectionId `0` — без секции).
     * @http POST /projects/:projectId/sections/:sectionId/items/reorder
     */
    reorderItems: (
      projectId: number,
      sectionId: number,
      items: { kind: 'task' | 'note'; id: number }[],
    ) =>
      api.post(`/projects/${projectId}/sections/${sectionId}/items/reorder`, {
        items,
      }),
  },

  /**
   * Участники проекта (`/projects/:id/members`).
   */
  members: {
    /**
     * Список участников.
     * @http GET /projects/:projectId/members
     */
    list: (projectId: number) =>
      api.get<{ members?: ProjectMember[] | null }>(
        `/projects/${projectId}/members`,
      ),

    /**
     * Добавить участника по user_id или email.
     * @http POST /projects/:projectId/members
     */
    add: (
      projectId: number,
      payload: { user_id?: number; email?: string; role: ProjectMemberRole },
    ) =>
      api.post<{ member: ProjectMember }>(
        `/projects/${projectId}/members`,
        payload,
      ),

    /**
     * Изменить роль участника в проекте.
     * @http PUT /projects/:projectId/members/:userId
     */
    setRole: (
      projectId: number,
      userId: number,
      role: ProjectMemberRole,
    ) =>
      api.put<{ member: ProjectMember }>(
        `/projects/${projectId}/members/${userId}`,
        { role },
      ),

    /**
     * Удалить участника; тело запроса задаёт режим переноса задач.
     * @http DELETE /projects/:projectId/members/:userId
     */
    remove: (
      projectId: number,
      userId: number,
      data: { transfer_mode: TaskTransferMode; transfer_to_user_id?: number },
    ) =>
      api.delete<RemoveMemberResult>(
        `/projects/${projectId}/members/${userId}`,
        { data },
      ),

    /**
     * Явный перенос задач между участниками перед/после исключения.
     *
     * @param transfers — список переносов по задачам
     * @http POST /projects/:projectId/members/:userId/transfer-tasks
     */
    transferTasks: (
      projectId: number,
      userId: number,
      transfers: TaskTransfer[],
    ) =>
      api.post<RemoveMemberResult>(
        `/projects/${projectId}/members/${userId}/transfer-tasks`,
        { transfers },
      ),
  },

  /**
   * Корзина проекта: удалённые задачи и заметки.
   */
  trash: {
    /**
     * @http GET /projects/:projectId/trash/tasks
     */
    tasks: (projectId: number) =>
      api.get<{ tasks?: Task[] | null }>(
        `/projects/${projectId}/trash/tasks`,
      ),

    /**
     * @http GET /projects/:projectId/trash/notes
     */
    notes: (projectId: number) =>
      api.get<{ notes?: NoteTrashItem[] | null }>(
        `/projects/${projectId}/trash/notes`,
      ),

    /**
     * @http POST /projects/:projectId/trash/tasks/:taskId/restore
     */
    restoreTask: (projectId: number, taskId: number) =>
      api.post(
        `/projects/${projectId}/trash/tasks/${taskId}/restore`,
      ),

    /**
     * @http POST /projects/:projectId/notes/:noteId/restore
     */
    restoreNote: (projectId: number, noteId: number) =>
      api.post(`/projects/${projectId}/notes/${noteId}/restore`),

    /**
     * @http DELETE /tasks/:taskId?permanent=true
     */
    permanentDeleteTask: (taskId: number) =>
      api.delete(`/tasks/${taskId}`, { params: { permanent: true } }),

    /**
     * @http DELETE /projects/:projectId/notes/:noteId?permanent=true
     */
    permanentDeleteNote: (projectId: number, noteId: number) =>
      api.delete(`/projects/${projectId}/notes/${noteId}`, {
        params: { permanent: true },
      }),
  },

  /**
   * Смена владельца проекта.
   */
  owner: {
    /**
     * Передать владение другому пользователю.
     * @http PATCH /projects/:projectId/owner
     */
    transfer: (projectId: number, new_owner_id: number) =>
      api.patch(`/projects/${projectId}/owner`, { new_owner_id }),
  },
}
