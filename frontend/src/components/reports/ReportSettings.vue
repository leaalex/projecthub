<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import UiButton from '../ui/UiButton.vue'
import UiCheckboxRow from '../ui/UiCheckboxRow.vue'
import UiFilterChip from '../ui/UiFilterChip.vue'
import UiFormSection from '../ui/UiFormSection.vue'
import UiInput from '../ui/UiInput.vue'
import UiScrollPanel from '../ui/UiScrollPanel.vue'
import UiSegmentedControl from '../ui/UiSegmentedControl.vue'
import UiSelect from '../ui/UiSelect.vue'
import UiTextAction from '../ui/UiTextAction.vue'
import { useAuthStore } from '@app/auth.store'
import { useProjectStore } from '@app/project.store'
import { useUserStore } from '@app/user.store'
import type {
  ReportConfig,
  ReportFormat,
  ReportGroupBy,
  ReportPdfLayout,
} from '@domain/report/types'
import type { TaskPriority, TaskStatus } from '@domain/task/types'
import { isPrivilegedRole } from '@domain/user/role'
import { taskPriorityLabel, taskStatusLabel } from '@infra/i18n/labels'

const { t } = useI18n()

const props = defineProps<{
  generating?: boolean
}>()

const emit = defineEmits<{
  generate: [ReportConfig]
}>()

const auth = useAuthStore()
const projectStore = useProjectStore()
const userStore = useUserStore()

const canFilterUsers = computed(
  () => isPrivilegedRole(auth.user?.role),
)

const format = ref<ReportFormat>('xlsx')
const dateFrom = ref('')
const dateTo = ref('')
const selectedProjectIds = ref<number[]>([])
const selectedUserIds = ref<number[]>([])

const FORMAT_OPTIONS = computed(() =>
  (['csv', 'xlsx', 'pdf', 'txt'] as const).map((value) => ({
    value,
    label: t(`enums.reportFormat.${value}`),
  })),
)

const PDF_LAYOUT_OPTIONS = computed(() =>
  (['table', 'list'] as const).map((value) => ({
    value,
    label: t(`enums.reportPdfLayout.${value}`),
  })),
)

const pdfLayout = ref<ReportPdfLayout>('table')

const statusKeys: TaskStatus[] = ['todo', 'in_progress', 'review', 'done']
const selectedStatuses = ref<TaskStatus[]>([...statusKeys])

const priorityKeys: TaskPriority[] = ['low', 'medium', 'high', 'critical']
const selectedPriorities = ref<TaskPriority[]>([...priorityKeys])

const fieldDefs = computed(() =>
  (
    [
      'title',
      'description',
      'status',
      'priority',
      'project',
      'assignee',
      'due_date',
      'created_at',
      'updated_at',
    ] as const
  ).map((key) => ({
    key,
    label: t(`enums.reportField.${key}`),
  })),
)
const selectedFields = ref<string[]>([
  'title',
  'description',
  'status',
  'priority',
  'project',
  'assignee',
  'due_date',
  'created_at',
  'updated_at',
])

const groupBy = ref<ReportGroupBy>('')

const groupSelectOptions = computed(() =>
  (['', 'project', 'status', 'priority', 'assignee'] as const).map((value) => ({
    value,
    label:
      value === ''
        ? t('enums.reportGroupBy.none')
        : t(`enums.reportGroupBy.${value}`),
  })),
)

onMounted(async () => {
  await projectStore.fetchList().catch(() => {})
  if (canFilterUsers.value) {
    try {
      await userStore.fetchList()
    } catch {
      /* keep store list; avoid wiping admin Users view */
    }
  }
})

function toggleAllStatuses(checked: boolean) {
  selectedStatuses.value = checked ? [...statusKeys] : []
}

function toggleAllPriorities(checked: boolean) {
  selectedPriorities.value = checked ? [...priorityKeys] : []
}

