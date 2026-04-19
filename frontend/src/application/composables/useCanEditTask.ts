import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { canChangeTaskStatus, canManageTask } from '@domain/project/permissions'
import type { UserRole } from '@domain/user/types'
import { useAuthStore } from '../auth.store'
import { useProjectStore } from '../project.store'
import type { Task } from '@domain/task/types'

/** Full task edit (title, assignee, etc.): manager/owner/admin/staff per API flag + legacy heuristics. */
export function canManageTaskRecord(
  task: Task | null | undefined,
  userId: number | undefined,
  userRole: UserRole | undefined,
  projectStore: ReturnType<typeof useProjectStore>,
): boolean {
  return canManageTask(task, userId, userRole, {
    projects: projectStore.projects,
    current: projectStore.current,
  })
}

/** Status changes (executor assignee, managers, etc.). */
export function canChangeTaskStatusRecord(
  task: Task | null | undefined,
  userId: number | undefined,
  userRole: UserRole | undefined,
  projectStore: ReturnType<typeof useProjectStore>,
): boolean {
  return canChangeTaskStatus(task, userId, userRole, {
    projects: projectStore.projects,
    current: projectStore.current,
  })
}

/** Reactive: can the current user fully edit this task? */
export function useCanEditTask(taskGetter: MaybeRefOrGetter<Task | null | undefined>) {
  const auth = useAuthStore()
  const projectStore = useProjectStore()
  return computed(() =>
    canManageTaskRecord(
      toValue(taskGetter),
      auth.user?.id,
      auth.user?.role,
      projectStore,
    ),
  )
}

/** Per-task helpers for list rows. */
export function useTaskEditPermission() {
  const auth = useAuthStore()
  const projectStore = useProjectStore()
  return {
    canManageTask(t: Task) {
      return canManageTaskRecord(t, auth.user?.id, auth.user?.role, projectStore)
    },
    canChangeTaskStatus(t: Task) {
      return canChangeTaskStatusRecord(
        t,
        auth.user?.id,
        auth.user?.role,
        projectStore,
      )
    },
  }
}
