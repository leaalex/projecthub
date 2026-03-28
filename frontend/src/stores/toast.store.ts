import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  message: string
  type: ToastType
  duration: number
}

let idSeq = 0

export const useToastStore = defineStore('toast', () => {
  const items = ref<ToastItem[]>([])

  function show(opts: {
    message: string
    type?: ToastType
    duration?: number
  }) {
    const id = ++idSeq
    const duration = opts.duration ?? 4000
    items.value.push({
      id,
      message: opts.message,
      type: opts.type ?? 'info',
      duration,
    })
    if (duration > 0) {
      window.setTimeout(() => dismiss(id), duration)
    }
    return id
  }

  function dismiss(id: number) {
    items.value = items.value.filter((t) => t.id !== id)
  }

  return { items, show, dismiss }
})

export function useToast() {
  const store = useToastStore()
  return {
    show: store.show,
    dismiss: store.dismiss,
    success: (message: string, duration?: number) =>
      store.show({ message, type: 'success', duration }),
    error: (message: string, duration?: number) =>
      store.show({ message, type: 'error', duration }),
    info: (message: string, duration?: number) =>
      store.show({ message, type: 'info', duration }),
  }
}
