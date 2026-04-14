<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Button from '../components/ui/UiButton.vue'
import Breadcrumb from '../components/ui/UiBreadcrumb.vue'
import EmptyState from '../components/ui/UiEmptyState.vue'
import Skeleton from '../components/ui/UiSkeleton.vue'
import Modal from '../components/ui/UiModal.vue'
import ProjectForm from '../components/projects/ProjectForm.vue'
import ProjectList from '../components/projects/ProjectList.vue'
import { useConfirm } from '../composables/useConfirm'
import { useAuthStore } from '../stores/auth.store'
import { useProjectStore } from '../stores/project.store'
import type { ProjectKind } from '../types/project'

const router = useRouter()
const auth = useAuthStore()
const store = useProjectStore()
const canCreateProjects = computed(() => auth.user != null)
const showKindPicker = computed(
  () =>
    auth.user?.role === 'creator' ||
    auth.user?.role === 'staff' ||
    auth.user?.role === 'admin',
)
const projectsSubtitle = computed(() => {
  if (auth.user?.role === 'admin' || auth.user?.role === 'staff') {
    return 'All projects in the workspace'
  }
  if (auth.user?.role === 'user') {
    return 'Your personal projects and teams you belong to'
  }
  return 'Projects you own or are a member of'
})
const { confirm } = useConfirm()

const showModal = ref(false)
const name = ref('')
const description = ref('')
const projectKind = ref<ProjectKind>('personal')
const saving = ref(false)

watch(showModal, (open) => {
  if (open) {
    projectKind.value =
      auth.user?.role === 'user' ? 'personal' : 'team'
  }
})

const editModalOpen = ref(false)
const editId = ref(0)
const editName = ref('')
const editDescription = ref('')
const editSaving = ref(false)

onMounted(() => {
  store.fetchList().catch(() => {})
})

async function createProject() {
  saving.value = true
  try {
    const kind: ProjectKind =
      auth.user?.role === 'user' ? 'personal' : projectKind.value
    await store.create({
      name: name.value,
      description: description.value,
      kind,
    })
    showModal.value = false
    name.value = ''
    description.value = ''
  } finally {
    saving.value = false
  }
}

function openProject(id: number) {
  if (!Number.isFinite(id) || id <= 0) return
  router.push({ name: 'project-detail', params: { id: String(id) } })
}

function openEditProject(id: number) {
  const p = store.projects.find((x) => x.id === id)
  if (!p) return
  editId.value = id
  editName.value = p.name
  editDescription.value = p.description ?? ''
  editModalOpen.value = true
}

async function saveEditProject() {
  editSaving.value = true
  try {
    await store.update(editId.value, {
      name: editName.value,
      description: editDescription.value,
    })
    editModalOpen.value = false
  } finally {
    editSaving.value = false
  }
}

async function removeEditProject() {
  const ok = await confirm({
    title: 'Delete project',
    message: 'Delete this project and its task links?',
    confirmLabel: 'Delete',
    danger: true,
  })
  if (!ok) return
  await store.remove(editId.value)
  editModalOpen.value = false
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
        <p class="mt-1 text-sm text-muted">{{ projectsSubtitle }}</p>
      </div>
      <Button v-if="canCreateProjects" @click="showModal = true">New project</Button>
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
      <Button v-if="canCreateProjects" @click="showModal = true"
        >Create your first project</Button
      >
    </EmptyState>
    <ProjectList
      v-else
      class="mt-6"
      :projects="store.projects"
      @open="openProject"
      @edit="openEditProject"
    />

    <Modal v-model="showModal" title="New project">
      <ProjectForm
        v-model:name="name"
        v-model:description="description"
        v-model:kind="projectKind"
        :show-kind-picker="showKindPicker"
        submit-label="Create"
        :loading="saving"
        @submit="createProject"
        @cancel="showModal = false"
      />
    </Modal>

    <Modal v-model="editModalOpen" title="Edit project">
      <ProjectForm
        v-model:name="editName"
        v-model:description="editDescription"
        submit-label="Save"
        :loading="editSaving"
        @submit="saveEditProject"
        @cancel="editModalOpen = false"
      >
        <template #actions-start>
          <Button variant="ghost-danger" type="button" @click="removeEditProject">
            Delete project
          </Button>
        </template>
      </ProjectForm>
    </Modal>
  </div>
</template>
