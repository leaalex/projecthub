import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { AUTH_TOKEN_KEY } from '../constants';
import { api } from '../utils/api';
export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem(AUTH_TOKEN_KEY));
    const user = ref(null);
    const isAuthenticated = computed(() => Boolean(token.value));
    function setToken(value) {
        token.value = value;
        if (value) {
            localStorage.setItem(AUTH_TOKEN_KEY, value);
        }
        else {
            localStorage.removeItem(AUTH_TOKEN_KEY);
        }
    }
    async function login(email, password) {
        const { data } = await api.post('/auth/login', { email, password });
        setToken(data.token);
        user.value = data.user;
    }
    async function register(email, password, name) {
        const { data } = await api.post('/auth/register', { email, password, name });
        setToken(data.token);
        user.value = data.user;
    }
    async function fetchMe() {
        const { data } = await api.get('/me');
        user.value = data.user;
    }
    async function restoreSession() {
        if (!token.value) {
            user.value = null;
            return;
        }
        try {
            await fetchMe();
        }
        catch {
            setToken(null);
            user.value = null;
        }
    }
    function logout() {
        setToken(null);
        user.value = null;
    }
    async function updateProfile(patch) {
        if (!user.value)
            return;
        const { data } = await api.put(`/users/${user.value.id}`, patch);
        user.value = data.user;
    }
    async function changePassword(current_password, new_password) {
        await api.post('/me/password', { current_password, new_password });
    }
    return {
        token,
        user,
        isAuthenticated,
        login,
        register,
        fetchMe,
        restoreSession,
        logout,
        updateProfile,
        changePassword,
    };
});
