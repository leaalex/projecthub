/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, onMounted, ref } from 'vue';
import UiButton from '../ui/UiButton.vue';
import UiCheckboxRow from '../ui/UiCheckboxRow.vue';
import UiFilterChip from '../ui/UiFilterChip.vue';
import UiFormSection from '../ui/UiFormSection.vue';
import UiInput from '../ui/UiInput.vue';
import UiScrollPanel from '../ui/UiScrollPanel.vue';
import UiSegmentedControl from '../ui/UiSegmentedControl.vue';
import UiSelect from '../ui/UiSelect.vue';
import UiTextAction from '../ui/UiTextAction.vue';
import { useAuthStore } from '../../stores/auth.store';
import { useProjectStore } from '../../stores/project.store';
import { api } from '../../utils/api';
const props = defineProps();
const emit = defineEmits();
const auth = useAuthStore();
const projectStore = useProjectStore();
const canFilterUsers = computed(() => auth.user?.role === 'admin' || auth.user?.role === 'staff');
const format = ref('xlsx');
const dateFrom = ref('');
const dateTo = ref('');
const selectedProjectIds = ref([]);
const selectedUserIds = ref([]);
const users = ref([]);
const loadingUsers = ref(false);
const FORMAT_OPTIONS = [
    { value: 'csv', label: 'CSV' },
    { value: 'xlsx', label: 'XLSX' },
    { value: 'pdf', label: 'PDF' },
    { value: 'txt', label: 'TXT' },
];
const PDF_LAYOUT_OPTIONS = [
    { value: 'table', label: 'Table' },
    { value: 'list', label: 'List' },
];
const pdfLayout = ref('table');
const statusOptions = [
    'todo',
    'in_progress',
    'review',
    'done',
];
const selectedStatuses = ref([...statusOptions]);
const priorityOptions = [
    'low',
    'medium',
    'high',
    'critical',
];
const selectedPriorities = ref([...priorityOptions]);
const fieldDefs = [
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Priority' },
    { key: 'project', label: 'Project' },
    { key: 'assignee', label: 'Assignee' },
    { key: 'due_date', label: 'Due date' },
    { key: 'created_at', label: 'Created at' },
    { key: 'updated_at', label: 'Updated at' },
];
const selectedFields = ref(fieldDefs.map((f) => f.key));
const groupBy = ref('');
const groupSelectOptions = [
    { value: '', label: 'None' },
    { value: 'project', label: 'By project' },
    { value: 'status', label: 'By status' },
    { value: 'priority', label: 'By priority' },
    { value: 'assignee', label: 'By assignee' },
];
onMounted(async () => {
    await projectStore.fetchList().catch(() => { });
    if (canFilterUsers.value) {
        loadingUsers.value = true;
        try {
            const { data } = await api.get('/users');
            users.value = data.users;
        }
        catch {
            users.value = [];
        }
        finally {
            loadingUsers.value = false;
        }
    }
});
function toggleAllStatuses(checked) {
    selectedStatuses.value = checked ? [...statusOptions] : [];
}
function toggleAllPriorities(checked) {
    selectedPriorities.value = checked ? [...priorityOptions] : [];
}
function toggleAllFields(checked) {
    selectedFields.value = checked ? fieldDefs.map((f) => f.key) : [];
}
function submit() {
    if (selectedFields.value.length === 0) {
        return;
    }
    const cfg = {
        format: format.value,
        date_from: dateFrom.value.trim() || undefined,
        date_to: dateTo.value.trim() || undefined,
        project_ids: [...selectedProjectIds.value],
        user_ids: canFilterUsers.value ? [...selectedUserIds.value] : [],
        statuses: [...selectedStatuses.value],
        priorities: [...selectedPriorities.value],
        fields: [...selectedFields.value],
        group_by: groupBy.value,
        ...(format.value === 'pdf' ? { pdf_layout: pdfLayout.value } : {}),
    };
    emit('generate', cfg);
}
const canSubmit = computed(() => selectedFields.value.length > 0 && !props.generating);
function statusLabel(s) {
    return s.replace('_', ' ');
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-muted" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mt-4 space-y-4" },
});
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
const __VLS_0 = UiFormSection || UiFormSection;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    title: "Format",
}));
const __VLS_2 = __VLS_1({
    title: "Format",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_5 } = __VLS_3.slots;
const __VLS_6 = UiSegmentedControl;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
    modelValue: (__VLS_ctx.format),
    'aria-label': "Report format",
    options: ([...__VLS_ctx.FORMAT_OPTIONS]),
}));
const __VLS_8 = __VLS_7({
    modelValue: (__VLS_ctx.format),
    'aria-label': "Report format",
    options: ([...__VLS_ctx.FORMAT_OPTIONS]),
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
// @ts-ignore
[format, FORMAT_OPTIONS,];
var __VLS_3;
if (__VLS_ctx.format === 'pdf') {
    const __VLS_11 = UiFormSection || UiFormSection;
    // @ts-ignore
    const __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
        title: "PDF layout",
    }));
    const __VLS_13 = __VLS_12({
        title: "PDF layout",
    }, ...__VLS_functionalComponentArgsRest(__VLS_12));
    const { default: __VLS_16 } = __VLS_14.slots;
    const __VLS_17 = UiSegmentedControl;
    // @ts-ignore
    const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
        modelValue: (__VLS_ctx.pdfLayout),
        'aria-label': "PDF layout",
        options: (__VLS_ctx.PDF_LAYOUT_OPTIONS),
    }));
    const __VLS_19 = __VLS_18({
        modelValue: (__VLS_ctx.pdfLayout),
        'aria-label': "PDF layout",
        options: (__VLS_ctx.PDF_LAYOUT_OPTIONS),
    }, ...__VLS_functionalComponentArgsRest(__VLS_18));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-2 text-xs text-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
    // @ts-ignore
    [format, pdfLayout, PDF_LAYOUT_OPTIONS,];
    var __VLS_14;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid gap-4 sm:grid-cols-2" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
