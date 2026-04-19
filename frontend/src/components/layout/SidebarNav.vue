<script setup lang="ts">
import {
  ArrowRightStartOnRectangleIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  FolderIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  SwatchIcon,
  UsersIcon,
} from '@heroicons/vue/24/outline'
import type { Component } from 'vue'
import { computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useProjectNavVisibility } from '@app/composables/useProjectNavVisibility'
import { useAuthStore } from '@app/auth.store'
import { useUiStore } from '@app/ui.store'
import Avatar from '../ui/UiAvatar.vue'

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
const { t } = useI18n()
const { showProjectsAndTasks } = useProjectNavVisibility()

const iconMap: Record<string, Component> = {
  home: HomeIcon,
  folder: FolderIcon,
  check: ClipboardDocumentCheckIcon,
  note: DocumentTextIcon,
  chart: ChartBarIcon,
  swatch: SwatchIcon,
  users: UsersIcon,
}

type NavLink = { to: string; label: string; icon: string }

const mainLinks = computed((): NavLink[] => {
  const base: NavLink[] = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: 'home' },
    { to: '/projects', label: t('nav.projects'), icon: 'folder' },
    { to: '/tasks', label: t('nav.tasks'), icon: 'check' },
    { to: '/notes', label: t('nav.notes'), icon: 'note' },
    { to: '/reports', label: t('nav.reports'), icon: 'chart' },
  ]
  if (auth.user?.role === 'user' && !showProjectsAndTasks.value) {
    return base.filter(
      (link) =>
        link.to !== '/projects' && link.to !== '/tasks' && link.to !== '/notes',
    )
  }
  return base
})

const adminLinks = computed((): NavLink[] => {
  if (auth.user?.role !== 'admin' && auth.user?.role !== 'staff') return []
  return [
    { to: '/admin/users', label: t('nav.users'), icon: 'users' },
    { to: '/ui-kit', label: t('nav.uiKit'), icon: 'swatch' },
  ]
})

function isActive(path: string) {
  if (path === '/dashboard') return route.path === '/dashboard'
  return route.path === path || route.path.startsWith(path + '/')
}

function onNavigate() {
  emit('navigate')
}

async function logout() {
  await auth.logout()
  await router.push('/login')
  emit('navigate')
}

function openCommandPaletteFromSidebar() {
  onNavigate()
  void nextTick(() => {
    ui.openCommandPalette()
  })
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-1 flex-col">
    <div
      class="flex border-b border-border px-2 py-3 md:px-3"
      :class="
        collapsed
          ? 'items-stretch'
          : 'items-center gap-1 md:gap-2'
      "
    >
      <RouterLink
        v-if="!collapsed"
        to="/dashboard"
        class="flex min-w-0 flex-1 items-center font-semibold text-primary md:justify-start"
        @click="onNavigate"
      >
        <span class="truncate text-lg">{{ t('common.brand') }}</span>
      </RouterLink>
      <button
        type="button"
        class="hidden rounded-md text-muted transition-colors hover:bg-surface-muted hover:text-foreground md:inline-flex md:items-center md:justify-center"
        :class="
          collapsed
            ? 'w-full py-2'
            : 'shrink-0 p-1.5'
        "
        :title="collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')"
        :aria-expanded="!collapsed"
        :aria-label="t('nav.toggleSidebar')"
        @click="ui.toggleSidebarCollapsed()"
      >
        <ChevronLeftIcon
          v-if="!collapsed"
          class="h-5 w-5"
          aria-hidden="true"
        />
        <ChevronRightIcon
          v-else
          class="h-5 w-5"
          aria-hidden="true"
        />
      </button>
    </div>

    <div class="border-b border-border px-2 pb-2 pt-2">
      <button
        type="button"
        class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
        :class="collapsed ? 'justify-center px-2' : ''"
        :title="t('nav.commandPaletteShortcut')"
        :aria-label="t('nav.commandPalette')"
        @click="openCommandPaletteFromSidebar"
      >
        <MagnifyingGlassIcon class="h-5 w-5 shrink-0" aria-hidden="true" />
        <span v-show="!collapsed" class="truncate">{{ t('nav.commandPalette') }}</span>
      </button>
    </div>

    <nav
      class="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2"
      :aria-label="t('nav.mainNavigation')"
    >
      <RouterLink
        v-for="l in mainLinks"
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

      <template v-if="adminLinks.length">
        <div
          class="my-2 border-t border-border"
          role="separator"
          :aria-hidden="true"
        />
        <p
          v-show="!collapsed"
          class="mb-0.5 mt-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted"
        >
          {{ t('nav.admin') }}
        </p>
        <div
          class="flex flex-col gap-0.5"
          role="group"
          :aria-label="t('nav.admin')"
        >
          <RouterLink
            v-for="l in adminLinks"
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
        </div>
      </template>
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
          :title="collapsed ? t('nav.profile') : undefined"
          :aria-current="isActive('/profile') ? 'page' : undefined"
          @click="onNavigate"
        >
          <Avatar
            :email="auth.user.email"
            :name="auth.user.name"
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
          :title="t('nav.signOut')"
          :aria-label="t('nav.signOut')"
          @click="logout"
        >
          <ArrowRightStartOnRectangleIcon class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>
</template>
