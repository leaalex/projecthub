import { defineStore } from 'pinia';
import { ref } from 'vue';
export const useConfirmStore = defineStore('confirm', () => {
    const open = ref(false);
    const options = ref(null);
    let resolver = null;
    function request(opts) {
        options.value = {
            confirmLabel: 'Confirm',
            cancelLabel: 'Cancel',
            danger: false,
            ...opts,
        };
        open.value = true;
        return new Promise((resolve) => {
            resolver = resolve;
        });
    }
    function answer(ok) {
        open.value = false;
        options.value = null;
        resolver?.(ok);
        resolver = null;
    }
    return { open, options, request, answer };
});
