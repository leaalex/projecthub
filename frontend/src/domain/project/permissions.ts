import { isPrivilegedRole } from '@domain/user/role'
import type { UserRole } from '@domain/user/types'
import type { Task } from '@domain/task/types'
import type { Project } from './types'

/** Minimal project list row for permission checks. */
export type ProjectListRow = Pick<Project, 'id' | 'owner_id'>

/** Current project detail for permission checks. */
export type CurrentProjectRow = Pick<
  Project,
  'id' | 'owner_id' | 'caller_project_role'
>

export type TaskPermissionContext = {
  projects: ReadonlyArray<ProjectListRow>
  current: CurrentProjectRow | null
}

/** Full task edit (title, assignee, etc.): manager/owner/admin/staff per API flag + legacy heuristics. */
export function canManageTask(
  task: Task | null | undefined,
  userId: number | undefined,
  userRole: UserRole | undefined,
  ctx: TaskPermissionContext,
): boolean {
  if (!task || userId == null) return false
  if (task.caller_can_manage === true) return true
  if (isPrivilegedRole(userRole)) return true
  if (ctx.projects.some((p) => p.id === task.project_id && p.owner_id === userId))
    return true
  const cur = ctx.current
  if (cur?.id === task.project_id) {
    if (cur.owner_id === userId) return true
    const r = cur.caller_project_role
    if (r === 'manager' || r === 'owner') return true
  }
  if (task.caller_can_manage === false) return false
  return false
}

/** Status changes (executor assignee, managers, etc.). */
export function canChangeTaskStatus(
  task: Task | null | undefined,
  userId: number | undefined,
  userRole: UserRole | undefined,
  ctx: TaskPermissionContext,
): boolean {
  if (!task || userId == null) return false
  if (canManageTask(task, userId, userRole, ctx)) return true
  if (typeof task.caller_can_change_status === 'boolean') {
    return task.caller_can_change_status
  }
  return task.assignee_id === userId
}
