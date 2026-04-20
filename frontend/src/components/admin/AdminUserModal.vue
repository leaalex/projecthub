<script setup lang="ts">
import { PencilSquareIcon } from '@heroicons/vue/24/outline'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '../ui/UiButton.vue'
import Input from '../ui/UiInput.vue'
import Modal from '../ui/UiModal.vue'
import UiMenuButton from '../ui/UiMenuButton.vue'
import type { UiSelectOption } from '../ui/UiSelect.vue'
import type { User, UserRole } from '@domain/user/types'
import { useConfirm } from '@app/composables/useConfirm'
import { useToast } from '@app/composables/useToast'
import { extractUserAxiosError, useUserStore } from '@app/user.store'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    mode: 'create' | 'edit' | 'view'
    user?: User | null
    /** When true, delete is disabled (e.g. editing your own account). */
    deleteDisabled?: boolean
  }>(),
  { user: null, deleteDisabled: false },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const toast = useToast()
const { confirm } = useConfirm()
const userStore = useUserStore()

const roleOptions = computed<UiSelectOption<string>[]>(() => [
  { value: 'user', label: t('admin.users.roles.user') },
  { value: 'creator', label: t('admin.users.roles.creator') },
  { value: 'staff', label: t('admin.users.roles.staff') },
])

function roleLabel(role: UserRole | undefined) {
  if (!role) return ''
  return t(`admin.users.roles.${role}`)
}

const email = ref('')
const password = ref('')
const lastName = ref('')
const firstName = ref('')
const patronymic = ref('')
const department = ref('')
const jobTitle = ref('')
const phone = ref('')
const formRole = ref<UserRole>('user')
const initialRole = ref<UserRole>('user')
const saving = ref(false)
const deleting = ref(false)

/** Локальный переход view → edit внутри модалки. */
const localEdit = ref(false)

type Snapshot = {
  email: string
  lastName: string
  firstName: string
  patronymic: string
  department: string
  jobTitle: string
  phone: string
  role: UserRole
}

const editSnapshot = ref<Snapshot | null>(null)

const title = computed(() => {
  if (props.mode === 'create') return t('admin.users.newUser')
  if (props.mode === 'view' && !localEdit.value) return t('admin.users.viewUser')
  return t('admin.users.editUser')
})

const isViewMode = computed(() => props.mode === 'view' && !localEdit.value)

/** Режим ввода (не read-only карточка). */
const isEditingUi = computed(
  () =>
    props.mode === 'create'
    || props.mode === 'edit'
    || (props.mode === 'view' && localEdit.value),
)

const canChangeRole = computed(
  () =>
    (props.mode === 'edit' || (props.mode === 'view' && localEdit.value))
    && props.user?.role !== 'admin',
)

function resetCreate() {
  email.value = ''
  password.value = ''
  lastName.value = ''
  firstName.value = ''
  patronymic.value = ''
  department.value = ''
  jobTitle.value = ''
  phone.value = ''
  formRole.value = 'user'
  editSnapshot.value = null
}

function fillFromUser(u: User) {
  email.value = u.email
  password.value = ''
  lastName.value = u.last_name ?? ''
  firstName.value = u.first_name ?? ''
  patronymic.value = u.patronymic ?? ''
  department.value = u.department ?? ''
  jobTitle.value = u.job_title ?? ''
  phone.value = u.phone ?? ''
  formRole.value = u.role
  initialRole.value = u.role
}

function captureSnapshot() {
  editSnapshot.value = {
    email: email.value,
    lastName: lastName.value,
    firstName: firstName.value,
    patronymic: patronymic.value,
    department: department.value,
    jobTitle: jobTitle.value,
    phone: phone.value,
    role: formRole.value,
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    localEdit.value = false
    if (props.mode === 'create') {
      resetCreate()
    } else if (props.user && (props.mode === 'edit' || props.mode === 'view')) {
      fillFromUser(props.user)
      captureSnapshot()
    }
  },
)

