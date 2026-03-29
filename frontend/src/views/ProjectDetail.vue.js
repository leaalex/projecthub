/// <reference types="../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { FunnelIcon } from '@heroicons/vue/24/outline';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Breadcrumb from '../components/ui/UiBreadcrumb.vue';
import Button from '../components/ui/UiButton.vue';
import EmptyState from '../components/ui/UiEmptyState.vue';
import UiInput from '../components/ui/UiInput.vue';
import Modal from '../components/ui/UiModal.vue';
import Skeleton from '../components/ui/UiSkeleton.vue';
import UiSegmentedControl from '../components/ui/UiSegmentedControl.vue';
import TaskDetailModal from '../components/tasks/TaskDetailModal.vue';
import TaskFiltersPanel from '../components/tasks/TaskFiltersPanel.vue';
import TaskForm from '../components/tasks/TaskForm.vue';
import TaskInlineComposer from '../components/tasks/TaskInlineComposer.vue';
import TaskKanban from '../components/tasks/TaskKanban.vue';
import TaskList from '../components/tasks/TaskList.vue';
import { presentTasks, } from '../composables/useTaskListPresentation';
import { useAuthStore } from '../stores/auth.store';
import { useProjectStore } from '../stores/project.store';
import { useTaskStore } from '../stores/task.store';
import { useAdminAssignableUsers } from '../composables/useAdminAssignableUsers';
import { useTaskEditPermission } from '../composables/useCanEditTask';
import { useToast } from '../composables/useToast';
const taskViewModeOptions = [
    { value: 'list', label: 'List' },
    { value: 'board', label: 'Board' },
];
const toast = useToast();
const auth = useAuthStore();
const canCreateTasks = computed(() => auth.user?.role !== 'user');
const { canEditTask } = useTaskEditPermission();
const { assignableUsers } = useAdminAssignableUsers();
const projectOptions = computed(() => projectStore.projects.map((p) => ({ id: p.id, name: p.name })));
const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();
const taskStore = useTaskStore();
const id = computed(() => Number(route.params.id));
const detailOpen = ref(false);
const detailTaskId = ref(null);
const showTaskComposer = ref(false);
const filtersOpen = ref(false);
const filterProject = ref('');
const filterStatus = ref([]);
const searchQuery = ref('');
const clientPriority = ref([]);
const assigneeFilter = ref([]);
const sortKey = ref('updated_at');
const sortDir = ref('desc');
const groupBy = ref('none');
const projectTaskView = ref('list');
const showModal = ref(false);
const modalTitle = ref('');
const modalDescription = ref('');
const modalProjectId = ref(0);
const modalStatus = ref('todo');
const modalPriority = ref('medium');
const modalSaving = ref(false);
const showAssigneeFilter = computed(() => assignableUsers.value.length > 0);
const presentation = computed(() => presentTasks(projectStore.tasks, {
    search: searchQuery.value,
    priority: clientPriority.value,
    assignee: assigneeFilter.value,
    sortKey: sortKey.value,
    sortDir: sortDir.value,
    groupBy: groupBy.value,
    status: filterStatus.value,
}));
const displayFlat = computed(() => presentation.value.flat);
const displayGroups = computed(() => presentation.value.groups);
const listEmptyMessage = computed(() => projectStore.tasks.length > 0 && displayFlat.value.length === 0
    ? 'No tasks match your search or filters. Adjust filters or reset.'
    : 'No tasks yet. Add one with New task.');
