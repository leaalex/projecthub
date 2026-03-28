<script setup lang="ts">
import { Bars3Icon } from '@heroicons/vue/24/outline'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from './components/layout/AppSidebar.vue'
import CommandPalette from './components/common/CommandPalette.vue'
import ConfirmDialog from './components/common/ConfirmDialog.vue'
import Toast from './components/common/Toast.vue'
import { useUiStore } from './stores/ui.store'

const route = useRoute()
const ui = useUiStore()

const useAuthLayout = computed(() => route.meta.layout === 'auth')
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <Toast />
    <ConfirmDialog />
    <CommandPalette />
    <template v-if="useAuthLayout">
      <router-view v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </Transition>
      </router-view>
    </template>
    <template v-else>
      <div
        class="relative flex h-dvh max-h-dvh min-h-0 overflow-hidden md:gap-3 md:p-3 lg:gap-4 lg:p-4"
      >
        <button
          type="button"
          class="fixed left-4 top-4 z-30 rounded-md border border-border bg-surface p-2 text-muted shadow-sm transition-colors hover:bg-surface-muted hover:text-foreground md:hidden"
          aria-label="Open menu"
          @click="ui.toggleMobileMenu()"
        >
          <Bars3Icon class="h-6 w-6" aria-hidden="true" />
        </button>
        <AppSidebar />
        <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <main
            class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-background p-6 pt-16 md:pt-6"
          >
            <router-view v-slot="{ Component }">
              <Transition name="page" mode="out-in">
                <component :is="Component" :key="route.fullPath" />
              </Transition>
            </router-view>
          </main>
        </div>
      </div>
    </template>
  </div>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
