import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../utils/api';
function sortSubtasks(list) {
    return [...list].sort((a, b) => a.position - b.position || a.id - b.id);
}
export const useTaskStore = defineStore('task', () => {
    const tasks = ref([]);
    const loading = ref(false);
    const error = ref(null);
    function patchTaskSubtasks(taskId, next) {
        const i = tasks.value.findIndex((t) => t.id === taskId);
        if (i < 0)
            return;
        const t = tasks.value[i];
        tasks.value[i] = { ...t, subtasks: sortSubtasks(next) };
    }
    async function fetchList(params) {
        loading.value = true;
        error.value = null;
        try {
            const { data } = await api.get('/tasks', {
                params,
            });
            tasks.value = data.tasks;
        }
        catch (e) {
            error.value = 'Failed to load tasks';
            throw e;
        }
        finally {
            loading.value = false;
        }
    }
    async function fetchOne(id) {
        const { data } = await api.get(`/tasks/${id}`);
        return data.task;
    }
    async function create(payload) {
        const { data } = await api.post('/tasks', payload);
        tasks.value.unshift(data.task);
        return data.task;
    }
    async function update(id, payload) {
        const { data } = await api.put(`/tasks/${id}`, payload);
        const i = tasks.value.findIndex((t) => t.id === id);
        if (i >= 0)
            tasks.value[i] = data.task;
        return data.task;
    }
    async function remove(id) {
        await api.delete(`/tasks/${id}`);
        tasks.value = tasks.value.filter((t) => t.id !== id);
    }
    async function assign(id, assignee_id) {
        const { data } = await api.post(`/tasks/${id}/assign`, {
            assignee_id,
        });
        const i = tasks.value.findIndex((t) => t.id === id);
        if (i >= 0)
            tasks.value[i] = data.task;
        return data.task;
    }
    async function complete(id) {
        const { data } = await api.post(`/tasks/${id}/complete`);
        const i = tasks.value.findIndex((t) => t.id === id);
        if (i >= 0)
            tasks.value[i] = data.task;
        return data.task;
    }
    async function createSubtask(taskId, title) {
        const { data } = await api.post(`/tasks/${taskId}/subtasks`, { title });
        const t = tasks.value.find((x) => x.id === taskId);
        const list = [...(t?.subtasks ?? []), data.subtask];
        patchTaskSubtasks(taskId, list);
        return data.subtask;
    }
    async function toggleSubtask(taskId, subtaskId) {
        const { data } = await api.post(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`);
        const t = tasks.value.find((x) => x.id === taskId);
        const list = (t?.subtasks ?? []).map((s) => s.id === data.subtask.id ? data.subtask : s);
        patchTaskSubtasks(taskId, list);
        return data.subtask;
    }
    async function updateSubtask(taskId, subtaskId, patch) {
        const { data } = await api.put(`/tasks/${taskId}/subtasks/${subtaskId}`, patch);
        const t = tasks.value.find((x) => x.id === taskId);
        const list = (t?.subtasks ?? []).map((s) => s.id === data.subtask.id ? data.subtask : s);
        patchTaskSubtasks(taskId, list);
        return data.subtask;
    }
    async function deleteSubtask(taskId, subtaskId) {
        await api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
        const t = tasks.value.find((x) => x.id === taskId);
        const list = (t?.subtasks ?? []).filter((s) => s.id !== subtaskId);
        patchTaskSubtasks(taskId, list);
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
    };
});
