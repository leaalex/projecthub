/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { BoltIcon, FolderIcon, TagIcon } from '@heroicons/vue/24/outline';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import Button from '../ui/UiButton.vue';
import Input from '../ui/UiInput.vue';
import UiMenuButton from '../ui/UiMenuButton.vue';
import UiTextarea from '../ui/UiTextarea.vue';
import { useTaskStore } from '../../stores/task.store';
import { useToast } from '../../composables/useToast';
const STATUS_OPTIONS = [
    { value: 'todo', label: 'To do' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'review', label: 'Review' },
    { value: 'done', label: 'Done' },
];
const PRIORITY_OPTIONS = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
];
const props = withDefaults(defineProps(), { variant: 'card' });
const emit = defineEmits();
const taskStore = useTaskStore();
const toast = useToast();
const title = ref('');
const description = ref('');
const status = ref('todo');
const priority = ref('medium');
const selectedProjectId = ref(0);
const saving = ref(false);
const titleInputRef = ref(null);
onMounted(() => {
    nextTick(() => titleInputRef.value?.focus());
});
const statusMenuLabel = computed(() => STATUS_OPTIONS.find((o) => o.value === status.value)?.label ?? '');
const priorityMenuLabel = computed(() => PRIORITY_OPTIONS.find((o) => o.value === priority.value)?.label ?? '');
const needsProjectSelect = computed(() => props.projectId == null && (props.projects?.length ?? 0) > 0);
watch(() => [props.projectId, props.projects], () => {
    if (props.projectId != null && props.projectId > 0) {
        selectedProjectId.value = props.projectId;
        return;
    }
    const first = props.projects?.[0];
    selectedProjectId.value = first?.id ?? 0;
}, { immediate: true });
const effectiveProjectId = computed(() => {
    if (props.projectId != null && props.projectId > 0)
        return props.projectId;
    return selectedProjectId.value;
});
const inlineProjectOptions = computed(() => (props.projects ?? []).map((p) => ({ value: p.id, label: p.name })));
const selectedProjectName = computed(() => inlineProjectOptions.value.find((o) => o.value === selectedProjectId.value)
    ?.label ?? 'Project');
function syncProjectFromProps() {
    if (props.projectId != null && props.projectId > 0) {
        selectedProjectId.value = props.projectId;
        return;
    }
    const first = props.projects?.[0];
    selectedProjectId.value = first?.id ?? 0;
}
function resetSecondaryFields() {
    description.value = '';
    status.value = 'todo';
    priority.value = 'medium';
    syncProjectFromProps();
}
function resetForm() {
    title.value = '';
    resetSecondaryFields();
}
function cancelForm() {
    resetForm();
    emit('dismiss');
}
async function submit() {
    const t = title.value.trim();
    if (!t) {
        toast.error('Enter a task title');
        return;
    }
    const pid = Math.trunc(Number(effectiveProjectId.value));
    if (!pid) {
        toast.error('Select a project');
        return;
    }
    saving.value = true;
    try {
        const desc = description.value.trim();
        await taskStore.create({
            title: t,
            ...(desc ? { description: desc } : {}),
            project_id: pid,
            status: status.value,
            priority: priority.value,
        });
        resetForm();
        emit('created');
        toast.success('Task created');
    }
    catch (e) {
        const err = e;
        const msg = err.response?.data?.error;
        toast.error(typeof msg === 'string' ? msg : 'Could not create task');
    }
    finally {
        saving.value = false;
    }
}
function onKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submit();
    }
}
const __VLS_defaults = { variant: 'card' };
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
    ...{ class: ([
            'flex flex-col gap-3',
            __VLS_ctx.variant === 'card' &&
                'rounded-lg border border-border bg-surface p-3 shadow-sm',
            __VLS_ctx.variant === 'plain' && 'py-1',
        ]) },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "min-w-0" },
});
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "sr-only" },
    for: "inline-task-title",
});
/** @type {__VLS_StyleScopedClasses['sr-only']} */ ;
const __VLS_0 = Input;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onKeydown': {} },
    id: "inline-task-title",
    ref: "titleInputRef",
    modelValue: (__VLS_ctx.title),
    type: "text",
    placeholder: "New task title…",
    autocomplete: "off",
    disabled: (__VLS_ctx.disabled || __VLS_ctx.saving),
}));
const __VLS_2 = __VLS_1({
    ...{ 'onKeydown': {} },
    id: "inline-task-title",
    ref: "titleInputRef",
    modelValue: (__VLS_ctx.title),
    type: "text",
    placeholder: "New task title…",
    autocomplete: "off",
    disabled: (__VLS_ctx.disabled || __VLS_ctx.saving),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ keydown: {} },
    { onKeydown: (__VLS_ctx.onKeydown) });
