/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, watch } from 'vue';
import Modal from '../ui/UiModal.vue';
import Button from '../ui/UiButton.vue';
import Skeleton from '../ui/UiSkeleton.vue';
import TaskForm from './TaskForm.vue';
import TaskSubtasksPanel from './TaskSubtasksPanel.vue';
import { useTaskStore } from '../../stores/task.store';
import { useCanEditTask } from '../../composables/useCanEditTask';
import { useConfirm } from '../../composables/useConfirm';
import { useToast } from '../../composables/useToast';
import { formatDate, formatTaskStatus } from '../../utils/formatters';
const props = defineProps();
const emit = defineEmits();
const taskStore = useTaskStore();
const toast = useToast();
const { confirm } = useConfirm();
const task = ref(null);
const loading = ref(false);
const loadError = ref(null);
const saving = ref(false);
const removing = ref(false);
const formTitle = ref('');
const formDescription = ref('');
const formProjectId = ref(0);
const formStatus = ref('todo');
const formPriority = ref('medium');
const canEdit = useCanEditTask(() => task.value);
watch(() => [props.modelValue, props.taskId], async ([open, id]) => {
    if (!open || id == null) {
        task.value = null;
        loadError.value = null;
        return;
    }
    loading.value = true;
    loadError.value = null;
    task.value = null;
    try {
        task.value = await taskStore.fetchOne(id);
    }
    catch {
        loadError.value = 'Could not load task.';
    }
    finally {
        loading.value = false;
    }
});
watch(() => [task.value, canEdit.value], ([t, edit]) => {
    if (!t || !edit)
        return;
    formTitle.value = t.title;
    formDescription.value = t.description ?? '';
    formProjectId.value = t.project_id;
    formStatus.value = t.status;
    formPriority.value = t.priority;
}, { immediate: true });
async function save() {
    const t = task.value;
    if (!t)
        return;
    const title = formTitle.value.trim();
    if (!title) {
        toast.error('Enter a task title');
        return;
    }
    saving.value = true;
    try {
        const updated = await taskStore.update(t.id, {
            title,
            description: formDescription.value.trim(),
            status: formStatus.value,
            priority: formPriority.value,
        });
        task.value = updated;
        toast.success('Task updated');
        emit('saved');
    }
    catch (e) {
        const err = e;
        const msg = err.response?.data?.error;
        toast.error(typeof msg === 'string' ? msg : 'Could not update task');
    }
    finally {
        saving.value = false;
    }
}
function close() {
    emit('update:modelValue', false);
}
async function refreshTask() {
    const id = props.taskId;
    if (id == null || !task.value)
        return;
    try {
        task.value = await taskStore.fetchOne(id);
    }
    catch {
        /* keep existing task */
    }
}
async function removeTask() {
    const t = task.value;
    if (!t)
        return;
    const ok = await confirm({
        title: 'Delete task',
        message: `Remove “${t.title}”? This cannot be undone.`,
        confirmLabel: 'Delete',
        danger: true,
    });
    if (!ok)
        return;
    removing.value = true;
    try {
        await taskStore.remove(t.id);
        toast.success('Task deleted');
        close();
        emit('saved');
    }
    catch {
        toast.error('Could not delete task');
    }
    finally {
        removing.value = false;
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
const __VLS_0 = Modal || Modal;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.modelValue),
    title: "Task details",
    wide: true,
}));
const __VLS_2 = __VLS_1({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.modelValue),
    title: "Task details",
    wide: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (...[$event]) => {
            __VLS_ctx.emit('update:modelValue', $event);
            // @ts-ignore
            [modelValue, emit,];
        } });
