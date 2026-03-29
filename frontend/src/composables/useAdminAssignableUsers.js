import { ref, watch } from 'vue';
import { useAuthStore } from '../stores/auth.store';
import { api } from '../utils/api';
/** Lists all users for task assignee pickers (admin or staff; others get an empty list). */
export function useAdminAssignableUsers() {
    const auth = useAuthStore();
    const assignableUsers = ref([]);
    async function refresh() {
        if (auth.user?.role !== 'admin' && auth.user?.role !== 'staff') {
            assignableUsers.value = [];
            return;
        }
        try {
            const { data } = await api.get('/users');
            assignableUsers.value = data.users.map((u) => ({
                id: u.id,
                email: u.email,
                name: u.name,
            }));
        }
        catch {
            assignableUsers.value = [];
        }
    }
    watch(() => auth.user?.role, refresh, { immediate: true });
    return { assignableUsers };
}
