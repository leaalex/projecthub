<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Breadcrumb from '../components/common/Breadcrumb.vue'
import Button from '../components/common/Button.vue'
import Modal from '../components/common/Modal.vue'
import TaskDetailModal from '../components/tasks/TaskDetailModal.vue'
import TaskInlineComposer from '../components/tasks/TaskInlineComposer.vue'
import TaskList from '../components/tasks/TaskList.vue'
import ProjectForm from '../components/projects/ProjectForm.vue'
import { useConfirm } from '../composables/useConfirm'
import { useProjectStore } from '../stores/project.store'
import { useTaskStore } from '../stores/task.store'
import { useToast } from '../stores/toast.store'

const { confirm } = useConfirm()
const toast = useToast()

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

async function load() {
  try {
    await projectStore.fetchOne(id.value)
    await projectStore.fetchTasks(id.value)
    name.value = projectStore.current?.name ?? ''
    description.value = projectStore.current?.description ?? ''
  } catch {
    router.replace('/projects')
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
  <div v-if="projectStore.current">
    <Breadcrumb
      class="mb-4"
      :items="[
        { label: 'Home', to: '/dashboard' },
        { label: 'Projects', to: '/projects' },
        { label: projectStore.current.name },
      ]"
    />
    <div class="flex flex-wrap items-start justify-between gap-4">
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

    <TaskInlineComposer
      class="mt-8"
      :project-id="id"
      :disabled="!Number.isFinite(id) || id <= 0"
      @created="onInlineTaskCreated"
    />
    <TaskList
      class="mt-4"
      :tasks="projectStore.tasks"
      @complete="onComplete"
      @reopen="onReopen"
      @info="openTaskDetail"
    />

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