watch(localEdit, (on) => {
  if (on && props.mode === 'view' && props.user) {
    fillFromUser(props.user)
    captureSnapshot()
  }
})

const adminModalDirty = computed(() => {
  if (props.mode === 'create' || isViewMode.value) return false
  const s = editSnapshot.value
  if (!s) return false
  if (password.value.trim() !== '') return true
  return (
    email.value.trim() !== s.email
    || lastName.value.trim() !== s.lastName
    || firstName.value.trim() !== s.firstName
    || patronymic.value.trim() !== s.patronymic
    || department.value.trim() !== s.department
    || jobTitle.value.trim() !== s.jobTitle
    || phone.value.trim() !== s.phone
    || formRole.value !== s.role
  )
})

function close() {
  emit('update:modelValue', false)
}

function onFooterCancel() {
  if (props.mode === 'view' && localEdit.value) {
    localEdit.value = false
    if (props.user) fillFromUser(props.user)
    return
  }
  close()
}

const busy = computed(() => saving.value || deleting.value)

async function confirmDelete() {
  if (
    (props.mode !== 'edit' && !(props.mode === 'view' && localEdit.value))
    || !props.user
  ) {
    return
  }
  const u = props.user
  const ok = await confirm({
    title: 'Delete user',
    message: `Delete user ${u.email}?`,
    confirmLabelKey: 'common.delete',
    danger: true,
  })
  if (!ok) return
  deleting.value = true
  try {
    await userStore.remove(u.id)
    toast.success('User deleted')
    emit('saved')
    close()
  } catch (err: unknown) {
    toast.error(
      extractUserAxiosError(err, 'Could not delete user'),
    )
  } finally {
    deleting.value = false
  }
}

