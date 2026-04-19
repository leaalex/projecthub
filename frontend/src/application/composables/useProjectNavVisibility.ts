import { computed } from 'vue'
import { useAuthStore } from '../auth.store'

/**
 * Authenticated users see Projects / Tasks (including global "user" role, who
 * can own personal projects without membership rows).
 */
export function useProjectNavVisibility() {
  const auth = useAuthStore()

  const showProjectsAndTasks = computed(() => auth.user != null)

  return { showProjectsAndTasks }
}
