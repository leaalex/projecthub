/// <reference types="../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Breadcrumb from '../components/ui/UiBreadcrumb.vue';
import { FunnelIcon } from '@heroicons/vue/24/outline';
import Button from '../components/ui/UiButton.vue';
import EmptyState from '../components/ui/UiEmptyState.vue';
import UiInput from '../components/ui/UiInput.vue';
import Skeleton from '../components/ui/UiSkeleton.vue';
import Modal from '../components/ui/UiModal.vue';
import TaskDetailModal from '../components/tasks/TaskDetailModal.vue';
import TaskFiltersPanel from '../components/tasks/TaskFiltersPanel.vue';
import UiSegmentedControl from '../components/ui/UiSegmentedControl.vue';
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
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const taskStore = useTaskStore();
const projectStore = useProjectStore();
const canCreateTasks = computed(() => auth.user?.role !== 'user');
const toast = useToast();
const { canEditTask } = useTaskEditPermission();
const { assignableUsers } = useAdminAssignableUsers();
const filterProject = ref('');
const filterStatus = ref([]);
const searchQuery = ref('');
const clientPriority = ref([]);
const assigneeFilter = ref([]);
const sortKey = ref('updated_at');
const sortDir = ref('desc');
const groupBy = ref('none');
const filtersOpen = ref(false);
const validStatuses = ['todo', 'in_progress', 'review', 'done'];
function syncFiltersFromRoute() {
    const pid = route.query.project_id;
    const st = route.query.status;
    if (pid != null && pid !== '') {
        const n = Number(pid);
        filterProject.value = Number.isFinite(n) ? n : '';
    }
    else {
        filterProject.value = '';
    }
    if (typeof st === 'string' && validStatuses.includes(st)) {
        filterStatus.value = [st];
    }
    else {
        filterStatus.value = [];
    }
}
const showModal = ref(false);
const title = ref('');
const description = ref('');
const projectId = ref(0);
const status = ref('todo');
const priority = ref('medium');
const saving = ref(false);
const taskView = ref('list');
const taskViewModeOptions = [
    { value: 'list', label: 'List' },
    { value: 'board', label: 'Board' },
];
const allowServerFilterWatch = ref(false);
const detailOpen = ref(false);
const detailTaskId = ref(null);
/** List view: inline create form toggled by "New task". */
const showListComposer = ref(false);
const inlineComposerProjectId = computed(() => {
    if (filterProject.value === '')
        return undefined;
    const n = Number(filterProject.value);
    return Number.isFinite(n) && n > 0 ? n : undefined;
});
const inlineComposerProjects = computed(() => projectStore.projects.map((p) => ({ id: p.id, name: p.name })));
const showAssigneeFilter = computed(() => assignableUsers.value.length > 0);
const presentation = computed(() => presentTasks(taskStore.tasks, {
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
const listEmptyMessage = computed(() => taskStore.tasks.length > 0 && displayFlat.value.length === 0
    ? 'No tasks match your search or filters. Adjust the toolbar or reset.'
    : 'No tasks match these filters. Add a task above or adjust filters.');
function openTaskDetail(taskId) {
    detailTaskId.value = taskId;
    detailOpen.value = true;
}
watch(detailOpen, (open) => {
    if (!open)
        detailTaskId.value = null;
});
onMounted(async () => {
    await projectStore.fetchList().catch(() => { });
    syncFiltersFromRoute();
    await load();
    allowServerFilterWatch.value = true;
});
watch(() => route.query, () => {
    syncFiltersFromRoute();
});
watch([filterProject, filterStatus], async () => {
    if (!allowServerFilterWatch.value)
        return;
    await load();
}, { deep: true });
watch(taskView, (v) => {
    if (v === 'board')
        showListComposer.value = false;
});
watch(showModal, (open) => {
    if (!open)
        return;
    const filtered = Number(filterProject.value);
    if (filterProject.value !== '' && Number.isFinite(filtered) && filtered > 0) {
        projectId.value = filtered;
        return;
    }
    const first = projectStore.projects[0];
    if (first)
        projectId.value = first.id;
});
async function load() {
    const params = {};
    if (filterProject.value !== '')
        params.project_id = Number(filterProject.value);
    if (filterStatus.value.length === 1)
        params.status = filterStatus.value[0];
    await taskStore.fetchList(params);
}
async function onListComposerCreated() {
    await load();
    showListComposer.value = false;
}
function resetToolbar() {
    filtersOpen.value = false;
    searchQuery.value = '';
    clientPriority.value = [];
    assigneeFilter.value = [];
    sortKey.value = 'updated_at';
    sortDir.value = 'desc';
    groupBy.value = 'none';
    filterProject.value = '';
    filterStatus.value = [];
    router.replace({ path: route.path, query: {} });
}
async function createTask() {
    const pid = Math.trunc(Number(projectId.value));
    const t = title.value.trim();
    if (!t) {
        toast.error('Enter a task title');
        return;
    }
    if (!pid) {
        toast.error('Select a project');
        return;
    }
    saving.value = true;
    try {
        await taskStore.create({
            title: t,
            description: description.value.trim(),
            project_id: pid,
            status: status.value,
            priority: priority.value,
        });
        showModal.value = false;
        title.value = '';
        description.value = '';
        projectId.value = projectStore.projects[0]?.id ?? 0;
        await load();
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
async function onComplete(id) {
    await taskStore.complete(id);
    await load();
}
async function onReopen(id) {
    try {
        await taskStore.update(id, { status: 'todo' });
        await load();
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
const __VLS_0 = Breadcrumb;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ class: "mb-4" },
    items: ([
        { label: 'Home', to: '/dashboard' },
        { label: 'Tasks' },
    ]),
}));
const __VLS_2 = __VLS_1({
    ...{ class: "mb-4" },
    items: ([
        { label: 'Home', to: '/dashboard' },
        { label: 'Tasks' },
    ]),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "min-w-0" },
});
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
    ...{ class: "text-2xl font-semibold text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "mt-1 text-sm text-muted" },
});
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
(__VLS_ctx.auth.user?.role === 'admin' || __VLS_ctx.auth.user?.role === 'staff'
    ? 'All tasks in the workspace'
    : 'Tasks in your projects or assigned to you');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mt-6 flex w-full flex-wrap items-center justify-between gap-2" },
});
/** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
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
const __VLS_5 = UiSegmentedControl;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
    modelValue: (__VLS_ctx.taskView),
    ...{ class: "shrink-0" },
    'aria-label': "Tasks view",
    options: (__VLS_ctx.taskViewModeOptions),
}));
const __VLS_7 = __VLS_6({
    modelValue: (__VLS_ctx.taskView),
    ...{ class: "shrink-0" },
    'aria-label': "Tasks view",
    options: (__VLS_ctx.taskViewModeOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "min-w-[8rem] max-w-md flex-1" },
});
/** @type {__VLS_StyleScopedClasses['min-w-[8rem]']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
const __VLS_10 = UiInput;
// @ts-ignore
const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
    id: "tasks-search",
    modelValue: (__VLS_ctx.searchQuery),
    placeholder: "Search title or description…",
    autocomplete: "off",
    'aria-label': "Search",
}));
const __VLS_12 = __VLS_11({
    id: "tasks-search",
    modelValue: (__VLS_ctx.searchQuery),
    placeholder: "Search title or description…",
    autocomplete: "off",
    'aria-label': "Search",
}, ...__VLS_functionalComponentArgsRest(__VLS_11));
const __VLS_15 = Button || Button;
// @ts-ignore
const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
    ...{ 'onClick': {} },
    type: "button",
    variant: "secondary",
    ...{ class: "shrink-0 px-2.5" },
    'aria-expanded': (__VLS_ctx.filtersOpen),
    'aria-controls': "task-filters-panel",
}));
const __VLS_17 = __VLS_16({
    ...{ 'onClick': {} },
    type: "button",
    variant: "secondary",
    ...{ class: "shrink-0 px-2.5" },
    'aria-expanded': (__VLS_ctx.filtersOpen),
    'aria-controls': "task-filters-panel",
}, ...__VLS_functionalComponentArgsRest(__VLS_16));
let __VLS_20;
const __VLS_21 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.filtersOpen = !__VLS_ctx.filtersOpen;
            // @ts-ignore
            [auth, auth, taskView, taskViewModeOptions, searchQuery, filtersOpen, filtersOpen, filtersOpen,];
        } });
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2.5']} */ ;
const { default: __VLS_22 } = __VLS_18.slots;
let __VLS_23;
/** @ts-ignore @type {typeof __VLS_components.FunnelIcon} */
FunnelIcon;
// @ts-ignore
const __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
    ...{ class: "h-4 w-4" },
    'aria-hidden': "true",
}));
const __VLS_25 = __VLS_24({
    ...{ class: "h-4 w-4" },
    'aria-hidden': "true",
}, ...__VLS_functionalComponentArgsRest(__VLS_24));
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "sr-only" },
});
/** @type {__VLS_StyleScopedClasses['sr-only']} */ ;
// @ts-ignore
[];
var __VLS_18;
var __VLS_19;
if (__VLS_ctx.canCreateTasks) {
    const __VLS_28 = Button || Button;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28({
        ...{ 'onClick': {} },
        ...{ class: "shrink-0" },
        disabled: (!__VLS_ctx.projectStore.projects.length),
    }));
    const __VLS_30 = __VLS_29({
        ...{ 'onClick': {} },
        ...{ class: "shrink-0" },
        disabled: (!__VLS_ctx.projectStore.projects.length),
    }, ...__VLS_functionalComponentArgsRest(__VLS_29));
    let __VLS_33;
    const __VLS_34 = ({ click: {} },
        { onClick: (...[$event]) => {
                if (!(__VLS_ctx.canCreateTasks))
                    return;
                __VLS_ctx.taskView === 'board' ? (__VLS_ctx.showModal = true) : (__VLS_ctx.showListComposer = true);
                // @ts-ignore
                [taskView, canCreateTasks, projectStore, showModal, showListComposer,];
            } });
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    const { default: __VLS_35 } = __VLS_31.slots;
    // @ts-ignore
    [];
    var __VLS_31;
    var __VLS_32;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    id: "task-filters-panel",
    ...{ class: "mt-4" },
    role: "region",
    'aria-label': "Task filters and sort",
});
__VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.filtersOpen) }, null, null);
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
const __VLS_36 = TaskFiltersPanel;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
    ...{ 'onReset': {} },
    taskView: (__VLS_ctx.taskView),
    filterProject: (__VLS_ctx.filterProject),
    filterStatus: (__VLS_ctx.filterStatus),
    clientPriority: (__VLS_ctx.clientPriority),
    assigneeFilter: (__VLS_ctx.assigneeFilter),
    sortKey: (__VLS_ctx.sortKey),
    sortDir: (__VLS_ctx.sortDir),
    groupBy: (__VLS_ctx.groupBy),
    projects: (__VLS_ctx.inlineComposerProjects),
    assignableUsers: (__VLS_ctx.assignableUsers),
    showAssigneeFilter: (__VLS_ctx.showAssigneeFilter),
    showViewSwitcher: (false),
}));
const __VLS_38 = __VLS_37({
    ...{ 'onReset': {} },
    taskView: (__VLS_ctx.taskView),
    filterProject: (__VLS_ctx.filterProject),
    filterStatus: (__VLS_ctx.filterStatus),
    clientPriority: (__VLS_ctx.clientPriority),
    assigneeFilter: (__VLS_ctx.assigneeFilter),
    sortKey: (__VLS_ctx.sortKey),
    sortDir: (__VLS_ctx.sortDir),
    groupBy: (__VLS_ctx.groupBy),
    projects: (__VLS_ctx.inlineComposerProjects),
    assignableUsers: (__VLS_ctx.assignableUsers),
    showAssigneeFilter: (__VLS_ctx.showAssigneeFilter),
    showViewSwitcher: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
let __VLS_41;
const __VLS_42 = ({ reset: {} },
    { onReset: (__VLS_ctx.resetToolbar) });
var __VLS_39;
var __VLS_40;
if (__VLS_ctx.taskStore.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-6 space-y-3" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
    for (const [i] of __VLS_vFor((5))) {
        const __VLS_43 = Skeleton;
        // @ts-ignore
        const __VLS_44 = __VLS_asFunctionalComponent1(__VLS_43, new __VLS_43({
            key: (i),
            variant: "card",
        }));
        const __VLS_45 = __VLS_44({
            key: (i),
            variant: "card",
        }, ...__VLS_functionalComponentArgsRest(__VLS_44));
        // @ts-ignore
        [taskView, filtersOpen, filterProject, filterStatus, clientPriority, assigneeFilter, sortKey, sortDir, groupBy, inlineComposerProjects, assignableUsers, showAssigneeFilter, resetToolbar, taskStore,];
    }
}
else if (__VLS_ctx.taskView === 'list') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-6 space-y-4" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
    if (__VLS_ctx.canCreateTasks && __VLS_ctx.showListComposer) {
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
        const __VLS_48 = TaskInlineComposer;
        // @ts-ignore
        const __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({
            ...{ 'onCreated': {} },
            ...{ 'onDismiss': {} },
            variant: "plain",
            projectId: (__VLS_ctx.inlineComposerProjectId),
            projects: (__VLS_ctx.inlineComposerProjects),
            disabled: (!__VLS_ctx.projectStore.projects.length),
        }));
        const __VLS_50 = __VLS_49({
            ...{ 'onCreated': {} },
            ...{ 'onDismiss': {} },
            variant: "plain",
            projectId: (__VLS_ctx.inlineComposerProjectId),
            projects: (__VLS_ctx.inlineComposerProjects),
            disabled: (!__VLS_ctx.projectStore.projects.length),
        }, ...__VLS_functionalComponentArgsRest(__VLS_49));
        let __VLS_53;
        const __VLS_54 = ({ created: {} },
            { onCreated: (__VLS_ctx.onListComposerCreated) });
        const __VLS_55 = ({ dismiss: {} },
            { onDismiss: (...[$event]) => {
                    if (!!(__VLS_ctx.taskStore.loading))
                        return;
                    if (!(__VLS_ctx.taskView === 'list'))
                        return;
                    if (!(__VLS_ctx.canCreateTasks && __VLS_ctx.showListComposer))
                        return;
                    __VLS_ctx.showListComposer = false;
                    // @ts-ignore
                    [taskView, canCreateTasks, projectStore, showListComposer, showListComposer, inlineComposerProjects, inlineComposerProjectId, onListComposerCreated,];
                } });
        var __VLS_51;
        var __VLS_52;
    }
    if (__VLS_ctx.groupBy === 'none') {
        const __VLS_56 = TaskList;
        // @ts-ignore
        const __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({
            ...{ 'onComplete': {} },
            ...{ 'onReopen': {} },
            ...{ 'onInfo': {} },
            ...{ 'onTaskUpdated': {} },
            tasks: (__VLS_ctx.displayFlat),
            canEditTask: (__VLS_ctx.canEditTask),
            projects: (__VLS_ctx.inlineComposerProjects),
            assignableUsers: (__VLS_ctx.assignableUsers),
            emptyMessage: (__VLS_ctx.listEmptyMessage),
        }));
        const __VLS_58 = __VLS_57({
            ...{ 'onComplete': {} },
            ...{ 'onReopen': {} },
            ...{ 'onInfo': {} },
            ...{ 'onTaskUpdated': {} },
            tasks: (__VLS_ctx.displayFlat),
            canEditTask: (__VLS_ctx.canEditTask),
            projects: (__VLS_ctx.inlineComposerProjects),
            assignableUsers: (__VLS_ctx.assignableUsers),
            emptyMessage: (__VLS_ctx.listEmptyMessage),
        }, ...__VLS_functionalComponentArgsRest(__VLS_57));
        let __VLS_61;
        const __VLS_62 = ({ complete: {} },
            { onComplete: (__VLS_ctx.onComplete) });
        const __VLS_63 = ({ reopen: {} },
            { onReopen: (__VLS_ctx.onReopen) });
        const __VLS_64 = ({ info: {} },
            { onInfo: (__VLS_ctx.openTaskDetail) });
        const __VLS_65 = ({ taskUpdated: {} },
            { onTaskUpdated: (__VLS_ctx.load) });
        var __VLS_59;
        var __VLS_60;
    }
    else if (!__VLS_ctx.displayFlat.length) {
        const __VLS_66 = TaskList;
        // @ts-ignore
        const __VLS_67 = __VLS_asFunctionalComponent1(__VLS_66, new __VLS_66({
            ...{ 'onComplete': {} },
            ...{ 'onReopen': {} },
            ...{ 'onInfo': {} },
            ...{ 'onTaskUpdated': {} },
            tasks: ([]),
            canEditTask: (__VLS_ctx.canEditTask),
            projects: (__VLS_ctx.inlineComposerProjects),
            assignableUsers: (__VLS_ctx.assignableUsers),
            emptyMessage: (__VLS_ctx.listEmptyMessage),
        }));
        const __VLS_68 = __VLS_67({
            ...{ 'onComplete': {} },
            ...{ 'onReopen': {} },
            ...{ 'onInfo': {} },
            ...{ 'onTaskUpdated': {} },
            tasks: ([]),
            canEditTask: (__VLS_ctx.canEditTask),
            projects: (__VLS_ctx.inlineComposerProjects),
            assignableUsers: (__VLS_ctx.assignableUsers),
            emptyMessage: (__VLS_ctx.listEmptyMessage),
        }, ...__VLS_functionalComponentArgsRest(__VLS_67));
        let __VLS_71;
        const __VLS_72 = ({ complete: {} },
            { onComplete: (__VLS_ctx.onComplete) });
        const __VLS_73 = ({ reopen: {} },
            { onReopen: (__VLS_ctx.onReopen) });
        const __VLS_74 = ({ info: {} },
            { onInfo: (__VLS_ctx.openTaskDetail) });
        const __VLS_75 = ({ taskUpdated: {} },
            { onTaskUpdated: (__VLS_ctx.load) });
        var __VLS_69;
        var __VLS_70;
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
            const __VLS_76 = TaskList;
            // @ts-ignore
            const __VLS_77 = __VLS_asFunctionalComponent1(__VLS_76, new __VLS_76({
                ...{ 'onComplete': {} },
                ...{ 'onReopen': {} },
                ...{ 'onInfo': {} },
                ...{ 'onTaskUpdated': {} },
                tasks: (g.tasks),
                canEditTask: (__VLS_ctx.canEditTask),
                projects: (__VLS_ctx.inlineComposerProjects),
                assignableUsers: (__VLS_ctx.assignableUsers),
                emptyMessage: "No tasks in this group.",
            }));
            const __VLS_78 = __VLS_77({
                ...{ 'onComplete': {} },
                ...{ 'onReopen': {} },
                ...{ 'onInfo': {} },
                ...{ 'onTaskUpdated': {} },
                tasks: (g.tasks),
                canEditTask: (__VLS_ctx.canEditTask),
                projects: (__VLS_ctx.inlineComposerProjects),
                assignableUsers: (__VLS_ctx.assignableUsers),
                emptyMessage: "No tasks in this group.",
            }, ...__VLS_functionalComponentArgsRest(__VLS_77));
            let __VLS_81;
            const __VLS_82 = ({ complete: {} },
                { onComplete: (__VLS_ctx.onComplete) });
            const __VLS_83 = ({ reopen: {} },
                { onReopen: (__VLS_ctx.onReopen) });
            const __VLS_84 = ({ info: {} },
                { onInfo: (__VLS_ctx.openTaskDetail) });
            const __VLS_85 = ({ taskUpdated: {} },
                { onTaskUpdated: (__VLS_ctx.load) });
            var __VLS_79;
            var __VLS_80;
            // @ts-ignore
            [groupBy, inlineComposerProjects, inlineComposerProjects, inlineComposerProjects, assignableUsers, assignableUsers, assignableUsers, displayFlat, displayFlat, canEditTask, canEditTask, canEditTask, listEmptyMessage, listEmptyMessage, onComplete, onComplete, onComplete, onReopen, onReopen, onReopen, openTaskDetail, openTaskDetail, openTaskDetail, load, load, load, displayGroups,];
        }
    }
}
else {
    if (!__VLS_ctx.displayFlat.length && __VLS_ctx.taskStore.tasks.length > 0) {
        const __VLS_86 = EmptyState || EmptyState;
        // @ts-ignore
        const __VLS_87 = __VLS_asFunctionalComponent1(__VLS_86, new __VLS_86({
            ...{ class: "mt-6" },
            title: "No tasks match filters",
            description: "Try clearing search, assignee, or priority filters, or reset the toolbar.",
        }));
        const __VLS_88 = __VLS_87({
            ...{ class: "mt-6" },
            title: "No tasks match filters",
            description: "Try clearing search, assignee, or priority filters, or reset the toolbar.",
        }, ...__VLS_functionalComponentArgsRest(__VLS_87));
        /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
        const { default: __VLS_91 } = __VLS_89.slots;
        const __VLS_92 = Button || Button;
        // @ts-ignore
        const __VLS_93 = __VLS_asFunctionalComponent1(__VLS_92, new __VLS_92({
            ...{ 'onClick': {} },
            variant: "secondary",
            type: "button",
        }));
        const __VLS_94 = __VLS_93({
            ...{ 'onClick': {} },
            variant: "secondary",
            type: "button",
        }, ...__VLS_functionalComponentArgsRest(__VLS_93));
        let __VLS_97;
        const __VLS_98 = ({ click: {} },
            { onClick: (__VLS_ctx.resetToolbar) });
        const { default: __VLS_99 } = __VLS_95.slots;
        // @ts-ignore
        [resetToolbar, taskStore, displayFlat,];
        var __VLS_95;
        var __VLS_96;
        // @ts-ignore
        [];
        var __VLS_89;
    }
    else if (!__VLS_ctx.displayFlat.length) {
        const __VLS_100 = EmptyState || EmptyState;
        // @ts-ignore
        const __VLS_101 = __VLS_asFunctionalComponent1(__VLS_100, new __VLS_100({
            ...{ class: "mt-6" },
            title: "No tasks found",
            description: (__VLS_ctx.canCreateTasks
                ? 'Create a task or adjust filters to see more.'
                : 'No tasks yet. You will see tasks when assigned to a project.'),
        }));
        const __VLS_102 = __VLS_101({
            ...{ class: "mt-6" },
            title: "No tasks found",
            description: (__VLS_ctx.canCreateTasks
                ? 'Create a task or adjust filters to see more.'
                : 'No tasks yet. You will see tasks when assigned to a project.'),
        }, ...__VLS_functionalComponentArgsRest(__VLS_101));
        /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
        const { default: __VLS_105 } = __VLS_103.slots;
        if (__VLS_ctx.canCreateTasks) {
            const __VLS_106 = Button || Button;
            // @ts-ignore
            const __VLS_107 = __VLS_asFunctionalComponent1(__VLS_106, new __VLS_106({
                ...{ 'onClick': {} },
                disabled: (!__VLS_ctx.projectStore.projects.length),
            }));
            const __VLS_108 = __VLS_107({
                ...{ 'onClick': {} },
                disabled: (!__VLS_ctx.projectStore.projects.length),
            }, ...__VLS_functionalComponentArgsRest(__VLS_107));
            let __VLS_111;
            const __VLS_112 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.taskStore.loading))
                            return;
                        if (!!(__VLS_ctx.taskView === 'list'))
                            return;
                        if (!!(!__VLS_ctx.displayFlat.length && __VLS_ctx.taskStore.tasks.length > 0))
                            return;
                        if (!(!__VLS_ctx.displayFlat.length))
                            return;
                        if (!(__VLS_ctx.canCreateTasks))
                            return;
                        __VLS_ctx.showModal = true;
                        // @ts-ignore
                        [canCreateTasks, canCreateTasks, projectStore, showModal, displayFlat,];
                    } });
            const { default: __VLS_113 } = __VLS_109.slots;
            // @ts-ignore
            [];
            var __VLS_109;
            var __VLS_110;
        }
        // @ts-ignore
        [];
        var __VLS_103;
    }
    else {
        const __VLS_114 = TaskKanban;
        // @ts-ignore
        const __VLS_115 = __VLS_asFunctionalComponent1(__VLS_114, new __VLS_114({
            ...{ 'onChanged': {} },
            ...{ class: "mt-6" },
            tasks: (__VLS_ctx.displayFlat),
        }));
        const __VLS_116 = __VLS_115({
            ...{ 'onChanged': {} },
            ...{ class: "mt-6" },
            tasks: (__VLS_ctx.displayFlat),
        }, ...__VLS_functionalComponentArgsRest(__VLS_115));
        let __VLS_119;
        const __VLS_120 = ({ changed: {} },
            { onChanged: (__VLS_ctx.load) });
        /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
        var __VLS_117;
        var __VLS_118;
    }
}
if (__VLS_ctx.canCreateTasks) {
    const __VLS_121 = Modal || Modal;
    // @ts-ignore
    const __VLS_122 = __VLS_asFunctionalComponent1(__VLS_121, new __VLS_121({
        modelValue: (__VLS_ctx.showModal),
        title: "New task",
    }));
    const __VLS_123 = __VLS_122({
        modelValue: (__VLS_ctx.showModal),
        title: "New task",
    }, ...__VLS_functionalComponentArgsRest(__VLS_122));
    const { default: __VLS_126 } = __VLS_124.slots;
    const __VLS_127 = TaskForm;
    // @ts-ignore
    const __VLS_128 = __VLS_asFunctionalComponent1(__VLS_127, new __VLS_127({
        ...{ 'onSubmit': {} },
        ...{ 'onCancel': {} },
        title: (__VLS_ctx.title),
        description: (__VLS_ctx.description),
        projectId: (__VLS_ctx.projectId),
        status: (__VLS_ctx.status),
        priority: (__VLS_ctx.priority),
        projects: (__VLS_ctx.projectStore.projects.map((p) => ({ id: p.id, name: p.name }))),
        loading: (__VLS_ctx.saving),
        submitLabel: "Create",
    }));
    const __VLS_129 = __VLS_128({
        ...{ 'onSubmit': {} },
        ...{ 'onCancel': {} },
        title: (__VLS_ctx.title),
        description: (__VLS_ctx.description),
        projectId: (__VLS_ctx.projectId),
        status: (__VLS_ctx.status),
        priority: (__VLS_ctx.priority),
        projects: (__VLS_ctx.projectStore.projects.map((p) => ({ id: p.id, name: p.name }))),
        loading: (__VLS_ctx.saving),
        submitLabel: "Create",
    }, ...__VLS_functionalComponentArgsRest(__VLS_128));
    let __VLS_132;
    const __VLS_133 = ({ submit: {} },
        { onSubmit: (__VLS_ctx.createTask) });
    const __VLS_134 = ({ cancel: {} },
        { onCancel: (...[$event]) => {
                if (!(__VLS_ctx.canCreateTasks))
                    return;
                __VLS_ctx.showModal = false;
                // @ts-ignore
                [canCreateTasks, projectStore, showModal, showModal, displayFlat, load, title, description, projectId, status, priority, saving, createTask,];
            } });
    var __VLS_130;
    var __VLS_131;
    // @ts-ignore
    [];
    var __VLS_124;
}
const __VLS_135 = TaskDetailModal;
// @ts-ignore
const __VLS_136 = __VLS_asFunctionalComponent1(__VLS_135, new __VLS_135({
    ...{ 'onSaved': {} },
    modelValue: (__VLS_ctx.detailOpen),
    taskId: (__VLS_ctx.detailTaskId),
}));
const __VLS_137 = __VLS_136({
    ...{ 'onSaved': {} },
    modelValue: (__VLS_ctx.detailOpen),
    taskId: (__VLS_ctx.detailTaskId),
}, ...__VLS_functionalComponentArgsRest(__VLS_136));
let __VLS_140;
const __VLS_141 = ({ saved: {} },
    { onSaved: (__VLS_ctx.load) });
var __VLS_138;
var __VLS_139;
// @ts-ignore
[load, detailOpen, detailTaskId,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
