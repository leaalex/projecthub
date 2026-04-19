import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Task } from '@domain/task/types'
import { projectsApi } from '@infra/api/projects'

/** Удалённые задачи проекта (корзина). */
export const useTrashTasksStore = defineStore('trashTasks', () => {
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const error = ref<unknown | null>(null)

  async function fetchTasks(projectId: number): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const { data } = await projectsApi.trash.tasks(projectId)
      tasks.value = data.tasks ?? []
    } catch (e: unknown) {
      error.value = e
      throw e
    } finally {
      loading.value = false
    }
  }

  async function restoreTask(projectId: number, taskId: number): Promise<void> {
    await projectsApi.trash.restoreTask(projectId, taskId)
    tasks.value = tasks.value.filter(t => t.id !== taskId)
  }

  async function permanentDeleteTask(taskId: number): Promise<void> {
    await projectsApi.trash.permanentDeleteTask(taskId)
    tasks.value = tasks.value.filter(t => t.id !== taskId)
  }

  async function fetchOne(projectId: number, taskId: number): Promise<Task> {
    const { data } = await projectsApi.trash.getTask(projectId, taskId)
    const t = data.task
    if (!t) {
      throw new Error('no task')
    }
    return t
  }

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    fetchOne,
    restoreTask,
    permanentDeleteTask,
  }
})
