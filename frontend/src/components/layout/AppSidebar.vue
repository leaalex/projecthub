<script setup lang="ts">
import { useUiStore } from '@app/ui.store'
import SidebarNav from './SidebarNav.vue'

const ui = useUiStore()
</script>

<template>
  <!-- Desktop rail only. Mobile navigation lives in BottomNav.vue. -->
  <aside
    class="relative hidden h-full max-h-full min-h-0 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-[width] duration-200 ease-out md:flex"
    :class="ui.sidebarCollapsed ? 'w-16' : 'w-56'"
  >
    <SidebarNav :collapsed="ui.sidebarCollapsed" />
  </aside>
</template>
