<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '@app/ui.store'
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
        class="fixed bottom-3 left-3 top-3 z-50 flex w-[min(16rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-surface md:hidden"
      >
        <SidebarNav :collapsed="false" @navigate="ui.closeMobileMenu()" />
      </aside>
    </Transition>
  </Teleport>

  <!-- Desktop rail -->
  <aside
    class="relative hidden h-full max-h-full min-h-0 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-[width] duration-200 ease-out md:flex"
    :class="ui.sidebarCollapsed ? 'w-16' : 'w-56'"
  >
    <SidebarNav :collapsed="ui.sidebarCollapsed" />
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
