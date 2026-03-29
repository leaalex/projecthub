import { useConfirmStore } from '../stores/confirm.store';
export function useConfirm() {
    const store = useConfirmStore();
    return {
        confirm: (opts) => store.request(opts),
    };
}
