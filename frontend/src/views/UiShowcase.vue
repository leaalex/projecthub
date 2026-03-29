<script setup lang="ts">
import { ref } from 'vue'
import UiAvatar from '../components/ui/UiAvatar.vue'
import UiBadge from '../components/ui/UiBadge.vue'
import UiBreadcrumb from '../components/ui/UiBreadcrumb.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiCard from '../components/ui/UiCard.vue'
import UiCheckboxRow from '../components/ui/UiCheckboxRow.vue'
import UiEmptyState from '../components/ui/UiEmptyState.vue'
import UiFilterChip from '../components/ui/UiFilterChip.vue'
import UiFormSection from '../components/ui/UiFormSection.vue'
import UiInput from '../components/ui/UiInput.vue'
import UiMenuButton from '../components/ui/UiMenuButton.vue'
import UiModal from '../components/ui/UiModal.vue'
import UiScrollPanel from '../components/ui/UiScrollPanel.vue'
import UiSegmentedControl from '../components/ui/UiSegmentedControl.vue'
import UiSelect from '../components/ui/UiSelect.vue'
import UiSkeleton from '../components/ui/UiSkeleton.vue'
import UiTextAction from '../components/ui/UiTextAction.vue'
import UiTable from '../components/ui/UiTable.vue'
import { useConfirm } from '../composables/useConfirm'
import { useToast } from '../composables/useToast'
import type { TaskPriority, TaskStatus } from '../types/task'

const { confirm } = useConfirm()
const toast = useToast()

const demoInput = ref('Sample value')
const demoErrorInput = ref('')
const demoDisabled = ref('Read-only value')
const demoDate = ref('')

const demoCheckboxIds = ref<number[]>([1, 2])
const demoFilterChips = ref<string[]>(['todo', 'done'])

const demoSelectPlain = ref('mocha')
const demoSelectDisabledOpt = ref('a')
const demoSelectSm = ref('latte')
const demoSelectEmpty = ref('')
const demoSelectFilterable = ref('')
const demoSelectMulti = ref<(string | number)[]>(['latte'])
const demoSelectFilterableMulti = ref<(string | number)[]>(['ams', 'vie'])

const demoMenuValue = ref<string | number>('latte')
const demoMenuActionLog = ref('—')
const menuActionOptions = [
  { value: 'edit', label: 'Edit' },
  { value: 'copy', label: 'Duplicate' },
  { value: 'archive', label: 'Archive' },
  { value: 'del', label: 'Delete', disabled: true },
]

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

/** Long list for filterable demos */
const selectCityOptions = [
  { value: 'ams', label: 'Amsterdam' },
  { value: 'ath', label: 'Athens' },
  { value: 'bcn', label: 'Barcelona' },
  { value: 'ber', label: 'Berlin' },
  { value: 'bru', label: 'Brussels' },
  { value: 'bud', label: 'Budapest' },
  { value: 'cph', label: 'Copenhagen' },
  { value: 'dub', label: 'Dublin' },
  { value: 'edi', label: 'Edinburgh' },
  { value: 'hel', label: 'Helsinki' },
  { value: 'lis', label: 'Lisbon' },
  { value: 'lon', label: 'London' },
  { value: 'mad', label: 'Madrid' },
  { value: 'muc', label: 'Munich' },
  { value: 'osl', label: 'Oslo' },
  { value: 'par', label: 'Paris' },
  { value: 'pra', label: 'Prague' },
  { value: 'rom', label: 'Rome' },
  { value: 'sto', label: 'Stockholm' },
  { value: 'vie', label: 'Vienna' },
  { value: 'war', label: 'Warsaw' },
  { value: 'zag', label: 'Zagreb' },
]

const modalOpen = ref(false)
const buttonLoading = ref(false)

const demoSegment = ref('list')
const demoSegmentThree = ref('b')
const segmentedTwo = [
  { value: 'list', label: 'List' },
  { value: 'board', label: 'Board' },
]
const segmentedThree = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
]

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

