import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  Project,
  ProjectMember,
  ProjectMemberRole,
} from '../types/project'
import type { Task } from '../types/task'
import { api } from '../utils/api'

/** Accepts JSON number or numeric string from APIs / proxies. */
function coerceProjectId(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    return Math.trunc(raw)
  }
  if (typeof raw === 'string' && /^\d+$/.test(raw.trim())) {
    const n = Number(raw.trim())
    return Number.isFinite(n) && n > 0 ? n : null
  }
  return null
}

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([])
  const current = ref<Project | null>(null)
  const tasks = ref<Task[]>([])
  const members = ref<ProjectMember[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchList() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<{ projects?: Project[] | null }>('/projects')
      projects.value = Array.isArray(data.projects) ? data.projects : []
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
      const { data } = await api.get<{
        project?: Project
        caller_project_role?: Project['caller_project_role']
      }>(`/projects/${id}`)
      const raw = data?.project
      if (raw == null) {
        throw new Error('Invalid project response')
      }
      const nid = coerceProjectId(raw.id)
      if (nid == null) {
        throw new Error('Invalid project response')
      }
      const p: Project = {
        ...raw,
        id: nid,
        ...(data.caller_project_role != null
          ? { caller_project_role: data.caller_project_role }
          : {}),
      }
      current.value = p
      return p
    } finally {
      loading.value = false
    }
  }

  async function fetchTasks(id: number) {
    const { data } = await api.get<{ tasks?: Task[] | null }>(
      `/projects/${id}/tasks`,
    )
    const list = Array.isArray(data.tasks) ? data.tasks : []
    tasks.value = list
    return list
  }

  async function fetchMembers(projectId: number) {
    const { data } = await api.get<{ members?: ProjectMember[] | null }>(
      `/projects/${projectId}/members`,
    )
    const list = data.members
    const normalized = Array.isArray(list) ? list : []
    members.value = normalized
    return normalized
  }

  async function addMember(
    projectId: number,
    payload: { user_id?: number; email?: string; role: ProjectMemberRole },
  ) {
    const { data } = await api.post<{ member: ProjectMember }>(
      `/projects/${projectId}/members`,
      payload,
    )
    const prev = Array.isArray(members.value) ? members.value : []
    members.value = [...prev, data.member]
    return data.member
  }

  async function updateMemberRole(
    projectId: number,
    userId: number,
    role: ProjectMemberRole,
  ) {
    const { data } = await api.put<{ member: ProjectMember }>(
      `/projects/${projectId}/members/${userId}`,
      { role },
    )
    if (!Array.isArray(members.value)) members.value = []
    const i = members.value.findIndex((m) => m.user_id === userId)
    if (i >= 0) members.value[i] = data.member
    return data.member
  }

  async function removeMember(projectId: number, userId: number) {
    await api.delete(`/projects/${projectId}/members/${userId}`)
    const prev = Array.isArray(members.value) ? members.value : []
    members.value = prev.filter((m) => m.user_id !== userId)
  }

  async function transferOwnership(projectId: number, newOwnerId: number) {
    await api.patch(`/projects/${projectId}/owner`, {
      new_owner_id: newOwnerId,
    })
    await fetchOne(projectId)
    await fetchMembers(projectId)
  }

  async function create(payload: { name: string; description: string }) {
    const { data } = await api.post<{ project?: Project }>('/projects', payload)
    const raw = data?.project
    if (raw == null || coerceProjectId(raw.id) == null) {
      throw new Error('Invalid project response')
    }
    const project: Project = { ...raw, id: coerceProjectId(raw.id)! }
    projects.value.unshift(project)
    return project
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
    if (current.value?.id === id) {
      current.value = {
        ...data.project,
        caller_project_role: current.value.caller_project_role,
      }
    }
    return data.project
  }

  async function remove(id: number) {
    await api.delete(`/projects/${id}`)
    projects.value = projects.value.filter((p) => p.id !== id)
    if (current.value?.id === id) current.value = null
  }

  /** Clears detail view state before loading another project (avoids stale UI). */
  function resetProjectDetailView() {
    current.value = null
    tasks.value = []
    members.value = []
  }

  return {
    projects,
    current,
    tasks,
    members,
    loading,
    error,
    resetProjectDetailView,
    fetchList,
    fetchOne,
    fetchTasks,
    fetchMembers,
    addMember,
    updateMemberRole,
    removeMember,
    transferOwnership,
    create,
    update,
    remove,
  }
})
