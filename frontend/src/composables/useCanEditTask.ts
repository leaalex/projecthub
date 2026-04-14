import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useAuthStore } from '../stores/auth.store'
import { useProjectStore } from '../stores/project.store'
import type { Task } from '../types/task'
import type { UserRole } from '../types/user'

/** Full task edit (title, assignee, etc.): manager/owner/admin/staff per API flag + legacy heuristics. */
export function canManageTaskRecord(
  task: Task | null | undefined,
  userId: number | undefined,
  userRole: UserRole | undefined,
  projectStore: ReturnType<typeof useProjectStore>,
): boolean {
  if (!task || userId == null) return false
  if (task.caller_can_manage === true) return true
  if (userRole === 'admin' || userRole === 'staff') return true
  if (
    projectStore.projects.some(
      (p) => p.id === task.project_id && p.owner_id === userId,
    )
  )
    return true
  const cur = projectStore.current
  if (cur?.id === task.project_id) {
    if (cur.owner_id === userId) return true
    const r = cur.caller_project_role
    if (r === 'manager' || r === 'owner') return true
  }
  if (task.caller_can_manage === false) return false
  return false
}

/** Status changes (executor assignee, managers, etc.). */
export function canChangeTaskStatusRecord(
  task: Task | null | undefined,
  userId: number | undefined,
  userRole: UserRole | undefined,
  projectStore: ReturnType<typeof useProjectStore>,
): boolean {
  if (!task || userId == null) return false
  // Managers/owners must be able to change status even if API sent caller_can_change_status: false
  // (booleans are always present on JSON responses, so the old order hid inline editing).
  if (canManageTaskRecord(task, userId, userRole, projectStore)) return true
  if (typeof task.caller_can_change_status === 'boolean') {
    return task.caller_can_change_status
  }
  return task.assignee_id === userId
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

/** Per-task helpers for list/kanban rows. */
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
