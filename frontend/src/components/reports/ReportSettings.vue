<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import UiButton from '../ui/UiButton.vue'
import UiCheckboxRow from '../ui/UiCheckboxRow.vue'
import UiFilterChip from '../ui/UiFilterChip.vue'
import UiFormSection from '../ui/UiFormSection.vue'
import UiInput from '../ui/UiInput.vue'
import UiScrollPanel from '../ui/UiScrollPanel.vue'
import UiSegmentedControl from '../ui/UiSegmentedControl.vue'
import UiSelect from '../ui/UiSelect.vue'
import UiTextAction from '../ui/UiTextAction.vue'
import { useAuthStore } from '../../stores/auth.store'
import { useProjectStore } from '../../stores/project.store'
import { api } from '../../utils/api'
import type {
  ReportConfig,
  ReportFormat,
  ReportGroupBy,
  ReportPdfLayout,
} from '../../types/report'
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

const canFilterUsers = computed(
  () => auth.user?.role === 'admin' || auth.user?.role === 'staff',
)

const format = ref<ReportFormat>('xlsx')
const dateFrom = ref('')
const dateTo = ref('')
const selectedProjectIds = ref<number[]>([])
const selectedUserIds = ref<number[]>([])
const users = ref<User[]>([])
const loadingUsers = ref(false)

const FORMAT_OPTIONS = [
  { value: 'csv', label: 'CSV' },
  { value: 'xlsx', label: 'XLSX' },
  { value: 'pdf', label: 'PDF' },
  { value: 'txt', label: 'TXT' },
] as const

const PDF_LAYOUT_OPTIONS = [
  { value: 'table' as const, label: 'Table' },
  { value: 'list' as const, label: 'List' },
]

const pdfLayout = ref<ReportPdfLayout>('table')

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

const groupSelectOptions = [
  { value: '' as const, label: 'None' },
  { value: 'project' as const, label: 'By project' },
  { value: 'status' as const, label: 'By status' },
  { value: 'priority' as const, label: 'By priority' },
  { value: 'assignee' as const, label: 'By assignee' },
]

onMounted(async () => {
  await projectStore.fetchList().catch(() => {})
  if (canFilterUsers.value) {
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
    user_ids: canFilterUsers.value ? [...selectedUserIds.value] : [],
    statuses: [...selectedStatuses.value],
    priorities: [...selectedPriorities.value],
    fields: [...selectedFields.value],
    group_by: groupBy.value,
    ...(format.value === 'pdf' ? { pdf_layout: pdfLayout.value } : {}),
  }
  emit('generate', cfg)
}

const canSubmit = computed(
  () => selectedFields.value.length > 0 && !props.generating,
)

function statusLabel(s: TaskStatus) {
  return s.replace('_', ' ')
}
</script>

<template>
  <div>
    <p class="text-sm text-muted">
      Choose format, filters, columns, and grouping. The file is saved on the server
      and listed under Saved reports on this page.
    </p>

    <div class="mt-4 space-y-4">
      <UiFormSection title="Format">
        <UiSegmentedControl
          v-model="format"
          aria-label="Report format"
          :options="[...FORMAT_OPTIONS]"
        />
      </UiFormSection>

      <UiFormSection v-if="format === 'pdf'" title="PDF layout">
        <UiSegmentedControl
          v-model="pdfLayout"
          aria-label="PDF layout"
          :options="PDF_LAYOUT_OPTIONS"
        />
        <p class="mt-2 text-xs text-muted">
          Table: columns like a spreadsheet. List: each task as labeled lines.
          PDF uses embedded Unicode fonts (UTF-8, including Cyrillic).
        </p>
      </UiFormSection>

      <div class="grid gap-4 sm:grid-cols-2">
        <UiInput
          id="rep-from"
          v-model="dateFrom"
          type="date"
          label="Created from"
        />
        <UiInput
          id="rep-to"
          v-model="dateTo"
          type="date"
          label="Created to"
        />
      </div>

      <UiFormSection title="Projects (empty = all you can access)">
        <div
          v-if="!projectStore.projects.length"
          class="text-sm text-muted"
        >
          No projects loaded.
        </div>
        <UiScrollPanel v-else>
          <UiCheckboxRow
            v-for="p in projectStore.projects"
            :key="p.id"
            v-model="selectedProjectIds"
            :value="p.id"
          >
            {{ p.name }}
          </UiCheckboxRow>
        </UiScrollPanel>
      </UiFormSection>

      <div v-if="canFilterUsers">
        <UiFormSection title="Users (empty = all tasks; otherwise assignee or project owner in list)">
          <div
            v-if="loadingUsers"
            class="text-sm text-muted"
          >
            Loading users…
          </div>
          <UiScrollPanel v-else>
            <UiCheckboxRow
              v-for="u in users"
              :key="u.id"
              v-model="selectedUserIds"
              :value="u.id"
            >
              <span class="truncate">{{ u.name || u.email }}</span>
              <span class="text-xs text-muted">({{ u.email }})</span>
            </UiCheckboxRow>
          </UiScrollPanel>
        </UiFormSection>
      </div>

      <UiFormSection title="Statuses">
        <template #actions>
          <UiTextAction
            @click="
              toggleAllStatuses(selectedStatuses.length < statusOptions.length)
            "
          >
            {{
              selectedStatuses.length < statusOptions.length
                ? 'Select all'
                : 'Clear'
            }}
          </UiTextAction>
        </template>
        <div class="flex flex-wrap gap-2">
          <UiFilterChip
            v-for="s in statusOptions"
            :key="s"
            v-model="selectedStatuses"
            :value="s"
          >
            {{ statusLabel(s) }}
          </UiFilterChip>
        </div>
      </UiFormSection>

      <UiFormSection title="Priorities">
        <template #actions>
          <UiTextAction
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
          </UiTextAction>
        </template>
        <div class="flex flex-wrap gap-2">
          <UiFilterChip
            v-for="pr in priorityOptions"
            :key="pr"
            v-model="selectedPriorities"
            :value="pr"
          >
            {{ pr }}
          </UiFilterChip>
        </div>
      </UiFormSection>

      <UiFormSection title="Columns">
        <template #actions>
          <UiTextAction
            @click="
              toggleAllFields(selectedFields.length < fieldDefs.length)
            "
          >
            {{
              selectedFields.length < fieldDefs.length ? 'Select all' : 'Clear'
            }}
          </UiTextAction>
        </template>
        <div class="flex flex-wrap gap-2">
          <UiFilterChip
            v-for="f in fieldDefs"
            :key="f.key"
            v-model="selectedFields"
            :value="f.key"
          >
            {{ f.label }}
          </UiFilterChip>
        </div>
        <p
          v-if="selectedFields.length === 0"
          class="mt-2 text-xs text-destructive"
        >
          Select at least one column.
        </p>
      </UiFormSection>

      <UiSelect
        id="rep-group"
        v-model="groupBy"
        label="Group by"
        class="max-w-xs"
        :block="false"
        placeholder="None"
        :options="groupSelectOptions"
      />
    </div>

    <div class="mt-6">
      <UiButton
        type="button"
        :disabled="!canSubmit"
        :loading="generating"
        @click="submit"
      >
        {{ generating ? 'Saving…' : 'Generate report' }}
      </UiButton>
    </div>
  </div>
</template>
