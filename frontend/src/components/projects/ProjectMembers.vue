<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useToast } from '../../composables/useToast'
import { useAuthStore } from '../../stores/auth.store'
import { useProjectStore } from '../../stores/project.store'
import type { ProjectMemberRole, TaskTransfer, TaskTransferMode } from '../../types/project'
import type { Task } from '../../types/task'
import Avatar from '../ui/UiAvatar.vue'
import Button from '../ui/UiButton.vue'
import UiMenuButton from '../ui/UiMenuButton.vue'
import type { UiSelectOption } from '../ui/UiSelect.vue'
import ManualTaskTransfer from './ManualTaskTransfer.vue'
import TaskTransferModal from './TaskTransferModal.vue'

const props = defineProps<{
  projectId: number
}>()

const auth = useAuthStore()
const projectStore = useProjectStore()
const toast = useToast()

const taskTransferOpen = ref(false)
const manualTransferOpen = ref(false)
const removingMemberId = ref<number | null>(null)
const memberTasks = ref<Task[]>([])

const project = computed(() =>
  projectStore.current?.id === props.projectId
    ? projectStore.current
    : projectStore.projects.find((p) => p.id === props.projectId),
)

const callerRole = computed(() => project.value?.caller_project_role)

const canManage = computed(() => {
  if (auth.user?.role === 'admin' || auth.user?.role === 'staff') return true
  const r = callerRole.value
  return r === 'owner' || r === 'manager'
})

const roleMenuOptions: UiSelectOption<ProjectMemberRole>[] = [
  { value: 'manager', label: 'Manager' },
  { value: 'executor', label: 'Executor' },
  { value: 'viewer', label: 'Viewer' },
]

watch(
  () => props.projectId,
  (pid) => {
    if (Number.isFinite(pid) && pid > 0) {
      void projectStore.fetchMembers(pid).catch(() => {})
    }
  },
)

async function onRoleChange(userId: number, role: ProjectMemberRole) {
  try {
    await projectStore.updateMemberRole(props.projectId, userId, role)
    toast.success('Role updated')
  } catch {
    toast.error('Could not update role')
  }
}

async function onRemove(userId: number) {
  removingMemberId.value = userId
  try {
    const checkResult = await projectStore.removeMember(
      props.projectId,
      userId,
      'manual',
    )

    if (!checkResult.task_count || checkResult.task_count === 0) {
      toast.success('Member removed')
      removingMemberId.value = null
      return
    }

    memberTasks.value = checkResult.tasks || []
    taskTransferOpen.value = true
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    toast.error(
      typeof err.response?.data?.error === 'string'
        ? err.response.data.error
        : 'Could not remove member',
    )
    removingMemberId.value = null
  }
}

async function onTransferSelect(mode: TaskTransferMode, targetUserId?: number) {
  if (!removingMemberId.value) return

  try {
    const result = await projectStore.removeMember(
      props.projectId,
      removingMemberId.value,
      mode,
      targetUserId,
    )
    toast.success(
      `Member removed, ${result.task_count} tasks ${mode === 'unassigned' ? 'unassigned' : 'transferred'}`,
    )
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    toast.error(
      typeof err.response?.data?.error === 'string'
        ? err.response.data.error
        : 'Could not remove member',
    )
  } finally {
    removingMemberId.value = null
    memberTasks.value = []
  }
}

async function onManualApply(transfers: TaskTransfer[]) {
  if (!removingMemberId.value) return

  try {
    const result = await projectStore.applyTaskTransfers(
      props.projectId,
      removingMemberId.value,
      transfers,
    )
    toast.success(`${result.transferred} tasks transferred, member removed`)
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    toast.error(
      typeof err.response?.data?.error === 'string'
        ? err.response.data.error
        : 'Could not transfer tasks and remove member',
    )
  } finally {
    removingMemberId.value = null
    memberTasks.value = []
    manualTransferOpen.value = false
  }
}

