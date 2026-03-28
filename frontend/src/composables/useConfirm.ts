import { useConfirmStore } from '../stores/confirm.store'

export function useConfirm() {
  const store = useConfirmStore()
  return {
    confirm: (opts: Parameters<typeof store.request>[0]) => store.request(opts),
  }
}
