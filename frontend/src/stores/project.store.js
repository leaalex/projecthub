import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../utils/api';
export const useProjectStore = defineStore('project', () => {
    const projects = ref([]);
    const current = ref(null);
    const tasks = ref([]);
    const loading = ref(false);
    const error = ref(null);
    async function fetchList() {
        loading.value = true;
        error.value = null;
        try {
            const { data } = await api.get('/projects');
            projects.value = data.projects;
        }
        catch (e) {
            error.value = 'Failed to load projects';
            throw e;
        }
        finally {
            loading.value = false;
        }
    }
    async function fetchOne(id) {
        loading.value = true;
        error.value = null;
        try {
            const { data } = await api.get(`/projects/${id}`);
            current.value = data.project;
            return data.project;
        }
        finally {
            loading.value = false;
        }
    }
    async function fetchTasks(id) {
        const { data } = await api.get(`/projects/${id}/tasks`);
        tasks.value = data.tasks;
        return data.tasks;
    }
    async function create(payload) {
        const { data } = await api.post('/projects', payload);
        projects.value.unshift(data.project);
        return data.project;
    }
    async function update(id, payload) {
        const { data } = await api.put(`/projects/${id}`, payload);
        const i = projects.value.findIndex((p) => p.id === id);
        if (i >= 0)
            projects.value[i] = data.project;
        if (current.value?.id === id)
            current.value = data.project;
        return data.project;
    }
    async function remove(id) {
        await api.delete(`/projects/${id}`);
        projects.value = projects.value.filter((p) => p.id !== id);
        if (current.value?.id === id)
            current.value = null;
    }
    return {
        projects,
        current,
        tasks,
        loading,
        error,
        fetchList,
        fetchOne,
        fetchTasks,
        create,
        update,
        remove,
    };
});
