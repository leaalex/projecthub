<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Button from '../ui/UiButton.vue'
import Input from '../ui/UiInput.vue'
import Modal from '../ui/UiModal.vue'
import UiMenuButton from '../ui/UiMenuButton.vue'
import type { UiSelectOption } from '../ui/UiSelect.vue'
import type { User, UserRole } from '@domain/user/types'
import { useConfirm } from '@app/composables/useConfirm'
import { useToast } from '@app/composables/useToast'
import { extractUserAxiosError, useUserStore } from '@app/user.store'

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

const roleOptions: UiSelectOption<string>[] = [
  { value: 'user', label: 'User' },
  { value: 'creator', label: 'Creator' },
  { value: 'staff', label: 'Staff' },
]

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

const title = computed(() => {
  if (props.mode === 'create') return 'New user'
  if (props.mode === 'view') return 'View user'
  return 'Edit user'
})

const isView = computed(() => props.mode === 'view')

const canChangeRole = computed(
  () => props.mode === 'edit' && props.user?.role !== 'admin',
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

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    if (props.mode === 'create') {
      resetCreate()
    } else if (props.user && (props.mode === 'edit' || props.mode === 'view')) {
      fillFromUser(props.user)
    }
  },
)

function close() {
  emit('update:modelValue', false)
}

const busy = computed(() => saving.value || deleting.value)

async function confirmDelete() {
  if (props.mode !== 'edit' || !props.user) return
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
  if (props.mode === 'view') return
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
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
  >
    <form class="space-y-4" @submit.prevent="submit">
      <div class="grid gap-4 sm:grid-cols-2">
        <Input
          id="adm-email"
          v-model="email"
          label="Email"
          type="email"
          autocomplete="off"
          :required="!isView"
          :disabled="isView"
        />
        <div>
          <label class="mb-1 block text-xs font-medium text-foreground">Global role</label>
          <template v-if="isView">
            <p class="rounded-md border border-border bg-surface-muted px-2.5 py-2 text-xs text-foreground">
              {{ user?.role }}
            </p>
          </template>
          <template v-else-if="mode === 'create'">
            <UiMenuButton
              v-model="formRole"
              variant="field"
              ariaLabel="Global role"
              placeholder="Role"
              :options="roleOptions"
              class="w-full"
              :min-panel-width="180"
            />
          </template>
          <template v-else-if="canChangeRole">
            <UiMenuButton
              v-model="formRole"
              variant="field"
              ariaLabel="Global role"
              placeholder="Role"
              :options="roleOptions"
              class="w-full"
              :min-panel-width="180"
            />
          </template>
          <p v-else class="rounded-md border border-border bg-surface-muted px-2.5 py-2 text-xs text-foreground">
            {{ user?.role }}
          </p>
        </div>
      </div>

      <Input
        v-if="!isView"
        id="adm-password"
        v-model="password"
        :label="mode === 'create' ? 'Password' : 'New password (optional)'"
        type="password"
        autocomplete="new-password"
        :required="mode === 'create'"
      />

      <div class="grid gap-4 sm:grid-cols-2">
        <Input
          id="adm-last"
          v-model="lastName"
          label="Last name"
          autocomplete="family-name"
          :disabled="isView"
        />
        <Input
          id="adm-first"
          v-model="firstName"
          label="First name"
          autocomplete="given-name"
          :disabled="isView"
        />
      </div>
      <Input
        id="adm-pat"
        v-model="patronymic"
        label="Patronymic"
        autocomplete="additional-name"
        :disabled="isView"
      />
      <Input
        id="adm-dept"
        v-model="department"
        label="Department"
        autocomplete="organization"
        :disabled="isView"
      />
      <Input
        id="adm-job"
        v-model="jobTitle"
        label="Job title"
        autocomplete="organization-title"
        :disabled="isView"
      />
      <Input
        id="adm-phone"
        v-model="phone"
        label="Phone"
        type="tel"
        autocomplete="tel"
        :disabled="isView"
      />

      <div
        v-if="isView"
        class="flex flex-wrap justify-end gap-2 pt-2"
      >
        <Button type="button" variant="secondary" @click="close">
          Close
        </Button>
      </div>
      <div
        v-else
        class="flex flex-wrap items-center gap-2 pt-2"
        :class="mode === 'edit' ? 'justify-between' : 'justify-end'"
      >
        <Button
          v-if="mode === 'edit'"
          type="button"
          variant="ghost-danger"
          :disabled="busy || deleteDisabled"
          @click="confirmDelete"
        >
          Delete
        </Button>
        <div class="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" :disabled="busy" @click="close">
            Cancel
          </Button>
          <Button type="submit" :disabled="busy">
            {{ mode === 'create' ? 'Create' : 'Save' }}
          </Button>
        </div>
      </div>
    </form>
  </Modal>
</template>
