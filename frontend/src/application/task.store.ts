import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TaskMovePayload } from '@domain/project/types'
import { applyMoveLocally } from '@domain/task/move'
import type { Subtask, Task, TaskPriority, TaskStatus } from '@domain/task/types'
import { projectsApi } from '@infra/api/projects'
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

  async function moveTask(projectId: number, payload: TaskMovePayload) {
    const snapshotTasks = tasks.value
    const snapshotProjectTasks =
      projectStore.tasks.length > 0 ? [...projectStore.tasks] : null

    tasks.value = applyMoveLocally(tasks.value, payload)
    if (projectStore.tasks.length > 0) {
      projectStore.replaceTasks(applyMoveLocally(projectStore.tasks, payload))
    }

    try {
      const { data } = await projectsApi.tasks.move(projectId, payload)
      const i = tasks.value.findIndex((t) => t.id === data.task.id)
      if (i >= 0) {
        tasks.value.splice(i, 1, data.task)
      } else {
        tasks.value.unshift(data.task)
      }
      projectStore.patchTask(data.task)
      return data.task
    } catch (e) {
      tasks.value = snapshotTasks
      if (snapshotProjectTasks !== null) {
        projectStore.replaceTasks([...snapshotProjectTasks])
      }
      throw e
    }
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
    moveTask,
    createSubtask,
    toggleSubtask,
    updateSubtask,
    deleteSubtask,
  }
})
