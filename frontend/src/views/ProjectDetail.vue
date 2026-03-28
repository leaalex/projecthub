<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Breadcrumb from '../components/ui/UiBreadcrumb.vue'
import Button from '../components/ui/UiButton.vue'
import Modal from '../components/ui/UiModal.vue'
import Skeleton from '../components/ui/UiSkeleton.vue'
import TaskDetailModal from '../components/tasks/TaskDetailModal.vue'
import TaskInlineComposer from '../components/tasks/TaskInlineComposer.vue'
import TaskList from '../components/tasks/TaskList.vue'
import ProjectForm from '../components/projects/ProjectForm.vue'
import { useConfirm } from '../composables/useConfirm'
import { useProjectStore } from '../stores/project.store'
import { useTaskStore } from '../stores/task.store'
import { useAdminAssignableUsers } from '../composables/useAdminAssignableUsers'
import { useTaskEditPermission } from '../composables/useCanEditTask'
import { useToast } from '../composables/useToast'

const { confirm } = useConfirm()
const toast = useToast()
const { canEditTask } = useTaskEditPermission()
const { assignableUsers } = useAdminAssignableUsers()

const projectOptions = computed(() =>
  projectStore.projects.map((p) => ({ id: p.id, name: p.name })),
)

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const taskStore = useTaskStore()

const id = computed(() => Number(route.params.id))

const editOpen = ref(false)
const detailOpen = ref(false)
const detailTaskId = ref<number | null>(null)

const name = ref('')
const description = ref('')
const saving = ref(false)
const pageLoading = ref(true)

async function load() {
  pageLoading.value = true
  try {
    await projectStore.fetchList().catch(() => {})
    await projectStore.fetchOne(id.value)
    await projectStore.fetchTasks(id.value)
    name.value = projectStore.current?.name ?? ''
    description.value = projectStore.current?.description ?? ''
  } catch {
    router.replace('/projects')
    return
  } finally {
    pageLoading.value = false
  }
}

watch(
  () => route.params.id,
  () => load(),
  { immediate: true },
)

function openTaskDetail(taskId: number) {
  detailTaskId.value = taskId
  detailOpen.value = true
}

watch(detailOpen, (open) => {
  if (!open) detailTaskId.value = null
})

async function onInlineTaskCreated() {
  await projectStore.fetchTasks(id.value)
}

async function saveProject() {
  saving.value = true
  try {
    await projectStore.update(id.value, {
      name: name.value,
      description: description.value,
    })
    editOpen.value = false
  } finally {
    saving.value = false
  }
}

async function removeProject() {
  const ok = await confirm({
    title: 'Delete project',
    message: 'Delete this project and its task links?',
    confirmLabel: 'Delete',
    danger: true,
  })
  if (!ok) return
  await projectStore.remove(id.value)
  router.push('/projects')
}

async function onComplete(taskId: number) {
  await taskStore.complete(taskId)
  await projectStore.fetchTasks(id.value)
}

async function onReopen(taskId: number) {
  try {
    await taskStore.update(taskId, { status: 'todo' })
    await projectStore.fetchTasks(id.value)
    toast.success('Task marked as not done')
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    const msg = err.response?.data?.error
    toast.error(typeof msg === 'string' ? msg : 'Could not update task')
  }
}
</script>

<template>
  <div v-if="pageLoading" class="space-y-4">
    <Skeleton variant="line" class="h-4 max-w-md" />
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0 flex-1 space-y-3">
        <Skeleton variant="line" class="h-8 max-w-xs" />
        <Skeleton variant="line" :lines="2" />
      </div>
      <Skeleton variant="line" class="h-10 w-24 shrink-0" />
    </div>
    <div
      class="mt-6 overflow-hidden rounded-lg border border-border bg-surface shadow-sm"
    >
      <div class="border-b border-border px-3 py-3">
        <Skeleton variant="line" class="max-w-lg" />
      </div>
      <div class="divide-y divide-border px-3 py-2">
        <div v-for="i in 4" :key="i" class="py-3">
          <Skeleton variant="line" />
        </div>
      </div>
    </div>
  </div>
  <div v-else-if="projectStore.current">
    <Breadcrumb
      class="mb-4"
      :items="[
        { label: 'Home', to: '/dashboard' },
        { label: 'Projects', to: '/projects' },
        { label: projectStore.current.name },
      ]"
    />
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">
          {{ projectStore.current.name }}
        </h1>
        <p class="mt-1 text-sm text-muted">
          {{ projectStore.current.description || 'No description' }}
        </p>
      </div>
      <Button variant="secondary" @click="editOpen = true">Edit</Button>
    </div>

    <TaskList
      class="mt-6"
      :tasks="projectStore.tasks"
      :can-edit-task="canEditTask"
      :projects="projectOptions"
      :assignable-users="assignableUsers"
      @complete="onComplete"
      @reopen="onReopen"
      @info="openTaskDetail"
      @task-updated="onInlineTaskCreated"
    >
      <template #header>
        <TaskInlineComposer
          variant="plain"
          :project-id="id"
          :disabled="!Number.isFinite(id) || id <= 0"
          @created="onInlineTaskCreated"
        />
      </template>
    </TaskList>

    <TaskDetailModal
      v-model="detailOpen"
      :task-id="detailTaskId"
      @saved="onInlineTaskCreated"
    />

    <Modal v-model="editOpen" title="Edit project">
      <ProjectForm
        v-model:name="name"
        v-model:description="description"
        submit-label="Save"
        :loading="saving"
        @submit="saveProject"
        @cancel="editOpen = false"
      />
      <div class="mt-6 border-t border-border pt-5">
        <Button variant="danger" type="button" @click="removeProject">
          Delete project
        </Button>
      </div>
    </Modal>
  </div>
</template>
