<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useToast } from '../../composables/useToast'
import { useAuthStore } from '../../stores/auth.store'
import { useProjectStore } from '../../stores/project.store'
import type { ProjectMemberRole } from '../../types/project'
import type { User } from '../../types/user'
import { api } from '../../utils/api'
import Avatar from '../ui/UiAvatar.vue'
import Button from '../ui/UiButton.vue'
import UiInput from '../ui/UiInput.vue'
import UiMenuButton from '../ui/UiMenuButton.vue'
import type { UiSelectOption } from '../ui/UiSelect.vue'
import UiSelect from '../ui/UiSelect.vue'

const props = defineProps<{
  projectId: number
}>()

const auth = useAuthStore()
const projectStore = useProjectStore()
const toast = useToast()

const addOpen = ref(false)
const addMode = ref<'email' | 'user'>('email')
const addEmail = ref('')
const addUserId = ref<string>('')
const addRole = ref<ProjectMemberRole>('viewer')
const adding = ref(false)
const staffUsers = ref<User[]>([])
const loadingUsers = ref(false)

const transferOpen = ref(false)
const transferTo = ref<string>('')
const transferring = ref(false)

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

const showTransfer = computed(
  () => auth.user?.role === 'admin' || auth.user?.role === 'staff',
)

const roleMenuOptions: UiSelectOption<ProjectMemberRole>[] = [
  { value: 'manager', label: 'Manager' },
  { value: 'executor', label: 'Executor' },
  { value: 'viewer', label: 'Viewer' },
]

async function loadStaffUsers() {
  if (auth.user?.role !== 'admin' && auth.user?.role !== 'staff') return
  loadingUsers.value = true
  try {
    const { data } = await api.get<{ users: User[] }>('/users')
    staffUsers.value = data.users
  } catch {
    staffUsers.value = []
  } finally {
    loadingUsers.value = false
  }
}

watch(addOpen, (o) => {
  if (o) {
    transferOpen.value = false
    addEmail.value = ''
    addUserId.value = ''
    addRole.value = 'viewer'
    addMode.value =
      auth.user?.role === 'admin' || auth.user?.role === 'staff'
        ? 'user'
        : 'email'
    void loadStaffUsers()
  }
})

watch(transferOpen, (o) => {
  if (o) {
    addOpen.value = false
    transferTo.value = ''
  }
})

watch(
  () => props.projectId,
  (pid) => {
    if (Number.isFinite(pid) && pid > 0) {
      void projectStore.fetchMembers(pid).catch(() => {})
    }
  },
)

const userSelectOptions = computed(() =>
  staffUsers.value.map((u) => ({
    value: String(u.id),
    label: u.name?.trim() ? `${u.name} (${u.email})` : u.email,
  })),
)

async function onAdd() {
  adding.value = true
  try {
    if (addMode.value === 'email') {
      const e = addEmail.value.trim()
      if (!e) {
        toast.error('Enter an email')
        return
      }
      await projectStore.addMember(props.projectId, {
        email: e,
        role: addRole.value,
      })
    } else {
      const id = Number(addUserId.value)
      if (!id) {
        toast.error('Select a user')
        return
      }
      await projectStore.addMember(props.projectId, {
        user_id: id,
        role: addRole.value,
      })
    }
    toast.success('Member added')
    addOpen.value = false
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    toast.error(
      typeof err.response?.data?.error === 'string'
        ? err.response.data.error
        : 'Could not add member',
    )
  } finally {
    adding.value = false
  }
}

async function onRoleChange(userId: number, role: ProjectMemberRole) {
  try {
    await projectStore.updateMemberRole(props.projectId, userId, role)
    toast.success('Role updated')
  } catch {
    toast.error('Could not update role')
  }
}

async function onRemove(userId: number) {
  try {
    await projectStore.removeMember(props.projectId, userId)
    toast.success('Member removed')
  } catch {
    toast.error('Could not remove member')
  }
}

