<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useToast } from '../../composables/useToast'
import { useAuthStore } from '../../stores/auth.store'
import { useProjectStore } from '../../stores/project.store'
import type { ProjectMemberRole } from '../../types/project'
import type { User } from '../../types/user'
import { api } from '../../utils/api'
import Button from '../ui/UiButton.vue'
import UiInput from '../ui/UiInput.vue'
import Modal from '../ui/UiModal.vue'
import type { UiSelectOption } from '../ui/UiSelect.vue'
import UiSelect from '../ui/UiSelect.vue'

const props = defineProps<{
  projectId: number
}>()

const open = defineModel<boolean>({ required: true })

const emit = defineEmits<{
  added: []
}>()

const auth = useAuthStore()
const projectStore = useProjectStore()
const toast = useToast()

const addMode = ref<'email' | 'user'>('email')
const addEmail = ref('')
const addUserId = ref<string>('')
const addRole = ref<ProjectMemberRole>('viewer')
const adding = ref(false)
const staffUsers = ref<User[]>([])
const loadingUsers = ref(false)

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

watch(open, (o) => {
  if (o) {
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
    open.value = false
    emit('added')
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
</script>

<template>
  <Modal v-model="open" title="Add member" wide>
    <div class="space-y-4">
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
        id="member-email-modal"
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
        <Button type="button" variant="secondary" @click="open = false">
          Cancel
        </Button>
        <Button type="button" :loading="adding" @click="onAdd">
          Add
        </Button>
      </div>
    </div>
  </Modal>
</template>
