/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { computed, watch } from 'vue';
import UiCard from '../ui/UiCard.vue';
import UiSegmentedControl from '../ui/UiSegmentedControl.vue';
import UiSelect from '../ui/UiSelect.vue';
import UiTextAction from '../ui/UiTextAction.vue';
const props = withDefaults(defineProps(), {
    showAssigneeFilter: false,
    assignableUsers: () => [],
    hideProjectFilter: false,
    showViewSwitcher: true,
});
const emit = defineEmits();
const taskView = defineModel('taskView', { default: 'list' });
const filterProject = defineModel('filterProject', { default: '' });
const filterStatus = defineModel('filterStatus', { default: () => [] });
const clientPriority = defineModel('clientPriority', {
    default: () => [],
});
const assigneeFilter = defineModel('assigneeFilter', {
    default: () => [],
});
const sortKey = defineModel('sortKey', {
    default: 'updated_at',
});
const sortDir = defineModel('sortDir', { default: 'desc' });
const groupBy = defineModel('groupBy', { default: 'none' });
watch(() => props.hideProjectFilter, (hide) => {
    if (hide && groupBy.value === 'project')
        groupBy.value = 'none';
}, { immediate: true });
const viewModeOptions = [
    { value: 'list', label: 'List' },
    { value: 'board', label: 'Board' },
];
const statusOptionsMulti = [
    { value: 'todo', label: 'To do' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'review', label: 'Review' },
    { value: 'done', label: 'Done' },
];
const priorityOptionsMulti = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
];
const sortKeySegmented = [
    { value: 'updated_at', label: 'Updated' },
    { value: 'created_at', label: 'Created' },
    { value: 'title', label: 'Title' },
    { value: 'priority', label: 'Priority' },
    { value: 'due_date', label: 'Due date' },
];
const sortDirSegmented = [
    { value: 'asc', label: 'Ascending' },
    { value: 'desc', label: 'Descending' },
];
const groupByOptionsAll = [
    { value: 'none', label: 'No grouping' },
    { value: 'project', label: 'By project' },
    { value: 'status', label: 'By status' },
    { value: 'priority', label: 'By priority' },
    { value: 'assignee', label: 'By assignee' },
];
const groupByOptions = computed(() => props.hideProjectFilter
    ? groupByOptionsAll.filter((o) => o.value !== 'project')
    : groupByOptionsAll);