async function submit() {
  if (isViewMode.value) return
  const e = email.value.trim()
  if (!e) {
    toast.error('Email is required')
    return
  }
  if (props.mode === 'create') {
    const p = password.value.trim()
    if (!p) {
      toast.error('Password is required')
      return
    }
    if (p.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
  }

  saving.value = true
  try {
    if (props.mode === 'create') {
      await userStore.create({
        email: e,
        password: password.value.trim(),
        role: formRole.value,
        last_name: lastName.value.trim() || undefined,
        first_name: firstName.value.trim() || undefined,
        patronymic: patronymic.value.trim() || undefined,
        department: department.value.trim() || undefined,
        job_title: jobTitle.value.trim() || undefined,
        phone: phone.value.trim() || undefined,
      })
      toast.success('User created')
    } else {
      const u = props.user!
      const patch: Record<string, string | undefined> = {
        email: e,
        last_name: lastName.value.trim() || undefined,
        first_name: firstName.value.trim() || undefined,
        patronymic: patronymic.value.trim() || undefined,
        department: department.value.trim() || undefined,
        job_title: jobTitle.value.trim() || undefined,
        phone: phone.value.trim() || undefined,
      }
      const pw = password.value.trim()
      if (pw) {
        if (pw.length < 8) {
          toast.error('Password must be at least 8 characters')
          saving.value = false
          return
        }
        patch.password = pw
      }
      await userStore.update(u.id, patch)
      if (canChangeRole.value && formRole.value !== initialRole.value) {
        await userStore.updateRole(u.id, formRole.value)
      }
      toast.success('User updated')
    }
    emit('saved')
    close()
  } catch (err: unknown) {
    toast.error(extractUserAxiosError(err, 'Request failed'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Modal
    :model-value="modelValue"
    :title="title"
    :dirty="adminModalDirty"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
  >
    <template #header-actions>
      <Button
        v-if="mode === 'view' && !localEdit"
        type="button"
        variant="secondary"
        @click="localEdit = true"
      >
        <PencilSquareIcon class="h-4 w-4" />
        <span class="ml-1">{{ t('common.edit') }}</span>
      </Button>
    </template>
    <form
      id="admin-user-form"
      class="space-y-4"
      @submit.prevent="submit"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <Input
          id="adm-email"
          v-model="email"
          :label="t('admin.users.form.email')"
          type="email"
          autocomplete="off"
          :required="isEditingUi"
          :disabled="isViewMode"
        />
        <div>
          <label class="mb-1 block text-xs font-medium text-foreground">{{ t('admin.users.form.globalRole') }}</label>
          <template v-if="isViewMode">
            <p class="rounded-md border border-border bg-surface-muted px-2.5 py-2 text-xs text-foreground">
              {{ roleLabel(user?.role) }}
            </p>
          </template>
          <template v-else-if="mode === 'create'">
            <UiMenuButton
              v-model="formRole"
              variant="field"
              :ariaLabel="t('admin.users.form.globalRole')"
              :placeholder="t('admin.users.form.rolePlaceholder')"
              :options="roleOptions"
              class="w-full"
              :min-panel-width="180"
            />
          </template>
          <template v-else-if="canChangeRole">
            <UiMenuButton
              v-model="formRole"
              variant="field"
              :ariaLabel="t('admin.users.form.globalRole')"
              :placeholder="t('admin.users.form.rolePlaceholder')"
              :options="roleOptions"
              class="w-full"
              :min-panel-width="180"
            />
          </template>
          <p v-else class="rounded-md border border-border bg-surface-muted px-2.5 py-2 text-xs text-foreground">
            {{ roleLabel(user?.role) }}
          </p>
        </div>
      </div>

      <Input
        v-if="isEditingUi"
        id="adm-password"
        v-model="password"
        :label="mode === 'create' ? t('admin.users.form.password') : t('admin.users.form.newPasswordOptional')"
        type="password"
        autocomplete="new-password"
        :required="mode === 'create'"
      />

      <div class="grid gap-4 sm:grid-cols-2">
        <Input
          id="adm-last"
          v-model="lastName"
          :label="t('admin.users.form.lastName')"
          autocomplete="family-name"
          :disabled="isViewMode"
        />
        <Input
          id="adm-first"
          v-model="firstName"
          :label="t('admin.users.form.firstName')"
          autocomplete="given-name"
          :disabled="isViewMode"
        />
      </div>
      <Input
        id="adm-pat"
        v-model="patronymic"
        :label="t('admin.users.form.patronymic')"
        autocomplete="additional-name"
        :disabled="isViewMode"
      />
      <Input
        id="adm-dept"
        v-model="department"
        :label="t('admin.users.form.department')"
        autocomplete="organization"
        :disabled="isViewMode"
      />
      <Input
        id="adm-job"
        v-model="jobTitle"
        :label="t('admin.users.form.jobTitle')"
        autocomplete="organization-title"
        :disabled="isViewMode"
      />
      <Input
        id="adm-phone"
        v-model="phone"
        :label="t('admin.users.form.phone')"
        type="tel"
        autocomplete="tel"
        :disabled="isViewMode"
      />
    </form>
    <template #footer>
      <div
        v-if="isViewMode"
        class="flex flex-wrap justify-end gap-2"
      >
        <Button type="button" variant="secondary" @click="close">
          {{ t('common.cancel') }}
        </Button>
      </div>
      <div
        v-else-if="mode === 'create'"
        class="flex flex-wrap justify-end gap-2"
      >
        <Button type="button" variant="secondary" :disabled="busy" @click="close">
          {{ t('common.cancel') }}
        </Button>
        <Button type="submit" form="admin-user-form" :disabled="busy">
          {{ t('common.create') }}
        </Button>
      </div>
      <div
        v-else
        class="flex flex-wrap items-center justify-between gap-2"
      >
        <Button
          v-if="mode === 'edit' || localEdit"
          type="button"
          variant="ghost-danger"
          :disabled="busy || deleteDisabled"
          @click="confirmDelete"
        >
          {{ t('common.delete') }}
        </Button>
        <div class="ml-auto flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" :disabled="busy" @click="onFooterCancel">
            {{ t('common.cancel') }}
          </Button>
          <Button type="submit" form="admin-user-form" :disabled="busy">
            {{ t('common.save') }}
          </Button>
        </div>
      </div>
    </template>
  </Modal>
</template>
