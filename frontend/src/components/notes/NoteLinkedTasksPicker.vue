<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import UiInput from '../ui/UiInput.vue'
import Button from '../ui/UiButton.vue'

const { t } = useI18n()

const props = defineProps<{
  tasks: { id: number; title: string }[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  link: [taskId: number]
}>()

const q = ref('')

const filtered = computed(() => {
  const s = q.value.trim().toLowerCase()
  return props.tasks.filter(t => {
    if (!s) return true
    return t.title.toLowerCase().includes(s)
  })
})
</script>

<template>
  <div class="space-y-2">
    <UiInput
      v-model="q"
      :placeholder="t('notes.linkTask.searchPlaceholder')"
      :disabled="disabled"
    />
    <ul
      class="max-h-48 overflow-auto rounded-md border border-border divide-y divide-border"
    >
      <li
        v-for="task in filtered"
        :key="task.id"
        class="flex items-center justify-between gap-2 px-2 py-1.5 text-sm"
      >
        <span class="min-w-0 truncate text-foreground">{{ task.title }}</span>
        <Button
          type="button"
          variant="secondary"
          class="shrink-0"
          :disabled="disabled"
          @click="emit('link', task.id)"
        >
          {{ t('notes.linkTask.link') }}
        </Button>
      </li>
      <li
        v-if="filtered.length === 0"
        class="px-2 py-4 text-center text-xs text-muted"
      >
        {{ t('notes.linkTask.empty') }}
      </li>
    </ul>
  </div>
</template>