const projectSelectOptions = computed(() => [
    { value: '', label: 'All projects' },
    ...props.projects.map((p) => ({ value: p.id, label: p.name })),
]);
const assigneeSelectOptions = computed(() => {
    const base = [
        { value: 'unassigned', label: 'Unassigned' },
    ];
    for (const u of props.assignableUsers) {
        base.push({
            value: u.id,
            label: u.name || u.email,
        });
    }
    return base;
});
const filterGridClass = computed(() => {
    const cols = 2 + (props.showAssigneeFilter ? 1 : 0) + (props.hideProjectFilter ? 0 : 1);
    if (cols >= 4)
        return 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4';
    if (cols === 3)
        return 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3';
    return 'grid gap-3 sm:grid-cols-2';
});
const clearBtnClass = 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';
const __VLS_defaultModels = {
    'taskView': 'list',
    'filterProject': '',
    'filterStatus': () => [],
    'clientPriority': () => [],
    'assigneeFilter': () => [],
    'sortKey': 'updated_at',
    'sortDir': 'desc',
    'groupBy': 'none',
};
let __VLS_modelEmit;
const __VLS_defaults = {
    showAssigneeFilter: false,
    assignableUsers: () => [],
    hideProjectFilter: false,
    showViewSwitcher: true,
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
const __VLS_0 = UiCard || UiCard;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    padding: "p-4 sm:p-5",
}));
const __VLS_2 = __VLS_1({
    padding: "p-4 sm:p-5",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
const { default: __VLS_6 } = __VLS_3.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "space-y-4" },
});
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
if (__VLS_ctx.showViewSwitcher) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-col gap-3 sm:flex-row sm:items-center" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:flex-row']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:items-center']} */ ;
    const __VLS_7 = UiSegmentedControl;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        modelValue: (__VLS_ctx.taskView),
        ...{ class: "w-full sm:w-auto" },
        'aria-label': "Tasks view",
        options: (__VLS_ctx.viewModeOptions),
    }));
    const __VLS_9 = __VLS_8({
        modelValue: (__VLS_ctx.taskView),
        ...{ class: "w-full sm:w-auto" },
        'aria-label': "Tasks view",
        options: (__VLS_ctx.viewModeOptions),
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:w-auto']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: (__VLS_ctx.filterGridClass) },
});
if (!__VLS_ctx.hideProjectFilter) {
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
        ...{ class: "flex min-w-0 items-start gap-1.5" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "min-w-0 flex-1" },
    });
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    const __VLS_12 = UiSelect;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
        modelValue: (__VLS_ctx.filterProject),
        filterable: true,
        placeholder: "All projects",
        'aria-label': "Filter by project",
        options: (__VLS_ctx.projectSelectOptions),
    }));
    const __VLS_14 = __VLS_13({
        modelValue: (__VLS_ctx.filterProject),
        filterable: true,
        placeholder: "All projects",
        'aria-label': "Filter by project",
        options: (__VLS_ctx.projectSelectOptions),
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    if (__VLS_ctx.filterProject !== '') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.hideProjectFilter))
                        return;
                    if (!(__VLS_ctx.filterProject !== ''))
                        return;
                    __VLS_ctx.filterProject = '';
                    // @ts-ignore
                    [showViewSwitcher, taskView, viewModeOptions, filterGridClass, hideProjectFilter, filterProject, filterProject, filterProject, projectSelectOptions,];
                } },
            type: "button",
            ...{ class: (__VLS_ctx.clearBtnClass) },
            'aria-label': "Clear project filter",
        });
        let __VLS_17;
        /** @ts-ignore @type {typeof __VLS_components.XMarkIcon} */
        XMarkIcon;
        // @ts-ignore
        const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
            ...{ class: "h-3.5 w-3.5" },
            'aria-hidden': "true",
        }));
        const __VLS_19 = __VLS_18({
            ...{ class: "h-3.5 w-3.5" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_18));
        /** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
    }
}
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
    ...{ class: "flex min-w-0 items-start gap-1.5" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
/** @type {__VLS_StyleScopedClasses['items-start']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "min-w-0 flex-1" },
});
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
const __VLS_22 = UiSelect;
// @ts-ignore
const __VLS_23 = __VLS_asFunctionalComponent1(__VLS_22, new __VLS_22({
    modelValue: (__VLS_ctx.filterStatus),
    filterable: true,
    multiple: true,
    placeholder: "All statuses",
    'aria-label': "Filter by status",
    options: (__VLS_ctx.statusOptionsMulti),
}));
const __VLS_24 = __VLS_23({
    modelValue: (__VLS_ctx.filterStatus),
    filterable: true,
    multiple: true,
    placeholder: "All statuses",
    'aria-label': "Filter by status",
    options: (__VLS_ctx.statusOptionsMulti),
}, ...__VLS_functionalComponentArgsRest(__VLS_23));
if (__VLS_ctx.filterStatus.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.filterStatus.length > 0))
                    return;
                __VLS_ctx.filterStatus = [];
                // @ts-ignore
                [clearBtnClass, filterStatus, filterStatus, filterStatus, statusOptionsMulti,];
            } },
        type: "button",
        ...{ class: (__VLS_ctx.clearBtnClass) },
        'aria-label': "Clear status filter",
    });
    let __VLS_27;
    /** @ts-ignore @type {typeof __VLS_components.XMarkIcon} */
    XMarkIcon;
    // @ts-ignore
    const __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({
        ...{ class: "h-3.5 w-3.5" },
        'aria-hidden': "true",
    }));
    const __VLS_29 = __VLS_28({
        ...{ class: "h-3.5 w-3.5" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_28));
    /** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
}
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
    ...{ class: "flex min-w-0 items-start gap-1.5" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
/** @type {__VLS_StyleScopedClasses['items-start']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "min-w-0 flex-1" },
});
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
const __VLS_32 = UiSelect;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
    modelValue: (__VLS_ctx.clientPriority),
    filterable: true,
    multiple: true,
    placeholder: "All priorities",
    'aria-label': "Filter by priority",
    options: (__VLS_ctx.priorityOptionsMulti),
}));
const __VLS_34 = __VLS_33({
    modelValue: (__VLS_ctx.clientPriority),
    filterable: true,
    multiple: true,
    placeholder: "All priorities",
    'aria-label': "Filter by priority",
    options: (__VLS_ctx.priorityOptionsMulti),
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
if (__VLS_ctx.clientPriority.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.clientPriority.length > 0))
                    return;
                __VLS_ctx.clientPriority = [];
                // @ts-ignore
                [clearBtnClass, clientPriority, clientPriority, clientPriority, priorityOptionsMulti,];
            } },
        type: "button",
        ...{ class: (__VLS_ctx.clearBtnClass) },
        'aria-label': "Clear priority filter",
    });
    let __VLS_37;
    /** @ts-ignore @type {typeof __VLS_components.XMarkIcon} */
    XMarkIcon;
    // @ts-ignore
    const __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37({
        ...{ class: "h-3.5 w-3.5" },
        'aria-hidden': "true",
    }));
    const __VLS_39 = __VLS_38({
        ...{ class: "h-3.5 w-3.5" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_38));
    /** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
}
if (__VLS_ctx.showAssigneeFilter) {
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
        ...{ class: "flex min-w-0 items-start gap-1.5" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "min-w-0 flex-1" },
    });
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    const __VLS_42 = UiSelect;
    // @ts-ignore
    const __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({
        modelValue: (__VLS_ctx.assigneeFilter),
        filterable: true,
        multiple: true,
        placeholder: "All assignees",
        'aria-label': "Filter by assignee",
        options: (__VLS_ctx.assigneeSelectOptions),
    }));
    const __VLS_44 = __VLS_43({
        modelValue: (__VLS_ctx.assigneeFilter),
        filterable: true,
        multiple: true,
        placeholder: "All assignees",
        'aria-label': "Filter by assignee",
        options: (__VLS_ctx.assigneeSelectOptions),
    }, ...__VLS_functionalComponentArgsRest(__VLS_43));
    if (__VLS_ctx.assigneeFilter.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showAssigneeFilter))
                        return;
                    if (!(__VLS_ctx.assigneeFilter.length > 0))
                        return;
                    __VLS_ctx.assigneeFilter = [];
                    // @ts-ignore
                    [clearBtnClass, showAssigneeFilter, assigneeFilter, assigneeFilter, assigneeFilter, assigneeSelectOptions,];
                } },
            type: "button",
            ...{ class: (__VLS_ctx.clearBtnClass) },
            'aria-label': "Clear assignee filter",
        });
        let __VLS_47;
        /** @ts-ignore @type {typeof __VLS_components.XMarkIcon} */
        XMarkIcon;
        // @ts-ignore
        const __VLS_48 = __VLS_asFunctionalComponent1(__VLS_47, new __VLS_47({
            ...{ class: "h-3.5 w-3.5" },
            'aria-hidden': "true",
        }));
        const __VLS_49 = __VLS_48({
            ...{ class: "h-3.5 w-3.5" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_48));
        /** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
    }
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "-mx-1 flex max-w-full flex-nowrap items-end gap-4 overflow-x-auto px-1 pb-0.5" },
    role: "group",
    'aria-label': "Sort, order, and grouping",
});
/** @type {__VLS_StyleScopedClasses['-mx-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-nowrap']} */ ;
/** @type {__VLS_StyleScopedClasses['items-end']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['px-1']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-0.5']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex shrink-0 flex-col gap-1.5" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-xs font-medium text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
const __VLS_52 = UiSegmentedControl;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({
    modelValue: (__VLS_ctx.sortKey),
    ...{ class: "min-w-max" },
    'aria-label': "Sort tasks by",
    options: (__VLS_ctx.sortKeySegmented),
}));
const __VLS_54 = __VLS_53({
    modelValue: (__VLS_ctx.sortKey),
    ...{ class: "min-w-max" },
    'aria-label': "Sort tasks by",
    options: (__VLS_ctx.sortKeySegmented),
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
/** @type {__VLS_StyleScopedClasses['min-w-max']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex shrink-0 flex-col gap-1.5" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-xs font-medium text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
const __VLS_57 = UiSegmentedControl;
// @ts-ignore
const __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57({
    modelValue: (__VLS_ctx.sortDir),
    'aria-label': "Sort order",
    options: (__VLS_ctx.sortDirSegmented),
}));
const __VLS_59 = __VLS_58({
    modelValue: (__VLS_ctx.sortDir),
    'aria-label': "Sort order",
    options: (__VLS_ctx.sortDirSegmented),
}, ...__VLS_functionalComponentArgsRest(__VLS_58));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex shrink-0 flex-col gap-1.5" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-xs font-medium text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
const __VLS_62 = UiSegmentedControl;
// @ts-ignore
const __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62({
    modelValue: (__VLS_ctx.groupBy),
    ...{ class: "min-w-max" },
    'aria-label': "Group tasks",
    options: (__VLS_ctx.groupByOptions),
}));
const __VLS_64 = __VLS_63({
    modelValue: (__VLS_ctx.groupBy),
    ...{ class: "min-w-max" },
    'aria-label': "Group tasks",
    options: (__VLS_ctx.groupByOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_63));
/** @type {__VLS_StyleScopedClasses['min-w-max']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex justify-start pt-1" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-start']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-1']} */ ;
const __VLS_67 = UiTextAction || UiTextAction;
// @ts-ignore
const __VLS_68 = __VLS_asFunctionalComponent1(__VLS_67, new __VLS_67({
    ...{ 'onClick': {} },
    type: "button",
}));
const __VLS_69 = __VLS_68({
    ...{ 'onClick': {} },
    type: "button",
}, ...__VLS_functionalComponentArgsRest(__VLS_68));
let __VLS_72;
const __VLS_73 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.emit('reset');
            // @ts-ignore
            [clearBtnClass, sortKey, sortKeySegmented, sortDir, sortDirSegmented, groupBy, groupByOptions, emit,];
        } });
const { default: __VLS_74 } = __VLS_70.slots;
// @ts-ignore
[];
var __VLS_70;
var __VLS_71;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
export default {};
