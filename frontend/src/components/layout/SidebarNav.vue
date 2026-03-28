<script setup lang="ts">
import {
  ArrowRightStartOnRectangleIcon,
  ChartBarIcon,
  ChevronDoubleLeftIcon,
  ClipboardDocumentCheckIcon,
  FolderIcon,
  HomeIcon,
  UsersIcon,
} from '@heroicons/vue/24/outline'
import type { Component } from 'vue'
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'
import { useUiStore } from '../../stores/ui.store'
import Avatar from '../common/Avatar.vue'

defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  navigate: []
}>()

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const iconMap: Record<string, Component> = {
  home: HomeIcon,
  folder: FolderIcon,
  check: ClipboardDocumentCheckIcon,
  chart: ChartBarIcon,
  users: UsersIcon,
}

const links = computed(() => {
  const base: { to: string; label: string; icon: string }[] = [
    { to: '/dashboard', label: 'Dashboard', icon: 'home' },
    { to: '/projects', label: 'Projects', icon: 'folder' },
    { to: '/tasks', label: 'Tasks', icon: 'check' },
    { to: '/reports', label: 'Reports', icon: 'chart' },
  ]
  if (auth.user?.role === 'admin') {
    base.push({ to: '/admin/users', label: 'Users', icon: 'users' })
  }
  return base
})

function isActive(path: string) {
  if (path === '/dashboard') return route.path === '/dashboard'
  return route.path === path || route.path.startsWith(path + '/')
}

function onNavigate() {
  emit('navigate')
}

async function logout() {
  auth.logout()
  await router.push('/login')
  emit('navigate')
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-1 flex-col">
    <div
      class="flex items-center gap-1 border-b border-border px-2 py-3 md:gap-2 md:px-3"
    >
      <RouterLink
        to="/dashboard"
        class="flex min-w-0 flex-1 items-center justify-center font-semibold text-primary md:justify-start"
        :title="collapsed ? 'Project Hub' : undefined"
        @click="onNavigate"
      >
        <span class="truncate text-lg">{{ collapsed ? 'P' : 'Project Hub' }}</span>
      </RouterLink>
      <button
        type="button"
        class="hidden shrink-0 rounded-md p-1.5 text-muted transition-colors hover:bg-surface-muted hover:text-foreground md:inline-flex"
        :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :aria-expanded="!collapsed"
        aria-label="Toggle sidebar width"
        @click="ui.toggleSidebarCollapsed()"
      >
        <ChevronDoubleLeftIcon
          class="h-5 w-5 transition-transform"
          :class="ui.sidebarCollapsed ? 'rotate-180' : ''"
          aria-hidden="true"
        />
      </button>
    </div>

    <nav
      class="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2"
      aria-label="Main"
    >
      <RouterLink
        v-for="l in links"
        :key="l.to"
        :to="l.to"
        class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
        :class="[
          isActive(l.to)
            ? 'bg-primary/10 text-primary'
            : 'text-muted hover:bg-surface-muted hover:text-foreground',
          collapsed ? 'justify-center px-2' : '',
        ]"
        :title="collapsed ? l.label : undefined"
        @click="onNavigate"
      >
        <component
          :is="iconMap[l.icon]"
          class="h-5 w-5 shrink-0"
          aria-hidden="true"
        />
        <span v-show="!collapsed" class="truncate">{{ l.label }}</span>
      </RouterLink>
    </nav>

    <div v-if="auth.user" class="mt-auto border-t border-border p-2">
      <div
        class="flex items-center gap-2 px-1"
        :class="
          collapsed
            ? 'flex-col gap-2'
            : 'justify-between gap-3'
        "
      >
        <RouterLink
          to="/profile"
          class="flex min-w-0 items-center gap-2 rounded-md px-1 py-0.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
          :class="[
            collapsed ? 'flex-col' : 'flex-1',
            isActive('/profile')
              ? 'bg-primary/10 text-primary'
              : 'text-foreground hover:bg-surface-muted',
          ]"
          :title="collapsed ? 'Profile' : undefined"
          :aria-current="isActive('/profile') ? 'page' : undefined"
          @click="onNavigate"
        >
          <Avatar
            :email="auth.user.email"
            :name="auth.user.name"
            size="sm"
          />
          <div
            v-show="!collapsed"
            class="min-w-0 flex-1"
          >
            <p class="truncate text-xs font-medium">
              {{ auth.user.name || auth.user.email }}
            </p>
            <p
              class="truncate text-xs"
              :class="isActive('/profile') ? 'text-primary/80' : 'text-muted'"
            >
              {{ auth.user.name ? auth.user.email : auth.user.role }}
            </p>
          </div>
        </RouterLink>
        <button
          type="button"
          class="inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          :class="collapsed ? 'w-full' : ''"
          title="Sign out"
          aria-label="Sign out"
          @click="logout"
        >
          <ArrowRightStartOnRectangleIcon class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>
</template>