const memberRows = computed(() =>
  Array.isArray(projectStore.members) ? projectStore.members : [],
)

const transferOptions = computed(() => {
  const opts: { value: string; label: string }[] = []
  const owner = project.value?.owner
  if (owner) {
    opts.push({
      value: String(owner.id),
      label: `${owner.name || owner.email} (current owner)`,
    })
  }
  for (const m of memberRows.value) {
    opts.push({
      value: String(m.user_id),
      label: m.user.name || m.user.email,
    })
  }
  return opts
})

async function doTransfer() {
  const nid = Number(transferTo.value)
  if (!nid) {
    toast.error('Select new owner')
    return
  }
  transferring.value = true
  try {
    await projectStore.transferOwnership(props.projectId, nid)
    toast.success('Ownership transferred')
    transferOpen.value = false
  } catch {
    toast.error('Could not transfer ownership')
  } finally {
    transferring.value = false
  }
}

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
    <div class="flex flex-wrap items-center justify-end gap-2">
      <Button
        v-if="showTransfer"
        type="button"
        variant="secondary"
        class="text-xs"
        @click="transferOpen = !transferOpen"
      >
        {{ transferOpen ? 'Cancel' : 'Transfer ownership' }}
      </Button>
      <Button
        v-if="canManage"
        type="button"
        class="text-xs"
        @click="addOpen = !addOpen"
      >
        {{ addOpen ? 'Cancel' : 'Add member' }}
      </Button>
    </div>

    <div
      class="max-h-[min(24rem,50vh)] overflow-y-auto rounded-md border border-border"
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

    <div
      v-if="transferOpen && showTransfer"
      class="space-y-4 rounded-md border border-border bg-surface-muted/40 p-4"
    >
      <p class="text-sm text-muted">
        Admin only. The previous owner will be added as a manager if needed.
      </p>
      <UiSelect
        v-model="transferTo"
        label="New owner"
        :options="transferOptions"
        placeholder="Select user…"
      />
      <div class="flex justify-end gap-2">
        <Button type="button" variant="secondary" @click="transferOpen = false">
          Cancel
        </Button>
        <Button type="button" :loading="transferring" @click="doTransfer">
          Transfer
        </Button>
      </div>
    </div>

    <div
      v-if="addOpen && canManage"
      class="space-y-4 rounded-md border border-border bg-surface-muted/40 p-4"
    >
      <div
        v-if="auth.user?.role === 'admin' || auth.user?.role === 'staff'"
        class="flex gap-2 text-xs"
      >
        <button
          type="button"
          class="rounded-md px-2 py-1"
          :class="
            addMode === 'user'
              ? 'bg-primary text-primary-foreground'
              : 'bg-surface-muted text-muted'
          "
          @click="addMode = 'user'"
        >
          Pick user
        </button>
        <button
          type="button"
          class="rounded-md px-2 py-1"
          :class="
            addMode === 'email'
              ? 'bg-primary text-primary-foreground'
              : 'bg-surface-muted text-muted'
          "
          @click="addMode = 'email'"
        >
          By email
        </button>
      </div>

      <UiSelect
        v-if="addMode === 'user'"
        v-model="addUserId"
        label="User"
        :options="userSelectOptions"
        :disabled="loadingUsers"
        placeholder="Select user…"
      />

      <UiInput
        v-else
        id="member-email"
        v-model="addEmail"
        label="Email"
        type="email"
        autocomplete="email"
        placeholder="user@example.com"
      />

      <UiSelect
        v-model="addRole"
        label="Project role"
        :options="roleMenuOptions"
      />

      <div class="flex justify-end gap-2">
        <Button type="button" variant="secondary" @click="addOpen = false">
          Cancel
        </Button>
        <Button type="button" :loading="adding" @click="onAdd">
          Add
        </Button>
      </div>
    </div>
  </div>
</template>
