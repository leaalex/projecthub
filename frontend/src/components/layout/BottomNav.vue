<script setup lang="ts">
import {
  ArrowRightStartOnRectangleIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  EllipsisHorizontalIcon,
  FolderIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  SwatchIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import type { Component } from 'vue'
import { computed, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@app/auth.store'
import { useProjectNavVisibility } from '@app/composables/useProjectNavVisibility'
import { useDetailPanelStore } from '@app/detailPanel.store'
import { useUiStore } from '@app/ui.store'
import Avatar from '../ui/UiAvatar.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
const detailPanel = useDetailPanelStore()
const { t } = useI18n()
const { showProjectsAndTasks } = useProjectNavVisibility()

type NavLink = { to: string; label: string; icon: Component }

const primaryLinks = computed((): NavLink[] => {
  const base: NavLink[] = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: HomeIcon },
    { to: '/projects', label: t('nav.projects'), icon: FolderIcon },
    { to: '/tasks', label: t('nav.tasks'), icon: ClipboardDocumentCheckIcon },
    { to: '/notes', label: t('nav.notes'), icon: DocumentTextIcon },
  ]
  if (auth.user?.role === 'user' && !showProjectsAndTasks.value) {
    return base.filter(
      (l) => l.to !== '/projects' && l.to !== '/tasks' && l.to !== '/notes',
    )
  }
  return base
})

const secondaryLinks = computed((): NavLink[] => {
  const links: NavLink[] = [
    { to: '/reports', label: t('nav.reports'), icon: ChartBarIcon },
  ]
  if (auth.user?.role === 'user' && !showProjectsAndTasks.value) {
    return []
  }
  return links
})

const adminLinks = computed((): NavLink[] => {
  if (auth.user?.role !== 'admin' && auth.user?.role !== 'staff') return []
  return [
    { to: '/admin/users', label: t('nav.users'), icon: UsersIcon },
    { to: '/ui-kit', label: t('nav.uiKit'), icon: SwatchIcon },
  ]
})

function isActive(path: string) {
  if (path === '/dashboard') return route.path === '/dashboard'
  return route.path === path || route.path.startsWith(path + '/')
}

const moreIsActive = computed(() => {
  const all = [...secondaryLinks.value, ...adminLinks.value].map((l) => l.to)
  if (isActive('/profile')) return true
  return all.some((p) => isActive(p))
})

// Hide the bottom bar when a detail panel fully covers the screen on mobile.
const hidden = computed(
  () => Boolean(detailPanel.entity) && !detailPanel.collapsed,
)

function closeMore() {
  ui.closeMobileMenu()
}

function openCommandPalette() {
  closeMore()
  void nextTick(() => ui.openCommandPalette())
}

async function logout() {
  closeMore()
  await auth.logout()
  await router.push('/login')
}

watch(
  () => route.fullPath,
  () => closeMore(),
)
</script>

<template>
  <!-- Floating bottom tab bar (mobile only) -->
  <nav
    v-show="!hidden"
    class="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-3 md:hidden"
    :aria-label="t('nav.mainNavigation')"
    style="padding-bottom: calc(env(safe-area-inset-bottom) + 0.75rem)"
  >
    <ul
      class="pointer-events-auto flex w-full max-w-screen-sm items-stretch justify-around rounded-2xl border border-border bg-surface/90 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-surface/75"
    >
      <li v-for="l in primaryLinks" :key="l.to" class="flex-1">
        <RouterLink
          :to="l.to"
          class="flex h-full flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-2 text-[11px] font-medium transition-colors"
          :class="
            isActive(l.to)
              ? 'text-primary'
              : 'text-muted hover:text-foreground'
          "
          :aria-current="isActive(l.to) ? 'page' : undefined"
        >
          <component
            :is="l.icon"
            class="h-6 w-6 shrink-0"
            aria-hidden="true"
          />
          <span class="truncate leading-tight">{{ l.label }}</span>
        </RouterLink>
      </li>
      <li class="flex-1">
        <button
          type="button"
          class="flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-2 text-[11px] font-medium transition-colors"
          :class="
            moreIsActive || ui.mobileMenuOpen
              ? 'text-primary'
              : 'text-muted hover:text-foreground'
          "
          :aria-expanded="ui.mobileMenuOpen"
          :aria-label="t('nav.moreMenu')"
          @click="ui.toggleMobileMenu()"
        >
          <EllipsisHorizontalIcon
            class="h-6 w-6 shrink-0"
            aria-hidden="true"
          />
          <span class="truncate leading-tight">{{ t('nav.more') }}</span>
        </button>
      </li>
    </ul>
  </nav>

  <!-- "More" bottom sheet (mobile only) -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="ui.mobileMenuOpen"
        class="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm md:hidden"
        aria-hidden="true"
        @click="closeMore"
      />
    </Transition>
    <Transition name="sheet">
      <div
        v-if="ui.mobileMenuOpen"
        class="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-h-[85dvh] max-w-screen-sm flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl md:hidden"
        role="dialog"
        aria-modal="true"
        :aria-label="t('nav.moreMenu')"
        style="bottom: calc(env(safe-area-inset-bottom) + 0.75rem)"
      >
        <div class="flex items-center justify-between border-b border-border px-4 py-3">
          <span class="text-sm font-semibold">{{ t('nav.moreMenu') }}</span>
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            :aria-label="t('common.close')"
            @click="closeMore"
          >
            <XMarkIcon class="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto p-2">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            :aria-label="t('nav.commandPalette')"
            @click="openCommandPalette"
          >
            <MagnifyingGlassIcon class="h-5 w-5 shrink-0" aria-hidden="true" />
            <span class="truncate">{{ t('nav.commandPalette') }}</span>
          </button>

          <div
            v-if="secondaryLinks.length"
            class="mt-1 flex flex-col gap-0.5"
          >
            <RouterLink
              v-for="l in secondaryLinks"
              :key="l.to"
              :to="l.to"
              class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
              :class="
                isActive(l.to)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted hover:bg-surface-muted hover:text-foreground'
              "
            >
              <component
                :is="l.icon"
                class="h-5 w-5 shrink-0"
                aria-hidden="true"
              />
              <span class="truncate">{{ l.label }}</span>
            </RouterLink>
          </div>

          <template v-if="adminLinks.length">
            <div
              class="my-2 border-t border-border"
              role="separator"
              aria-hidden="true"
            />
            <p
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
                :class="
                  isActive(l.to)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted hover:bg-surface-muted hover:text-foreground'
                "
              >
                <component
                  :is="l.icon"
                  class="h-5 w-5 shrink-0"
                  aria-hidden="true"
                />
                <span class="truncate">{{ l.label }}</span>
              </RouterLink>
            </div>
          </template>
        </div>

        <div v-if="auth.user" class="border-t border-border p-2">
          <div class="flex items-center gap-2 px-1">
            <RouterLink
              to="/profile"
              class="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-0.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
              :class="
                isActive('/profile')
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-surface-muted'
              "
              :aria-current="isActive('/profile') ? 'page' : undefined"
            >
              <Avatar
                :email="auth.user.email"
                :name="auth.user.name"
              />
              <div class="min-w-0 flex-1">
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
              :title="t('nav.signOut')"
              :aria-label="t('nav.signOut')"
              @click="logout"
            >
              <ArrowRightStartOnRectangleIcon
                class="h-5 w-5"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.sheet-enter-active,
.sheet-leave-active {
  transition: transform 0.25s ease;
}
.sheet-enter-from,
.sheet-leave-to {
  transform: translateY(100%);
}
</style>
