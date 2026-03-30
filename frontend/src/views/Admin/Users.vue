<script setup lang="ts">
import {
  Cog6ToothIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'
import { computed, onMounted, ref } from 'vue'
import AdminUserModal from '../../components/admin/AdminUserModal.vue'
import Avatar from '../../components/ui/UiAvatar.vue'
import Breadcrumb from '../../components/ui/UiBreadcrumb.vue'
import Button from '../../components/ui/UiButton.vue'
import EmptyState from '../../components/ui/UiEmptyState.vue'
import UiMenuButton from '../../components/ui/UiMenuButton.vue'
import Skeleton from '../../components/ui/UiSkeleton.vue'
import type { UiSelectOption } from '../../components/ui/UiSelect.vue'
import type { User, UserRole } from '../../types/user'
import { useConfirm } from '../../composables/useConfirm'
import { useToast } from '../../composables/useToast'
import { useAuthStore } from '../../stores/auth.store'
import { api } from '../../utils/api'

const { confirm } = useConfirm()
const toast = useToast()
const auth = useAuthStore()
const users = ref<User[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const roleSavingId = ref<number | null>(null)

const isAdmin = computed(() => auth.user?.role === 'admin')
const isStaff = computed(() => auth.user?.role === 'staff')

const roleMenuOptions: UiSelectOption<string>[] = [
  { value: 'user', label: 'User' },
  { value: 'creator', label: 'Creator' },
  { value: 'staff', label: 'Staff' },
]

const modalOpen = ref(false)
const modalMode = ref<'create' | 'edit' | 'view'>('create')
const modalUser = ref<User | null>(null)

function dashOr(s?: string | null) {
  const t = s?.trim()
  return t || '—'
}

function primaryLine(u: User): string {
  const n = u.name?.trim()
  if (n) return n
  const fio = [u.last_name, u.first_name, u.patronymic]
    .map((x) => x?.trim())
    .filter(Boolean)
    .join(' ')
  if (fio) return fio
  return u.email
}

function secondaryLine(u: User): string | null {
  if (primaryLine(u) === u.email) return null
  return u.email
}

function roleBadgeClass(r: UserRole) {
  switch (r) {
    case 'admin':
      return 'bg-red-500/15 text-red-800 dark:text-red-200'
    case 'staff':
      return 'bg-violet-500/15 text-violet-800 dark:text-violet-200'
    case 'creator':
      return 'bg-sky-500/15 text-sky-800 dark:text-sky-200'
    default:
      return 'bg-surface-muted text-muted'
  }
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const { data } = await api.get<{ users: User[] }>('/users')
    users.value = data.users
  } catch {
    error.value = 'Failed to load users (staff or admin only).'
  } finally {
    loading.value = false
  }
}

onMounted(() => load())

function openCreate() {
  modalMode.value = 'create'
  modalUser.value = null
  modalOpen.value = true
}

function openEdit(u: User) {
  modalMode.value = 'edit'
  modalUser.value = u
  modalOpen.value = true
}

function openView(u: User) {
  modalMode.value = 'view'
  modalUser.value = u
  modalOpen.value = true
}

async function remove(u: User) {
  const ok = await confirm({
    title: 'Delete user',
    message: `Delete user ${u.email}?`,
    confirmLabel: 'Delete',
    danger: true,
  })
  if (!ok) return
  try {
    await api.delete(`/users/${u.id}`)
    await load()
    toast.success('User deleted')
  } catch {
    const msg = 'Could not delete user.'
    error.value = msg
    toast.error(msg)
  }
}

async function applyRole(u: User, newRole: string) {
  if (newRole === u.role) return
  roleSavingId.value = u.id
  try {
    await api.patch(`/users/${u.id}/role`, { role: newRole })
    await load()
    toast.success('Role updated')
  } catch {
    toast.error('Could not update role')
  } finally {
    roleSavingId.value = null
  }
}

function isSelf(u: User) {
  return auth.user?.id === u.id
}
</script>

<template>
  <div>
    <Breadcrumb
      class="mb-4"
      :items="[
        { label: 'Home', to: '/dashboard' },
        { label: 'Users' },
      ]"
    />
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">Users</h1>
        <p class="mt-1 text-sm text-muted">
          {{
            isAdmin
              ? 'Manage accounts and global roles'
              : isStaff
                ? 'Directory — view all users (editing is admin-only)'
                : 'Directory (read-only)'
          }}
        </p>
      </div>
      <Button v-if="isAdmin" type="button" @click="openCreate">New user</Button>
    </div>

    <AdminUserModal
      v-model="modalOpen"
      :mode="modalMode"
      :user="modalUser"
      :delete-disabled="modalUser ? isSelf(modalUser) : false"
      @saved="load"
    />

    <p v-if="error" class="mt-4 text-sm text-destructive">{{ error }}</p>
    <div v-if="loading" class="mt-8 space-y-3">
      <div
        v-for="i in 5"
        :key="i"
        class="flex items-center gap-4 rounded-lg border border-border bg-surface p-4"
      >
        <Skeleton variant="avatar" />
        <div class="min-w-0 flex-1 space-y-2">
          <Skeleton variant="line" />
          <Skeleton variant="line" :lines="2" />
        </div>
        <div class="hidden w-24 shrink-0 sm:block">
          <Skeleton variant="line" />
        </div>
      </div>
    </div>

    <EmptyState
      v-else-if="!users.length"
      class="mt-8"
      title="No users"
      description="No user accounts are visible in this environment."
    />

    <!-- Mobile -->
    <div v-else class="mt-8 space-y-3 md:hidden">
      <div
        v-for="u in users"
        :key="u.id"
        class="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm"
      >
        <div class="flex items-start gap-3">
          <Avatar :email="u.email" :name="u.name" />
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium text-foreground">{{ primaryLine(u) }}</p>
            <p v-if="secondaryLine(u)" class="truncate text-sm text-muted">{{ secondaryLine(u) }}</p>
          </div>
        </div>

        <div class="min-w-0 space-y-1.5">
          <p class="break-words text-sm font-medium leading-snug text-foreground">
            {{ dashOr(u.job_title) }}
          </p>
          <p
            class="truncate text-xs text-muted"
            :title="u.department?.trim() ? u.department : undefined"
          >
            {{ dashOr(u.department) }}
          </p>
          <p class="truncate text-xs text-muted">{{ dashOr(u.phone) }}</p>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2">
          <span
            class="inline-flex w-fit rounded px-2 py-0.5 text-xs font-medium"
            :class="roleBadgeClass(u.role)"
            >{{ u.role }}</span
          >
          <div class="flex flex-wrap items-center justify-end gap-1.5">
            <template v-if="isAdmin">
              <Button
                type="button"
                variant="secondary"
                class="h-8 min-h-8 w-8 min-w-8 !px-0"
                :aria-label="`Edit ${u.email}`"
                :title="`Edit ${u.email}`"
                @click.stop="openEdit(u)"
              >
                <PencilSquareIcon class="h-4 w-4 shrink-0" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost-danger"
                class="h-8 min-h-8 w-8 min-w-8 !px-0"
                :disabled="isSelf(u)"
                :aria-label="`Delete ${u.email}`"
                :title="isSelf(u) ? 'Cannot delete your own account' : `Delete ${u.email}`"
                @click.stop="remove(u)"
              >
                <TrashIcon class="h-4 w-4 shrink-0" aria-hidden="true" />
              </Button>
            </template>
            <Button
              v-else-if="isStaff"
              type="button"
              variant="secondary"
              class="h-8 min-h-8 w-8 min-w-8 !px-0"
              :aria-label="`View ${u.email}`"
              :title="`View ${u.email}`"
              @click.stop="openView(u)"
            >
              <EyeIcon class="h-4 w-4 shrink-0" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div v-if="isAdmin && u.role !== 'admin'" class="flex items-center gap-2">
          <span class="text-xs font-medium text-muted">Change role</span>
          <UiMenuButton
            :key="`${u.id}-${u.role}`"
            :model-value="u.role"
            :ariaLabel="`Change role for ${u.email}, current ${u.role}`"
            :title="`Change role (now ${u.role})`"
            :options="roleMenuOptions"
            :disabled="roleSavingId === u.id"
            :min-panel-width="180"
            @select="(v) => applyRole(u, String(v))"
          >
            <Cog6ToothIcon class="h-5 w-5" aria-hidden="true" />
          </UiMenuButton>
        </div>
      </div>
    </div>

    <!-- Desktop -->
    <div
      v-if="!loading && users.length"
      class="mt-8 hidden overflow-x-auto rounded-lg border border-border md:block"
    >
      <table class="w-full min-w-[42rem] border-collapse text-left text-sm">
        <thead>
          <tr class="border-b border-border bg-surface-muted">
            <th class="px-4 py-3 font-semibold text-foreground">User</th>
            <th class="px-4 py-3 font-semibold text-foreground">Info</th>
            <th class="px-4 py-3 font-semibold text-foreground">Phone</th>
            <th class="px-4 py-3 font-semibold text-foreground">Role</th>
            <th class="px-4 py-3 text-right font-semibold text-foreground">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border bg-surface">
          <tr v-for="u in users" :key="u.id" class="hover:bg-surface-muted/80">
            <td class="px-4 py-3 align-middle">
              <div class="flex min-w-0 items-center gap-3">
                <Avatar :email="u.email" :name="u.name" />
                <div class="min-w-0">
                  <p class="truncate font-medium text-foreground">{{ primaryLine(u) }}</p>
                  <p v-if="secondaryLine(u)" class="truncate text-xs text-muted">
                    {{ secondaryLine(u) }}
                  </p>
                </div>
              </div>
            </td>
            <td class="min-w-[11rem] max-w-[22rem] overflow-hidden px-4 py-3 align-middle">
              <p class="break-words text-sm font-medium leading-snug text-foreground">
                {{ dashOr(u.job_title) }}
              </p>
              <p
                class="mt-1 truncate text-xs text-muted"
                :title="u.department?.trim() ? u.department : undefined"
              >
                {{ dashOr(u.department) }}
              </p>
            </td>
            <td class="max-w-[10rem] min-w-[6rem] px-4 py-3 align-middle text-xs text-muted">
              <span class="block truncate">{{ dashOr(u.phone) }}</span>
            </td>
            <td class="px-4 py-3 align-middle">
              <div class="flex max-w-[14rem] flex-wrap items-center gap-2">
                <span
                  class="inline-flex w-fit rounded px-2 py-0.5 text-xs font-medium"
                  :class="roleBadgeClass(u.role)"
                  >{{ u.role }}</span
                >
                <UiMenuButton
                  v-if="isAdmin && u.role !== 'admin'"
                  :key="`${u.id}-${u.role}`"
                  :model-value="u.role"
                  :ariaLabel="`Change role for ${u.email}, current ${u.role}`"
                  :title="`Change role (now ${u.role})`"
                  :options="roleMenuOptions"
                  :disabled="roleSavingId === u.id"
                  :min-panel-width="180"
                  @select="(v) => applyRole(u, String(v))"
                >
                  <Cog6ToothIcon class="h-5 w-5" aria-hidden="true" />
                </UiMenuButton>
              </div>
            </td>
            <td class="px-4 py-3 text-right align-middle">
              <div class="inline-flex flex-wrap items-center justify-end gap-1.5">
                <template v-if="isAdmin">
                  <Button
                    type="button"
                    variant="secondary"
                    class="h-8 min-h-8 w-8 min-w-8 !px-0"
                    :aria-label="`Edit ${u.email}`"
                    :title="`Edit ${u.email}`"
                    @click.stop="openEdit(u)"
                  >
                    <PencilSquareIcon class="h-4 w-4 shrink-0" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost-danger"
                    class="h-8 min-h-8 w-8 min-w-8 !px-0"
                    :disabled="isSelf(u)"
                    :aria-label="`Delete ${u.email}`"
                    :title="
                      isSelf(u) ? 'Cannot delete your own account' : `Delete ${u.email}`
                    "
                    @click.stop="remove(u)"
                  >
                    <TrashIcon class="h-4 w-4 shrink-0" aria-hidden="true" />
                  </Button>
                </template>
                <Button
                  v-else-if="isStaff"
                  type="button"
                  variant="secondary"
                  class="h-8 min-h-8 w-8 min-w-8 !px-0"
                  :aria-label="`View ${u.email}`"
                  :title="`View ${u.email}`"
                  @click.stop="openView(u)"
                >
                  <EyeIcon class="h-4 w-4 shrink-0" aria-hidden="true" />
                </Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
