<script setup lang="ts">
import {
  BriefcaseIcon,
  EyeIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/vue/20/solid'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { isPrivilegedRole } from '@domain/user/role'
import { useToast } from '@app/composables/useToast'
import { useAuthStore } from '@app/auth.store'
import { useProjectStore } from '@app/project.store'
import type {
  ProjectMemberRole,
  TaskTransfer,
  TaskTransferMode,
} from '@domain/project/types'
import type { Task } from '@domain/task/types'
import Avatar from '../ui/UiAvatar.vue'
import Button from '../ui/UiButton.vue'
import UiIconSelect from '../ui/UiIconSelect.vue'
import type { UiIconSelectOption } from '../ui/UiIconSelect.vue'
import ManualTaskTransfer from './ManualTaskTransfer.vue'
import TaskTransferModal from './TaskTransferModal.vue'
import { mapApiError } from '@infra/api/errorMap'

const props = defineProps<{
  projectId: number
}>()

const auth = useAuthStore()
const projectStore = useProjectStore()
const toast = useToast()
const { t, te } = useI18n()

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
  if (isPrivilegedRole(auth.user?.role)) return true
  const r = callerRole.value
  return r === 'owner' || r === 'manager'
})

const roleMenuOptions = computed((): UiIconSelectOption<ProjectMemberRole>[] => [
  { value: 'manager', label: t('members.role.manager'), icon: BriefcaseIcon },
  {
    value: 'executor',
    label: t('members.role.executor'),
    icon: WrenchScrewdriverIcon,
  },
  { value: 'viewer', label: t('members.role.viewer'), icon: EyeIcon },
])

function displayMemberRole(role: string) {
  const key = `members.role.${role}`
  return te(key) ? t(key) : role
}

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
    toast.success(t('members.toasts.roleUpdated'))
  } catch {
    toast.error(t('members.toasts.roleFailed'))
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
      toast.success(t('members.toasts.memberRemoved'))
      removingMemberId.value = null
      return
    }

    memberTasks.value = checkResult.tasks || []
    taskTransferOpen.value = true
  } catch (e: unknown) {
    toast.error(mapApiError(e, 'members.toasts.removeFailed'))
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
      mode === 'unassigned'
        ? t('members.toasts.memberRemovedTasksUnassigned', {
            count: result.task_count,
          })
        : t('members.toasts.memberRemovedTasksTransferred', {
            count: result.task_count,
          }),
    )
  } catch (e: unknown) {
    toast.error(mapApiError(e, 'members.toasts.removeFailed'))
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
    toast.success(
      t('members.toasts.tasksTransferredMemberRemoved', {
        count: result.transferred,
      }),
    )
  } catch (e: unknown) {
    toast.error(mapApiError(e, 'members.toasts.transferRemoveFailed'))
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
      :aria-label="t('members.ariaList')"
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
            {{ t('members.owner') }}
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
            v-if="!canManage"
            class="shrink-0 rounded-md px-2 py-0.5 text-xs font-medium capitalize"
            :class="roleBadgeClass(m.role)"
          >
            {{ displayMemberRole(m.role) }}
          </span>
          <div v-if="canManage" class="flex shrink-0 items-center gap-1">
            <UiIconSelect
              :model-value="m.role"
              :block="false"
              class="min-w-[7.5rem]"
              :aria-label="t('members.changeRole')"
              :trigger-title="t('members.changeRole')"
              :placeholder="t('members.rolePlaceholder')"
              :options="roleMenuOptions"
              @update:model-value="
                onRoleChange(m.user_id, $event as ProjectMemberRole)
              "
            />
            <Button
              type="button"
              variant="ghost-danger"
              class="text-xs"
              @click="onRemove(m.user_id)"
            >
              {{ t('members.remove') }}
            </Button>
          </div>
        </div>

        <p
          v-if="!memberRows.length && !project?.owner"
          class="px-3 py-6 text-center text-sm text-muted"
        >
          {{ t('members.noMembers') }}
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
