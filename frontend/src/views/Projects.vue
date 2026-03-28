<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from '../components/ui/UiButton.vue'
import Breadcrumb from '../components/ui/UiBreadcrumb.vue'
import EmptyState from '../components/ui/UiEmptyState.vue'
import Skeleton from '../components/ui/UiSkeleton.vue'
import Modal from '../components/ui/UiModal.vue'
import ProjectForm from '../components/projects/ProjectForm.vue'
import ProjectList from '../components/projects/ProjectList.vue'
import { useProjectStore } from '../stores/project.store'

const router = useRouter()
const store = useProjectStore()

const showModal = ref(false)
const name = ref('')
const description = ref('')
const saving = ref(false)

onMounted(() => {
  store.fetchList().catch(() => {})
})

async function createProject() {
  saving.value = true
  try {
    await store.create({
      name: name.value,
      description: description.value,
    })
    showModal.value = false
    name.value = ''
    description.value = ''
  } finally {
    saving.value = false
  }
}

function openProject(id: number) {
  router.push(`/projects/${id}`)
}
</script>

<template>
  <div>
    <Breadcrumb
      class="mb-4"
      :items="[
        { label: 'Home', to: '/dashboard' },
        { label: 'Projects' },
      ]"
    />
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">Projects</h1>
        <p class="mt-1 text-sm text-muted">Projects you own</p>
      </div>
      <Button @click="showModal = true">New project</Button>
    </div>

    <div
      v-if="store.loading"
      class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <Skeleton v-for="i in 6" :key="i" variant="card" />
    </div>
    <EmptyState
      v-else-if="!store.projects.length"
      class="mt-6"
      title="No projects yet"
      description="Create your first project to start organizing tasks."
    >
      <Button @click="showModal = true">Create your first project</Button>
    </EmptyState>
    <ProjectList
      v-else
      class="mt-6"
      :projects="store.projects"
      @open="openProject"
    />

    <Modal v-model="showModal" title="New project">
      <ProjectForm
        v-model:name="name"
        v-model:description="description"
        submit-label="Create"
        :loading="saving"
        @submit="createProject"
        @cancel="showModal = false"
      />
    </Modal>
  </div>
</template>
