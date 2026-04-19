import type { UserRole } from './types'

/** Workspace superuser (full admin UI). */
export function isAdminRole(role: UserRole | undefined): boolean {
  return role === 'admin'
}

/** Admin or staff (elevated workspace access). */
export function isPrivilegedRole(role: UserRole | undefined): boolean {
  return role === 'admin' || role === 'staff'
}
