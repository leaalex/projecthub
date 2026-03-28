<script setup lang="ts">
import {
  ChartBarIcon,
  CheckBadgeIcon,
  ClipboardDocumentCheckIcon,
  FolderIcon,
  HomeIcon,
  UserIcon,
  UsersIcon,
} from '@heroicons/vue/24/outline'
import type { Component } from 'vue'
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'

defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  navigate: []
}>()

const route = useRoute()
const auth = useAuthStore()

const iconMap: Record<string, Component> = {
  home: HomeIcon,
  folder: FolderIcon,
  check: ClipboardDocumentCheckIcon,
  chart: ChartBarIcon,
  user: UserIcon,
  users: UsersIcon,
}

const links = computed(() => {
  const base: { to: string; label: string; icon: string }[] = [
    { to: '/dashboard', label: 'Dashboard', icon: 'home' },
    { to: '/projects', label: 'Projects', icon: 'folder' },
    { to: '/tasks', label: 'Tasks', icon: 'check' },
    { to: '/reports', label: 'Reports', icon: 'chart' },
    { to: '/profile', label: 'Profile', icon: 'user' },
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
</script>

<template>
  <div class="border-b border-border px-3 py-3">
    <RouterLink
      to="/dashboard"
      class="flex items-center justify-center gap-2 font-semibold text-primary md:justify-start"
      :title="collapsed ? 'Project Hub' : undefined"
      @click="onNavigate"
    >
      <CheckBadgeIcon class="h-6 w-6 shrink-0" aria-hidden="true" />
      <span v-show="!collapsed" class="truncate text-lg">Project Hub</span>
    </RouterLink>
  </div>
  <nav class="flex flex-1 flex-col gap-0.5 p-2" aria-label="Main">
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
</template>
