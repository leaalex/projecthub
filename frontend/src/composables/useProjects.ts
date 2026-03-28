import { storeToRefs } from 'pinia'
import { useProjectStore } from '../stores/project.store'

export function useProjects() {
  const store = useProjectStore()
  return { ...storeToRefs(store), ...store }
}
