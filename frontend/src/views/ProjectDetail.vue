<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Breadcrumb from '../components/common/Breadcrumb.vue'
import Button from '../components/common/Button.vue'
import Modal from '../components/common/Modal.vue'
import TaskList from '../components/tasks/TaskList.vue'
import ProjectForm from '../components/projects/ProjectForm.vue'
import { useConfirm } from '../composables/useConfirm'
import { useProjectStore } from '../stores/project.store'
import { useTaskStore } from '../stores/task.store'

const { confirm } = useConfirm()

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const taskStore = useTaskStore()

const id = computed(() => Number(route.params.id))

const editOpen = ref(false)
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
      <div class="flex gap-2">
        <Button variant="secondary" @click="editOpen = true">Edit</Button>
        <Button variant="danger" @click="removeProject">Delete</Button>
      </div>
    </div>

    <h2 class="mt-8 text-lg font-medium text-foreground">Tasks in this project</h2>
    <TaskList
      class="mt-4"
      :tasks="projectStore.tasks"
      @complete="onComplete"
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
    </Modal>
  </div>
</template>
