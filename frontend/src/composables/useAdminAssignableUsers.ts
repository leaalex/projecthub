import { ref, watch, toValue, type MaybeRefOrGetter } from 'vue'
import { useAuthStore } from '../stores/auth.store'
import { useProjectStore } from '../stores/project.store'
import type { User } from '../types/user'
import { api } from '../utils/api'

export type AssignableUserOption = {
  id: number
  email: string
  name: string
}

function ownerToOption(o: {
  id: number
  email: string
  name: string
}): AssignableUserOption {
  return { id: o.id, email: o.email, name: o.name }
}

function mergeOwnerAndMembers(
  owner: { id: number; email: string; name: string } | null | undefined,
  members: { user_id: number; user: { email: string; name: string } }[] | null | undefined,
): AssignableUserOption[] {
  const map = new Map<number, AssignableUserOption>()
  if (owner) map.set(owner.id, ownerToOption(owner))
  const rows = Array.isArray(members) ? members : []
  for (const m of rows) {
    if (!map.has(m.user_id)) {
      map.set(m.user_id, {
        id: m.user_id,
        email: m.user.email,
        name: m.user.name,
      })
    }
  }
  return [...map.values()]
}

/**
 * Assignee options for a single project: owner + GET /projects/:id/members.
 */
export function useProjectScopedAssignableUsers(
  projectIdRef: MaybeRefOrGetter<number | undefined>,
) {
  const auth = useAuthStore()
  const projectStore = useProjectStore()
  const assignableUsers = ref<AssignableUserOption[]>([])

  async function refreshAssignableUsers() {
    const pid = toValue(projectIdRef)
    if (pid == null || !Number.isFinite(pid) || pid <= 0) {
      assignableUsers.value = []
      return
    }
    try {
      await projectStore.fetchMembers(pid)
      const proj =
        projectStore.projects.find((p) => p.id === pid) ??
        (projectStore.current?.id === pid ? projectStore.current : null)
      assignableUsers.value = mergeOwnerAndMembers(
        proj?.owner ?? undefined,
        projectStore.members,
      )
    } catch {
      assignableUsers.value = []
    }
  }

  watch(
    () => [toValue(projectIdRef), auth.user?.id] as const,
    () => {
      void refreshAssignableUsers()
    },
    { immediate: true },
  )

  return { assignableUsers, refreshAssignableUsers }
}

/**
 * Tasks page: scoped to members when a project filter is set; admin/staff with no filter use /users.
 */
export function useTasksPageAssignableUsers(
  filterProjectIdRef: MaybeRefOrGetter<number | '' | undefined>,
) {
  const auth = useAuthStore()
  const projectStore = useProjectStore()
  const assignableUsers = ref<AssignableUserOption[]>([])

  async function refreshAssignableUsers() {
    const raw = toValue(filterProjectIdRef)
    const pid =
      typeof raw === 'number' && raw > 0
        ? raw
        : typeof raw === 'string' && raw !== ''
          ? Number(raw)
          : 0
    if (pid > 0) {
      try {
        await projectStore.fetchMembers(pid)
        const proj = projectStore.projects.find((p) => p.id === pid)
        assignableUsers.value = mergeOwnerAndMembers(
          proj?.owner ?? undefined,
          projectStore.members,
        )
      } catch {
        assignableUsers.value = []
      }
      return
    }
    if (auth.user?.role === 'admin' || auth.user?.role === 'staff') {
      try {
        const { data } = await api.get<{ users?: User[] | null }>('/users')
        const users = Array.isArray(data.users) ? data.users : []
        assignableUsers.value = users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
        }))
      } catch {
        assignableUsers.value = []
      }
      return
    }
    assignableUsers.value = []
  }

  watch(
    () => [toValue(filterProjectIdRef), auth.user?.role] as const,
    () => {
      void refreshAssignableUsers()
    },
    { immediate: true },
  )

  return { assignableUsers, refreshAssignableUsers }
}
