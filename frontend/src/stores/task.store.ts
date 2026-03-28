import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Task, TaskPriority, TaskStatus } from '../types/task'
import { api } from '../utils/api'

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

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

  async function create(payload: {
    title: string
    description?: string
    project_id: number
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
    }>,
  ) {
    const { data } = await api.put<{ task: Task }>(`/tasks/${id}`, payload)
    const i = tasks.value.findIndex((t) => t.id === id)
    if (i >= 0) tasks.value[i] = data.task
    return data.task
  }

  async function remove(id: number) {
    await api.delete(`/tasks/${id}`)
    tasks.value = tasks.value.filter((t) => t.id !== id)
  }

  async function assign(id: number, assignee_id: number) {
    const { data } = await api.post<{ task: Task }>(`/tasks/${id}/assign`, {
      assignee_id,
    })
    const i = tasks.value.findIndex((t) => t.id === id)
    if (i >= 0) tasks.value[i] = data.task
    return data.task
  }

  async function complete(id: number) {
    const { data } = await api.post<{ task: Task }>(`/tasks/${id}/complete`)
    const i = tasks.value.findIndex((t) => t.id === id)
    if (i >= 0) tasks.value[i] = data.task
    return data.task
  }

  return {
    tasks,
    loading,
    error,
    fetchList,
    create,
    update,
    remove,
    assign,
    complete,
  }
})
