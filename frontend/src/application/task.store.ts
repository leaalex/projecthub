import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  DraftSubtask,
  Subtask,
  Task,
  TaskPriority,
  TaskStatus,
} from '@domain/task/types'
import { tasksApi } from '@infra/api/tasks'
import { useProjectStore } from './project.store'

function sortSubtasks(list: Subtask[]): Subtask[] {
  return [...list].sort(
    (a, b) => a.position - b.position || a.id - b.id,
  )
}

export const useTaskStore = defineStore('task', () => {
  const projectStore = useProjectStore()
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  function patchTaskSubtasks(taskId: number, next: Subtask[]) {
    const i = tasks.value.findIndex((t) => t.id === taskId)
    if (i < 0) return
    const t = tasks.value[i]
    tasks.value[i] = { ...t, subtasks: sortSubtasks(next) }
  }

  async function fetchList(params?: {
    project_id?: number
    status?: TaskStatus
  }) {
    loading.value = true
    error.value = null
    try {
      const { data } = await tasksApi.list(params)
      tasks.value = data.tasks
    } catch (e: unknown) {
      error.value = 'Failed to load tasks'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: number) {
    const { data } = await tasksApi.get(id)
    return data.task
  }

  async function create(payload: {
    title: string
    description?: string
    project_id: number
    section_id?: number
    status?: TaskStatus
    priority?: TaskPriority
  }) {
    const { data } = await tasksApi.create(payload)
    tasks.value.unshift(data.task)
    return data.task
  }

  async function update(
    id: number,
    payload: Partial<{
      title: string
      description: string
      status: TaskStatus
      priority: TaskPriority
      project_id: number
      /** ISO date YYYY-MM-DD; send empty string to clear */
      due_date: string
    }>,
  ) {
    const { data } = await tasksApi.update(id, payload)
    const i = tasks.value.findIndex((t) => t.id === id)
    if (i >= 0) tasks.value[i] = data.task
    projectStore.patchTask(data.task)
    return data.task
  }

  async function remove(id: number) {
    await tasksApi.remove(id)
    tasks.value = tasks.value.filter((t) => t.id !== id)
    projectStore.removeTask(id)
  }

  async function assign(id: number, assignee_id: number) {
    const { data } = await tasksApi.assign(id, assignee_id)
    const i = tasks.value.findIndex((t) => t.id === id)
    if (i >= 0) tasks.value[i] = data.task
    projectStore.patchTask(data.task)
    return data.task
  }

  async function complete(id: number) {
    const { data } = await tasksApi.complete(id)
    const i = tasks.value.findIndex((t) => t.id === id)
    if (i >= 0) tasks.value[i] = data.task
    projectStore.patchTask(data.task)
    return data.task
  }

  async function createSubtask(taskId: number, title: string) {
    const { data } = await tasksApi.subtasks.create(taskId, title)
    const t = tasks.value.find((x) => x.id === taskId)
    const list = [...(t?.subtasks ?? []), data.subtask]
    patchTaskSubtasks(taskId, list)
    return data.subtask
  }

  async function toggleSubtask(taskId: number, subtaskId: number) {
    const { data } = await tasksApi.subtasks.toggle(taskId, subtaskId)
    const t = tasks.value.find((x) => x.id === taskId)
    const list = (t?.subtasks ?? []).map((s) =>
      s.id === data.subtask.id ? data.subtask : s,
    )
    patchTaskSubtasks(taskId, list)
    return data.subtask
  }

  async function updateSubtask(
    taskId: number,
    subtaskId: number,
    patch: Partial<{ title: string; done: boolean; position: number }>,
  ) {
    const { data } = await tasksApi.subtasks.update(taskId, subtaskId, patch)
    const t = tasks.value.find((x) => x.id === taskId)
    const list = (t?.subtasks ?? []).map((s) =>
      s.id === data.subtask.id ? data.subtask : s,
    )
    patchTaskSubtasks(taskId, list)
    return data.subtask
  }

  async function deleteSubtask(taskId: number, subtaskId: number) {
    await tasksApi.subtasks.remove(taskId, subtaskId)
    const t = tasks.value.find((x) => x.id === taskId)
    const list = (t?.subtasks ?? []).filter((s) => s.id !== subtaskId)
    patchTaskSubtasks(taskId, list)
  }

  async function reorderSubtasks(taskId: number, subtaskIds: number[]) {
    if (subtaskIds.length < 2) {
      return
    }
    await tasksApi.subtasks.reorder(taskId, subtaskIds)
    const t = tasks.value.find((x) => x.id === taskId)
    if (!t) {
      return
    }
    const byId = new Map((t.subtasks ?? []).map((s) => [s.id, s]))
    const next: Subtask[] = []
    let p = 1
    for (const id of subtaskIds) {
      const s = byId.get(id)
      if (s) {
        next.push({ ...s, position: p })
        p += 1
      }
    }
    patchTaskSubtasks(taskId, next)
  }

  function sortDraftsByPosition(list: DraftSubtask[]): DraftSubtask[] {
    return [...list].sort(
      (a, b) =>
        a.position - b.position
        || (a.id != null && b.id != null ? a.id - b.id : 0)
        || a.clientKey.localeCompare(b.clientKey),
    )
  }

  /**
   * Применяет черновик подзадач: удаления, новые (create + опциональный done)
   * и дифы по `original` для существующих id.
   * В конце — при необходимости batch `reorder`, чтобы порядок в draft совпал с бэкендом.
   */
  async function applyDraftSubtasks(
    taskId: number,
    draft: DraftSubtask[],
    removedIds: number[],
    original: Map<number, { title: string; done: boolean }>,
  ) {
    for (const subId of removedIds) {
      await deleteSubtask(taskId, subId)
    }
    const createdIds = new Map<string, number>()
    const ordered = sortDraftsByPosition(draft)
    for (const it of ordered) {
      const trimmed = it.title.trim()
      if (it.id == null) {
        const created = await createSubtask(taskId, trimmed)
        createdIds.set(it.clientKey, created.id)
        if (it.done) {
          await updateSubtask(taskId, created.id, { done: true })
        }
        continue
      }
      const o = original.get(it.id)
      if (!o) {
        continue
      }
      const patch: Partial<{ title: string; done: boolean }> = {}
      if (o.title !== trimmed) {
        patch.title = trimmed
      }
      if (o.done !== it.done) {
        patch.done = it.done
      }
      if (Object.keys(patch).length > 0) {
        await updateSubtask(taskId, it.id, patch)
      }
    }

    if (ordered.length < 2) {
      return
    }
    const intendedIds: number[] = []
    for (const it of ordered) {
      const id = it.id ?? createdIds.get(it.clientKey)
      if (id == null) {
        continue
      }
      intendedIds.push(id)
    }
    if (intendedIds.length < 2) {
      return
    }
    const t = tasks.value.find((x) => x.id === taskId)
    const currentIds = sortSubtasks(t?.subtasks ?? []).map((s) => s.id)
    if (
      currentIds.length === intendedIds.length
      && currentIds.every((x, i) => x === intendedIds[i])
    ) {
      return
    }
    await reorderSubtasks(taskId, intendedIds)
  }

  return {
    tasks,
    loading,
    error,
    fetchList,
    fetchOne,
    create,
    update,
    remove,
    assign,
    complete,
    createSubtask,
    toggleSubtask,
    updateSubtask,
    deleteSubtask,
    applyDraftSubtasks,
    reorderSubtasks,
  }
})
