<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { PencilSquareIcon } from '@heroicons/vue/24/outline'
import type { Project } from '../../types/project'
import { timeAgo } from '../../utils/formatters'
import Button from '../ui/UiButton.vue'

const props = defineProps<{
  project: Project
}>()

const emit = defineEmits<{
  open: [id: number]
  edit: [id: number]
}>()

const { t } = useI18n()

const kindLabel = computed(() =>
  props.project.kind === 'personal'
    ? t('projectCard.personal')
    : t('projectCard.team'),
)

const editAria = computed(() =>
  t('projectCard.editAria', { name: props.project.name }),
)
</script>

<template>
  <div
    class="flex flex-col justify-between rounded-lg border border-border bg-surface p-4"
  >
    <div>
      <div class="flex flex-wrap items-center gap-2">
        <h3 class="font-semibold text-foreground">{{ props.project.name }}</h3>
        <span
          v-if="props.project.kind === 'personal' || props.project.kind === 'team'"
          class="inline-flex rounded-md border border-border bg-surface-muted/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted"
        >
          {{ kindLabel }}
        </span>
      </div>
      <p class="mt-1 line-clamp-2 text-sm text-muted">
        {{ props.project.description || t('common.noDescription') }}
      </p>
      <p class="mt-2 text-xs text-muted">
        <span class="text-foreground/80">{{ t('projectCard.owner') }}</span>
        <span aria-hidden="true"> · </span>
        <span class="text-foreground">{{
          props.project.owner
            ? props.project.owner.name || props.project.owner.email
            : `User #${props.project.owner_id}`
        }}</span>
      </p>
      <p class="mt-1 text-xs text-muted">
        {{ t('projectCard.updatedAt', { time: timeAgo(props.project.updated_at) }) }}
      </p>
    </div>
    <div class="mt-4 flex items-center gap-2">
      <Button
        type="button"
        class="min-w-0 flex-1"
        variant="secondary"
        @click="emit('open', props.project.id)"
      >
        {{ t('projectCard.open') }}
      </Button>
      <Button
        type="button"
        variant="secondary"
        class="shrink-0 px-2.5"
        :aria-label="editAria"
        @click="emit('edit', props.project.id)"
      >
        <PencilSquareIcon class="h-4 w-4" aria-hidden="true" />
        <span class="sr-only">{{ t('projectCard.editSr') }}</span>
      </Button>
    </div>
  </div>
</template>
