<script setup lang="ts">
import { UsersIcon } from '@heroicons/vue/24/outline'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AddMemberModal from '../components/projects/AddMemberModal.vue'
import ProjectMembers from '../components/projects/ProjectMembers.vue'
import TransferOwnershipModal from '../components/projects/TransferOwnershipModal.vue'
import Breadcrumb from '../components/ui/UiBreadcrumb.vue'
import Button from '../components/ui/UiButton.vue'
import EmptyState from '../components/ui/UiEmptyState.vue'
import Skeleton from '../components/ui/UiSkeleton.vue'
import { useAuthStore } from '../stores/auth.store'
import { useProjectStore } from '../stores/project.store'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const projectStore = useProjectStore()

const id = computed(() => {
  const raw = route.params.id
  const s = Array.isArray(raw) ? raw[0] : raw
  const n = typeof s === 'string' ? Number(s) : Number(s)
  return Number.isFinite(n) && n > 0 ? n : NaN
})

const pageLoading = ref(true)
const loadError = ref<string | null>(null)

const addModalOpen = ref(false)
const transferModalOpen = ref(false)

const callerRole = computed(() => projectStore.current?.caller_project_role)

const canManage = computed(() => {
  if (auth.user?.role === 'admin' || auth.user?.role === 'staff') return true
  const r = callerRole.value
  return r === 'owner' || r === 'manager'
})

const showTransfer = computed(
  () => auth.user?.role === 'admin' || auth.user?.role === 'staff',
)

let loadGeneration = 0

async function load() {
  const gen = ++loadGeneration
  pageLoading.value = true
  loadError.value = null

  const finishIfCurrent = () => {
    if (gen === loadGeneration) pageLoading.value = false
  }

  if (!Number.isFinite(id.value) || id.value <= 0) {
    finishIfCurrent()
    void router.replace('/projects')
    return
  }

  try {
    await projectStore.fetchList().catch(() => {})
    if (gen !== loadGeneration) return

    await projectStore.fetchOne(id.value)
    if (gen !== loadGeneration) return

    if (projectStore.current?.kind !== 'team') {
      void router.replace(`/projects/${id.value}`)
      finishIfCurrent()
      return
    }

    await projectStore.fetchMembers(id.value).catch(() => {
      projectStore.members = []
      projectStore.membersProjectId = id.value
    })
    if (gen !== loadGeneration) return
  } catch (e: unknown) {
    if (gen !== loadGeneration) return
    const ax = e as {
      response?: { status?: number; data?: { error?: string } }
    }
    const status = ax.response?.status
    const apiMsg = ax.response?.data?.error
    let msg = 'Could not load project'
    if (typeof apiMsg === 'string') msg = apiMsg
    else if (e instanceof Error && e.message) msg = e.message

    if (status === 404 || status === 403) {
      void router.replace('/projects')
      finishIfCurrent()
      return
    }
    loadError.value = msg
  } finally {
    finishIfCurrent()
  }
}

watch(
  id,
  () => {
    void load()
  },
  { immediate: true },
)

async function refreshMembers() {
  if (!Number.isFinite(id.value) || id.value <= 0) return
  await projectStore.fetchMembers(id.value).catch(() => {})
}

async function refreshAfterTransfer() {
  if (!Number.isFinite(id.value) || id.value <= 0) return
  await projectStore.fetchOne(id.value).catch(() => {})
  await projectStore.fetchMembers(id.value).catch(() => {})
}
</script>

<template>
  <div v-if="pageLoading" class="space-y-4">
    <Skeleton variant="line" class="h-4 max-w-md" />
    <div class="space-y-3">
      <Skeleton variant="line" class="h-8 max-w-xs" />
      <Skeleton variant="line" :lines="3" />
    </div>
  </div>
  <div v-else-if="loadError">
    <EmptyState
      title="Could not load settings"
      :description="loadError"
    >
      <Button type="button" variant="secondary" @click="void load()">
        Retry
      </Button>
    </EmptyState>
  </div>
  <div v-else-if="projectStore.current && projectStore.current.kind === 'team'">
    <Breadcrumb
      class="mb-4"
      :items="[
        { label: 'Home', to: '/dashboard' },
        { label: 'Projects', to: '/projects' },
        { label: projectStore.current.name, to: `/projects/${id}` },
        { label: 'Settings' },
      ]"
    />

    <h1 class="text-2xl font-semibold text-foreground">Settings</h1>
    <p class="mt-1 text-sm text-muted">
      {{ projectStore.current.name }}
    </p>

    <section class="mt-8 border-t border-border pt-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <h2 class="text-lg font-semibold text-foreground">Members</h2>
        <div class="flex flex-wrap items-center gap-2">
          <Button
            v-if="showTransfer"
            type="button"
            variant="secondary"
            class="text-xs"
            @click="transferModalOpen = true"
          >
            Transfer ownership
          </Button>
          <Button
            v-if="canManage"
            type="button"
            class="text-xs"
            @click="addModalOpen = true"
          >
            <UsersIcon class="inline h-4 w-4 shrink-0" aria-hidden="true" />
            <span class="ml-1.5">Add member</span>
          </Button>
        </div>
      </div>

      <div class="mt-6">
        <ProjectMembers :project-id="id" />
      </div>
    </section>

    <AddMemberModal
      v-if="canManage"
      v-model="addModalOpen"
      :project-id="id"
      @added="refreshMembers"
    />

    <TransferOwnershipModal
      v-if="showTransfer"
      v-model="transferModalOpen"
      :project-id="id"
      @transferred="refreshAfterTransfer"
    />
  </div>
</template>
