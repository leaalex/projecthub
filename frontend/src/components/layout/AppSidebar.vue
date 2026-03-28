<script setup lang="ts">
import { ChevronDoubleLeftIcon } from '@heroicons/vue/24/outline'
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '../../stores/ui.store'
import SidebarNav from './SidebarNav.vue'

const ui = useUiStore()
const route = useRoute()

watch(
  () => route.fullPath,
  () => ui.closeMobileMenu(),
)
</script>

<template>
  <!-- Mobile overlay -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="ui.mobileMenuOpen"
        class="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm md:hidden"
        aria-hidden="true"
        @click="ui.closeMobileMenu()"
      />
    </Transition>
    <Transition name="slide">
      <aside
        v-if="ui.mobileMenuOpen"
        class="fixed inset-y-0 left-0 z-50 flex w-[min(16rem,88vw)] flex-col border-r border-border bg-surface shadow-xl md:hidden"
      >
        <SidebarNav :collapsed="false" @navigate="ui.closeMobileMenu()" />
      </aside>
    </Transition>
  </Teleport>

  <!-- Desktop rail -->
  <aside
    class="relative hidden shrink-0 flex-col border-r border-border bg-surface shadow-sm transition-[width] duration-200 ease-out md:flex"
    :class="ui.sidebarCollapsed ? 'w-16' : 'w-56'"
  >
    <SidebarNav :collapsed="ui.sidebarCollapsed" />
    <div class="mt-auto border-t border-border p-2">
      <button
        type="button"
        class="flex w-full items-center justify-center rounded-md p-2 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
        :title="ui.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :aria-expanded="!ui.sidebarCollapsed"
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
  </aside>
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
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
