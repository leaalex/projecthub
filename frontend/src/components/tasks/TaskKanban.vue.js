/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref } from 'vue';
import { TrashIcon } from '@heroicons/vue/24/outline';
import { useTaskStore } from '../../stores/task.store';
import { useConfirm } from '../../composables/useConfirm';
import { useTaskEditPermission } from '../../composables/useCanEditTask';
import { useToast } from '../../composables/useToast';
import { formatTaskStatus } from '../../utils/formatters';
import Button from '../ui/UiButton.vue';
const props = defineProps();
const emit = defineEmits();
const taskStore = useTaskStore();
const toast = useToast();
const { confirm } = useConfirm();
const { canEditTask } = useTaskEditPermission();
const columns = [
    { status: 'todo', title: 'To do' },
    { status: 'in_progress', title: 'In progress' },
    { status: 'review', title: 'Review' },
    { status: 'done', title: 'Done' },
];
const dragOverColumn = ref(null);
const removingId = ref(null);
/** Column order follows the order of tasks in the parent array (after client sort). */
function tasksIn(status) {
    return props.tasks.filter((t) => t.status === status);
}
function onDragStart(e, task) {
    e.dataTransfer?.setData('text/plain', String(task.id));
    e.dataTransfer.effectAllowed = 'move';
}
function onDragOver(e, status) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dragOverColumn.value = status;
}
function onDragLeave(status) {
    if (dragOverColumn.value === status)
        dragOverColumn.value = null;
}
async function onDrop(e, status) {
    e.preventDefault();
    dragOverColumn.value = null;
    const raw = e.dataTransfer?.getData('text/plain');
    const id = raw ? Number(raw) : NaN;
    if (!Number.isFinite(id))
        return;
    const task = props.tasks.find((t) => t.id === id);
    if (!task || task.status === status)
        return;
    try {
        await taskStore.update(id, { status });
        emit('changed');
    }
    catch {
        toast.error('Could not move task');
    }
}
function onDragEnd() {
    dragOverColumn.value = null;
}
async function markDone(taskId) {
    try {
        await taskStore.complete(taskId);
        emit('changed');
    }
    catch {
        toast.error('Could not complete task');
    }
}
async function removeTask(task) {
    if (!canEditTask(task))
        return;
    const ok = await confirm({
        title: 'Delete task',
        message: `Remove “${task.title}”? This cannot be undone.`,
        confirmLabel: 'Delete',
        danger: true,
    });
    if (!ok)
        return;
    removingId.value = task.id;
    try {
        await taskStore.remove(task.id);
        toast.success('Task deleted');
        emit('changed');
    }
    catch {
        toast.error('Could not delete task');
    }
    finally {
        removingId.value = null;
    }
}
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
    ...{ class: "grid gap-4 md:grid-cols-2 xl:grid-cols-4" },
    role: "list",
    'aria-label': "Task board",
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['xl:grid-cols-4']} */ ;
for (const [col] of __VLS_vFor((__VLS_ctx.columns))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onDragover: (...[$event]) => {
                __VLS_ctx.onDragOver($event, col.status);
                // @ts-ignore
                [columns, onDragOver,];
            } },
        ...{ onDragleave: (...[$event]) => {
                __VLS_ctx.onDragLeave(col.status);
                // @ts-ignore
                [onDragLeave,];
            } },
        ...{ onDrop: (...[$event]) => {
                __VLS_ctx.onDrop($event, col.status);
                // @ts-ignore
                [onDrop,];
            } },
        key: (col.status),
        ...{ class: "flex min-h-[12rem] flex-col rounded-lg border border-border bg-surface-muted/40 p-3 transition-colors" },
        ...{ class: (__VLS_ctx.dragOverColumn === col.status
                ? 'border-primary ring-2 ring-primary/30'
                : '') },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-h-[12rem]']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-surface-muted/40']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mb-3 flex items-center justify-between gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        ...{ class: "text-sm font-semibold text-foreground" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
    (col.title);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
    (__VLS_ctx.tasksIn(col.status).length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-1 flex-col gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    for (const [task] of __VLS_vFor((__VLS_ctx.tasksIn(col.status)))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onDragstart: (...[$event]) => {
                    __VLS_ctx.onDragStart($event, task);
                    // @ts-ignore
                    [dragOverColumn, tasksIn, tasksIn, onDragStart,];
                } },
            ...{ onDragend: (__VLS_ctx.onDragEnd) },
            key: (task.id),
            draggable: "true",
            ...{ class: "cursor-grab rounded-lg border border-border bg-surface p-3 shadow-sm active:cursor-grabbing" },
        });
        /** @type {__VLS_StyleScopedClasses['cursor-grab']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['active:cursor-grabbing']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "font-medium text-foreground" },
        });
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
        (task.title);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-1 line-clamp-2 text-xs text-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['line-clamp-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        (task.description || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-2 text-xs text-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        (__VLS_ctx.formatTaskStatus(task.status));
        (task.priority);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-2 flex flex-wrap items-center gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        if (task.status !== 'done') {
            const __VLS_0 = Button || Button;
            // @ts-ignore
            const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
                ...{ 'onClick': {} },
                variant: "secondary",
            }));
            const __VLS_2 = __VLS_1({
                ...{ 'onClick': {} },
                variant: "secondary",
            }, ...__VLS_functionalComponentArgsRest(__VLS_1));
            let __VLS_5;
            const __VLS_6 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!(task.status !== 'done'))
                            return;
                        __VLS_ctx.markDone(task.id);
                        // @ts-ignore
                        [onDragEnd, formatTaskStatus, markDone,];
                    } });
            const { default: __VLS_7 } = __VLS_3.slots;
            // @ts-ignore
            [];
            var __VLS_3;
            var __VLS_4;
        }
        if (__VLS_ctx.canEditTask(task)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.canEditTask(task)))
                            return;
                        __VLS_ctx.removeTask(task);
                        // @ts-ignore
                        [canEditTask, removeTask,];
                    } },
                type: "button",
                ...{ class: "inline-flex items-center justify-center rounded-md p-1.5 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50" },
                'aria-label': "Delete task",
                disabled: (__VLS_ctx.removingId === task.id),
            });
            /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-1.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-destructive']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-destructive/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
            let __VLS_8;
            /** @ts-ignore @type {typeof __VLS_components.TrashIcon} */
            TrashIcon;
            // @ts-ignore
            const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({
                ...{ class: "h-4 w-4" },
            }));
            const __VLS_10 = __VLS_9({
                ...{ class: "h-4 w-4" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_9));
            /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
        }
        // @ts-ignore
        [removingId,];
    }
    // @ts-ignore
    [];
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
