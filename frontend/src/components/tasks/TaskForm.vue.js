/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { BoltIcon, FolderIcon, TagIcon } from '@heroicons/vue/24/outline';
import { computed } from 'vue';
import Button from '../ui/UiButton.vue';
import Input from '../ui/UiInput.vue';
import UiMenuButton from '../ui/UiMenuButton.vue';
import UiTextarea from '../ui/UiTextarea.vue';
const title = defineModel('title', { default: '' });
const description = defineModel('description', { default: '' });
const projectId = defineModel('projectId', { default: 0 });
const status = defineModel('status', { default: 'todo' });
const priority = defineModel('priority', { default: 'medium' });
const props = withDefaults(defineProps(), {
    projects: () => [],
    hideProjectSelect: false,
});
const emit = defineEmits();
const statusOptions = [
    { value: 'todo', label: 'To do' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'review', label: 'Review' },
    { value: 'done', label: 'Done' },
];
const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
];
const projectOptions = computed(() => [
    { value: 0, label: 'Select project', disabled: true },
    ...props.projects.map((p) => ({ value: p.id, label: p.name })),
]);
const projectMenuLabel = computed(() => projectOptions.value.find((o) => o.value === projectId.value)?.label ?? 'Project');
const statusMenuLabel = computed(() => statusOptions.find((o) => o.value === status.value)?.label ?? 'Status');
const priorityMenuLabel = computed(() => priorityOptions.find((o) => o.value === priority.value)?.label ?? 'Priority');
const __VLS_defaultModels = {
    'title': '',
    'description': '',
    'projectId': 0,
    'status': 'todo',
    'priority': 'medium',
};
let __VLS_modelEmit;
const __VLS_defaults = {
    projects: () => [],
    hideProjectSelect: false,
};
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
__VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
    ...{ onSubmit: (...[$event]) => {
            __VLS_ctx.emit('submit');
            // @ts-ignore
            [emit,];
        } },
    ...{ class: "space-y-4" },
});
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
const __VLS_0 = Input;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    id: "tf-title",
    modelValue: (__VLS_ctx.title),
    label: "Title",
    required: true,
    autofocus: true,
}));
const __VLS_2 = __VLS_1({
    id: "tf-title",
    modelValue: (__VLS_ctx.title),
    label: "Title",
    required: true,
    autofocus: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const __VLS_5 = UiTextarea;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
    id: "tf-desc",
    modelValue: (__VLS_ctx.description),
    label: "Description",
    rows: (2),
    placeholder: "Optional",
}));
const __VLS_7 = __VLS_6({
    id: "tf-desc",
    modelValue: (__VLS_ctx.description),
    label: "Description",
    rows: (2),
    placeholder: "Optional",
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
if (!__VLS_ctx.hideProjectSelect) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "mb-1 block text-xs font-medium text-foreground" },
    });
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex min-w-0 items-center gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    const __VLS_10 = UiMenuButton || UiMenuButton;
    // @ts-ignore
    const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
        modelValue: (__VLS_ctx.projectId),
        ariaLabel: (`Project: ${__VLS_ctx.projectMenuLabel}`),
        title: (`Project: ${__VLS_ctx.projectMenuLabel}`),
        options: (__VLS_ctx.projectOptions),
    }));
    const __VLS_12 = __VLS_11({
        modelValue: (__VLS_ctx.projectId),
        ariaLabel: (`Project: ${__VLS_ctx.projectMenuLabel}`),
        title: (`Project: ${__VLS_ctx.projectMenuLabel}`),
        options: (__VLS_ctx.projectOptions),
    }, ...__VLS_functionalComponentArgsRest(__VLS_11));
    const { default: __VLS_15 } = __VLS_13.slots;
    let __VLS_16;
    /** @ts-ignore @type {typeof __VLS_components.FolderIcon} */
    FolderIcon;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({
        ...{ class: "h-5 w-5" },
        'aria-hidden': "true",
    }));
    const __VLS_18 = __VLS_17({
        ...{ class: "h-5 w-5" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
    // @ts-ignore
    [title, description, hideProjectSelect, projectId, projectMenuLabel, projectMenuLabel, projectOptions,];
    var __VLS_13;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "min-w-0 flex-1 truncate text-sm text-foreground" },
    });
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
    (__VLS_ctx.projectMenuLabel);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid grid-cols-2 gap-4" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "mb-1 block text-xs font-medium text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex min-w-0 items-center gap-2" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
