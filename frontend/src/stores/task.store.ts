import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TaskMovePayload } from '../types/project'
import type { Subtask, Task, TaskPriority, TaskStatus } from '../types/task'
import { api } from '../utils/api'
import { useProjectStore } from './project.store'

function sortSubtasks(list: Subtask[]): Subtask[] {
  return [...list].sort(
    (a, b) => a.position - b.position || a.id - b.id,
  )
}

export const useTaskStore = defineStore('task', () => {
  const projectStore = useProjectStore()
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  function patchTaskSubtasks(taskId: number, next: Subtask[]) {
    const i = tasks.value.findIndex((t) => t.id === taskId)
    if (i < 0) return
    const t = tasks.value[i]
    tasks.value[i] = { ...t, subtasks: sortSubtasks(next) }
  }

  async function fetchList(params?: {
    project_id?: number
    status?: TaskStatus
  }) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<{ tasks: Task[] }>('/tasks', {
        params,
      })
      tasks.value = data.tasks
    } catch (e: unknown) {
      error.value = 'Failed to load tasks'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: number) {
    const { data } = await api.get<{ task: Task }>(`/tasks/${id}`)
    return data.task
  }

  async function create(payload: {
    title: string
    description?: string
    project_id: number
    section_id?: number
    status?: TaskStatus
    priority?: TaskPriority
  }) {
    const { data } = await api.post<{ task: Task }>('/tasks', payload)
    tasks.value.unshift(data.task)
    return data.task
  }

  async function update(
    id: number,
    payload: Partial<{
      title: string
      description: string
      status: TaskStatus
      priority: TaskPriority
      project_id: number
      /** ISO date YYYY-MM-DD; send empty string to clear */
      due_date: string
    }>,
  ) {
    const { data } = await api.put<{ task: Task }>(`/tasks/${id}`, payload)
    const i = tasks.value.findIndex((t) => t.id === id)
    if (i >= 0) tasks.value[i] = data.task
    projectStore.patchTask(data.task)
    return data.task
  }

  async function remove(id: number) {
    await api.delete(`/tasks/${id}`)
    tasks.value = tasks.value.filter((t) => t.id !== id)
    projectStore.removeTask(id)
  }

  async function assign(id: number, assignee_id: number) {
    const { data } = await api.post<{ task: Task }>(`/tasks/${id}/assign`, {
      assignee_id,
    })
    const i = tasks.value.findIndex((t) => t.id === id)
    if (i >= 0) tasks.value[i] = data.task
    projectStore.patchTask(data.task)
    return data.task
  }

  async function complete(id: number) {
    const { data } = await api.post<{ task: Task }>(`/tasks/${id}/complete`)
    const i = tasks.value.findIndex((t) => t.id === id)
    if (i >= 0) tasks.value[i] = data.task
    projectStore.patchTask(data.task)
    return data.task
  }

  async function moveTask(projectId: number, payload: TaskMovePayload) {
    const { data } = await api.post<{ task: Task }>(
      `/projects/${projectId}/tasks/move`,
      payload,
    )
    const i = tasks.value.findIndex((t) => t.id === data.task.id)
    if (i >= 0) {
      tasks.value.splice(i, 1, data.task)
    } else {
      tasks.value.unshift(data.task)
    }
    projectStore.patchTask(data.task)
    return data.task
  }

  async function createSubtask(taskId: number, title: string) {
    const { data } = await api.post<{ subtask: Subtask }>(
      `/tasks/${taskId}/subtasks`,
      { title },
    )
    const t = tasks.value.find((x) => x.id === taskId)
    const list = [...(t?.subtasks ?? []), data.subtask]
    patchTaskSubtasks(taskId, list)
    return data.subtask
  }

  async function toggleSubtask(taskId: number, subtaskId: number) {
    const { data } = await api.post<{ subtask: Subtask }>(
      `/tasks/${taskId}/subtasks/${subtaskId}/toggle`,
    )
    const t = tasks.value.find((x) => x.id === taskId)
    const list = (t?.subtasks ?? []).map((s) =>
      s.id === data.subtask.id ? data.subtask : s,
    )
    patchTaskSubtasks(taskId, list)
    return data.subtask
  }

  async function updateSubtask(
    taskId: number,
    subtaskId: number,
    patch: Partial<{ title: string; done: boolean; position: number }>,
  ) {
    const { data } = await api.put<{ subtask: Subtask }>(
      `/tasks/${taskId}/subtasks/${subtaskId}`,
      patch,
    )
    const t = tasks.value.find((x) => x.id === taskId)
    const list = (t?.subtasks ?? []).map((s) =>
      s.id === data.subtask.id ? data.subtask : s,
    )
    patchTaskSubtasks(taskId, list)
    return data.subtask
  }

  async function deleteSubtask(taskId: number, subtaskId: number) {
    await api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`)
    const t = tasks.value.find((x) => x.id === taskId)
    const list = (t?.subtasks ?? []).filter((s) => s.id !== subtaskId)
    patchTaskSubtasks(taskId, list)
  }

  return {
    tasks,
    loading,
    error,
    fetchList,
    fetchOne,
    create,
    update,
    remove,
    assign,
    complete,
    moveTask,
    createSubtask,
    toggleSubtask,
    updateSubtask,
    deleteSubtask,
  }
})
