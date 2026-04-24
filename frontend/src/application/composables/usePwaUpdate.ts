import { registerSW } from 'virtual:pwa-register'
import { i18n } from '@infra/i18n'
import { useToast } from './useToast'

/** Register service worker and surface update/offline toasts (after app + Pinia mount). */
export function initPwaUpdates() {
  const toast = useToast()
  const { t } = i18n.global

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      toast.info(t('pwa.updateReady'), {
        duration: 0,
        action: {
          label: t('pwa.update'),
          run: () => {
            void updateSW(true)
          },
        },
      })
    },
    onOfflineReady() {
      toast.success(t('pwa.offlineReady'))
    },
  })
}