var __VLS_7 = {};
const { default: __VLS_8 } = __VLS_3.slots;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-3" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
    const __VLS_9 = Skeleton;
    // @ts-ignore
    const __VLS_10 = __VLS_asFunctionalComponent1(__VLS_9, new __VLS_9({
        variant: "line",
    }));
    const __VLS_11 = __VLS_10({
        variant: "line",
    }, ...__VLS_functionalComponentArgsRest(__VLS_10));
    const __VLS_14 = Skeleton;
    // @ts-ignore
    const __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({
        variant: "line",
        lines: (3),
    }));
    const __VLS_16 = __VLS_15({
        variant: "line",
        lines: (3),
    }, ...__VLS_functionalComponentArgsRest(__VLS_15));
}
else if (__VLS_ctx.loadError) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-destructive" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-destructive']} */ ;
    (__VLS_ctx.loadError);
}
else if (__VLS_ctx.task) {
    if (!__VLS_ctx.canEdit) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.dl, __VLS_intrinsics.dl)({
            ...{ class: "space-y-4 text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
            ...{ class: "font-medium text-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
            ...{ class: "mt-1 text-foreground" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
        (__VLS_ctx.task.title);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
            ...{ class: "font-medium text-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
            ...{ class: "mt-1 whitespace-pre-wrap text-foreground" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['whitespace-pre-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
        (__VLS_ctx.task.description || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
            ...{ class: "font-medium text-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
            ...{ class: "mt-1" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        const __VLS_19 = TaskSubtasksPanel;
        // @ts-ignore
        const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
            task: (__VLS_ctx.task),
            hideHeading: true,
            readonly: true,
        }));
        const __VLS_21 = __VLS_20({
            task: (__VLS_ctx.task),
            hideHeading: true,
            readonly: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_20));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid gap-4 sm:grid-cols-2" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
            ...{ class: "font-medium text-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
            ...{ class: "mt-1 capitalize text-foreground" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['capitalize']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
        (__VLS_ctx.formatTaskStatus(__VLS_ctx.task.status));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
            ...{ class: "font-medium text-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
            ...{ class: "mt-1 capitalize text-foreground" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['capitalize']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
        (__VLS_ctx.task.priority);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
            ...{ class: "font-medium text-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
            ...{ class: "mt-1 text-foreground" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
        (__VLS_ctx.task.project?.name ?? `Project #${__VLS_ctx.task.project_id}`);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
            ...{ class: "font-medium text-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
            ...{ class: "mt-1 text-foreground" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
        if (__VLS_ctx.task.assignee) {
            (__VLS_ctx.task.assignee.name || __VLS_ctx.task.assignee.email);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
            (__VLS_ctx.task.assignee.email);
        }
        else {
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
            ...{ class: "font-medium text-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
            ...{ class: "mt-1 text-foreground" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
        (__VLS_ctx.task.due_date ? __VLS_ctx.formatDate(__VLS_ctx.task.due_date) : '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid gap-4 sm:grid-cols-2" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
            ...{ class: "font-medium text-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
            ...{ class: "mt-1 text-foreground" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
        (__VLS_ctx.formatDate(__VLS_ctx.task.created_at));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({
            ...{ class: "font-medium text-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
            ...{ class: "mt-1 text-foreground" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
        (__VLS_ctx.formatDate(__VLS_ctx.task.updated_at));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "space-y-4" },
        });
        /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "rounded-md border border-border bg-surface-muted/40 px-3 py-2 text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-surface-muted/40']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "font-medium text-foreground" },
        });
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
        (__VLS_ctx.task.project?.name ?? `Project #${__VLS_ctx.task.project_id}`);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-2 text-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-foreground" },
        });
        /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
        if (__VLS_ctx.task.assignee) {
            (__VLS_ctx.task.assignee.name || __VLS_ctx.task.assignee.email);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
            (__VLS_ctx.task.assignee.email);
        }
        else {
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-x-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-y-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.formatDate(__VLS_ctx.task.created_at));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.formatDate(__VLS_ctx.task.updated_at));
        if (__VLS_ctx.task.due_date) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (__VLS_ctx.formatDate(__VLS_ctx.task.due_date));
        }
        const __VLS_24 = TaskForm || TaskForm;
        // @ts-ignore
        const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
            ...{ 'onSubmit': {} },
            ...{ 'onCancel': {} },
            title: (__VLS_ctx.formTitle),
            description: (__VLS_ctx.formDescription),
            projectId: (__VLS_ctx.formProjectId),
            status: (__VLS_ctx.formStatus),
            priority: (__VLS_ctx.formPriority),
            hideProjectSelect: true,
            submitLabel: "Save",
            loading: (__VLS_ctx.saving),
        }));
        const __VLS_26 = __VLS_25({
            ...{ 'onSubmit': {} },
            ...{ 'onCancel': {} },
            title: (__VLS_ctx.formTitle),
            description: (__VLS_ctx.formDescription),
            projectId: (__VLS_ctx.formProjectId),
            status: (__VLS_ctx.formStatus),
            priority: (__VLS_ctx.formPriority),
            hideProjectSelect: true,
            submitLabel: "Save",
            loading: (__VLS_ctx.saving),
        }, ...__VLS_functionalComponentArgsRest(__VLS_25));
        let __VLS_29;
        const __VLS_30 = ({ submit: {} },
            { onSubmit: (__VLS_ctx.save) });
        const __VLS_31 = ({ cancel: {} },
            { onCancel: (__VLS_ctx.close) });
        const { default: __VLS_32 } = __VLS_27.slots;
        {
            const { 'actions-start': __VLS_33 } = __VLS_27.slots;
            const __VLS_34 = Button || Button;
            // @ts-ignore
            const __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34({
                ...{ 'onClick': {} },
                variant: "ghost-danger",
                type: "button",
                loading: (__VLS_ctx.removing),
                disabled: (__VLS_ctx.saving),
            }));
            const __VLS_36 = __VLS_35({
                ...{ 'onClick': {} },
                variant: "ghost-danger",
                type: "button",
                loading: (__VLS_ctx.removing),
                disabled: (__VLS_ctx.saving),
            }, ...__VLS_functionalComponentArgsRest(__VLS_35));
            let __VLS_39;
            const __VLS_40 = ({ click: {} },
                { onClick: (__VLS_ctx.removeTask) });
            const { default: __VLS_41 } = __VLS_37.slots;
            // @ts-ignore
            [loading, loadError, loadError, task, task, task, task, task, task, task, task, task, task, task, task, task, task, task, task, task, task, task, task, task, task, task, task, task, task, canEdit, formatTaskStatus, formatDate, formatDate, formatDate, formatDate, formatDate, formatDate, formTitle, formDescription, formProjectId, formStatus, formPriority, saving, saving, save, close, removing, removeTask,];
            var __VLS_37;
            var __VLS_38;
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        var __VLS_27;
        var __VLS_28;
        const __VLS_42 = TaskSubtasksPanel;
        // @ts-ignore
        const __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({
            ...{ 'onUpdated': {} },
            task: (__VLS_ctx.task),
        }));
        const __VLS_44 = __VLS_43({
            ...{ 'onUpdated': {} },
            task: (__VLS_ctx.task),
        }, ...__VLS_functionalComponentArgsRest(__VLS_43));
        let __VLS_47;
        const __VLS_48 = ({ updated: {} },
            { onUpdated: (__VLS_ctx.refreshTask) });
        var __VLS_45;
        var __VLS_46;
    }
}
// @ts-ignore
[task, refreshTask,];
var __VLS_3;
var __VLS_4;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
