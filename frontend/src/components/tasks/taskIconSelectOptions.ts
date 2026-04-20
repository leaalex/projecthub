import type { Component } from 'vue'
import type { ComposerTranslation } from 'vue-i18n'
import {
  ArrowPathIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  EqualsIcon,
  EyeIcon,
} from '@heroicons/vue/20/solid'
import type { TaskPriority, TaskStatus } from '@domain/task/types'
import { taskPriorityLabel, taskStatusLabel } from '@infra/i18n/labels'
import type { UiIconSelectOption } from '../ui/UiIconSelect.vue'

const statusIcons: Record<TaskStatus, Component> = {
  todo: ClipboardDocumentListIcon,
  in_progress: ArrowPathIcon,
  review: EyeIcon,
  done: CheckCircleIcon,
}

const priorityIcons: Record<TaskPriority, Component> = {
  low: ArrowTrendingDownIcon,
  medium: EqualsIcon,
  high: ArrowTrendingUpIcon,
  critical: BoltIcon,
}

export function taskStatusIconSelectOptions(
  t: ComposerTranslation,
): UiIconSelectOption<TaskStatus>[] {
  return (['todo', 'in_progress', 'review', 'done'] as const).map((value) => ({
    value,
    label: taskStatusLabel(t, value),
    icon: statusIcons[value],
  }))
}

export function taskPriorityIconSelectOptions(
  t: ComposerTranslation,
): UiIconSelectOption<TaskPriority>[] {
  return (['low', 'medium', 'high', 'critical'] as const).map((value) => ({
    value,
    label: taskPriorityLabel(t, value),
    icon: priorityIcons[value],
  }))
}
