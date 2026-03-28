<script setup lang="ts">
import {
  Bars3Icon,
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/vue/24/outline'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'
import { useUiStore } from '../../stores/ui.store'
import Avatar from '../common/Avatar.vue'
import Button from '../common/Button.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const ui = useUiStore()

const isAuthLayout = computed(() => route.meta.layout === 'auth')

const themeTitle = computed(() => {
  switch (ui.theme) {
    case 'light':
      return 'Theme: light (click for dark)'
    case 'dark':
      return 'Theme: dark (click for system)'
    default:
      return 'Theme: system (click for light)'
  }
})

async function logout() {
  auth.logout()
  await router.push('/login')
}
</script>

<template>
  <header
    v-if="!isAuthLayout"
    class="flex h-14 items-center justify-between gap-4 border-b border-border bg-surface px-4 md:px-6"
  >
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="rounded-md p-2 text-muted transition-colors hover:bg-surface-muted hover:text-foreground md:hidden"
        aria-label="Open menu"
        @click="ui.toggleMobileMenu()"
      >
        <Bars3Icon class="h-6 w-6" aria-hidden="true" />
      </button>
    </div>
    <div class="flex flex-1 items-center justify-end gap-2 sm:gap-4">
      <button
        type="button"
        class="rounded-md p-2 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
        :title="themeTitle"
        aria-label="Cycle color theme"
        @click="ui.cycleTheme()"
      >
        <SunIcon
          v-if="ui.theme === 'light'"
          class="h-5 w-5"
          aria-hidden="true"
        />
        <MoonIcon
          v-else-if="ui.theme === 'dark'"
          class="h-5 w-5"
          aria-hidden="true"
        />
        <ComputerDesktopIcon v-else class="h-5 w-5" aria-hidden="true" />
      </button>
      <div
        v-if="auth.user"
        class="hidden items-center gap-2 sm:flex"
      >
        <Avatar
          :email="auth.user.email"
          :name="auth.user.name"
          size="sm"
        />
        <span class="max-w-[10rem] truncate text-sm text-foreground">
          <span class="font-medium">{{ auth.user.email }}</span>
          <span class="ml-2 rounded bg-surface-muted px-2 py-0.5 text-xs text-muted">
            {{ auth.user.role }}
          </span>
        </span>
      </div>
      <Button variant="secondary" @click="logout">Sign out</Button>
    </div>
  </header>
</template>
