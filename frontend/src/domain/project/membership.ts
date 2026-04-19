import type { ProjectMember } from './types'

/** User row for task assignee pickers (owner + project members). */
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

/** Deduped list: project owner plus members (members table excludes owner). */
export function mergeOwnerAndMembers(
  owner: { id: number; email: string; name: string } | null | undefined,
  memberRows: ProjectMember[] | null | undefined,
): AssignableUserOption[] {
  const map = new Map<number, AssignableUserOption>()
  if (owner) map.set(owner.id, ownerToOption(owner))
  const rows = Array.isArray(memberRows) ? memberRows : []
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
