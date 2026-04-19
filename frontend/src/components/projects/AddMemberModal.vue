<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@app/composables/useToast'
import { useAuthStore } from '@app/auth.store'
import { useProjectStore } from '@app/project.store'
import { useUserStore } from '@app/user.store'
import type { ProjectMemberRole } from '@domain/project/types'
import { isPrivilegedRole } from '@domain/user/role'
import { storeToRefs } from 'pinia'
import Button from '../ui/UiButton.vue'
import UiInput from '../ui/UiInput.vue'
import Modal from '../ui/UiModal.vue'
import type { UiSelectOption } from '../ui/UiSelect.vue'
import UiSelect from '../ui/UiSelect.vue'

const { t } = useI18n()

const props = defineProps<{
  projectId: number
}>()

const open = defineModel<boolean>({ required: true })

const emit = defineEmits<{
  added: []
}>()

const auth = useAuthStore()
const projectStore = useProjectStore()
const userStore = useUserStore()
const { users: staffUsers, loading: loadingUsers } = storeToRefs(userStore)
const toast = useToast()

const addMode = ref<'email' | 'user'>('email')
const addEmail = ref('')
const addUserId = ref<string>('')
const addRole = ref<ProjectMemberRole>('viewer')
const adding = ref(false)

const roleMenuOptions = computed<UiSelectOption<ProjectMemberRole>[]>(() => [
  { value: 'manager', label: t('enums.projectRole.manager') },
  { value: 'executor', label: t('enums.projectRole.executor') },
  { value: 'viewer', label: t('enums.projectRole.viewer') },
])

async function loadStaffUsers() {
  if (!isPrivilegedRole(auth.user?.role)) return
  try {
    await userStore.fetchList()
  } catch {
    /* keep store list; avoid wiping admin Users view */
  }
}

watch(open, (o) => {
  if (o) {
    addEmail.value = ''
    addUserId.value = ''
    addRole.value = 'viewer'
    addMode.value =
      isPrivilegedRole(auth.user?.role)
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
        toast.error(t('addMemberModal.toasts.enterEmail'))
        return
      }
      await projectStore.addMember(props.projectId, {
        email: e,
        role: addRole.value,
      })
    } else {
      const id = Number(addUserId.value)
      if (!id) {
        toast.error(t('addMemberModal.toasts.selectUser'))
        return
      }
      await projectStore.addMember(props.projectId, {
        user_id: id,
        role: addRole.value,
      })
    }
    toast.success(t('addMemberModal.toasts.added'))
    open.value = false
    emit('added')
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    toast.error(
      typeof err.response?.data?.error === 'string'
        ? err.response.data.error
        : t('addMemberModal.toasts.addFailed'),
    )
  } finally {
    adding.value = false
  }
}
</script>

<template>
  <Modal v-model="open" :title="t('addMemberModal.title')" wide>
    <div class="space-y-4">
      <div
        v-if="isPrivilegedRole(auth.user?.role)"
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
          {{ t('addMemberModal.tabs.pickUser') }}
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
          {{ t('addMemberModal.tabs.byEmail') }}
        </button>
      </div>

      <UiSelect
        v-if="addMode === 'user'"
        v-model="addUserId"
        :label="t('addMemberModal.labels.user')"
        :options="userSelectOptions"
        :disabled="loadingUsers"
        :placeholder="t('addMemberModal.placeholders.selectUser')"
      />

      <UiInput
        v-else
        id="member-email-modal"
        v-model="addEmail"
        :label="t('addMemberModal.labels.email')"
        type="email"
        autocomplete="email"
        :placeholder="t('addMemberModal.placeholders.emailExample')"
      />

      <UiSelect
        v-model="addRole"
        :label="t('addMemberModal.labels.projectRole')"
        :options="roleMenuOptions"
      />

      <div class="flex justify-end gap-2">
        <Button type="button" variant="secondary" @click="open = false">
          {{ t('addMemberModal.cancel') }}
        </Button>
        <Button type="button" :loading="adding" @click="onAdd">
          {{ t('addMemberModal.add') }}
        </Button>
      </div>
    </div>
  </Modal>
</template>
