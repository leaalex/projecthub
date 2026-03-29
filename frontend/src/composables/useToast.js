import { useToastStore } from '../stores/toast.store';
/** Toast helpers (symmetric with useConfirm). */
export function useToast() {
    const store = useToastStore();
    return {
        show: store.show,
        dismiss: store.dismiss,
        success: (message, duration) => store.show({ message, type: 'success', duration }),
        error: (message, duration) => store.show({ message, type: 'error', duration }),
        info: (message, duration) => store.show({ message, type: 'info', duration }),
    };
}
