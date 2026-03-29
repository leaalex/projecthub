/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { PencilSquareIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { computed, ref, useTemplateRef } from 'vue';
import { useTaskStore } from '../../stores/task.store';
import { useToast } from '../../composables/useToast';
import UiInput from '../ui/UiInput.vue';
const props = withDefaults(defineProps(), { readonly: false, hideHeading: false, compact: false, allowToggle: true });
const emit = defineEmits();
const taskStore = useTaskStore();
const toast = useToast();
const newTitle = ref('');
const newInputRef = useTemplateRef('newInputRef');
const busyAdd = ref(false);
const busyId = ref(null);
const editingId = ref(null);
const editDraft = ref('');
const sorted = computed(() => sortSubtasks(props.task.subtasks ?? []));
const showAsReadonlyMarkers = computed(() => props.readonly || (props.compact && !props.allowToggle));
const effectiveAllowRename = computed(() => {
    if (props.readonly || showAsReadonlyMarkers.value)
        return false;
    if (props.allowRename != null)
        return props.allowRename;
    return !props.compact;
});
function sortSubtasks(list) {
    return [...list].sort((a, b) => a.position - b.position || a.id - b.id);
}
async function addSubtask() {
    const title = newTitle.value.trim();
    if (!title || busyAdd.value)
        return;
    busyAdd.value = true;
    try {
        await taskStore.createSubtask(props.task.id, title);
        newTitle.value = '';
        emit('updated');
        toast.success('Subtask added');
    }
    catch (e) {
        const err = e;
        const msg = err.response?.data?.error;
        toast.error(typeof msg === 'string' ? msg : 'Could not add subtask');
    }
    finally {
        busyAdd.value = false;
    }
}
async function toggle(st) {
    if (busyId.value != null)
        return;
    busyId.value = st.id;
    try {
        await taskStore.toggleSubtask(props.task.id, st.id);
        emit('updated');
    }
    catch (e) {
        const err = e;
        const msg = err.response?.data?.error;
        toast.error(typeof msg === 'string' ? msg : 'Could not update subtask');
    }
    finally {
        busyId.value = null;
    }
}
async function remove(st) {
    if (busyId.value != null)
        return;
    busyId.value = st.id;
    try {
        await taskStore.deleteSubtask(props.task.id, st.id);
        emit('updated');
        toast.success('Subtask removed');
    }
    catch (e) {
        const err = e;
        const msg = err.response?.data?.error;
        toast.error(typeof msg === 'string' ? msg : 'Could not remove subtask');
    }
    finally {
        busyId.value = null;
    }
}
function onNewKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        addSubtask();
    }
}
function startEdit(s) {
    if (!effectiveAllowRename.value || busyId.value != null)
        return;
    editingId.value = s.id;
    editDraft.value = s.title;
}
function cancelEdit() {
    editingId.value = null;
    editDraft.value = '';
}
async function commitEdit(s) {
    if (editingId.value !== s.id)
        return;
    const title = editDraft.value.trim();
    if (!title) {
        toast.error('Enter a subtask title');
        editDraft.value = s.title;
        return;
    }
    if (title === s.title) {
        cancelEdit();
        return;
    }
    busyId.value = s.id;
    try {
        await taskStore.updateSubtask(props.task.id, s.id, { title });
        emit('updated');
        cancelEdit();
    }
    catch (e) {
        const err = e;
        const msg = err.response?.data?.error;
        toast.error(typeof msg === 'string' ? msg : 'Could not update subtask');
    }
    finally {
        busyId.value = null;
    }
}
function onEditKeydown(s, e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit(s);
    }
    else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
    }
}
function focusNewInput() {
    newInputRef.value?.focus();
}
const __VLS_exposed = { focusNewInput };
defineExpose(__VLS_exposed);
const __VLS_defaults = { readonly: false, hideHeading: false, compact: false, allowToggle: true };
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "space-y-2" },
});
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
if (!__VLS_ctx.hideHeading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex min-w-0 items-center gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: "h-px w-1.5 shrink-0 bg-border sm:w-2" },
        'aria-hidden': "true",
    });
    /** @type {__VLS_StyleScopedClasses['h-px']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:w-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "shrink-0 text-xs font-medium text-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: "h-px min-h-px flex-1 bg-border" },
        'aria-hidden': "true",
    });
    /** @type {__VLS_StyleScopedClasses['h-px']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-h-px']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-border']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "min-w-0 space-y-2 pl-2 sm:pl-3" },
});
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['pl-2']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:pl-3']} */ ;
if (__VLS_ctx.sorted.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
        ...{ class: (__VLS_ctx.compact ? 'space-y-1' : 'space-y-1.5') },
    });
    for (const [s] of __VLS_vFor((__VLS_ctx.sorted))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            key: (s.id),
            ...{ class: "flex items-center gap-2" },
            ...{ class: (__VLS_ctx.compact ? 'py-1' : 'py-1.5') },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        if (__VLS_ctx.showAsReadonlyMarkers) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border text-[10px]" },
                ...{ class: (s.done ? 'border-emerald-600 bg-emerald-600 text-white' : '') },
                'aria-hidden': "true",
            });
            /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
            (s.done ? '✓' : '');
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "min-w-0 flex-1 leading-snug" },
                ...{ class: ([
                        __VLS_ctx.compact ? 'text-xs' : 'text-sm',
                        s.done ? 'text-muted line-through' : 'text-foreground',
                    ]) },
            });
            /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['leading-snug']} */ ;
            (s.title);
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                ...{ onChange: (...[$event]) => {
                        if (!(__VLS_ctx.sorted.length > 0))
                            return;
                        if (!!(__VLS_ctx.showAsReadonlyMarkers))
                            return;
                        __VLS_ctx.toggle(s);
                        // @ts-ignore
                        [hideHeading, sorted, sorted, compact, compact, compact, showAsReadonlyMarkers, toggle,];
                    } },
                type: "checkbox",
                ...{ class: "h-3.5 w-3.5 shrink-0 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-ring sm:h-4 sm:w-4" },
                checked: (s.done),
                disabled: (__VLS_ctx.busyId === s.id || __VLS_ctx.editingId === s.id),
                'aria-label': (`Done: ${s.title}`),
            });
            /** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:ring-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:ring-ring']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:h-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['sm:w-4']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex min-w-0 flex-1 items-center gap-0.5" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-0.5']} */ ;
            if (__VLS_ctx.editingId === s.id) {
                const __VLS_0 = UiInput;
                // @ts-ignore
                const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
                    ...{ 'onKeydown': {} },
                    ...{ 'onBlur': {} },
                    id: (`subtask-edit-${__VLS_ctx.task.id}-${s.id}`),
                    modelValue: (__VLS_ctx.editDraft),
                    ...{ class: "w-full min-w-0" },
                    ...{ class: (__VLS_ctx.compact ? 'text-xs' : '') },
                    disabled: (__VLS_ctx.busyId === s.id),
                    'aria-label': (`Edit subtask: ${s.title}`),
                    autofocus: true,
                }));
                const __VLS_2 = __VLS_1({
                    ...{ 'onKeydown': {} },
                    ...{ 'onBlur': {} },
                    id: (`subtask-edit-${__VLS_ctx.task.id}-${s.id}`),
                    modelValue: (__VLS_ctx.editDraft),
                    ...{ class: "w-full min-w-0" },
                    ...{ class: (__VLS_ctx.compact ? 'text-xs' : '') },
                    disabled: (__VLS_ctx.busyId === s.id),
                    'aria-label': (`Edit subtask: ${s.title}`),
                    autofocus: true,
                }, ...__VLS_functionalComponentArgsRest(__VLS_1));
                let __VLS_5;
                const __VLS_6 = ({ keydown: {} },
                    { onKeydown: (...[$event]) => {
                            if (!(__VLS_ctx.sorted.length > 0))
                                return;
                            if (!!(__VLS_ctx.showAsReadonlyMarkers))
                                return;
                            if (!(__VLS_ctx.editingId === s.id))
                                return;
                            __VLS_ctx.onEditKeydown(s, $event);
                            // @ts-ignore
                            [compact, busyId, busyId, editingId, editingId, task, editDraft, onEditKeydown,];
                        } });
                const __VLS_7 = ({ blur: {} },
                    { onBlur: (...[$event]) => {
                            if (!(__VLS_ctx.sorted.length > 0))
                                return;
                            if (!!(__VLS_ctx.showAsReadonlyMarkers))
                                return;
                            if (!(__VLS_ctx.editingId === s.id))
                                return;
                            __VLS_ctx.commitEdit(s);
                            // @ts-ignore
                            [commitEdit,];
                        } });
                /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                var __VLS_3;
                var __VLS_4;
            }
            else {
                if (__VLS_ctx.effectiveAllowRename && !__VLS_ctx.compact) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!(__VLS_ctx.sorted.length > 0))
                                    return;
                                if (!!(__VLS_ctx.showAsReadonlyMarkers))
                                    return;
                                if (!!(__VLS_ctx.editingId === s.id))
                                    return;
                                if (!(__VLS_ctx.effectiveAllowRename && !__VLS_ctx.compact))
                                    return;
                                __VLS_ctx.startEdit(s);
                                // @ts-ignore
                                [compact, effectiveAllowRename, startEdit,];
                            } },
                        type: "button",
                        ...{ class: "min-w-0 flex-1 rounded px-0.5 text-left leading-snug transition-colors hover:bg-surface-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" },
                        ...{ class: ([
                                'pt-0.5 text-sm',
                                s.done ? 'text-muted line-through' : 'text-foreground',
                            ]) },
                        title: "Click to edit title",
                        disabled: (__VLS_ctx.busyId === s.id),
                    });
                    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
                    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                    /** @type {__VLS_StyleScopedClasses['px-0.5']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
                    /** @type {__VLS_StyleScopedClasses['leading-snug']} */ ;
                    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:bg-surface-muted/60']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-none']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:ring-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:ring-ring']} */ ;
                    /** @type {__VLS_StyleScopedClasses['pt-0.5']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                    (s.title);
                }
                else if (__VLS_ctx.effectiveAllowRename && __VLS_ctx.compact) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "min-w-0 flex-1 leading-snug" },
                        ...{ class: ([
                                'pt-0 text-xs',
                                s.done ? 'text-muted line-through' : 'text-foreground',
                            ]) },
                    });
                    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
                    /** @type {__VLS_StyleScopedClasses['leading-snug']} */ ;
                    /** @type {__VLS_StyleScopedClasses['pt-0']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    (s.title);
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onMousedown: () => { } },
                        ...{ onClick: (...[$event]) => {
                                if (!(__VLS_ctx.sorted.length > 0))
                                    return;
                                if (!!(__VLS_ctx.showAsReadonlyMarkers))
                                    return;
                                if (!!(__VLS_ctx.editingId === s.id))
                                    return;
                                if (!!(__VLS_ctx.effectiveAllowRename && !__VLS_ctx.compact))
                                    return;
                                if (!(__VLS_ctx.effectiveAllowRename && __VLS_ctx.compact))
                                    return;
                                __VLS_ctx.startEdit(s);
                                // @ts-ignore
                                [compact, busyId, effectiveAllowRename, startEdit,];
                            } },
                        type: "button",
                        ...{ class: "shrink-0 rounded p-1 text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" },
                        'aria-label': "Edit subtask title",
                        title: "Edit title",
                        disabled: (__VLS_ctx.busyId === s.id),
                    });
                    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                    /** @type {__VLS_StyleScopedClasses['p-1']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
                    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:bg-surface-muted']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:text-foreground']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-none']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:ring-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['focus-visible:ring-ring']} */ ;
                    /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
                    let __VLS_8;
                    /** @ts-ignore @type {typeof __VLS_components.PencilSquareIcon} */
                    PencilSquareIcon;
                    // @ts-ignore
                    const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({
                        ...{ class: "h-3.5 w-3.5" },
                        'aria-hidden': "true",
                    }));
                    const __VLS_10 = __VLS_9({
                        ...{ class: "h-3.5 w-3.5" },
                        'aria-hidden': "true",
                    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
                    /** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
                    /** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
                }
                else {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "min-w-0 flex-1 leading-snug" },
                        ...{ class: ([
                                __VLS_ctx.compact ? 'pt-0 text-xs' : 'pt-0.5 text-sm',
                                s.done ? 'text-muted line-through' : 'text-foreground',
                            ]) },
                    });
                    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
                    /** @type {__VLS_StyleScopedClasses['leading-snug']} */ ;
                    (s.title);
                }
            }
            if (!__VLS_ctx.compact) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onMousedown: () => { } },
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.sorted.length > 0))
                                return;
                            if (!!(__VLS_ctx.showAsReadonlyMarkers))
                                return;
                            if (!(!__VLS_ctx.compact))
                                return;
                            __VLS_ctx.remove(s);
                            // @ts-ignore
                            [compact, compact, busyId, remove,];
                        } },
                    type: "button",
                    ...{ class: "shrink-0 rounded p-1 text-muted transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50" },
                    'aria-label': "Remove subtask",
                    disabled: (__VLS_ctx.busyId === s.id || __VLS_ctx.editingId === s.id),
                });
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['p-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:bg-destructive/10']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:text-destructive']} */ ;
                /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
                let __VLS_13;
                /** @ts-ignore @type {typeof __VLS_components.TrashIcon} */
                TrashIcon;
                // @ts-ignore
                const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
                    ...{ class: "h-4 w-4" },
                    'aria-hidden': "true",
                }));
                const __VLS_15 = __VLS_14({
                    ...{ class: "h-4 w-4" },
                    'aria-hidden': "true",
                }, ...__VLS_functionalComponentArgsRest(__VLS_14));
                /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
            }
        }
        // @ts-ignore
        [busyId, editingId,];
    }
}
else if (__VLS_ctx.readonly) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
}
if (!__VLS_ctx.readonly && !__VLS_ctx.compact) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex min-w-0 items-center gap-2 py-1.5" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
        disabled: true,
        tabindex: "-1",
        ...{ class: "pointer-events-none h-3.5 w-3.5 shrink-0 cursor-default rounded border-border opacity-45 text-primary sm:h-4 sm:w-4" },
        'aria-hidden': "true",
        title: "",
    });
    /** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-default']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['opacity-45']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:h-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:w-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex min-w-0 flex-1 items-center" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "sr-only" },
        for: (`subtask-new-${__VLS_ctx.task.id}`),
    });
    /** @type {__VLS_StyleScopedClasses['sr-only']} */ ;
    const __VLS_18 = UiInput;
    // @ts-ignore
    const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
        ...{ 'onKeydown': {} },
        ref: "newInputRef",
        id: (`subtask-new-${__VLS_ctx.task.id}`),
        modelValue: (__VLS_ctx.newTitle),
        placeholder: "New subtask… (Enter)",
        disabled: (__VLS_ctx.busyAdd),
        ...{ class: "w-full min-w-0" },
    }));
    const __VLS_20 = __VLS_19({
        ...{ 'onKeydown': {} },
        ref: "newInputRef",
        id: (`subtask-new-${__VLS_ctx.task.id}`),
        modelValue: (__VLS_ctx.newTitle),
        placeholder: "New subtask… (Enter)",
        disabled: (__VLS_ctx.busyAdd),
        ...{ class: "w-full min-w-0" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_19));
    let __VLS_23;
    const __VLS_24 = ({ keydown: {} },
        { onKeydown: (__VLS_ctx.onNewKeydown) });
    var __VLS_25 = {};
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    var __VLS_21;
    var __VLS_22;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "shrink-0 p-1" },
        'aria-hidden': "true",
    });
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: "h-4 w-4" },
    });
    /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
}
// @ts-ignore
var __VLS_26 = __VLS_25;
// @ts-ignore
[compact, task, task, readonly, readonly, newTitle, busyAdd, onNewKeydown,];
const __VLS_export = (await import('vue')).defineComponent({
    setup: () => (__VLS_exposed),
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
export default {};