function toggleAllFields(checked: boolean) {
  selectedFields.value = checked ? fieldDefs.value.map((f) => f.key) : []
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
</script>

<template>
  <div>
    <p class="text-sm text-muted">
      {{ t('reportSettings.intro') }}
    </p>

    <div class="mt-4 space-y-4">
      <UiFormSection :title="t('reportSettings.format')">
        <UiSegmentedControl
          v-model="format"
          :aria-label="t('reportSettings.formatAria')"
          :options="FORMAT_OPTIONS"
        />
      </UiFormSection>

      <UiFormSection v-if="format === 'pdf'" :title="t('reportSettings.pdfLayout')">
        <UiSegmentedControl
          v-model="pdfLayout"
          :aria-label="t('reportSettings.pdfLayoutAria')"
          :options="PDF_LAYOUT_OPTIONS"
        />
        <p class="mt-2 text-xs text-muted">
          {{ t('reportSettings.pdfHint') }}
        </p>
      </UiFormSection>

      <div class="grid gap-4 sm:grid-cols-2">
        <UiInput
          id="rep-from"
          v-model="dateFrom"
          type="date"
          :label="t('reportSettings.createdFrom')"
        />
        <UiInput
          id="rep-to"
          v-model="dateTo"
          type="date"
          :label="t('reportSettings.createdTo')"
        />
      </div>

      <UiFormSection :title="t('reportSettings.projects')">
        <div
          v-if="!projectStore.projects.length"
          class="text-sm text-muted"
        >
          {{ t('reportSettings.noProjects') }}
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
        <UiFormSection :title="t('reportSettings.users')">
          <div
            v-if="userStore.loading"
            class="text-sm text-muted"
          >
            {{ t('reportSettings.loadingUsers') }}
          </div>
          <UiScrollPanel v-else>
            <UiCheckboxRow
              v-for="u in userStore.users"
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

      <UiFormSection :title="t('reportSettings.statuses')">
        <template #actions>
          <UiTextAction
            @click="
              toggleAllStatuses(selectedStatuses.length < statusKeys.length)
            "
          >
            {{
              selectedStatuses.length < statusKeys.length
                ? t('common.selectAll')
                : t('common.clear')
            }}
          </UiTextAction>
        </template>
        <div class="flex flex-wrap gap-2">
          <UiFilterChip
            v-for="s in statusKeys"
            :key="s"
            v-model="selectedStatuses"
            :value="s"
          >
            {{ taskStatusLabel(t, s) }}
          </UiFilterChip>
        </div>
      </UiFormSection>

      <UiFormSection :title="t('reportSettings.priorities')">
        <template #actions>
          <UiTextAction
            @click="
              toggleAllPriorities(
                selectedPriorities.length < priorityKeys.length,
              )
            "
          >
            {{
              selectedPriorities.length < priorityKeys.length
                ? t('common.selectAll')
                : t('common.clear')
            }}
          </UiTextAction>
        </template>
        <div class="flex flex-wrap gap-2">
          <UiFilterChip
            v-for="pr in priorityKeys"
            :key="pr"
            v-model="selectedPriorities"
            :value="pr"
          >
            {{ taskPriorityLabel(t, pr) }}
          </UiFilterChip>
        </div>
      </UiFormSection>

      <UiFormSection :title="t('reportSettings.columns')">
        <template #actions>
          <UiTextAction
            @click="
              toggleAllFields(selectedFields.length < fieldDefs.length)
            "
          >
            {{
              selectedFields.length < fieldDefs.length
                ? t('common.selectAll')
                : t('common.clear')
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
          {{ t('reportSettings.selectOneColumn') }}
        </p>
      </UiFormSection>

      <UiSelect
        id="rep-group"
        v-model="groupBy"
        :label="t('reportSettings.groupBy')"
        class="max-w-xs"
        :block="false"
        :placeholder="t('reportSettings.groupByPlaceholder')"
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
        {{ generating ? t('reportSettings.generating') : t('reportSettings.generate') }}
      </UiButton>
    </div>
  </div>
</template>
