<script setup lang="ts">
import { ref } from 'vue'
import UiAvatar from '../components/ui/UiAvatar.vue'
import UiBadge from '../components/ui/UiBadge.vue'
import UiBreadcrumb from '../components/ui/UiBreadcrumb.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiCard from '../components/ui/UiCard.vue'
import UiEmptyState from '../components/ui/UiEmptyState.vue'
import UiInput from '../components/ui/UiInput.vue'
import UiModal from '../components/ui/UiModal.vue'
import UiSelect from '../components/ui/UiSelect.vue'
import UiSkeleton from '../components/ui/UiSkeleton.vue'
import UiTable from '../components/ui/UiTable.vue'
import { useConfirm } from '../composables/useConfirm'
import { useToast } from '../composables/useToast'
import type { TaskPriority, TaskStatus } from '../types/task'

const { confirm } = useConfirm()
const toast = useToast()

const demoInput = ref('Sample value')
const demoErrorInput = ref('')
const demoDisabled = ref('Read-only value')

const demoSelectPlain = ref('mocha')
const demoSelectDisabledOpt = ref('a')
const demoSelectSm = ref('latte')
const demoSelectEmpty = ref('')

const selectFlavorOptions = [
  { value: 'latte', label: 'Latte' },
  { value: 'mocha', label: 'Mocha' },
  { value: 'tea', label: 'Tea' },
]

const selectWithDisabledOption = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B', disabled: true },
  { value: 'c', label: 'Option C' },
]

const modalOpen = ref(false)
const buttonLoading = ref(false)

const statuses: TaskStatus[] = ['todo', 'in_progress', 'review', 'done']
const priorities: TaskPriority[] = ['low', 'medium', 'high', 'critical']

function flashLoading() {
  buttonLoading.value = true
  window.setTimeout(() => {
    buttonLoading.value = false
  }, 1500)
}

async function runConfirmDemo() {
  const ok = await confirm({
    title: 'Confirm dialog',
    message: 'This is a demo of UiConfirmDialog (global).',
    confirmLabel: 'OK',
  })
  toast.info(ok ? 'Confirmed' : 'Cancelled')
}
</script>

