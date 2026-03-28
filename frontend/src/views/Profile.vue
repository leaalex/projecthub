<script setup lang="ts">
import {
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/vue/24/outline'
import { onMounted, ref } from 'vue'
import Button from '../components/common/Button.vue'
import Card from '../components/common/Card.vue'
import Input from '../components/common/Input.vue'
import { useAuthStore } from '../stores/auth.store'
import { useUiStore, type ThemeMode } from '../stores/ui.store'

const auth = useAuthStore()
const ui = useUiStore()

const themeOptions: {
  mode: ThemeMode
  label: string
  icon: typeof SunIcon
}[] = [
  { mode: 'light', label: 'Light', icon: SunIcon },
  { mode: 'dark', label: 'Dark', icon: MoonIcon },
  { mode: 'system', label: 'System', icon: ComputerDesktopIcon },
]
const name = ref('')
const email = ref('')
const saving = ref(false)
const message = ref<string | null>(null)

onMounted(() => {
  name.value = auth.user?.name ?? ''
  email.value = auth.user?.email ?? ''
})

async function save() {
  saving.value = true
  message.value = null
  try {
    await auth.updateProfile({
      name: name.value,
      email: email.value,
    })
    message.value = 'Profile saved.'
  } catch {
    message.value = 'Could not save profile (email may be taken).'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold text-foreground">Profile</h1>
    <p class="mt-1 text-sm text-muted">Update your account</p>

    <Card class="mt-6 max-w-md" title="Details">
      <form class="space-y-4" @submit.prevent="save">
        <Input id="pf-name" v-model="name" label="Name" />
        <Input
          id="pf-email"
          v-model="email"
          label="Email"
          type="email"
          required
          autocomplete="email"
        />
        <p v-if="message" class="text-sm text-muted">{{ message }}</p>
        <Button type="submit" :disabled="saving">
          {{ saving ? 'Saving…' : 'Save' }}
        </Button>
      </form>
    </Card>

    <Card class="mt-6 max-w-md" title="Appearance">
      <p class="mb-3 text-sm text-muted">
        Color theme for this device
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="opt in themeOptions"
          :key="opt.mode"
          type="button"
          class="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors"
          :class="
            ui.theme === opt.mode
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-surface-muted/50 text-muted hover:bg-surface-muted hover:text-foreground'
          "
          :aria-pressed="ui.theme === opt.mode"
          @click="ui.setTheme(opt.mode)"
        >
          <component :is="opt.icon" class="h-5 w-5 shrink-0" aria-hidden="true" />
          {{ opt.label }}
        </button>
      </div>
    </Card>
  </div>
</template>
