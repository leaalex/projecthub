<script setup lang="ts">
import {
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'
import {
  PaintBrushIcon,
  UserIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/vue/20/solid'
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import AdminUserModal from '../../components/admin/AdminUserModal.vue'
import Avatar from '../../components/ui/UiAvatar.vue'
import Breadcrumb from '../../components/ui/UiBreadcrumb.vue'
import Button from '../../components/ui/UiButton.vue'
import EmptyState from '../../components/ui/UiEmptyState.vue'
import UiIconSelect from '../../components/ui/UiIconSelect.vue'
import type { UiIconSelectOption } from '../../components/ui/UiIconSelect.vue'
import Skeleton from '../../components/ui/UiSkeleton.vue'
import { isAdminRole } from '@domain/user/role'
import type { User, UserRole } from '@domain/user/types'
import { useConfirm } from '@app/composables/useConfirm'
import { useToast } from '@app/composables/useToast'
import { useAuthStore } from '@app/auth.store'
import { useUserStore } from '@app/user.store'

const { t, te } = useI18n()

function roleLabel(role: string): string {
  const key = `enums.userRole.${role}`
  return te(key) ? t(key) : role
}
const { confirm } = useConfirm()
const toast = useToast()
const auth = useAuthStore()
const userStore = useUserStore()
const { users, loading, savingId } = storeToRefs(userStore)
const error = ref<string | null>(null)
/** Until first fetch completes (store `loading` is false before onMounted). */
const bootstrapping = ref(true)

const isAdmin = computed(() => isAdminRole(auth.user?.role))
const isStaff = computed(() => auth.user?.role === 'staff')

const roleIconSelectOptions = computed((): UiIconSelectOption<UserRole>[] => [
  { value: 'user', label: roleLabel('user'), icon: UserIcon },
  { value: 'creator', label: roleLabel('creator'), icon: PaintBrushIcon },
  { value: 'staff', label: roleLabel('staff'), icon: WrenchScrewdriverIcon },
])

const modalOpen = ref(false)
const modalMode = ref<'create' | 'edit' | 'view'>('create')
const modalUser = ref<User | null>(null)

function trimOrDash(s?: string | null) {
  const x = s?.trim()
  return x || t('common.dash')
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
  error.value = null
  try {
    await userStore.fetchList()
  } catch {
    error.value = t('admin.users.errors.loadFailed')
  } finally {
    bootstrapping.value = false
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
    title: t('admin.users.confirm.deleteTitle'),
    message: t('admin.users.confirm.deleteMessage', { email: u.email }),
    confirmLabelKey: 'admin.users.confirm.deleteConfirm',
    danger: true,
  })
  if (!ok) return
  try {
    await userStore.remove(u.id)
    toast.success(t('admin.users.toasts.userDeleted'))
  } catch {
    const msg = t('admin.users.errors.deleteFailed')
    error.value = msg
    toast.error(msg)
  }
}

async function applyRole(u: User, newRole: string) {
  if (newRole === u.role) return
  try {
    await userStore.updateRole(u.id, newRole as UserRole)
    toast.success(t('admin.users.toasts.roleUpdated'))
  } catch {
    toast.error(t('admin.users.errors.roleFailed'))
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
        { label: t('common.home'), to: '/dashboard' },
        { label: t('admin.users.title') },
      ]"
    />
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">{{ t('admin.users.title') }}</h1>
        <p class="mt-1 text-sm text-muted">
          {{
            isAdmin
              ? t('admin.users.subtitleAdmin')
              : isStaff
                ? t('admin.users.subtitleStaff')
                : t('admin.users.subtitleReadonly')
          }}
        </p>
      </div>
      <Button v-if="isAdmin" type="button" @click="openCreate">{{
        t('admin.users.newUser')
      }}</Button>
    </div>

    <AdminUserModal
      v-model="modalOpen"
      :mode="modalMode"
      :user="modalUser"
      :delete-disabled="modalUser ? isSelf(modalUser) : false"
    />

    <p v-if="error" class="mt-4 text-sm text-destructive">{{ error }}</p>
    <div v-if="loading || bootstrapping" class="mt-8 space-y-3">
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
      v-else-if="!bootstrapping && !users.length"
      class="mt-8"
      :title="t('admin.users.empty.title')"
      :description="t('admin.users.empty.description')"
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
            {{ trimOrDash(u.job_title) }}
          </p>
          <p
            class="truncate text-xs text-muted"
            :title="u.department?.trim() ? u.department : undefined"
          >
            {{ trimOrDash(u.department) }}
          </p>
          <p class="truncate text-xs text-muted">{{ trimOrDash(u.phone) }}</p>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2">
          <template v-if="!isAdmin || u.role === 'admin'">
            <span
              class="inline-flex w-fit rounded px-2 py-0.5 text-xs font-medium"
              :class="roleBadgeClass(u.role)"
              >{{ roleLabel(u.role) }}</span
            >
          </template>
          <UiIconSelect
            v-else
            :key="`${u.id}-${u.role}`"
            :model-value="u.role"
            :block="false"
            class="min-w-0 max-w-[11rem] flex-1"
            :aria-label="
              t('admin.users.aria.changeRole', { email: u.email, role: roleLabel(u.role) })
            "
            :trigger-title="t('admin.users.aria.changeRoleTitle', { role: roleLabel(u.role) })"
            :placeholder="t('admin.users.form.rolePlaceholder')"
            :options="roleIconSelectOptions"
            :disabled="savingId === u.id"
            @update:model-value="applyRole(u, String($event))"
          />
          <div class="flex flex-wrap items-center justify-end gap-1.5">
            <template v-if="isAdmin">
              <Button
                type="button"
                variant="secondary"
                class="h-8 min-h-8 w-8 min-w-8 !px-0"
                :aria-label="t('admin.users.aria.edit', { email: u.email })"
                :title="t('admin.users.aria.edit', { email: u.email })"
                @click.stop="openEdit(u)"
              >
                <PencilSquareIcon class="h-4 w-4 shrink-0" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost-danger"
                class="h-8 min-h-8 w-8 min-w-8 !px-0"
                :disabled="isSelf(u)"
                :aria-label="t('admin.users.aria.delete', { email: u.email })"
                :title="
                  isSelf(u)
                    ? t('admin.users.cannotDeleteSelf')
                    : t('admin.users.aria.delete', { email: u.email })
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
              :aria-label="t('admin.users.aria.view', { email: u.email })"
              :title="t('admin.users.aria.view', { email: u.email })"
              @click.stop="openView(u)"
            >
              <EyeIcon class="h-4 w-4 shrink-0" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop -->
    <div
      v-if="!loading && !bootstrapping && users.length"
      class="mt-8 hidden overflow-x-auto rounded-lg border border-border md:block"
    >
      <table class="w-full min-w-[42rem] border-collapse text-left text-sm">
        <thead>
          <tr class="border-b border-border bg-surface-muted">
            <th class="px-4 py-3 font-semibold text-foreground">{{ t('admin.users.table.user') }}</th>
            <th class="px-4 py-3 font-semibold text-foreground">{{ t('admin.users.table.info') }}</th>
            <th class="px-4 py-3 font-semibold text-foreground">{{ t('admin.users.table.phone') }}</th>
            <th class="px-4 py-3 font-semibold text-foreground">{{ t('admin.users.table.role') }}</th>
            <th class="px-4 py-3 text-right font-semibold text-foreground">{{ t('admin.users.table.actions') }}</th>
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
                {{ trimOrDash(u.job_title) }}
              </p>
              <p
                class="mt-1 truncate text-xs text-muted"
                :title="u.department?.trim() ? u.department : undefined"
              >
                {{ trimOrDash(u.department) }}
              </p>
            </td>
            <td class="max-w-[10rem] min-w-[6rem] px-4 py-3 align-middle text-xs text-muted">
              <span class="block truncate">{{ trimOrDash(u.phone) }}</span>
            </td>
            <td class="px-4 py-3 align-middle">
              <div class="flex max-w-[16rem] flex-wrap items-center gap-2">
                <template v-if="!isAdmin || u.role === 'admin'">
                  <span
                    class="inline-flex w-fit rounded px-2 py-0.5 text-xs font-medium"
                    :class="roleBadgeClass(u.role)"
                    >{{ roleLabel(u.role) }}</span
                  >
                </template>
                <UiIconSelect
                  v-else
                  :key="`${u.id}-${u.role}`"
                  :model-value="u.role"
                  :block="false"
                  class="min-w-[7.5rem]"
                  :aria-label="
                    t('admin.users.aria.changeRole', {
                      email: u.email,
                      role: roleLabel(u.role),
                    })
                  "
                  :trigger-title="t('admin.users.aria.changeRoleTitle', { role: roleLabel(u.role) })"
                  :placeholder="t('admin.users.form.rolePlaceholder')"
                  :options="roleIconSelectOptions"
                  :disabled="savingId === u.id"
                  @update:model-value="applyRole(u, String($event))"
                />
              </div>
            </td>
            <td class="px-4 py-3 text-right align-middle">
              <div class="inline-flex flex-wrap items-center justify-end gap-1.5">
                <template v-if="isAdmin">
                  <Button
                    type="button"
                    variant="secondary"
                    class="h-8 min-h-8 w-8 min-w-8 !px-0"
                    :aria-label="t('admin.users.aria.edit', { email: u.email })"
                    :title="t('admin.users.aria.edit', { email: u.email })"
                    @click.stop="openEdit(u)"
                  >
                    <PencilSquareIcon class="h-4 w-4 shrink-0" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost-danger"
                    class="h-8 min-h-8 w-8 min-w-8 !px-0"
                    :disabled="isSelf(u)"
                    :aria-label="t('admin.users.aria.delete', { email: u.email })"
                    :title="
                      isSelf(u)
                        ? t('admin.users.cannotDeleteSelf')
                        : t('admin.users.aria.delete', { email: u.email })
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
                  :aria-label="t('admin.users.aria.view', { email: u.email })"
                  :title="t('admin.users.aria.view', { email: u.email })"
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
