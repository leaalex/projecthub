<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Avatar from '../../components/ui/UiAvatar.vue'
import Breadcrumb from '../../components/ui/UiBreadcrumb.vue'
import Button from '../../components/ui/UiButton.vue'
import EmptyState from '../../components/ui/UiEmptyState.vue'
import Skeleton from '../../components/ui/UiSkeleton.vue'
import Table from '../../components/ui/UiTable.vue'
import type { User } from '../../types/user'
import { useConfirm } from '../../composables/useConfirm'
import { useToast } from '../../composables/useToast'
import { api } from '../../utils/api'

const { confirm } = useConfirm()
const toast = useToast()
const users = ref<User[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    const { data } = await api.get<{ users: User[] }>('/users')
    users.value = data.users
  } catch {
    error.value = 'Failed to load users (admin only).'
  } finally {
    loading.value = false
  }
}

onMounted(() => load())

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
    <h1 class="text-2xl font-semibold text-foreground">Users</h1>
    <p class="mt-1 text-sm text-muted">Administrator list</p>

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

    <div v-else class="mt-8 space-y-3 md:hidden">
      <div
        v-for="u in users"
        :key="u.id"
        class="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm"
      >
        <div class="flex items-center gap-3">
          <Avatar :email="u.email" :name="u.name" />
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium text-foreground">{{ u.email }}</p>
            <p class="text-sm text-muted">{{ u.name || '—' }}</p>
          </div>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span class="font-mono">ID {{ u.id }}</span>
          <span class="rounded bg-surface-muted px-2 py-0.5">{{ u.role }}</span>
        </div>
        <Button variant="danger" class="w-full" @click="remove(u)">Delete</Button>
      </div>
    </div>

    <Table
      v-if="!loading && users.length"
      class="mt-8 hidden md:block"
      :headers="['', 'ID', 'Email', 'Name', 'Role', 'Actions']"
    >
      <tr v-for="u in users" :key="u.id" class="hover:bg-surface-muted">
        <td class="px-4 py-3">
          <Avatar size="sm" :email="u.email" :name="u.name" />
        </td>
        <td class="px-4 py-3 font-mono text-xs">{{ u.id }}</td>
        <td class="px-4 py-3">{{ u.email }}</td>
        <td class="px-4 py-3">{{ u.name || '—' }}</td>
        <td class="px-4 py-3">{{ u.role }}</td>
        <td class="px-4 py-3">
          <Button variant="danger" @click="remove(u)">Delete</Button>
        </td>
      </tr>
    </Table>
  </div>
</template>
