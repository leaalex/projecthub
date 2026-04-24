<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import AppSidebar from './components/layout/AppSidebar.vue'
import BottomNav from './components/layout/BottomNav.vue'
import NoteDetailSidebar from './components/notes/NoteDetailSidebar.vue'
import TaskDetailSidebar from './components/tasks/TaskDetailSidebar.vue'
import CommandPalette from './components/ui/UiCommandPalette.vue'
import ConfirmDialog from './components/ui/UiConfirmDialog.vue'
import Toast from './components/ui/UiToast.vue'
import { useAuthStore } from '@app/auth.store'
import { useDetailPanelStore } from '@app/detailPanel.store'
import { useProjectStore } from '@app/project.store'

const route = useRoute()
const { t } = useI18n()
const auth = useAuthStore()
const projectStore = useProjectStore()
const detailPanel = useDetailPanelStore()
const { entity, collapsed } = storeToRefs(detailPanel)

const useAuthLayout = computed(() => route.meta.layout === 'auth')

function refreshMemberProjects() {
  if (auth.user?.role === 'user') {
    void projectStore.fetchList().catch(() => {})
  }
}

watch(() => auth.user, refreshMemberProjects, { immediate: true })
watch(() => route.fullPath, () => {
  refreshMemberProjects()
  detailPanel.close()
})

function onVisibilityChange() {
  if (document.visibilityState === 'visible') refreshMemberProjects()
}

onMounted(() =>
  document.addEventListener('visibilitychange', onVisibilityChange),
)
onUnmounted(() =>
  document.removeEventListener('visibilitychange', onVisibilityChange),
)
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
        <AppSidebar />
        <div
          class="relative flex min-h-0 min-w-0 flex-1 overflow-hidden md:flex-row md:gap-3"
        >
          <main
            class="relative z-0 min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-background p-6 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] md:pb-6"
          >
            <router-view v-slot="{ Component }">
              <Transition name="page" mode="out-in">
                <component :is="Component" :key="route.fullPath" />
              </Transition>
            </router-view>
          </main>
          <template v-if="entity">
            <button
              v-if="!collapsed"
              type="button"
              class="fixed inset-0 z-10 bg-foreground/25 backdrop-blur-[2px] md:hidden"
              :aria-label="t('detailPanel.closeOverlay')"
              @click="detailPanel.close()"
            />
            <div
              class="fixed inset-0 z-20 flex min-h-0 w-full max-w-xl min-w-0 flex-col overflow-hidden p-3 pl-2 transition-transform duration-200 ease-out md:static md:inset-auto md:z-auto md:h-full md:max-h-full md:shrink-0 md:p-0 md:transition-[width,min-width] md:duration-200"
              :class="[
                collapsed
                  ? 'pointer-events-none translate-x-full md:translate-x-0 md:w-0 md:min-w-0 md:max-w-0 md:border-0 md:p-0'
                  : 'translate-x-0 md:w-full md:max-w-xl',
              ]"
            >
              <div
                class="flex min-h-0 min-w-0 flex-1 flex-col transition-transform duration-200 ease-out md:w-full md:max-w-xl"
                :class="collapsed ? 'md:translate-x-full' : 'md:translate-x-0'"
              >
                <TaskDetailSidebar
                  v-if="entity.kind === 'task'"
                  :key="`detail-task-${entity.taskId}`"
                  class="min-h-0 flex-1"
                  :task-id="entity.taskId"
                />
                <NoteDetailSidebar
                  v-else
                  :key="`detail-note-${entity.projectId}-${entity.noteId}`"
                  class="min-h-0 flex-1"
                  :project-id="entity.projectId"
                  :note-id="entity.noteId"
                />
              </div>
            </div>
          </template>
        </div>
        <BottomNav />
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