const __VLS_22 = UiInput;
// @ts-ignore
const __VLS_23 = __VLS_asFunctionalComponent1(__VLS_22, new __VLS_22({
    id: "rep-from",
    modelValue: (__VLS_ctx.dateFrom),
    type: "date",
    label: "Created from",
}));
const __VLS_24 = __VLS_23({
    id: "rep-from",
    modelValue: (__VLS_ctx.dateFrom),
    type: "date",
    label: "Created from",
}, ...__VLS_functionalComponentArgsRest(__VLS_23));
const __VLS_27 = UiInput;
// @ts-ignore
const __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({
    id: "rep-to",
    modelValue: (__VLS_ctx.dateTo),
    type: "date",
    label: "Created to",
}));
const __VLS_29 = __VLS_28({
    id: "rep-to",
    modelValue: (__VLS_ctx.dateTo),
    type: "date",
    label: "Created to",
}, ...__VLS_functionalComponentArgsRest(__VLS_28));
const __VLS_32 = UiFormSection || UiFormSection;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
    title: "Projects (empty = all you can access)",
}));
const __VLS_34 = __VLS_33({
    title: "Projects (empty = all you can access)",
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
const { default: __VLS_37 } = __VLS_35.slots;
if (!__VLS_ctx.projectStore.projects.length) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-sm text-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
}
else {
    const __VLS_38 = UiScrollPanel || UiScrollPanel;
    // @ts-ignore
    const __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({}));
    const __VLS_40 = __VLS_39({}, ...__VLS_functionalComponentArgsRest(__VLS_39));
    const { default: __VLS_43 } = __VLS_41.slots;
    for (const [p] of __VLS_vFor((__VLS_ctx.projectStore.projects))) {
        const __VLS_44 = UiCheckboxRow || UiCheckboxRow;
        // @ts-ignore
        const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
            key: (p.id),
            modelValue: (__VLS_ctx.selectedProjectIds),
            value: (p.id),
        }));
        const __VLS_46 = __VLS_45({
            key: (p.id),
            modelValue: (__VLS_ctx.selectedProjectIds),
            value: (p.id),
        }, ...__VLS_functionalComponentArgsRest(__VLS_45));
        const { default: __VLS_49 } = __VLS_47.slots;
        (p.name);
        // @ts-ignore
        [dateFrom, dateTo, projectStore, projectStore, selectedProjectIds,];
        var __VLS_47;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_41;
}
// @ts-ignore
[];
var __VLS_35;
if (__VLS_ctx.canFilterUsers) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    const __VLS_50 = UiFormSection || UiFormSection;
    // @ts-ignore
    const __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
        title: "Users (empty = all tasks; otherwise assignee or project owner in list)",
    }));
    const __VLS_52 = __VLS_51({
        title: "Users (empty = all tasks; otherwise assignee or project owner in list)",
    }, ...__VLS_functionalComponentArgsRest(__VLS_51));
    const { default: __VLS_55 } = __VLS_53.slots;
    if (__VLS_ctx.loadingUsers) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-sm text-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
    }
    else {
        const __VLS_56 = UiScrollPanel || UiScrollPanel;
        // @ts-ignore
        const __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({}));
        const __VLS_58 = __VLS_57({}, ...__VLS_functionalComponentArgsRest(__VLS_57));
        const { default: __VLS_61 } = __VLS_59.slots;
        for (const [u] of __VLS_vFor((__VLS_ctx.users))) {
            const __VLS_62 = UiCheckboxRow || UiCheckboxRow;
            // @ts-ignore
            const __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62({
                key: (u.id),
                modelValue: (__VLS_ctx.selectedUserIds),
                value: (u.id),
            }));
            const __VLS_64 = __VLS_63({
                key: (u.id),
                modelValue: (__VLS_ctx.selectedUserIds),
                value: (u.id),
            }, ...__VLS_functionalComponentArgsRest(__VLS_63));
            const { default: __VLS_67 } = __VLS_65.slots;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "truncate" },
            });
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            (u.name || u.email);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-xs text-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
            (u.email);
            // @ts-ignore
            [canFilterUsers, loadingUsers, users, selectedUserIds,];
            var __VLS_65;
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        var __VLS_59;
    }
    // @ts-ignore
    [];
    var __VLS_53;
}
const __VLS_68 = UiFormSection || UiFormSection;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent1(__VLS_68, new __VLS_68({
    title: "Statuses",
}));
const __VLS_70 = __VLS_69({
    title: "Statuses",
}, ...__VLS_functionalComponentArgsRest(__VLS_69));
const { default: __VLS_73 } = __VLS_71.slots;
{
    const { actions: __VLS_74 } = __VLS_71.slots;
    const __VLS_75 = UiTextAction || UiTextAction;
    // @ts-ignore
    const __VLS_76 = __VLS_asFunctionalComponent1(__VLS_75, new __VLS_75({
        ...{ 'onClick': {} },
    }));
    const __VLS_77 = __VLS_76({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_76));
    let __VLS_80;
    const __VLS_81 = ({ click: {} },
        { onClick: (...[$event]) => {
                __VLS_ctx.toggleAllStatuses(__VLS_ctx.selectedStatuses.length < __VLS_ctx.statusOptions.length);
                // @ts-ignore
                [toggleAllStatuses, selectedStatuses, statusOptions,];
            } });
    const { default: __VLS_82 } = __VLS_78.slots;
    (__VLS_ctx.selectedStatuses.length < __VLS_ctx.statusOptions.length
        ? 'Select all'
        : 'Clear');
    // @ts-ignore
    [selectedStatuses, statusOptions,];
    var __VLS_78;
    var __VLS_79;
    // @ts-ignore
    [];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex flex-wrap gap-2" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
for (const [s] of __VLS_vFor((__VLS_ctx.statusOptions))) {
    const __VLS_83 = UiFilterChip || UiFilterChip;
    // @ts-ignore
    const __VLS_84 = __VLS_asFunctionalComponent1(__VLS_83, new __VLS_83({
        key: (s),
        modelValue: (__VLS_ctx.selectedStatuses),
        value: (s),
    }));
    const __VLS_85 = __VLS_84({
        key: (s),
        modelValue: (__VLS_ctx.selectedStatuses),
        value: (s),
    }, ...__VLS_functionalComponentArgsRest(__VLS_84));
    const { default: __VLS_88 } = __VLS_86.slots;
    (__VLS_ctx.statusLabel(s));
    // @ts-ignore
    [selectedStatuses, statusOptions, statusLabel,];
    var __VLS_86;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_71;
const __VLS_89 = UiFormSection || UiFormSection;
// @ts-ignore
const __VLS_90 = __VLS_asFunctionalComponent1(__VLS_89, new __VLS_89({
    title: "Priorities",
}));
const __VLS_91 = __VLS_90({
    title: "Priorities",
}, ...__VLS_functionalComponentArgsRest(__VLS_90));
const { default: __VLS_94 } = __VLS_92.slots;
{
    const { actions: __VLS_95 } = __VLS_92.slots;
    const __VLS_96 = UiTextAction || UiTextAction;
    // @ts-ignore
    const __VLS_97 = __VLS_asFunctionalComponent1(__VLS_96, new __VLS_96({
        ...{ 'onClick': {} },
    }));
    const __VLS_98 = __VLS_97({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_97));
    let __VLS_101;
    const __VLS_102 = ({ click: {} },
        { onClick: (...[$event]) => {
                __VLS_ctx.toggleAllPriorities(__VLS_ctx.selectedPriorities.length < __VLS_ctx.priorityOptions.length);
                // @ts-ignore
                [toggleAllPriorities, selectedPriorities, priorityOptions,];
            } });
    const { default: __VLS_103 } = __VLS_99.slots;
    (__VLS_ctx.selectedPriorities.length < __VLS_ctx.priorityOptions.length
        ? 'Select all'
        : 'Clear');
    // @ts-ignore
    [selectedPriorities, priorityOptions,];
    var __VLS_99;
    var __VLS_100;
    // @ts-ignore
    [];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex flex-wrap gap-2" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
for (const [pr] of __VLS_vFor((__VLS_ctx.priorityOptions))) {
    const __VLS_104 = UiFilterChip || UiFilterChip;
    // @ts-ignore
    const __VLS_105 = __VLS_asFunctionalComponent1(__VLS_104, new __VLS_104({
        key: (pr),
        modelValue: (__VLS_ctx.selectedPriorities),
        value: (pr),
    }));
    const __VLS_106 = __VLS_105({
        key: (pr),
        modelValue: (__VLS_ctx.selectedPriorities),
        value: (pr),
    }, ...__VLS_functionalComponentArgsRest(__VLS_105));
    const { default: __VLS_109 } = __VLS_107.slots;
    (pr);
    // @ts-ignore
    [selectedPriorities, priorityOptions,];
    var __VLS_107;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_92;
const __VLS_110 = UiFormSection || UiFormSection;
// @ts-ignore
const __VLS_111 = __VLS_asFunctionalComponent1(__VLS_110, new __VLS_110({
    title: "Columns",
}));
const __VLS_112 = __VLS_111({
    title: "Columns",
}, ...__VLS_functionalComponentArgsRest(__VLS_111));
const { default: __VLS_115 } = __VLS_113.slots;
{
    const { actions: __VLS_116 } = __VLS_113.slots;
    const __VLS_117 = UiTextAction || UiTextAction;
    // @ts-ignore
    const __VLS_118 = __VLS_asFunctionalComponent1(__VLS_117, new __VLS_117({
        ...{ 'onClick': {} },
    }));
    const __VLS_119 = __VLS_118({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_118));
    let __VLS_122;
    const __VLS_123 = ({ click: {} },
        { onClick: (...[$event]) => {
                __VLS_ctx.toggleAllFields(__VLS_ctx.selectedFields.length < __VLS_ctx.fieldDefs.length);
                // @ts-ignore
                [toggleAllFields, selectedFields, fieldDefs,];
            } });
    const { default: __VLS_124 } = __VLS_120.slots;
    (__VLS_ctx.selectedFields.length < __VLS_ctx.fieldDefs.length ? 'Select all' : 'Clear');
    // @ts-ignore
    [selectedFields, fieldDefs,];
    var __VLS_120;
    var __VLS_121;
    // @ts-ignore
    [];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex flex-wrap gap-2" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
for (const [f] of __VLS_vFor((__VLS_ctx.fieldDefs))) {
    const __VLS_125 = UiFilterChip || UiFilterChip;
    // @ts-ignore
    const __VLS_126 = __VLS_asFunctionalComponent1(__VLS_125, new __VLS_125({
        key: (f.key),
        modelValue: (__VLS_ctx.selectedFields),
        value: (f.key),
    }));
    const __VLS_127 = __VLS_126({
        key: (f.key),
        modelValue: (__VLS_ctx.selectedFields),
        value: (f.key),
    }, ...__VLS_functionalComponentArgsRest(__VLS_126));
    const { default: __VLS_130 } = __VLS_128.slots;
    (f.label);
    // @ts-ignore
    [selectedFields, fieldDefs,];
    var __VLS_128;
    // @ts-ignore
    [];
}
if (__VLS_ctx.selectedFields.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-2 text-xs text-destructive" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-destructive']} */ ;
}
// @ts-ignore
[selectedFields,];
var __VLS_113;
const __VLS_131 = UiSelect;
// @ts-ignore
const __VLS_132 = __VLS_asFunctionalComponent1(__VLS_131, new __VLS_131({
    id: "rep-group",
    modelValue: (__VLS_ctx.groupBy),
    label: "Group by",
    ...{ class: "max-w-xs" },
    block: (false),
    placeholder: "None",
    options: (__VLS_ctx.groupSelectOptions),
}));
const __VLS_133 = __VLS_132({
    id: "rep-group",
    modelValue: (__VLS_ctx.groupBy),
    label: "Group by",
    ...{ class: "max-w-xs" },
    block: (false),
    placeholder: "None",
    options: (__VLS_ctx.groupSelectOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_132));
/** @type {__VLS_StyleScopedClasses['max-w-xs']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mt-6" },
});
/** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
const __VLS_136 = UiButton || UiButton;
// @ts-ignore
const __VLS_137 = __VLS_asFunctionalComponent1(__VLS_136, new __VLS_136({
    ...{ 'onClick': {} },
    type: "button",
    disabled: (!__VLS_ctx.canSubmit),
    loading: (__VLS_ctx.generating),
}));
const __VLS_138 = __VLS_137({
    ...{ 'onClick': {} },
    type: "button",
    disabled: (!__VLS_ctx.canSubmit),
    loading: (__VLS_ctx.generating),
}, ...__VLS_functionalComponentArgsRest(__VLS_137));
let __VLS_141;
const __VLS_142 = ({ click: {} },
    { onClick: (__VLS_ctx.submit) });
const { default: __VLS_143 } = __VLS_139.slots;
(__VLS_ctx.generating ? 'Saving…' : 'Generate report');
// @ts-ignore
[groupBy, groupSelectOptions, canSubmit, generating, generating, submit,];
var __VLS_139;
var __VLS_140;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