function onManualCancel() {
  removingMemberId.value = null
  memberTasks.value = []
  manualTransferOpen.value = false
  taskTransferOpen.value = true
}

function onOpenManualTransfer() {
  manualTransferOpen.value = true
  taskTransferOpen.value = false
}

function getMemberName(userId: number): string {
  const member = memberRows.value.find((m) => m.user_id === userId)
  if (member) {
    return member.user.name || member.user.email
  }
  return ''
}

const memberRows = computed(() =>
  Array.isArray(projectStore.members) ? projectStore.members : [],
)

function roleBadgeClass(r: string) {
  switch (r) {
    case 'manager':
      return 'bg-sky-500/15 text-sky-800 dark:text-sky-200'
    case 'executor':
      return 'bg-amber-500/15 text-amber-900 dark:text-amber-200'
    default:
      return 'bg-surface-muted text-muted'
  }
}

function displayName(u: { name?: string; email: string }) {
  return u.name?.trim() || u.email
}
</script>

<template>
  <div
    v-if="Number.isFinite(projectId) && projectId > 0"
    class="space-y-4"
  >
    <div
      class="overflow-hidden rounded-md border border-border"
      aria-label="Project members"
    >
      <div class="divide-y divide-border">
        <div
          v-if="project?.owner"
          class="flex flex-wrap items-center gap-3 px-3 py-3"
        >
          <Avatar
            class="h-9 w-9 shrink-0"
            :label="displayName(project.owner)"
          />
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-medium text-foreground">
              {{ displayName(project.owner) }}
            </div>
            <div class="truncate text-xs text-muted">
              {{ project.owner.email }}
            </div>
          </div>
          <span
            class="shrink-0 rounded-md bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary"
          >
            Owner
          </span>
        </div>

        <div
          v-for="m in memberRows"
          :key="m.id"
          class="flex flex-wrap items-center gap-3 px-3 py-3"
        >
          <Avatar class="h-9 w-9 shrink-0" :label="displayName(m.user)" />
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-medium text-foreground">
              {{ displayName(m.user) }}
            </div>
            <div class="truncate text-xs text-muted">
              {{ m.user.email }}
            </div>
          </div>
          <span
            class="shrink-0 rounded-md px-2 py-0.5 text-xs font-medium capitalize"
            :class="roleBadgeClass(m.role)"
          >
            {{ m.role }}
          </span>
          <div v-if="canManage" class="flex shrink-0 items-center gap-1">
            <UiMenuButton
              variant="field"
              ariaLabel="Change role"
              title="Change role"
              placement="bottom-end"
              placeholder="Role…"
              class="min-w-[6.5rem]"
              :options="roleMenuOptions"
              @select="
                onRoleChange(m.user_id, String($event) as ProjectMemberRole)
              "
            />
            <Button
              type="button"
              variant="ghost-danger"
              class="text-xs"
              @click="onRemove(m.user_id)"
            >
              Remove
            </Button>
          </div>
        </div>

        <p
          v-if="!memberRows.length && !project?.owner"
          class="px-3 py-6 text-center text-sm text-muted"
        >
          No members loaded.
        </p>
      </div>
    </div>

    <TaskTransferModal
      v-model="taskTransferOpen"
      :member-id="removingMemberId ?? 0"
      :member-name="getMemberName(removingMemberId ?? 0)"
      :task-count="memberTasks.length"
      :available-assignees="projectStore.assignableUsers"
      @select="onTransferSelect"
      @manual="onOpenManualTransfer"
    />

    <ManualTaskTransfer
      v-model="manualTransferOpen"
      :project-id="props.projectId"
      :member-id="removingMemberId ?? 0"
      :member-name="getMemberName(removingMemberId ?? 0)"
      :tasks="memberTasks"
      :available-assignees="projectStore.assignableUsers"
      @apply="onManualApply"
      @cancel="onManualCancel"
    />
  </div>
</template>
