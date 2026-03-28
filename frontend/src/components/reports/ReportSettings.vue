<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Button from '../common/Button.vue'
import { useAuthStore } from '../../stores/auth.store'
import { useProjectStore } from '../../stores/project.store'
import { api } from '../../utils/api'
import type { ReportConfig, ReportFormat, ReportGroupBy } from '../../types/report'
import type { TaskPriority, TaskStatus } from '../../types/task'
import type { User } from '../../types/user'

const props = defineProps<{
  generating?: boolean
}>()

const emit = defineEmits<{
  generate: [ReportConfig]
}>()

const auth = useAuthStore()
const projectStore = useProjectStore()

const isAdmin = computed(() => auth.user?.role === 'admin')

const format = ref<ReportFormat>('xlsx')
const dateFrom = ref('')
const dateTo = ref('')
const selectedProjectIds = ref<number[]>([])
const selectedUserIds = ref<number[]>([])
const users = ref<User[]>([])
const loadingUsers = ref(false)

const statusOptions: TaskStatus[] = [
  'todo',
  'in_progress',
  'review',
  'done',
]
const selectedStatuses = ref<TaskStatus[]>([...statusOptions])

const priorityOptions: TaskPriority[] = [
  'low',
  'medium',
  'high',
  'critical',
]
const selectedPriorities = ref<TaskPriority[]>([...priorityOptions])

const fieldDefs: { key: string; label: string }[] = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'project', label: 'Project' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'due_date', label: 'Due date' },
  { key: 'created_at', label: 'Created at' },
  { key: 'updated_at', label: 'Updated at' },
]
const selectedFields = ref<string[]>(fieldDefs.map((f) => f.key))

const groupBy = ref<ReportGroupBy>('')

const groupOptions: { value: ReportGroupBy; label: string }[] = [
  { value: '', label: 'None' },
  { value: 'project', label: 'By project' },
  { value: 'status', label: 'By status' },
  { value: 'priority', label: 'By priority' },
  { value: 'assignee', label: 'By assignee' },
]

onMounted(async () => {
  await projectStore.fetchList().catch(() => {})
  if (isAdmin.value) {
    loadingUsers.value = true
    try {
      const { data } = await api.get<{ users: User[] }>('/users')
      users.value = data.users
    } catch {
      users.value = []
    } finally {
      loadingUsers.value = false
    }
  }
})

function toggleAllStatuses(checked: boolean) {
  selectedStatuses.value = checked ? [...statusOptions] : []
}

function toggleAllPriorities(checked: boolean) {
  selectedPriorities.value = checked ? [...priorityOptions] : []
}

function toggleAllFields(checked: boolean) {
  selectedFields.value = checked ? fieldDefs.map((f) => f.key) : []
}

function submit() {
  if (selectedFields.value.length === 0) {
    return
  }
  const cfg: ReportConfig = {
    format: format.value,
    date_from: dateFrom.value.trim() || undefined,
    date_to: dateTo.value.trim() || undefined,
    project_ids: [...selectedProjectIds.value],
    user_ids: isAdmin.value ? [...selectedUserIds.value] : [],
    statuses: [...selectedStatuses.value],
    priorities: [...selectedPriorities.value],
    fields: [...selectedFields.value],
    group_by: groupBy.value,
  }
  emit('generate', cfg)
}

const canSubmit = computed(
  () => selectedFields.value.length > 0 && !props.generating,
)
</script>

