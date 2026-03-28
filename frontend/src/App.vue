<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './components/layout/AppHeader.vue'
import AppSidebar from './components/layout/AppSidebar.vue'
import CommandPalette from './components/common/CommandPalette.vue'
import ConfirmDialog from './components/common/ConfirmDialog.vue'
import Toast from './components/common/Toast.vue'

const route = useRoute()

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
      <div class="flex min-h-screen">
        <AppSidebar />
        <div class="flex min-h-screen flex-1 flex-col">
          <AppHeader />
          <main class="flex-1 overflow-auto bg-background p-6">
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