function onDemoMenuSelect(v: string | number) {
  demoMenuActionLog.value = String(v)
  toast.info(`Action: ${v}`)
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
        <span class="text-foreground/90">UiSegmentedControl</span>,
        <span class="text-foreground/90">UiInput</span>,
        <span class="text-foreground/90">UiSelect</span>,
        <span class="text-foreground/90">UiBadge</span>,
        <span class="text-foreground/90">UiAvatar</span>,
        <span class="text-foreground/90">UiCard</span>,
        <span class="text-foreground/90">UiTable</span>,
        <span class="text-foreground/90">UiBreadcrumb</span>,
        <span class="text-foreground/90">UiEmptyState</span>,
        <span class="text-foreground/90">UiSkeleton</span>,
        <span class="text-foreground/90">UiModal</span>,
        <span class="text-foreground/90">UiFormSection</span>,
        <span class="text-foreground/90">UiScrollPanel</span>,
        <span class="text-foreground/90">UiTextAction</span>,
        <span class="text-foreground/90">UiCheckboxRow</span>,
        <span class="text-foreground/90">UiFilterChip</span>.
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
          <UiButton variant="ghost-danger">Ghost danger</UiButton>
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

      <UiCard title="Segmented control (UiSegmentedControl)">
        <p class="mb-4 text-sm text-muted">
          Same pattern as List / Board on the Tasks page. Uses
          <code class="text-foreground">v-model</code> with string values.
        </p>
        <div class="flex flex-col gap-6">
          <div>
            <p class="mb-2 text-xs font-medium text-muted">Two segments</p>
            <UiSegmentedControl
              v-model="demoSegment"
              aria-label="Demo two options"
              :options="segmentedTwo"
            />
            <p class="mt-2 text-xs text-muted">
              Selected: <code class="text-foreground">{{ demoSegment }}</code>
            </p>
          </div>
          <div>
            <p class="mb-2 text-xs font-medium text-muted">Three segments</p>
            <UiSegmentedControl
              v-model="demoSegmentThree"
              aria-label="Demo three options"
              :options="segmentedThree"
            />
          </div>
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
          <UiInput
            id="ui-demo-date"
            v-model="demoDate"
            type="date"
            label="Date (type=&quot;date&quot;)"
          />
        </div>
      </UiCard>

      <UiCard title="Form sections & filters">
        <p class="mb-4 text-sm text-muted">
          Primitives used in dense forms (e.g.
          <code class="text-foreground">ReportSettings</code>).
        </p>
        <UiFormSection title="Sample checklist">
          <template #actions>
            <UiTextAction
              @click="
                demoCheckboxIds =
                  demoCheckboxIds.length < 3 ? [1, 2, 3] : []
              "
            >
              {{ demoCheckboxIds.length < 3 ? 'Select all' : 'Clear' }}
            </UiTextAction>
          </template>
          <UiScrollPanel max-height-class="max-h-28">
            <UiCheckboxRow v-model="demoCheckboxIds" :value="1">
              Option one
            </UiCheckboxRow>
            <UiCheckboxRow v-model="demoCheckboxIds" :value="2">
              Option two
            </UiCheckboxRow>
            <UiCheckboxRow v-model="demoCheckboxIds" :value="3">
              Option three
            </UiCheckboxRow>
          </UiScrollPanel>
        </UiFormSection>
        <UiFormSection title="Filter chips" class="mt-6">
          <div class="flex flex-wrap gap-2">
            <UiFilterChip v-model="demoFilterChips" value="todo">
              To do
            </UiFilterChip>
            <UiFilterChip v-model="demoFilterChips" value="in_progress">
              In progress
            </UiFilterChip>
            <UiFilterChip v-model="demoFilterChips" value="done">
              Done
            </UiFilterChip>
          </div>
          <p class="mt-2 text-xs text-muted">
            Selected:
            <code class="text-foreground">{{ demoFilterChips.join(', ') || '—' }}</code>
          </p>
        </UiFormSection>
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
            label="Same compact height as other controls"
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
          <UiSelect
            id="ui-sel-5"
            v-model="demoSelectFilterable"
            label="Filterable (search)"
            placeholder="Pick a city…"
            filterable
            :options="selectCityOptions"
          />
          <div class="space-y-2">
            <UiSelect
              id="ui-sel-6"
              v-model="demoSelectMulti"
              label="Multiple"
              placeholder="Pick drinks…"
              multiple
              :options="selectFlavorOptions"
            />
            <p class="text-xs text-muted">
              Selected:
              <code class="text-foreground">{{
                demoSelectMulti.join(', ') || '—'
              }}</code>
            </p>
          </div>
          <div class="space-y-2">
            <UiSelect
              id="ui-sel-7"
              v-model="demoSelectFilterableMulti"
              label="Filterable + multiple"
              placeholder="Pick cities…"
              filterable
              multiple
              :options="selectCityOptions"
            />
            <p class="text-xs text-muted">
              Selected:
              <code class="text-foreground">{{
                demoSelectFilterableMulti.join(', ') || '—'
              }}</code>
            </p>
          </div>
        </div>
      </UiCard>

      <UiCard title="Menu button (UiMenuButton)">
        <p class="mb-4 text-sm text-muted">
          Dropdown like
          <code class="text-foreground">UiSelect</code>: icon trigger or
          <code class="text-foreground">variant="field"</code> (value + chevron).
          <code class="text-foreground">ariaLabel</code> is required.
        </p>
        <div class="flex flex-col flex-wrap gap-6 sm:flex-row sm:items-center">
          <div class="flex items-center gap-3">
            <span class="text-xs font-medium text-muted">With v-model</span>
            <UiMenuButton
              v-model="demoMenuValue"
              ariaLabel="Choose drink"
              title="Choose drink"
              :options="selectFlavorOptions"
            />
            <code class="text-xs text-foreground">{{ demoMenuValue }}</code>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs font-medium text-muted">Actions (@select)</span>
            <UiMenuButton
              ariaLabel="Row actions"
              title="Row actions"
              :options="menuActionOptions"
              placement="bottom-start"
              @select="onDemoMenuSelect"
            />
            <code class="text-xs text-foreground">{{ demoMenuActionLog }}</code>
          </div>
          <div class="max-w-xs flex-1">
            <span class="mb-1 block text-xs font-medium text-muted"
              >Field style (tasks / filters)</span
            >
            <UiMenuButton
              v-model="demoMenuValue"
              variant="field"
              ariaLabel="Choose drink"
              placeholder="Pick a drink"
              :options="selectFlavorOptions"
            />
          </div>
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
        <p class="mb-3 mt-6 text-sm font-medium text-muted">Avatar</p>
        <p class="mb-3 text-xs text-muted">
          Single size (32×32px, <code class="text-foreground">text-xs</code>) everywhere.
        </p>
        <div class="flex flex-wrap items-center gap-4">
          <UiAvatar name="Alex Doe" email="alex@example.com" />
          <UiAvatar name="Jamie Smith" email="jamie@example.com" />
          <UiAvatar email="only@email.com" />
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
