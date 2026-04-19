import type { UserRole } from '@domain/user/types'
import { isPrivilegedRole } from '@domain/user/role'

type ProjectRole =
  | 'admin'
  | 'staff'
  | 'owner'
  | 'manager'
  | 'executor'
  | 'viewer'

/** Контекст для проверки прав на заметки (без импорта типов из агрегата задач / проекта). */
export type NotePermissionContext = {
  projects: ReadonlyArray<{
    id: number
    owner_id: number
    caller_project_role?: ProjectRole
  }>
  current: {
    id: number
    owner_id: number
    caller_project_role?:
      | 'admin'
      | 'staff'
      | 'owner'
      | 'manager'
      | 'executor'
      | 'viewer'
  } | null
}

/**
 * Управление заметками: owner | manager проекта | admin/staff.
 * Зеркало правил canManageTask без привязки к конкретной задаче.
 */
export function canManageNote(
  userId: number | undefined,
  userRole: UserRole | undefined,
  ctx: NotePermissionContext,
  projectId: number,
): boolean {
  if (userId == null) return false
  if (isPrivilegedRole(userRole)) return true
  const inList = ctx.projects.find(p => p.id === projectId)
  if (inList) {
    if (inList.owner_id === userId) return true
    const r = inList.caller_project_role
    if (r === 'manager' || r === 'owner') return true
  }
  const cur = ctx.current
  if (cur?.id === projectId) {
    if (cur.owner_id === userId) return true
    const r = cur.caller_project_role
    if (r === 'manager' || r === 'owner') return true
  }
  return false
}
