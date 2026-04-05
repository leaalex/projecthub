import { computed } from 'vue'
import { useAuthStore } from '../stores/auth.store'
import { useProjectStore } from '../stores/project.store'

/**
 * Global role "user" (member-only) sees Projects / Tasks in nav only when
 * they belong to at least one project (API GET /projects).
 */
export function useProjectNavVisibility() {
  const auth = useAuthStore()
  const projectStore = useProjectStore()

  const showProjectsAndTasks = computed(
    () =>
      auth.user?.role !== 'user' || projectStore.projects.length > 0,
  )

  return { showProjectsAndTasks }
}
