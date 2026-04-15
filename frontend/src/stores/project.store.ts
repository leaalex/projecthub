import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  Project,
  ProjectKind,
  ProjectMember,
  ProjectMemberRole,
} from '../types/project'
import type { Task } from '../types/task'
import { mergeOwnerAndMembers } from '../utils/assignee'
import { api } from '../utils/api'

function projectKindFromApi(k: unknown): ProjectKind {
  return k === 'personal' || k === 'team' ? k : 'team'
}

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
  /** Which project `members` belongs to; drives `assignableUsers`. */
  const membersProjectId = ref<number | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const assignableUsers = computed(() => {
    const pid = membersProjectId.value
    if (pid == null) return []
    // Prefer `current` (GET /projects/:id preloads Owner); list rows can omit nested owner.
    const proj =
      (current.value?.id === pid ? current.value : null) ??
      projects.value.find((p) => p.id === pid) ??
      null
    return mergeOwnerAndMembers(proj?.owner, members.value)
  })

  async function fetchList() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<{ projects?: Project[] | null }>('/projects')
      projects.value = Array.isArray(data.projects)
        ? data.projects.map((p) => ({
            ...p,
            kind: projectKindFromApi(p.kind),
          }))
        : []
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
        kind: projectKindFromApi(raw.kind),
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
    membersProjectId.value = projectId
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
    membersProjectId.value = projectId
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
    membersProjectId.value = projectId
    return data.member
  }

  async function removeMember(projectId: number, userId: number) {
    await api.delete(`/projects/${projectId}/members/${userId}`)
    const prev = Array.isArray(members.value) ? members.value : []
    members.value = prev.filter((m) => m.user_id !== userId)
    membersProjectId.value = projectId
  }

  async function transferOwnership(projectId: number, newOwnerId: number) {
    await api.patch(`/projects/${projectId}/owner`, {
      new_owner_id: newOwnerId,
    })
    await fetchOne(projectId)
    await fetchMembers(projectId)
  }

  async function create(payload: {
    name: string
    description: string
    kind: ProjectKind
  }) {
    const { data } = await api.post<{
      project?: Project
      caller_project_role?: Project['caller_project_role']
    }>('/projects', payload)
    const raw = data?.project
    if (raw == null || coerceProjectId(raw.id) == null) {
      throw new Error('Invalid project response')
    }
    const project: Project = {
      ...raw,
      id: coerceProjectId(raw.id)!,
      kind: projectKindFromApi(raw.kind),
      ...(data.caller_project_role != null
        ? { caller_project_role: data.caller_project_role }
        : {}),
    }
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
    const updated: Project = {
      ...data.project,
      kind: projectKindFromApi(data.project.kind),
    }
    const i = projects.value.findIndex((p) => p.id === id)
    if (i >= 0) projects.value[i] = updated
    if (current.value?.id === id) {
      current.value = {
        ...updated,
        caller_project_role: current.value.caller_project_role,
      }
    }
    return updated
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
    membersProjectId.value = null
  }

  /** Keeps project detail task list in sync when taskStore mutates the same task. */
  function patchTask(updated: Task) {
    const i = tasks.value.findIndex((t) => t.id === updated.id)
    if (i >= 0) {
      tasks.value.splice(i, 1, updated)
    }
  }

  function removeTask(taskId: number) {
    tasks.value = tasks.value.filter((t) => t.id !== taskId)
  }

  return {
    projects,
    current,
    tasks,
    members,
    membersProjectId,
    assignableUsers,
    loading,
    error,
    resetProjectDetailView,
    patchTask,
    removeTask,
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
