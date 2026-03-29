import { defineStore } from 'pinia';
import { ref } from 'vue';
let idSeq = 0;
export const useToastStore = defineStore('toast', () => {
    const items = ref([]);
    function show(opts) {
        const id = ++idSeq;
        const duration = opts.duration ?? 4000;
        items.value.push({
            id,
            message: opts.message,
            type: opts.type ?? 'info',
            duration,
        });
        if (duration > 0) {
            window.setTimeout(() => dismiss(id), duration);
        }
        return id;
    }
    function dismiss(id) {
        items.value = items.value.filter((t) => t.id !== id);
    }
    return { items, show, dismiss };
});
