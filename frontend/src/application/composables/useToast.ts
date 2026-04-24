import type { ToastAction } from '../toast.store'
import { useToastStore } from '../toast.store'

/** Toast helpers (symmetric with useConfirm). */
export function useToast() {
  const store = useToastStore()
  return {
    show: store.show,
    dismiss: store.dismiss,
    success: (message: string, duration?: number) =>
      store.show({ message, type: 'success', duration }),
    error: (message: string, duration?: number) =>
      store.show({ message, type: 'error', duration }),
    info: (
      message: string,
      opts?: { duration?: number; action?: ToastAction },
    ) =>
      store.show({
        message,
        type: 'info',
        duration: opts?.duration,
        action: opts?.action,
      }),
  }
}
