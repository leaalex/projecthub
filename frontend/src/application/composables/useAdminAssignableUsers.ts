import { computed, ref, watch, toValue, type MaybeRefOrGetter } from 'vue'
import { useAuthStore } from '../auth.store'
import { useProjectStore } from '../project.store'
import { isPrivilegedRole } from '@domain/user/role'
import type { User } from '@domain/user/types'
import type { AssignableUserOption } from '@domain/project/membership'
import { usersApi } from '@infra/api/users'

export type { AssignableUserOption } from '@domain/project/membership'

/**
 * Assignee options for a single project: owner + GET /projects/:id/members.
 * List is derived in project store (`assignableUsers`); stays in sync when members change.
 */
export function useProjectScopedAssignableUsers(
  projectIdRef: MaybeRefOrGetter<number | undefined>,
) {
  const auth = useAuthStore()
  const projectStore = useProjectStore()

  async function refreshAssignableUsers() {
    const pid = toValue(projectIdRef)
    if (pid == null || !Number.isFinite(pid) || pid <= 0) {
      return
    }
    try {
      await projectStore.fetchMembers(pid)
    } catch {
      /* fetchMembers failed; members may be stale */
    }
  }

  const assignableUsers = computed(() => {
    const pid = toValue(projectIdRef)
    if (pid == null || !Number.isFinite(pid) || pid <= 0) return []
    if (projectStore.membersProjectId !== pid) return []
    return projectStore.assignableUsers
  })

  watch(
    () => [toValue(projectIdRef), auth.user?.id] as const,
    () => {
      void refreshAssignableUsers()
    },
    { immediate: true },
  )

  return { assignableUsers, refreshAssignableUsers }
}

function parseFilterProjectId(
  raw: number | '' | undefined,
): number {
  if (typeof raw === 'number' && raw > 0) return raw
  if (typeof raw === 'string' && raw !== '') {
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? n : 0
  }
  return 0
}

/**
 * Tasks page: scoped to members when a project filter is set; admin/staff with no filter use /users.
 */
export function useTasksPageAssignableUsers(
  filterProjectIdRef: MaybeRefOrGetter<number | '' | undefined>,
) {
  const auth = useAuthStore()
  const projectStore = useProjectStore()
  const workspaceUsers = ref<AssignableUserOption[]>([])

  async function refreshAssignableUsers() {
    const raw = toValue(filterProjectIdRef)
    const pid = parseFilterProjectId(raw)
    if (pid > 0) {
      try {
        await projectStore.fetchMembers(pid)
      } catch {
        /* */
      }
      return
    }
    if (isPrivilegedRole(auth.user?.role)) {
      try {
        const { data } = await usersApi.list()
        const users = Array.isArray(data.users)
          ? (data.users as User[])
          : []
        workspaceUsers.value = users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
        }))
      } catch {
        workspaceUsers.value = []
      }
      return
    }
    workspaceUsers.value = []
  }

  const assignableUsers = computed(() => {
    const raw = toValue(filterProjectIdRef)
    const pid = parseFilterProjectId(raw)
    if (pid > 0) {
      if (projectStore.membersProjectId !== pid) return []
      return projectStore.assignableUsers
    }
    if (isPrivilegedRole(auth.user?.role)) {
      return workspaceUsers.value
    }
    return []
  })

  watch(
    () => [toValue(filterProjectIdRef), auth.user?.role] as const,
    () => {
      void refreshAssignableUsers()
    },
    { immediate: true },
  )

  return { assignableUsers, refreshAssignableUsers }
}
