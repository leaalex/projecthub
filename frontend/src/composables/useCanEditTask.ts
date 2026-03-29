import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useAuthStore } from '../stores/auth.store'
import { useProjectStore } from '../stores/project.store'
import type { Task } from '../types/task'
import type { UserRole } from '../types/user'

/** Project owner can edit tasks (same rules as TaskDetailModal). */
export function canEditTaskRecord(
  task: Task | null | undefined,
  userId: number | undefined,
  userRole: UserRole | undefined,
  projectStore: ReturnType<typeof useProjectStore>,
): boolean {
  if (!task || userId == null) return false
  if (userRole === 'admin' || userRole === 'staff') return true
  if (projectStore.projects.some((p) => p.id === task.project_id)) return true
  if (
    projectStore.current?.id === task.project_id &&
    projectStore.current.owner_id === userId
  )
    return true
  return false
}

/** Reactive: can the current user edit this task? */
export function useCanEditTask(taskGetter: MaybeRefOrGetter<Task | null | undefined>) {
  const auth = useAuthStore()
  const projectStore = useProjectStore()
  return computed(() =>
    canEditTaskRecord(toValue(taskGetter), auth.user?.id, auth.user?.role, projectStore),
  )
}

/** Imperative helper for templates / loops (e.g. TaskList). */
export function useTaskEditPermission() {
  const auth = useAuthStore()
  const projectStore = useProjectStore()
  return {
    canEditTask(t: Task) {
      return canEditTaskRecord(t, auth.user?.id, auth.user?.role, projectStore)
    },
  }
}
