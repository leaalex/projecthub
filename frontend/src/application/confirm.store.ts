import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabelKey?: string
  cancelLabelKey?: string
  danger?: boolean
}

export const useConfirmStore = defineStore('confirm', () => {
  const open = ref(false)
  const options = ref<ConfirmOptions | null>(null)
  let resolver: ((value: boolean) => void) | null = null

  function request(opts: ConfirmOptions): Promise<boolean> {
    options.value = { danger: false, ...opts }
    open.value = true
    return new Promise<boolean>((resolve) => {
      resolver = resolve
    })
  }

  function answer(ok: boolean) {
    open.value = false
    options.value = null
    resolver?.(ok)
    resolver = null
  }

  return { open, options, request, answer }
})