<template>
  <div>
    <UiBreadcrumb
      class="mb-4"
      :items="[
        { label: 'Home', to: '/dashboard' },
        { label: 'UI kit' },
      ]"
    />
    <div class="mb-8">
      <h1 class="text-2xl font-semibold text-foreground">UI kit</h1>
      <p class="mt-1 text-sm text-muted">
        Project UI primitives from <code class="text-foreground">components/ui</code>
      </p>
      <p class="mt-3 max-w-3xl text-xs leading-relaxed text-muted">
        On this page:
        <span class="text-foreground/90">UiButton</span>,
        <span class="text-foreground/90">UiInput</span>,
        <span class="text-foreground/90">UiSelect</span>,
        <span class="text-foreground/90">UiBadge</span>,
        <span class="text-foreground/90">UiAvatar</span>,
        <span class="text-foreground/90">UiCard</span>,
        <span class="text-foreground/90">UiTable</span>,
        <span class="text-foreground/90">UiBreadcrumb</span>,
        <span class="text-foreground/90">UiEmptyState</span>,
        <span class="text-foreground/90">UiSkeleton</span>,
        <span class="text-foreground/90">UiModal</span>.
        Globally in the app shell:
        <span class="text-foreground/90">UiToast</span>,
        <span class="text-foreground/90">UiConfirmDialog</span>,
        <span class="text-foreground/90">UiCommandPalette</span>.
      </p>
    </div>

    <div class="space-y-8">
      <UiCard title="Buttons">
        <div class="flex flex-wrap items-center gap-3">
          <UiButton variant="primary">Primary</UiButton>
          <UiButton variant="secondary">Secondary</UiButton>
          <UiButton variant="ghost">Ghost</UiButton>
          <UiButton variant="danger">Danger</UiButton>
        </div>
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <UiButton :loading="true">Loading</UiButton>
          <UiButton disabled>Disabled</UiButton>
          <UiButton :loading="buttonLoading" @click="flashLoading">
            Click to load
          </UiButton>
        </div>
        <div class="mt-4 max-w-xs">
          <UiButton block variant="secondary">Block</UiButton>
        </div>
      </UiCard>

      <UiCard title="Inputs (UiInput)">
        <div class="grid max-w-md gap-4">
          <UiInput
            id="ui-demo-1"
            v-model="demoInput"
            label="With label"
            placeholder="Type here…"
          />
          <UiInput
            id="ui-demo-2"
            v-model="demoErrorInput"
            label="With error"
            placeholder="Required"
            error="This field cannot be empty"
          />
          <UiInput
            id="ui-demo-3"
            v-model="demoDisabled"
            label="Disabled"
            disabled
          />
        </div>
      </UiCard>

      <UiCard title="Select (UiSelect)">
        <div class="grid max-w-md gap-6">
          <UiSelect
            id="ui-sel-1"
            v-model="demoSelectPlain"
            label="Basic"
            placeholder="Choose a drink…"
            :options="selectFlavorOptions"
          />
          <UiSelect
            id="ui-sel-2"
            v-model="demoSelectDisabledOpt"
            label="With disabled option"
            :options="selectWithDisabledOption"
          />
          <UiSelect
            id="ui-sel-3"
            v-model="demoSelectSm"
            label="Small size"
            size="sm"
            :options="selectFlavorOptions"
          />
          <UiSelect
            id="ui-sel-4"
            v-model="demoSelectEmpty"
            label="Error state"
            placeholder="Required"
            error="Pick a value"
            :options="selectFlavorOptions"
          />
        </div>
      </UiCard>

      <UiCard title="Badges & avatars">
        <p class="mb-3 text-sm font-medium text-muted">Status</p>
        <div class="flex flex-wrap gap-2">
          <UiBadge
            v-for="s in statuses"
            :key="s"
            kind="status"
            :value="s"
          />
        </div>
        <p class="mb-3 mt-6 text-sm font-medium text-muted">Priority</p>
        <div class="flex flex-wrap gap-2">
          <UiBadge
            v-for="p in priorities"
            :key="p"
            kind="priority"
            :value="p"
          />
        </div>
        <p class="mb-3 mt-6 text-sm font-medium text-muted">Avatar sizes</p>
        <div class="flex flex-wrap items-end gap-4">
          <UiAvatar size="sm" name="Alex Doe" email="alex@example.com" />
          <UiAvatar size="md" name="Jamie Smith" email="jamie@example.com" />
          <UiAvatar size="lg" email="only@email.com" />
        </div>
      </UiCard>

      <UiCard title="Cards & table">
        <UiCard class="mb-6 border-dashed bg-surface-muted/30 p-4 shadow-none">
          <p class="text-sm text-foreground">
            Nested card (no title) for nested content.
          </p>
        </UiCard>
        <UiTable :headers="['Name', 'Role', 'Status']">
          <tr v-for="row in 3" :key="row" class="text-foreground">
            <td class="px-4 py-3">User {{ row }}</td>
            <td class="px-4 py-3 text-muted">Member</td>
            <td class="px-4 py-3">Active</td>
          </tr>
        </UiTable>
      </UiCard>

      <UiCard title="Breadcrumb (sample)">
        <UiBreadcrumb
          :items="[
            { label: 'Projects', to: '/projects' },
            { label: 'Alpha', to: '/projects/1' },
            { label: 'Settings' },
          ]"
        />
      </UiCard>

      <UiCard title="Empty state & skeletons">
        <UiEmptyState
          class="mb-8"
          title="Nothing here"
          description="UiEmptyState for lists with no data."
        >
          <UiButton variant="secondary">Action</UiButton>
        </UiEmptyState>
        <div class="grid gap-6 sm:grid-cols-3">
          <div>
            <p class="mb-2 text-xs font-medium text-muted">Skeleton line</p>
            <UiSkeleton variant="line" :lines="3" />
          </div>
          <div>
            <p class="mb-2 text-xs font-medium text-muted">Skeleton card</p>
            <UiSkeleton variant="card" />
          </div>
          <div>
            <p class="mb-2 text-xs font-medium text-muted">Skeleton avatar</p>
            <UiSkeleton variant="avatar" />
          </div>
        </div>
      </UiCard>

      <UiCard title="Modal & global overlays">
        <div class="flex flex-wrap gap-3">
          <UiButton @click="modalOpen = true">Open modal</UiButton>
          <UiButton variant="secondary" @click="toast.success('Saved successfully')">
            Toast success
          </UiButton>
          <UiButton variant="secondary" @click="toast.error('Something went wrong')">
            Toast error
          </UiButton>
          <UiButton variant="secondary" @click="toast.info('FYI: demo info toast')">
            Toast info
          </UiButton>
          <UiButton variant="ghost" @click="runConfirmDemo">Confirm dialog</UiButton>
        </div>
        <p class="mt-4 text-sm text-muted">
          <strong class="text-foreground">Command palette:</strong>
          press <kbd class="rounded border border-border bg-surface-muted px-1.5 py-0.5 text-xs font-mono text-foreground">⌘</kbd>
          +
          <kbd class="rounded border border-border bg-surface-muted px-1.5 py-0.5 text-xs font-mono text-foreground">K</kbd>
          (Mac) or
          <kbd class="rounded border border-border bg-surface-muted px-1.5 py-0.5 text-xs font-mono text-foreground">Ctrl</kbd>
          +
          <kbd class="rounded border border-border bg-surface-muted px-1.5 py-0.5 text-xs font-mono text-foreground">K</kbd>
          (Windows/Linux). Toasts and confirm are rendered globally in
          <code class="text-foreground">App.vue</code>.
        </p>
      </UiCard>
    </div>

    <UiModal v-model="modalOpen" title="Demo modal">
      <p class="text-sm text-foreground">
        Content for <code class="text-foreground">UiModal</code>. Close with the
        button, overlay click, or Escape.
      </p>
      <div class="mt-4 flex justify-end gap-2">
        <UiButton variant="ghost" @click="modalOpen = false">Close</UiButton>
      </div>
    </UiModal>
  </div>
</template>
