<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'
import { useProjectStore } from '../../stores/project.store'
import { useTaskStore } from '../../stores/task.store'
import { useUiStore } from '../../stores/ui.store'
import type { TaskStatus } from '../../types/task'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const ui = useUiStore()
const { commandPaletteOpen } = storeToRefs(ui)
const query = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const selected = ref(0)

type Kind = 'nav' | 'project' | 'task' | 'action'

interface Item {
  id: string
  kind: Kind
  label: string
  subtitle?: string
  run: () => void | Promise<void>
}

const navItems = computed<Item[]>(() => {
  const base: Item[] = [
    {
      id: 'nav-dashboard',
      kind: 'nav',
      label: 'Dashboard',
      subtitle: 'Go to dashboard',
      run: () => void router.push('/dashboard'),
    },
    {
      id: 'nav-projects',
      kind: 'nav',
      label: 'Projects',
      subtitle: 'All projects',
      run: () => void router.push('/projects'),
    },
    {
      id: 'nav-tasks',
      kind: 'nav',
      label: 'Tasks',
      subtitle: 'Task list',
      run: () => void router.push('/tasks'),
    },
    {
      id: 'nav-reports',
      kind: 'nav',
      label: 'Reports',
      subtitle: 'Weekly reports',
      run: () => void router.push('/reports'),
    },
    {
      id: 'nav-profile',
      kind: 'nav',
      label: 'Profile',
      subtitle: 'Your profile',
      run: () => void router.push('/profile'),
    },
    {
      id: 'nav-ui-kit',
      kind: 'nav',
      label: 'UI kit',
      subtitle: 'Component gallery',
      run: () => void router.push('/ui-kit'),
    },
  ]
  if (auth.user?.role === 'admin') {
    base.push({
      id: 'nav-users',
      kind: 'nav',
      label: 'Users',
      subtitle: 'Admin',
      run: () => void router.push('/admin/users'),
    })
  }
  return base
})

const actionItems = computed<Item[]>(() => [
  {
    id: 'act-new-project',
    kind: 'action',
    label: 'New project',
    subtitle: 'Open projects',
    run: () => void router.push('/projects'),
  },
  {
    id: 'act-new-task',
    kind: 'action',
    label: 'New task',
    subtitle: 'Open tasks',
    run: () => void router.push('/tasks'),
  },
  {
    id: 'act-signout',
    kind: 'action',
    label: 'Sign out',
    subtitle: 'End session',
    run: () => {
      auth.logout()
      void router.push('/login')
    },
  },
])

const projectItems = computed<Item[]>(() =>
  projectStore.projects.map((p) => ({
    id: `proj-${p.id}`,
    kind: 'project' as const,
    label: p.name,
    subtitle: 'Project',
    run: () => void router.push(`/projects/${p.id}`),
  })),
)

const taskItems = computed<Item[]>(() =>
  taskStore.tasks.map((t) => ({
    id: `task-${t.id}`,
    kind: 'task' as const,
    label: t.title,
    subtitle: t.status.replace('_', ' '),
    run: () => {
      const q: Record<string, string> = {}
      if (t.project_id) q.project_id = String(t.project_id)
      const st = t.status as TaskStatus
      if (st) q.status = st
      void router.push({ path: '/tasks', query: q })
    },
  })),
)

const allItems = computed(() => [
  ...navItems.value,
  ...actionItems.value,
  ...projectItems.value,
  ...taskItems.value,
])

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return allItems.value
  return allItems.value.filter(
    (i) =>
      i.label.toLowerCase().includes(q) ||
      (i.subtitle && i.subtitle.toLowerCase().includes(q)),
  )
})

watch(filtered, () => {
  selected.value = 0
})

watch(commandPaletteOpen, async (v) => {
  if (v) {
    query.value = ''
    selected.value = 0
    projectStore.fetchList().catch(() => {})
    taskStore.fetchList().catch(() => {})
    await nextTick()
    inputRef.value?.focus()
  }
})

function close() {
  ui.closeCommandPalette()
}

function activate(i: number) {
  const list = filtered.value
  const item = list[i]
  if (!item) return
  void Promise.resolve(item.run()).finally(() => close())
}

function onKeydown(e: KeyboardEvent) {
  if (route.meta.layout === 'auth') return
  const meta = e.metaKey || e.ctrlKey
  if (meta && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    ui.toggleCommandPalette()
    return
  }
  if (!commandPaletteOpen.value) return
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    const n = filtered.value.length
    if (n) selected.value = (selected.value + 1) % n
    return
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    const n = filtered.value.length
    if (n) selected.value = (selected.value - 1 + n) % n
    return
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    activate(selected.value)
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="palette">
      <div
        v-if="commandPaletteOpen"
        class="fixed inset-0 z-[95] flex items-start justify-center overflow-y-auto bg-foreground/30 p-4 pt-[12vh] backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        @click.self="close"
      >
        <div
          class="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
          @keydown.stop
        >
          <div class="border-b border-border p-3">
            <input
              ref="inputRef"
              v-model="query"
              type="search"
              class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Search navigation, projects, tasks…"
              autocomplete="off"
              spellcheck="false"
              aria-autocomplete="list"
              :aria-activedescendant="
                filtered[selected] ? `cmd-${filtered[selected].id}` : undefined
              "
            />
            <p class="mt-2 text-xs text-muted">
              <kbd class="rounded border border-border bg-surface-muted px-1">↑</kbd>
              <kbd class="rounded border border-border bg-surface-muted px-1">↓</kbd>
              navigate ·
              <kbd class="rounded border border-border bg-surface-muted px-1">↵</kbd>
              open ·
              <kbd class="rounded border border-border bg-surface-muted px-1">esc</kbd>
              close
            </p>
          </div>
          <ul
            class="max-h-[min(50vh,24rem)] overflow-y-auto py-2"
            role="listbox"
          >
            <li v-if="!filtered.length" class="px-4 py-6 text-center text-sm text-muted">
              No matches
            </li>
            <li
              v-for="(item, index) in filtered"
              :id="`cmd-${item.id}`"
              :key="item.id"
              role="option"
              :aria-selected="index === selected"
              class="mx-2 flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
              :class="
                index === selected
                  ? 'bg-primary/15 text-foreground'
                  : 'text-foreground hover:bg-surface-muted'
              "
              @click="activate(index)"
              @mouseenter="selected = index"
            >
              <span class="min-w-0 flex-1 truncate font-medium">{{ item.label }}</span>
              <span class="shrink-0 text-xs capitalize text-muted">{{
                item.kind
              }}</span>
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.palette-enter-active,
.palette-leave-active {
  transition: opacity 0.15s ease;
}
.palette-enter-active > div,
.palette-leave-active > div {
  transition:
    transform 0.15s ease,
    opacity 0.15s ease;
}
.palette-enter-from,
.palette-leave-to {
  opacity: 0;
}
.palette-enter-from > div,
.palette-leave-to > div {
  opacity: 0;
  transform: scale(0.98);
}
</style>