const __VLS_21 = UiMenuButton || UiMenuButton;
// @ts-ignore
const __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21({
    modelValue: (__VLS_ctx.status),
    ariaLabel: (`Status: ${__VLS_ctx.statusMenuLabel}`),
    title: (`Status: ${__VLS_ctx.statusMenuLabel}`),
    options: (__VLS_ctx.statusOptions),
}));
const __VLS_23 = __VLS_22({
    modelValue: (__VLS_ctx.status),
    ariaLabel: (`Status: ${__VLS_ctx.statusMenuLabel}`),
    title: (`Status: ${__VLS_ctx.statusMenuLabel}`),
    options: (__VLS_ctx.statusOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_22));
const { default: __VLS_26 } = __VLS_24.slots;
let __VLS_27;
/** @ts-ignore @type {typeof __VLS_components.TagIcon} */
TagIcon;
// @ts-ignore
const __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({
    ...{ class: "h-5 w-5" },
    'aria-hidden': "true",
}));
const __VLS_29 = __VLS_28({
    ...{ class: "h-5 w-5" },
    'aria-hidden': "true",
}, ...__VLS_functionalComponentArgsRest(__VLS_28));
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
// @ts-ignore
[projectMenuLabel, status, statusMenuLabel, statusMenuLabel, statusOptions,];
var __VLS_24;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "min-w-0 flex-1 truncate text-sm text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['truncate']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
(__VLS_ctx.statusMenuLabel);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "mb-1 block text-xs font-medium text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex min-w-0 items-center gap-2" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
const __VLS_32 = UiMenuButton || UiMenuButton;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
    modelValue: (__VLS_ctx.priority),
    ariaLabel: (`Priority: ${__VLS_ctx.priorityMenuLabel}`),
    title: (`Priority: ${__VLS_ctx.priorityMenuLabel}`),
    options: (__VLS_ctx.priorityOptions),
}));
const __VLS_34 = __VLS_33({
    modelValue: (__VLS_ctx.priority),
    ariaLabel: (`Priority: ${__VLS_ctx.priorityMenuLabel}`),
    title: (`Priority: ${__VLS_ctx.priorityMenuLabel}`),
    options: (__VLS_ctx.priorityOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
const { default: __VLS_37 } = __VLS_35.slots;
let __VLS_38;
/** @ts-ignore @type {typeof __VLS_components.BoltIcon} */
BoltIcon;
// @ts-ignore
const __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({
    ...{ class: "h-5 w-5" },
    'aria-hidden': "true",
}));
const __VLS_40 = __VLS_39({
    ...{ class: "h-5 w-5" },
    'aria-hidden': "true",
}, ...__VLS_functionalComponentArgsRest(__VLS_39));
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
// @ts-ignore
[statusMenuLabel, priority, priorityMenuLabel, priorityMenuLabel, priorityOptions,];
var __VLS_35;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "min-w-0 flex-1 truncate text-sm text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['truncate']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
(__VLS_ctx.priorityMenuLabel);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex flex-wrap items-center gap-2" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
var __VLS_43 = {};
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "ml-auto flex flex-wrap gap-2" },
});
/** @type {__VLS_StyleScopedClasses['ml-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
const __VLS_45 = Button || Button;
// @ts-ignore
const __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45({
    ...{ 'onClick': {} },
    type: "button",
    variant: "ghost",
}));
const __VLS_47 = __VLS_46({
    ...{ 'onClick': {} },
    type: "button",
    variant: "ghost",
}, ...__VLS_functionalComponentArgsRest(__VLS_46));
let __VLS_50;
const __VLS_51 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.emit('cancel');
            // @ts-ignore
            [emit, priorityMenuLabel,];
        } });
const { default: __VLS_52 } = __VLS_48.slots;
// @ts-ignore
[];
var __VLS_48;
var __VLS_49;
const __VLS_53 = Button || Button;
// @ts-ignore
const __VLS_54 = __VLS_asFunctionalComponent1(__VLS_53, new __VLS_53({
    type: "submit",
    loading: (__VLS_ctx.loading),
}));
const __VLS_55 = __VLS_54({
    type: "submit",
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_54));
const { default: __VLS_58 } = __VLS_56.slots;
(__VLS_ctx.submitLabel ?? 'Create');
// @ts-ignore
[loading, submitLabel,];
var __VLS_56;
// @ts-ignore
var __VLS_44 = __VLS_43;
// @ts-ignore
[];
const __VLS_base = (await import('vue')).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
const __VLS_export = {};
export default {};