<template>
  <div class="rounded-lg border border-border bg-surface p-4 shadow-sm">
    <h3 class="text-sm font-semibold text-foreground">Custom report</h3>
    <p class="mt-1 text-sm text-muted">
      Choose format, filters, columns, and grouping. Export downloads immediately.
    </p>

    <div class="mt-4 space-y-4">
      <div>
        <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
          Format
        </p>
        <div class="flex flex-wrap gap-2">
          <Button
            type="button"
            :variant="format === 'csv' ? 'primary' : 'secondary'"
            @click="format = 'csv'"
          >
            CSV
          </Button>
          <Button
            type="button"
            :variant="format === 'xlsx' ? 'primary' : 'secondary'"
            @click="format = 'xlsx'"
          >
            XLSX
          </Button>
          <Button
            type="button"
            :variant="format === 'pdf' ? 'primary' : 'secondary'"
            @click="format = 'pdf'"
          >
            PDF
          </Button>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            for="rep-from"
            class="mb-1 block text-sm font-medium text-foreground"
            >Created from</label
          >
          <input
            id="rep-from"
            v-model="dateFrom"
            type="date"
            class="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            for="rep-to"
            class="mb-1 block text-sm font-medium text-foreground"
            >Created to</label
          >
          <input
            id="rep-to"
            v-model="dateTo"
            type="date"
            class="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
          Projects (empty = all you can access)
        </p>
        <div
          v-if="!projectStore.projects.length"
          class="text-sm text-muted"
        >
          No projects loaded.
        </div>
        <div v-else class="max-h-36 space-y-2 overflow-y-auto rounded-md border border-border p-2">
          <label
            v-for="p in projectStore.projects"
            :key="p.id"
            class="flex cursor-pointer items-center gap-2 text-sm"
          >
            <input
              v-model="selectedProjectIds"
              type="checkbox"
              class="rounded border-border"
              :value="p.id"
            />
            <span class="truncate">{{ p.name }}</span>
          </label>
        </div>
      </div>

      <div v-if="isAdmin">
        <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
          Users (empty = all tasks; otherwise assignee or project owner in list)
        </p>
        <div
          v-if="loadingUsers"
          class="text-sm text-muted"
        >
          Loading users…
        </div>
        <div
          v-else
          class="max-h-36 space-y-2 overflow-y-auto rounded-md border border-border p-2"
        >
          <label
            v-for="u in users"
            :key="u.id"
            class="flex cursor-pointer items-center gap-2 text-sm"
          >
            <input
              v-model="selectedUserIds"
              type="checkbox"
              class="rounded border-border"
              :value="u.id"
            />
            <span class="truncate">{{ u.name || u.email }}</span>
            <span class="text-xs text-muted">({{ u.email }})</span>
          </label>
        </div>
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between gap-2">
          <p class="text-xs font-medium uppercase tracking-wide text-muted">
            Statuses
          </p>
          <button
            type="button"
            class="text-xs text-primary hover:underline"
            @click="toggleAllStatuses(selectedStatuses.length < statusOptions.length)"
          >
            {{ selectedStatuses.length < statusOptions.length ? 'Select all' : 'Clear' }}
          </button>
        </div>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="s in statusOptions"
            :key="s"
            class="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs"
            :class="
              selectedStatuses.includes(s)
                ? 'border-primary bg-primary/10 text-primary'
                : 'text-muted'
            "
          >
            <input
              v-model="selectedStatuses"
              type="checkbox"
              class="rounded border-border"
              :value="s"
            />
            {{ s.replace('_', ' ') }}
          </label>
        </div>
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between gap-2">
          <p class="text-xs font-medium uppercase tracking-wide text-muted">
            Priorities
          </p>
          <button
            type="button"
            class="text-xs text-primary hover:underline"
            @click="
              toggleAllPriorities(
                selectedPriorities.length < priorityOptions.length,
              )
            "
          >
            {{
              selectedPriorities.length < priorityOptions.length
                ? 'Select all'
                : 'Clear'
            }}
          </button>
        </div>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="pr in priorityOptions"
            :key="pr"
            class="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs"
            :class="
              selectedPriorities.includes(pr)
                ? 'border-primary bg-primary/10 text-primary'
                : 'text-muted'
            "
          >
            <input
              v-model="selectedPriorities"
              type="checkbox"
              class="rounded border-border"
              :value="pr"
            />
            {{ pr }}
          </label>
        </div>
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between gap-2">
          <p class="text-xs font-medium uppercase tracking-wide text-muted">
            Columns
          </p>
          <button
            type="button"
            class="text-xs text-primary hover:underline"
            @click="
              toggleAllFields(selectedFields.length < fieldDefs.length)
            "
          >
            {{
              selectedFields.length < fieldDefs.length ? 'Select all' : 'Clear'
            }}
          </button>
        </div>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="f in fieldDefs"
            :key="f.key"
            class="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs"
            :class="
              selectedFields.includes(f.key)
                ? 'border-primary bg-primary/10 text-primary'
                : 'text-muted'
            "
          >
            <input
              v-model="selectedFields"
              type="checkbox"
              class="rounded border-border"
              :value="f.key"
            />
            {{ f.label }}
          </label>
        </div>
        <p
          v-if="selectedFields.length === 0"
          class="mt-2 text-xs text-destructive"
        >
          Select at least one column.
        </p>
      </div>

      <div>
        <label
          for="rep-group"
          class="mb-1 block text-sm font-medium text-foreground"
          >Group by</label
        >
        <select
          id="rep-group"
          v-model="groupBy"
          class="w-full max-w-xs rounded-md border border-border bg-surface px-3 py-2 text-sm"
        >
          <option
            v-for="g in groupOptions"
            :key="g.value || 'none'"
            :value="g.value"
          >
            {{ g.label }}
          </option>
        </select>
      </div>
    </div>

    <div class="mt-6">
      <Button
        type="button"
        :disabled="!canSubmit"
        :loading="generating"
        @click="submit"
      >
        {{ generating ? 'Generating…' : 'Generate & download' }}
      </Button>
    </div>
  </div>
</template>