var __VLS_7 = {};
var __VLS_3;
var __VLS_4;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "min-w-0" },
});
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "sr-only" },
    for: "inline-task-desc",
});
/** @type {__VLS_StyleScopedClasses['sr-only']} */ ;
const __VLS_9 = UiTextarea;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent1(__VLS_9, new __VLS_9({
    id: "inline-task-desc",
    modelValue: (__VLS_ctx.description),
    rows: (2),
    placeholder: "Description (optional)",
    disabled: (__VLS_ctx.disabled || __VLS_ctx.saving),
}));
const __VLS_11 = __VLS_10({
    id: "inline-task-desc",
    modelValue: (__VLS_ctx.description),
    rows: (2),
    placeholder: "Description (optional)",
    disabled: (__VLS_ctx.disabled || __VLS_ctx.saving),
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-2" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-y-2']} */ ;
if (__VLS_ctx.needsProjectSelect) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex shrink-0 items-center" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "sr-only" },
    });
    /** @type {__VLS_StyleScopedClasses['sr-only']} */ ;
    const __VLS_14 = UiMenuButton || UiMenuButton;
    // @ts-ignore
    const __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({
        modelValue: (__VLS_ctx.selectedProjectId),
        summary: (__VLS_ctx.selectedProjectName),
        ariaLabel: (`Project for new task: ${__VLS_ctx.selectedProjectName}`),
        title: (`Project: ${__VLS_ctx.selectedProjectName}`),
        options: (__VLS_ctx.inlineProjectOptions),
        disabled: (__VLS_ctx.disabled || __VLS_ctx.saving),
    }));
    const __VLS_16 = __VLS_15({
        modelValue: (__VLS_ctx.selectedProjectId),
        summary: (__VLS_ctx.selectedProjectName),
        ariaLabel: (`Project for new task: ${__VLS_ctx.selectedProjectName}`),
        title: (`Project: ${__VLS_ctx.selectedProjectName}`),
        options: (__VLS_ctx.inlineProjectOptions),
        disabled: (__VLS_ctx.disabled || __VLS_ctx.saving),
    }, ...__VLS_functionalComponentArgsRest(__VLS_15));
    const { default: __VLS_19 } = __VLS_17.slots;
    let __VLS_20;
    /** @ts-ignore @type {typeof __VLS_components.FolderIcon} */
    FolderIcon;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
        ...{ class: "h-5 w-5" },
        'aria-hidden': "true",
    }));
    const __VLS_22 = __VLS_21({
        ...{ class: "h-5 w-5" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
    // @ts-ignore
    [variant, variant, title, disabled, disabled, disabled, saving, saving, saving, onKeydown, description, needsProjectSelect, selectedProjectId, selectedProjectName, selectedProjectName, selectedProjectName, inlineProjectOptions,];
    var __VLS_17;
}
const __VLS_25 = UiMenuButton || UiMenuButton;
// @ts-ignore
const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
    modelValue: (__VLS_ctx.status),
    summary: (__VLS_ctx.statusMenuLabel),
    ariaLabel: (`Status: ${__VLS_ctx.statusMenuLabel}`),
    title: (`Status: ${__VLS_ctx.statusMenuLabel}`),
    options: (__VLS_ctx.STATUS_OPTIONS),
    disabled: (__VLS_ctx.disabled || __VLS_ctx.saving),
}));
const __VLS_27 = __VLS_26({
    modelValue: (__VLS_ctx.status),
    summary: (__VLS_ctx.statusMenuLabel),
    ariaLabel: (`Status: ${__VLS_ctx.statusMenuLabel}`),
    title: (`Status: ${__VLS_ctx.statusMenuLabel}`),
    options: (__VLS_ctx.STATUS_OPTIONS),
    disabled: (__VLS_ctx.disabled || __VLS_ctx.saving),
}, ...__VLS_functionalComponentArgsRest(__VLS_26));
const { default: __VLS_30 } = __VLS_28.slots;
let __VLS_31;
/** @ts-ignore @type {typeof __VLS_components.TagIcon} */
TagIcon;
// @ts-ignore
const __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({
    ...{ class: "h-5 w-5" },
    'aria-hidden': "true",
}));
const __VLS_33 = __VLS_32({
    ...{ class: "h-5 w-5" },
    'aria-hidden': "true",
}, ...__VLS_functionalComponentArgsRest(__VLS_32));
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
// @ts-ignore
[disabled, saving, status, statusMenuLabel, statusMenuLabel, statusMenuLabel, STATUS_OPTIONS,];
var __VLS_28;
const __VLS_36 = UiMenuButton || UiMenuButton;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
    modelValue: (__VLS_ctx.priority),
    summary: (__VLS_ctx.priorityMenuLabel),
    ariaLabel: (`Priority: ${__VLS_ctx.priorityMenuLabel}`),
    title: (`Priority: ${__VLS_ctx.priorityMenuLabel}`),
    options: (__VLS_ctx.PRIORITY_OPTIONS),
    disabled: (__VLS_ctx.disabled || __VLS_ctx.saving),
}));
const __VLS_38 = __VLS_37({
    modelValue: (__VLS_ctx.priority),
    summary: (__VLS_ctx.priorityMenuLabel),
    ariaLabel: (`Priority: ${__VLS_ctx.priorityMenuLabel}`),
    title: (`Priority: ${__VLS_ctx.priorityMenuLabel}`),
    options: (__VLS_ctx.PRIORITY_OPTIONS),
    disabled: (__VLS_ctx.disabled || __VLS_ctx.saving),
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
const { default: __VLS_41 } = __VLS_39.slots;
let __VLS_42;
/** @ts-ignore @type {typeof __VLS_components.BoltIcon} */
BoltIcon;
// @ts-ignore
const __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({
    ...{ class: "h-5 w-5" },
    'aria-hidden': "true",
}));
const __VLS_44 = __VLS_43({
    ...{ class: "h-5 w-5" },
    'aria-hidden': "true",
}, ...__VLS_functionalComponentArgsRest(__VLS_43));
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
// @ts-ignore
[disabled, saving, priority, priorityMenuLabel, priorityMenuLabel, priorityMenuLabel, PRIORITY_OPTIONS,];
var __VLS_39;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2" },
});
/** @type {__VLS_StyleScopedClasses['ml-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
const __VLS_47 = Button || Button;
// @ts-ignore
const __VLS_48 = __VLS_asFunctionalComponent1(__VLS_47, new __VLS_47({
    ...{ 'onClick': {} },
    type: "button",
    variant: "secondary",
    disabled: (__VLS_ctx.disabled || __VLS_ctx.saving),
}));
const __VLS_49 = __VLS_48({
    ...{ 'onClick': {} },
    type: "button",
    variant: "secondary",
    disabled: (__VLS_ctx.disabled || __VLS_ctx.saving),
}, ...__VLS_functionalComponentArgsRest(__VLS_48));
let __VLS_52;
const __VLS_53 = ({ click: {} },
    { onClick: (__VLS_ctx.cancelForm) });
const { default: __VLS_54 } = __VLS_50.slots;
// @ts-ignore
[disabled, saving, cancelForm,];
var __VLS_50;
var __VLS_51;
const __VLS_55 = Button || Button;
// @ts-ignore
const __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55({
    ...{ 'onClick': {} },
    type: "button",
    disabled: (__VLS_ctx.disabled || __VLS_ctx.saving),
    loading: (__VLS_ctx.saving),
}));
const __VLS_57 = __VLS_56({
    ...{ 'onClick': {} },
    type: "button",
    disabled: (__VLS_ctx.disabled || __VLS_ctx.saving),
    loading: (__VLS_ctx.saving),
}, ...__VLS_functionalComponentArgsRest(__VLS_56));
let __VLS_60;
const __VLS_61 = ({ click: {} },
    { onClick: (__VLS_ctx.submit) });
const { default: __VLS_62 } = __VLS_58.slots;
// @ts-ignore
[disabled, saving, saving, submit,];
var __VLS_58;
var __VLS_59;
// @ts-ignore
var __VLS_8 = __VLS_7;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
export default {};
