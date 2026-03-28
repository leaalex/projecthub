import { storeToRefs } from 'pinia'
import { useTaskStore } from '../stores/task.store'

export function useTasks() {
  const store = useTaskStore()
  return { ...storeToRefs(store), ...store }
}
