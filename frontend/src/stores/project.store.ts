import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Project } from '../types/project'
import type { Task } from '../types/task'
import { api } from '../utils/api'

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([])
  const current = ref<Project | null>(null)
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchList() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<{ projects: Project[] }>('/projects')
      projects.value = data.projects
    } catch (e: unknown) {
      error.value = 'Failed to load projects'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: number) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<{ project: Project }>(`/projects/${id}`)
      current.value = data.project
      return data.project
    } finally {
      loading.value = false
    }
  }

  async function fetchTasks(id: number) {
    const { data } = await api.get<{ tasks: Task[] }>(`/projects/${id}/tasks`)
    tasks.value = data.tasks
    return data.tasks
  }

  async function create(payload: { name: string; description: string }) {
    const { data } = await api.post<{ project: Project }>('/projects', payload)
    projects.value.unshift(data.project)
    return data.project
  }

  async function update(
    id: number,
    payload: { name: string; description: string },
  ) {
    const { data } = await api.put<{ project: Project }>(
      `/projects/${id}`,
      payload,
    )
    const i = projects.value.findIndex((p) => p.id === id)
    if (i >= 0) projects.value[i] = data.project
    if (current.value?.id === id) current.value = data.project
    return data.project
  }

  async function remove(id: number) {
    await api.delete(`/projects/${id}`)
    projects.value = projects.value.filter((p) => p.id !== id)
    if (current.value?.id === id) current.value = null
  }

  return {
    projects,
    current,
    tasks,
    loading,
    error,
    fetchList,
    fetchOne,
    fetchTasks,
    create,
    update,
    remove,
  }
})
