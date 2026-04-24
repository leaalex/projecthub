import type { Options } from 'sortablejs'

/**
 * Общие опции для Sortable / vue-draggable-plus (мобилка: delay + touchStartThreshold).
 * `handle` задаёт на каждом `<VueDraggable>`.
 */
export const COMMON_DND_OPTIONS: Options = {
  animation: 150,
  delay: 150,
  delayOnTouchOnly: true,
  touchStartThreshold: 6,
  ghostClass: 'dnd-ghost',
  chosenClass: 'dnd-chosen',
  dragClass: 'dnd-drag',
  /** клик по кнопкам/инпутам внутри ряда/карточки, не драг-ручка */
  filter: 'button, a, input, textarea, select, [data-no-dnd], [data-no-dnd] *',
  preventOnFilter: false,
}