function resetTaskFilters() {
    filtersOpen.value = false;
    searchQuery.value = '';
    clientPriority.value = [];
    assigneeFilter.value = [];
    sortKey.value = 'updated_at';
    sortDir.value = 'desc';
    groupBy.value = 'none';
    filterProject.value = '';
    filterStatus.value = [];
}
const pageLoading = ref(true);
async function load() {
    pageLoading.value = true;
    try {
        await projectStore.fetchList().catch(() => { });
        await projectStore.fetchOne(id.value);
        await projectStore.fetchTasks(id.value);
    }
    catch {
        router.replace('/projects');
        return;
    }
    finally {
        pageLoading.value = false;
    }
}
watch(() => route.params.id, () => {
    showTaskComposer.value = false;
    resetTaskFilters();
    load();
}, { immediate: true });
watch(projectTaskView, (v) => {
    if (v === 'board')
        showTaskComposer.value = false;
});
watch(showModal, (open) => {
    if (open && Number.isFinite(id.value) && id.value > 0) {
        modalProjectId.value = id.value;
    }
});
function openTaskDetail(taskId) {
    detailTaskId.value = taskId;
    detailOpen.value = true;
}
watch(detailOpen, (open) => {
    if (!open)
        detailTaskId.value = null;
});
async function refreshProjectTasks() {
    await projectStore.fetchTasks(id.value);
}
async function onInlineComposerCreated() {
    await refreshProjectTasks();
    showTaskComposer.value = false;
}
async function createTaskFromModal() {
    const t = modalTitle.value.trim();
    if (!t) {
        toast.error('Enter a task title');
        return;
    }
    const pid = Math.trunc(Number(modalProjectId.value));
    if (!pid) {
        toast.error('Invalid project');
        return;
    }
    modalSaving.value = true;
    try {
        await taskStore.create({
            title: t,
            description: modalDescription.value.trim(),
            project_id: pid,
            status: modalStatus.value,
            priority: modalPriority.value,
        });
        showModal.value = false;
        modalTitle.value = '';
        modalDescription.value = '';
        modalStatus.value = 'todo';
        modalPriority.value = 'medium';
        await refreshProjectTasks();
        toast.success('Task created');
    }
    catch (e) {
        const err = e;
        const msg = err.response?.data?.error;
        toast.error(typeof msg === 'string' ? msg : 'Could not create task');
    }
    finally {
        modalSaving.value = false;
    }
}
async function onComplete(taskId) {
    await taskStore.complete(taskId);
    await projectStore.fetchTasks(id.value);
}
async function onReopen(taskId) {
    try {
        await taskStore.update(taskId, { status: 'todo' });
        await projectStore.fetchTasks(id.value);
        toast.success('Task marked as not done');
    }
    catch (e) {
        const err = e;
        const msg = err.response?.data?.error;
        toast.error(typeof msg === 'string' ? msg : 'Could not update task');
    }
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
if (__VLS_ctx.pageLoading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-4" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
    const __VLS_0 = Skeleton;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        variant: "line",
        ...{ class: "h-4 max-w-md" },
    }));
    const __VLS_2 = __VLS_1({
        variant: "line",
        ...{ class: "h-4 max-w-md" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-3" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
    const __VLS_5 = Skeleton;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
        variant: "line",
        ...{ class: "h-8 max-w-xs" },
    }));
    const __VLS_7 = __VLS_6({
        variant: "line",
        ...{ class: "h-8 max-w-xs" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    /** @type {__VLS_StyleScopedClasses['h-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-xs']} */ ;
    const __VLS_10 = Skeleton;
    // @ts-ignore
    const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
        variant: "line",
        lines: (2),
    }));
    const __VLS_12 = __VLS_11({
        variant: "line",
        lines: (2),
    }, ...__VLS_functionalComponentArgsRest(__VLS_11));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-6 overflow-hidden rounded-lg border border-border bg-surface shadow-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "border-b border-border px-3 py-3" },
    });
    /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    const __VLS_15 = Skeleton;
    // @ts-ignore
    const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
        variant: "line",
        ...{ class: "max-w-lg" },
    }));
    const __VLS_17 = __VLS_16({
        variant: "line",
        ...{ class: "max-w-lg" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_16));
    /** @type {__VLS_StyleScopedClasses['max-w-lg']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "divide-y divide-border px-3 py-2" },
    });
    /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
    /** @type {__VLS_StyleScopedClasses['divide-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    for (const [i] of __VLS_vFor((4))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (i),
            ...{ class: "py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        const __VLS_20 = Skeleton;
        // @ts-ignore
        const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
            variant: "line",
        }));
        const __VLS_22 = __VLS_21({
            variant: "line",
        }, ...__VLS_functionalComponentArgsRest(__VLS_21));
        // @ts-ignore
        [pageLoading,];
    }
}
else if (__VLS_ctx.projectStore.current) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    const __VLS_25 = Breadcrumb;
    // @ts-ignore
    const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
        ...{ class: "mb-4" },
        items: ([
            { label: 'Home', to: '/dashboard' },
            { label: 'Projects', to: '/projects' },
            { label: __VLS_ctx.projectStore.current.name },
        ]),
    }));
    const __VLS_27 = __VLS_26({
        ...{ class: "mb-4" },
        items: ([
            { label: 'Home', to: '/dashboard' },
            { label: 'Projects', to: '/projects' },
            { label: __VLS_ctx.projectStore.current.name },
        ]),
    }, ...__VLS_functionalComponentArgsRest(__VLS_26));
    /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
        ...{ class: "text-2xl font-semibold text-foreground" },
    });
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
    (__VLS_ctx.projectStore.current.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-1 text-sm text-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
    (__VLS_ctx.projectStore.current.description || 'No description');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-6 space-y-4" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex w-full flex-wrap items-center justify-between gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex min-w-0 flex-1 flex-wrap items-center gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    const __VLS_30 = UiSegmentedControl;
    // @ts-ignore
    const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
        modelValue: (__VLS_ctx.projectTaskView),
        ...{ class: "shrink-0" },
        'aria-label': "Tasks view",
        options: (__VLS_ctx.taskViewModeOptions),
    }));
    const __VLS_32 = __VLS_31({
        modelValue: (__VLS_ctx.projectTaskView),
        ...{ class: "shrink-0" },
        'aria-label': "Tasks view",
        options: (__VLS_ctx.taskViewModeOptions),
    }, ...__VLS_functionalComponentArgsRest(__VLS_31));
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "min-w-[8rem] max-w-md flex-1" },
    });
    /** @type {__VLS_StyleScopedClasses['min-w-[8rem]']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    const __VLS_35 = UiInput;
    // @ts-ignore
    const __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({
        id: "project-tasks-search",
        modelValue: (__VLS_ctx.searchQuery),
        placeholder: "Search title or description…",
        autocomplete: "off",
        'aria-label': "Search",
    }));
    const __VLS_37 = __VLS_36({
        id: "project-tasks-search",
        modelValue: (__VLS_ctx.searchQuery),
        placeholder: "Search title or description…",
        autocomplete: "off",
        'aria-label': "Search",
    }, ...__VLS_functionalComponentArgsRest(__VLS_36));
    const __VLS_40 = Button || Button;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
        ...{ 'onClick': {} },
        type: "button",
        variant: "secondary",
        ...{ class: "shrink-0 px-2.5" },
        'aria-expanded': (__VLS_ctx.filtersOpen),
        'aria-controls': "project-task-filters-panel",
    }));
    const __VLS_42 = __VLS_41({
        ...{ 'onClick': {} },
        type: "button",
        variant: "secondary",
        ...{ class: "shrink-0 px-2.5" },
        'aria-expanded': (__VLS_ctx.filtersOpen),
        'aria-controls': "project-task-filters-panel",
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    let __VLS_45;
    const __VLS_46 = ({ click: {} },
        { onClick: (...[$event]) => {
                if (!!(__VLS_ctx.pageLoading))
                    return;
                if (!(__VLS_ctx.projectStore.current))
                    return;
                __VLS_ctx.filtersOpen = !__VLS_ctx.filtersOpen;
                // @ts-ignore
                [projectStore, projectStore, projectStore, projectStore, projectTaskView, taskViewModeOptions, searchQuery, filtersOpen, filtersOpen, filtersOpen,];
            } });
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-2.5']} */ ;
    const { default: __VLS_47 } = __VLS_43.slots;
    let __VLS_48;
    /** @ts-ignore @type {typeof __VLS_components.FunnelIcon} */
    FunnelIcon;
    // @ts-ignore
    const __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({
        ...{ class: "h-4 w-4" },
        'aria-hidden': "true",
    }));
    const __VLS_50 = __VLS_49({
        ...{ class: "h-4 w-4" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_49));
    /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "sr-only" },
    });
    /** @type {__VLS_StyleScopedClasses['sr-only']} */ ;
    // @ts-ignore
    [];
    var __VLS_43;
    var __VLS_44;
    if (__VLS_ctx.canCreateTasks) {
        const __VLS_53 = Button || Button;
        // @ts-ignore
        const __VLS_54 = __VLS_asFunctionalComponent1(__VLS_53, new __VLS_53({
            ...{ 'onClick': {} },
            type: "button",
            ...{ class: "shrink-0" },
            disabled: (!Number.isFinite(__VLS_ctx.id) || __VLS_ctx.id <= 0),
        }));
        const __VLS_55 = __VLS_54({
            ...{ 'onClick': {} },
            type: "button",
            ...{ class: "shrink-0" },
            disabled: (!Number.isFinite(__VLS_ctx.id) || __VLS_ctx.id <= 0),
        }, ...__VLS_functionalComponentArgsRest(__VLS_54));
        let __VLS_58;
        const __VLS_59 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.pageLoading))
                        return;
                    if (!(__VLS_ctx.projectStore.current))
                        return;
                    if (!(__VLS_ctx.canCreateTasks))
                        return;
                    __VLS_ctx.projectTaskView === 'board'
                        ? (__VLS_ctx.showModal = true)
                        : (__VLS_ctx.showTaskComposer = true);
                    // @ts-ignore
                    [projectTaskView, canCreateTasks, id, id, showModal, showTaskComposer,];
                } });
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        const { default: __VLS_60 } = __VLS_56.slots;
        // @ts-ignore
        [];
        var __VLS_56;
        var __VLS_57;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        id: "project-task-filters-panel",
        role: "region",
        'aria-label': "Task filters and sort",
    });
    __VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.filtersOpen) }, null, null);
    const __VLS_61 = TaskFiltersPanel;
    // @ts-ignore
    const __VLS_62 = __VLS_asFunctionalComponent1(__VLS_61, new __VLS_61({
        ...{ 'onReset': {} },
        taskView: (__VLS_ctx.projectTaskView),
        filterProject: (__VLS_ctx.filterProject),
        filterStatus: (__VLS_ctx.filterStatus),
        clientPriority: (__VLS_ctx.clientPriority),
        assigneeFilter: (__VLS_ctx.assigneeFilter),
        sortKey: (__VLS_ctx.sortKey),
        sortDir: (__VLS_ctx.sortDir),
        groupBy: (__VLS_ctx.groupBy),
        projects: (__VLS_ctx.projectOptions),
        assignableUsers: (__VLS_ctx.assignableUsers),
        showAssigneeFilter: (__VLS_ctx.showAssigneeFilter),
        hideProjectFilter: true,
        showViewSwitcher: (false),
    }));
    const __VLS_63 = __VLS_62({
        ...{ 'onReset': {} },
        taskView: (__VLS_ctx.projectTaskView),
        filterProject: (__VLS_ctx.filterProject),
        filterStatus: (__VLS_ctx.filterStatus),
        clientPriority: (__VLS_ctx.clientPriority),
        assigneeFilter: (__VLS_ctx.assigneeFilter),
        sortKey: (__VLS_ctx.sortKey),
        sortDir: (__VLS_ctx.sortDir),
        groupBy: (__VLS_ctx.groupBy),
        projects: (__VLS_ctx.projectOptions),
        assignableUsers: (__VLS_ctx.assignableUsers),
        showAssigneeFilter: (__VLS_ctx.showAssigneeFilter),
        hideProjectFilter: true,
        showViewSwitcher: (false),
    }, ...__VLS_functionalComponentArgsRest(__VLS_62));
    let __VLS_66;
    const __VLS_67 = ({ reset: {} },
        { onReset: (__VLS_ctx.resetTaskFilters) });
    var __VLS_64;
    var __VLS_65;
    if (__VLS_ctx.projectTaskView === 'list') {
        if (__VLS_ctx.canCreateTasks && __VLS_ctx.showTaskComposer) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "overflow-hidden rounded-lg border border-border bg-surface shadow-sm" },
            });
            /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
            /** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "border-b border-border px-3 py-3" },
            });
            /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            const __VLS_68 = TaskInlineComposer;
            // @ts-ignore
            const __VLS_69 = __VLS_asFunctionalComponent1(__VLS_68, new __VLS_68({
                ...{ 'onCreated': {} },
                ...{ 'onDismiss': {} },
                variant: "plain",
                projectId: (__VLS_ctx.id),
                disabled: (!Number.isFinite(__VLS_ctx.id) || __VLS_ctx.id <= 0),
            }));
            const __VLS_70 = __VLS_69({
                ...{ 'onCreated': {} },
                ...{ 'onDismiss': {} },
                variant: "plain",
                projectId: (__VLS_ctx.id),
                disabled: (!Number.isFinite(__VLS_ctx.id) || __VLS_ctx.id <= 0),
            }, ...__VLS_functionalComponentArgsRest(__VLS_69));
            let __VLS_73;
            const __VLS_74 = ({ created: {} },
                { onCreated: (__VLS_ctx.onInlineComposerCreated) });
            const __VLS_75 = ({ dismiss: {} },
                { onDismiss: (...[$event]) => {
                        if (!!(__VLS_ctx.pageLoading))
                            return;
                        if (!(__VLS_ctx.projectStore.current))
                            return;
                        if (!(__VLS_ctx.projectTaskView === 'list'))
                            return;
                        if (!(__VLS_ctx.canCreateTasks && __VLS_ctx.showTaskComposer))
                            return;
                        __VLS_ctx.showTaskComposer = false;
                        // @ts-ignore
                        [projectTaskView, projectTaskView, filtersOpen, canCreateTasks, id, id, id, showTaskComposer, showTaskComposer, filterProject, filterStatus, clientPriority, assigneeFilter, sortKey, sortDir, groupBy, projectOptions, assignableUsers, showAssigneeFilter, resetTaskFilters, onInlineComposerCreated,];
                    } });
            var __VLS_71;
            var __VLS_72;
        }
        if (__VLS_ctx.groupBy === 'none') {
            const __VLS_76 = TaskList;
            // @ts-ignore
            const __VLS_77 = __VLS_asFunctionalComponent1(__VLS_76, new __VLS_76({
                ...{ 'onComplete': {} },
                ...{ 'onReopen': {} },
                ...{ 'onInfo': {} },
                ...{ 'onTaskUpdated': {} },
                tasks: (__VLS_ctx.displayFlat),
                canEditTask: (__VLS_ctx.canEditTask),
                projects: (__VLS_ctx.projectOptions),
                assignableUsers: (__VLS_ctx.assignableUsers),
                emptyMessage: (__VLS_ctx.listEmptyMessage),
            }));
            const __VLS_78 = __VLS_77({
                ...{ 'onComplete': {} },
                ...{ 'onReopen': {} },
                ...{ 'onInfo': {} },
                ...{ 'onTaskUpdated': {} },
                tasks: (__VLS_ctx.displayFlat),
                canEditTask: (__VLS_ctx.canEditTask),
                projects: (__VLS_ctx.projectOptions),
                assignableUsers: (__VLS_ctx.assignableUsers),
                emptyMessage: (__VLS_ctx.listEmptyMessage),
            }, ...__VLS_functionalComponentArgsRest(__VLS_77));
            let __VLS_81;
            const __VLS_82 = ({ complete: {} },
                { onComplete: (__VLS_ctx.onComplete) });
            const __VLS_83 = ({ reopen: {} },
                { onReopen: (__VLS_ctx.onReopen) });
            const __VLS_84 = ({ info: {} },
                { onInfo: (__VLS_ctx.openTaskDetail) });
            const __VLS_85 = ({ taskUpdated: {} },
                { onTaskUpdated: (__VLS_ctx.refreshProjectTasks) });
            var __VLS_79;
            var __VLS_80;
        }
        else if (!__VLS_ctx.displayFlat.length) {
            const __VLS_86 = TaskList;
            // @ts-ignore
            const __VLS_87 = __VLS_asFunctionalComponent1(__VLS_86, new __VLS_86({
                ...{ 'onComplete': {} },
                ...{ 'onReopen': {} },
                ...{ 'onInfo': {} },
                ...{ 'onTaskUpdated': {} },
                tasks: ([]),
                canEditTask: (__VLS_ctx.canEditTask),
                projects: (__VLS_ctx.projectOptions),
                assignableUsers: (__VLS_ctx.assignableUsers),
                emptyMessage: (__VLS_ctx.listEmptyMessage),
            }));
            const __VLS_88 = __VLS_87({
                ...{ 'onComplete': {} },
                ...{ 'onReopen': {} },
                ...{ 'onInfo': {} },
                ...{ 'onTaskUpdated': {} },
                tasks: ([]),
                canEditTask: (__VLS_ctx.canEditTask),
                projects: (__VLS_ctx.projectOptions),
                assignableUsers: (__VLS_ctx.assignableUsers),
                emptyMessage: (__VLS_ctx.listEmptyMessage),
            }, ...__VLS_functionalComponentArgsRest(__VLS_87));
            let __VLS_91;
            const __VLS_92 = ({ complete: {} },
                { onComplete: (__VLS_ctx.onComplete) });
            const __VLS_93 = ({ reopen: {} },
                { onReopen: (__VLS_ctx.onReopen) });
            const __VLS_94 = ({ info: {} },
                { onInfo: (__VLS_ctx.openTaskDetail) });
            const __VLS_95 = ({ taskUpdated: {} },
                { onTaskUpdated: (__VLS_ctx.refreshProjectTasks) });
            var __VLS_89;
            var __VLS_90;
        }
        else {
            for (const [g] of __VLS_vFor((__VLS_ctx.displayGroups))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: (g.key),
                    ...{ class: "space-y-2" },
                });
                /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
                    ...{ class: "text-sm font-semibold text-foreground" },
                });
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
                (g.label);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "font-normal text-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['font-normal']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
                (g.tasks.length);
                const __VLS_96 = TaskList;
                // @ts-ignore
                const __VLS_97 = __VLS_asFunctionalComponent1(__VLS_96, new __VLS_96({
                    ...{ 'onComplete': {} },
                    ...{ 'onReopen': {} },
                    ...{ 'onInfo': {} },
                    ...{ 'onTaskUpdated': {} },
                    tasks: (g.tasks),
                    canEditTask: (__VLS_ctx.canEditTask),
                    projects: (__VLS_ctx.projectOptions),
                    assignableUsers: (__VLS_ctx.assignableUsers),
                    emptyMessage: "No tasks in this group.",
                }));
                const __VLS_98 = __VLS_97({
                    ...{ 'onComplete': {} },
                    ...{ 'onReopen': {} },
                    ...{ 'onInfo': {} },
                    ...{ 'onTaskUpdated': {} },
                    tasks: (g.tasks),
                    canEditTask: (__VLS_ctx.canEditTask),
                    projects: (__VLS_ctx.projectOptions),
                    assignableUsers: (__VLS_ctx.assignableUsers),
                    emptyMessage: "No tasks in this group.",
                }, ...__VLS_functionalComponentArgsRest(__VLS_97));
                let __VLS_101;
                const __VLS_102 = ({ complete: {} },
                    { onComplete: (__VLS_ctx.onComplete) });
                const __VLS_103 = ({ reopen: {} },
                    { onReopen: (__VLS_ctx.onReopen) });
                const __VLS_104 = ({ info: {} },
                    { onInfo: (__VLS_ctx.openTaskDetail) });
                const __VLS_105 = ({ taskUpdated: {} },
                    { onTaskUpdated: (__VLS_ctx.refreshProjectTasks) });
                var __VLS_99;
                var __VLS_100;
                // @ts-ignore
                [groupBy, projectOptions, projectOptions, projectOptions, assignableUsers, assignableUsers, assignableUsers, displayFlat, displayFlat, canEditTask, canEditTask, canEditTask, listEmptyMessage, listEmptyMessage, onComplete, onComplete, onComplete, onReopen, onReopen, onReopen, openTaskDetail, openTaskDetail, openTaskDetail, refreshProjectTasks, refreshProjectTasks, refreshProjectTasks, displayGroups,];
            }
        }
    }
    else {
        if (!__VLS_ctx.displayFlat.length && __VLS_ctx.projectStore.tasks.length > 0) {
            const __VLS_106 = EmptyState || EmptyState;
            // @ts-ignore
            const __VLS_107 = __VLS_asFunctionalComponent1(__VLS_106, new __VLS_106({
                ...{ class: "mt-6" },
                title: "No tasks match filters",
                description: "Try clearing search or filters, or reset.",
            }));
            const __VLS_108 = __VLS_107({
                ...{ class: "mt-6" },
                title: "No tasks match filters",
                description: "Try clearing search or filters, or reset.",
            }, ...__VLS_functionalComponentArgsRest(__VLS_107));
            /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
            const { default: __VLS_111 } = __VLS_109.slots;
            const __VLS_112 = Button || Button;
            // @ts-ignore
            const __VLS_113 = __VLS_asFunctionalComponent1(__VLS_112, new __VLS_112({
                ...{ 'onClick': {} },
                variant: "secondary",
                type: "button",
            }));
            const __VLS_114 = __VLS_113({
                ...{ 'onClick': {} },
                variant: "secondary",
                type: "button",
            }, ...__VLS_functionalComponentArgsRest(__VLS_113));
            let __VLS_117;
            const __VLS_118 = ({ click: {} },
                { onClick: (__VLS_ctx.resetTaskFilters) });
            const { default: __VLS_119 } = __VLS_115.slots;
            // @ts-ignore
            [projectStore, resetTaskFilters, displayFlat,];
            var __VLS_115;
            var __VLS_116;
            // @ts-ignore
            [];
            var __VLS_109;
        }
        else if (!__VLS_ctx.displayFlat.length) {
            const __VLS_120 = EmptyState || EmptyState;
            // @ts-ignore
            const __VLS_121 = __VLS_asFunctionalComponent1(__VLS_120, new __VLS_120({
                ...{ class: "mt-6" },
                title: "No tasks yet",
                description: (__VLS_ctx.canCreateTasks
                    ? 'Create a task to see it on the board.'
                    : 'No tasks in this project yet.'),
            }));
            const __VLS_122 = __VLS_121({
                ...{ class: "mt-6" },
                title: "No tasks yet",
                description: (__VLS_ctx.canCreateTasks
                    ? 'Create a task to see it on the board.'
                    : 'No tasks in this project yet.'),
            }, ...__VLS_functionalComponentArgsRest(__VLS_121));
            /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
            const { default: __VLS_125 } = __VLS_123.slots;
            if (__VLS_ctx.canCreateTasks) {
                const __VLS_126 = Button || Button;
                // @ts-ignore
                const __VLS_127 = __VLS_asFunctionalComponent1(__VLS_126, new __VLS_126({
                    ...{ 'onClick': {} },
                    type: "button",
                    disabled: (!Number.isFinite(__VLS_ctx.id) || __VLS_ctx.id <= 0),
                }));
                const __VLS_128 = __VLS_127({
                    ...{ 'onClick': {} },
                    type: "button",
                    disabled: (!Number.isFinite(__VLS_ctx.id) || __VLS_ctx.id <= 0),
                }, ...__VLS_functionalComponentArgsRest(__VLS_127));
                let __VLS_131;
                const __VLS_132 = ({ click: {} },
                    { onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.pageLoading))
                                return;
                            if (!(__VLS_ctx.projectStore.current))
                                return;
                            if (!!(__VLS_ctx.projectTaskView === 'list'))
                                return;
                            if (!!(!__VLS_ctx.displayFlat.length && __VLS_ctx.projectStore.tasks.length > 0))
                                return;
                            if (!(!__VLS_ctx.displayFlat.length))
                                return;
                            if (!(__VLS_ctx.canCreateTasks))
                                return;
                            __VLS_ctx.showModal = true;
                            // @ts-ignore
                            [canCreateTasks, canCreateTasks, id, id, showModal, displayFlat,];
                        } });
                const { default: __VLS_133 } = __VLS_129.slots;
                // @ts-ignore
                [];
                var __VLS_129;
                var __VLS_130;
            }
            // @ts-ignore
            [];
            var __VLS_123;
        }
        else {
            const __VLS_134 = TaskKanban;
            // @ts-ignore
            const __VLS_135 = __VLS_asFunctionalComponent1(__VLS_134, new __VLS_134({
                ...{ 'onChanged': {} },
                ...{ class: "mt-6" },
                tasks: (__VLS_ctx.displayFlat),
            }));
            const __VLS_136 = __VLS_135({
                ...{ 'onChanged': {} },
                ...{ class: "mt-6" },
                tasks: (__VLS_ctx.displayFlat),
            }, ...__VLS_functionalComponentArgsRest(__VLS_135));
            let __VLS_139;
            const __VLS_140 = ({ changed: {} },
                { onChanged: (__VLS_ctx.refreshProjectTasks) });
            /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
            var __VLS_137;
            var __VLS_138;
        }
    }
    const __VLS_141 = TaskDetailModal;
    // @ts-ignore
    const __VLS_142 = __VLS_asFunctionalComponent1(__VLS_141, new __VLS_141({
        ...{ 'onSaved': {} },
        modelValue: (__VLS_ctx.detailOpen),
        taskId: (__VLS_ctx.detailTaskId),
    }));
    const __VLS_143 = __VLS_142({
        ...{ 'onSaved': {} },
        modelValue: (__VLS_ctx.detailOpen),
        taskId: (__VLS_ctx.detailTaskId),
    }, ...__VLS_functionalComponentArgsRest(__VLS_142));
    let __VLS_146;
    const __VLS_147 = ({ saved: {} },
        { onSaved: (__VLS_ctx.refreshProjectTasks) });
    var __VLS_144;
    var __VLS_145;
    if (__VLS_ctx.canCreateTasks) {
        const __VLS_148 = Modal || Modal;
        // @ts-ignore
        const __VLS_149 = __VLS_asFunctionalComponent1(__VLS_148, new __VLS_148({
            modelValue: (__VLS_ctx.showModal),
            title: "New task",
        }));
        const __VLS_150 = __VLS_149({
            modelValue: (__VLS_ctx.showModal),
            title: "New task",
        }, ...__VLS_functionalComponentArgsRest(__VLS_149));
        const { default: __VLS_153 } = __VLS_151.slots;
        const __VLS_154 = TaskForm;
        // @ts-ignore
        const __VLS_155 = __VLS_asFunctionalComponent1(__VLS_154, new __VLS_154({
            ...{ 'onSubmit': {} },
            ...{ 'onCancel': {} },
            title: (__VLS_ctx.modalTitle),
            description: (__VLS_ctx.modalDescription),
            projectId: (__VLS_ctx.modalProjectId),
            status: (__VLS_ctx.modalStatus),
            priority: (__VLS_ctx.modalPriority),
            hideProjectSelect: true,
            projects: (__VLS_ctx.projectOptions),
            loading: (__VLS_ctx.modalSaving),
            submitLabel: "Create",
        }));
        const __VLS_156 = __VLS_155({
            ...{ 'onSubmit': {} },
            ...{ 'onCancel': {} },
            title: (__VLS_ctx.modalTitle),
            description: (__VLS_ctx.modalDescription),
            projectId: (__VLS_ctx.modalProjectId),
            status: (__VLS_ctx.modalStatus),
            priority: (__VLS_ctx.modalPriority),
            hideProjectSelect: true,
            projects: (__VLS_ctx.projectOptions),
            loading: (__VLS_ctx.modalSaving),
            submitLabel: "Create",
        }, ...__VLS_functionalComponentArgsRest(__VLS_155));
        let __VLS_159;
        const __VLS_160 = ({ submit: {} },
            { onSubmit: (__VLS_ctx.createTaskFromModal) });
        const __VLS_161 = ({ cancel: {} },
            { onCancel: (...[$event]) => {
                    if (!!(__VLS_ctx.pageLoading))
                        return;
                    if (!(__VLS_ctx.projectStore.current))
                        return;
                    if (!(__VLS_ctx.canCreateTasks))
                        return;
                    __VLS_ctx.showModal = false;
                    // @ts-ignore
                    [canCreateTasks, showModal, showModal, projectOptions, displayFlat, refreshProjectTasks, refreshProjectTasks, detailOpen, detailTaskId, modalTitle, modalDescription, modalProjectId, modalStatus, modalPriority, modalSaving, createTaskFromModal,];
                } });
        var __VLS_157;
        var __VLS_158;
        // @ts-ignore
        [];
        var __VLS_151;
    }
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
