/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { CheckIcon } from '@heroicons/vue/24/solid';
import { BoltIcon, ChevronDownIcon, ChevronRightIcon, FolderIcon, InformationCircleIcon, RectangleStackIcon, TagIcon, TrashIcon, UserPlusIcon, } from '@heroicons/vue/24/outline';
import { computed, nextTick, ref, watch } from 'vue';
import { useAuthStore } from '../../stores/auth.store';
import { useTaskStore } from '../../stores/task.store';
import { useConfirm } from '../../composables/useConfirm';
import { useToast } from '../../composables/useToast';
import { timeAgo } from '../../utils/formatters';
import Badge from '../ui/UiBadge.vue';
import Button from '../ui/UiButton.vue';
import UiDateMenuButton from '../ui/UiDateMenuButton.vue';
import UiInput from '../ui/UiInput.vue';
import UiMenuButton from '../ui/UiMenuButton.vue';
import UiTextarea from '../ui/UiTextarea.vue';
import TaskSubtasksPanel from './TaskSubtasksPanel.vue';
const props = withDefaults(defineProps(), {
    canEdit: false,
    projects: () => [],
    assignableUsers: () => [],
});
const emit = defineEmits();
const authStore = useAuthStore();
const taskStore = useTaskStore();
const toast = useToast();
const { confirm } = useConfirm();
const expanded = ref(false);
/** Collapsed row: show subtasks list without opening full editor. */
const subtasksExpanded = ref(false);
const busy = ref(false);
const deleting = ref(false);
/** Quick assignee change from collapsed row (UiMenuButton); avoids opening expanded editor. */
const assigningQuick = ref(false);
const draftTitle = ref('');
const draftDescription = ref('');
const draftStatus = ref('todo');
const draftPriority = ref('medium');
const draftProjectId = ref(0);
const draftDue = ref('');
const draftAssigneeId = ref('');
const titleInputRef = ref(null);
/** Full subtasks editor in expanded card: hidden until + or when task already has subtasks. */
const subtasksBlockVisible = ref(false);
const subtasksPanelRef = ref(null);
/** Исполнитель в правой колонке (колонка скрыта при развёрнутом редактировании). */
const assigneeLabel = computed(() => {
    if (props.task.assignee) {
        return props.task.assignee.name || props.task.assignee.email;
    }
    return 'Unassigned';
});
const assigneeTitle = computed(() => {
    const a = props.task.assignee;
    if (!a?.email)
        return undefined;
    return a.name ? `${a.name} (${a.email})` : a.email;
});
const isAssigneePlaceholder = computed(() => assigneeLabel.value === 'Unassigned');
const subtaskSummary = computed(() => {
    const list = props.task.subtasks ?? [];
    if (list.length === 0)
        return null;
    const done = list.filter((s) => s.done).length;
    return `${done}/${list.length}`;
});
const hasSubtasks = computed(() => (props.task.subtasks?.length ?? 0) > 0);
/** Owner can toggle; assignee can toggle (matches API). */
const canToggleSubtasks = computed(() => {
    if (props.canEdit)
        return true;
    const uid = authStore.user?.id;
    return uid != null && props.task.assignee_id === uid;
});
watch(expanded, (v) => {
    if (v) {
        subtasksExpanded.value = false;
        subtasksBlockVisible.value = (props.task.subtasks?.length ?? 0) > 0;
    }
});
function dueFromTask(iso) {
    if (!iso)
        return '';
    return iso.slice(0, 10);
}
function syncDraftsFromTask() {
    const t = props.task;
    draftTitle.value = t.title;
    draftDescription.value = t.description ?? '';
    draftStatus.value = t.status;
    draftPriority.value = t.priority;
    draftProjectId.value = t.project_id;
    draftDue.value = dueFromTask(t.due_date);
    draftAssigneeId.value = t.assignee_id ?? '';
}
watch(() => props.task, () => {
    if (!expanded.value)
        syncDraftsFromTask();
}, { deep: true });
function openExpanded() {
    if (!props.canEdit)
        return;
    syncDraftsFromTask();
    expanded.value = true;
    subtasksBlockVisible.value = (props.task.subtasks?.length ?? 0) > 0;
    nextTick(() => titleInputRef.value?.focus());
}
function revealSubtasksAndFocus() {
    subtasksBlockVisible.value = true;
    nextTick(() => subtasksPanelRef.value?.focusNewInput());
}
function onBodyClick() {
    if (!props.canEdit || expanded.value)
        return;
    openExpanded();
}
/** Закрыть без сохранения. */
function collapseExpanded() {
    expanded.value = false;
    syncDraftsFromTask();
}
async function requestDelete() {
    if (!props.canEdit || deleting.value)
        return;
    const t = props.task;
    const ok = await confirm({
        title: 'Delete task',
        message: `Remove “${t.title}”? This cannot be undone.`,
        confirmLabel: 'Delete',
        danger: true,
    });
    if (!ok)
        return;
    deleting.value = true;
    try {
        await taskStore.remove(t.id);
        toast.success('Task deleted');
        collapseExpanded();
        emit('updated');
    }
    catch {
        toast.error('Could not delete task');
    }
    finally {
        deleting.value = false;
    }
}
function onInlineEscape(e) {
    if (e.key !== 'Escape')
        return;
    e.preventDefault();
    collapseExpanded();
}
/** Сохранить изменения одной кнопкой Done. */
async function saveAndCollapse() {
    const t = props.task;
    const title = draftTitle.value.trim();
    if (!title) {
        toast.error('Enter a task title');
        return;
    }
    const desc = draftDescription.value.trim();
    const descPrev = (t.description ?? '').trim();
    const pid = Number(draftProjectId.value);
    const due = draftDue.value.trim();
    const duePrev = dueFromTask(t.due_date);
    const rawAssignee = draftAssigneeId.value;
    const nextAssignee = rawAssignee === '' ? 0 : Number(rawAssignee);
    const prevAssignee = t.assignee_id ?? 0;
    const patch = {};
    if (title !== t.title)
        patch.title = title;
    if (desc !== descPrev)
        patch.description = desc;
    if (draftStatus.value !== t.status)
        patch.status = draftStatus.value;
    if (draftPriority.value !== t.priority)
        patch.priority = draftPriority.value;
    if (pid && pid !== t.project_id)
        patch.project_id = pid;
    if (due !== duePrev)
        patch.due_date = due;
    const assigneeChanged = nextAssignee !== prevAssignee;
    const hasPatch = Object.keys(patch).length > 0;
    if (!hasPatch && !assigneeChanged) {
        expanded.value = false;
        syncDraftsFromTask();
        return;
    }
    busy.value = true;
    try {
        if (hasPatch) {
            await taskStore.update(t.id, patch);
        }
        if (assigneeChanged) {
            await taskStore.assign(t.id, nextAssignee);
        }
        emit('updated');
        expanded.value = false;
        syncDraftsFromTask();
    }
    catch (e) {
        const err = e;
        const msg = err.response?.data?.error;
        toast.error(typeof msg === 'string' ? msg : 'Could not update task');
        syncDraftsFromTask();
    }
    finally {
        busy.value = false;
    }
}
function onTitleKeydown(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
    }
    onInlineEscape(e);
}
const showProjectPicker = () => props.projects.length > 0;
const showAssigneePicker = () => props.assignableUsers.length > 0;
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
const projectSelectOptions = computed(() => props.projects.map((p) => ({ value: p.id, label: p.name })));
const assigneeSelectOptions = computed(() => [
    { value: '', label: 'Unassigned' },
    ...props.assignableUsers.map((u) => ({
        value: u.id,
        label: u.name || u.email,
    })),
]);
const draftStatusMenuLabel = computed(() => STATUS_OPTIONS.find((o) => o.value === draftStatus.value)?.label ?? '');
const draftPriorityMenuLabel = computed(() => PRIORITY_OPTIONS.find((o) => o.value === draftPriority.value)?.label ?? '');
const draftProjectMenuLabel = computed(() => projectSelectOptions.value.find((o) => o.value === draftProjectId.value)
    ?.label ?? '');
const draftAssigneeMenuLabel = computed(() => {
    const v = draftAssigneeId.value;
    const key = v === '' ? '' : v;
    return (assigneeSelectOptions.value.find((o) => o.value === key)?.label ?? '');
});
function setDraftAssigneeFromMenu(v) {
    draftAssigneeId.value = v === '' ? '' : Number(v);
}
async function onAssigneeMenuSelect(v) {
    if (!props.canEdit || assigningQuick.value)
        return;
    const next = v === '' ? 0 : Number(v);
    const prev = props.task.assignee_id ?? 0;
    if (next === prev)
        return;
    assigningQuick.value = true;
    try {
        await taskStore.assign(props.task.id, next);
        emit('updated');
        toast.success('Assignee updated');
    }
    catch (e) {
        const err = e;
        const msg = err.response?.data?.error;
        toast.error(typeof msg === 'string' ? msg : 'Could not update assignee');
    }
    finally {
        assigningQuick.value = false;
    }
}
const __VLS_defaults = {
    canEdit: false,
    projects: () => [],
    assignableUsers: () => [],
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-stretch gap-2.5 py-2" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-stretch']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex shrink-0 flex-col self-start pt-0.5" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['self-start']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-0.5']} */ ;
if (__VLS_ctx.task.status !== 'done') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.task.status !== 'done'))
                    return;
                __VLS_ctx.emit('complete', __VLS_ctx.task.id);
                // @ts-ignore
                [task, task, emit,];
            } },
        type: "button",
        ...{ class: "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/45 transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" },
        'aria-label': "Mark done",
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-muted-foreground/45']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:border-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-primary/5']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:ring-ring']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.task.status !== 'done'))
                    return;
                __VLS_ctx.emit('reopen', __VLS_ctx.task.id);
                // @ts-ignore
                [task, emit,];
            } },
        type: "button",
        ...{ class: "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-emerald-500" },
        'aria-label': "Mark as not done",
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-emerald-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:opacity-80']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:ring-ring']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-emerald-500']} */ ;
    let __VLS_0;
    /** @ts-ignore @type {typeof __VLS_components.CheckIcon} */
    CheckIcon;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        ...{ class: "h-3 w-3 text-white" },
        'aria-hidden': "true",
    }));
    const __VLS_2 = __VLS_1({
        ...{ class: "h-3 w-3 text-white" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onClick: (__VLS_ctx.onBodyClick) },
    ...{ class: "min-w-0 flex-1" },
    ...{ class: (__VLS_ctx.canEdit && !__VLS_ctx.expanded && 'cursor-pointer rounded-md transition-colors hover:bg-surface-muted/60') },
});
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
if (!__VLS_ctx.expanded) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
        ...{ class: "min-w-0 flex-1 truncate text-sm font-medium text-foreground" },
        ...{ class: (__VLS_ctx.task.status === 'done' && 'text-muted line-through') },
    });
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
    (__VLS_ctx.task.title);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "flex shrink-0 items-center gap-1" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    const __VLS_5 = Badge;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
        kind: "status",
        value: (__VLS_ctx.task.status),
    }));
    const __VLS_7 = __VLS_6({
        kind: "status",
        value: (__VLS_ctx.task.status),
    }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    const __VLS_10 = Badge;
    // @ts-ignore
    const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
        kind: "priority",
        value: (__VLS_ctx.task.priority),
    }));
    const __VLS_12 = __VLS_11({
        kind: "priority",
        value: (__VLS_ctx.task.priority),
    }, ...__VLS_functionalComponentArgsRest(__VLS_11));
    if (__VLS_ctx.task.description) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "mt-1 line-clamp-1 text-xs text-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['line-clamp-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        (__VLS_ctx.task.description);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0 text-xs text-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-x-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-y-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "shrink-0" },
    });
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    (__VLS_ctx.task.project?.name ?? `Project #${__VLS_ctx.task.project_id}`);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "shrink-0" },
    });
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "shrink-0" },
    });
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    (__VLS_ctx.timeAgo(__VLS_ctx.task.updated_at));
    if (__VLS_ctx.task.due_date) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "shrink-0" },
        });
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "shrink-0" },
        });
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        (__VLS_ctx.dueFromTask(__VLS_ctx.task.due_date));
    }
    if (__VLS_ctx.hasSubtasks && __VLS_ctx.subtaskSummary) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.expanded))
                        return;
                    if (!(__VLS_ctx.hasSubtasks && __VLS_ctx.subtaskSummary))
                        return;
                    __VLS_ctx.subtasksExpanded = !__VLS_ctx.subtasksExpanded;
                    // @ts-ignore
                    [task, task, task, task, task, task, task, task, task, task, task, onBodyClick, canEdit, expanded, expanded, timeAgo, dueFromTask, hasSubtasks, subtaskSummary, subtasksExpanded, subtasksExpanded,];
                } },
            type: "button",
            ...{ class: "mt-1 flex w-full min-w-0 items-center gap-1 rounded-md py-0.5 text-left text-xs text-muted transition-colors hover:bg-surface-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" },
            'aria-expanded': (__VLS_ctx.subtasksExpanded),
            'aria-controls': (`task-subtasks-${__VLS_ctx.task.id}`),
        });
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-surface-muted/50']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-foreground']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-none']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:ring-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:ring-ring']} */ ;
        if (!__VLS_ctx.subtasksExpanded) {
            let __VLS_15;
            /** @ts-ignore @type {typeof __VLS_components.ChevronRightIcon} */
            ChevronRightIcon;
            // @ts-ignore
            const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
                ...{ class: "h-3.5 w-3.5 shrink-0" },
                'aria-hidden': "true",
            }));
            const __VLS_17 = __VLS_16({
                ...{ class: "h-3.5 w-3.5 shrink-0" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_16));
            /** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        }
        else {
            let __VLS_20;
            /** @ts-ignore @type {typeof __VLS_components.ChevronDownIcon} */
            ChevronDownIcon;
            // @ts-ignore
            const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
                ...{ class: "h-3.5 w-3.5 shrink-0" },
                'aria-hidden': "true",
            }));
            const __VLS_22 = __VLS_21({
                ...{ class: "h-3.5 w-3.5 shrink-0" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_21));
            /** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "min-w-0" },
        });
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "font-medium text-foreground" },
        });
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
        (__VLS_ctx.subtaskSummary);
    }
    if (__VLS_ctx.subtasksExpanded && __VLS_ctx.hasSubtasks) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onClick: () => { } },
            id: (`task-subtasks-${__VLS_ctx.task.id}`),
            ...{ class: "mt-1.5" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-1.5']} */ ;
        const __VLS_25 = TaskSubtasksPanel;
        // @ts-ignore
        const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
            ...{ 'onUpdated': {} },
            task: (__VLS_ctx.task),
            compact: true,
            hideHeading: true,
            allowToggle: (__VLS_ctx.canToggleSubtasks),
            allowRename: (__VLS_ctx.canEdit),
        }));
        const __VLS_27 = __VLS_26({
            ...{ 'onUpdated': {} },
            task: (__VLS_ctx.task),
            compact: true,
            hideHeading: true,
            allowToggle: (__VLS_ctx.canToggleSubtasks),
            allowRename: (__VLS_ctx.canEdit),
        }, ...__VLS_functionalComponentArgsRest(__VLS_26));
        let __VLS_30;
        const __VLS_31 = ({ updated: {} },
            { onUpdated: (...[$event]) => {
                    if (!(!__VLS_ctx.expanded))
                        return;
                    if (!(__VLS_ctx.subtasksExpanded && __VLS_ctx.hasSubtasks))
                        return;
                    __VLS_ctx.emit('updated');
                    // @ts-ignore
                    [task, task, task, emit, canEdit, hasSubtasks, subtaskSummary, subtasksExpanded, subtasksExpanded, subtasksExpanded, canToggleSubtasks,];
                } });
        var __VLS_28;
        var __VLS_29;
    }
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "space-y-2 rounded-md border border-border bg-surface-muted/30 p-2" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-surface-muted/30']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "min-w-0 flex-1" },
    });
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    const __VLS_32 = UiInput;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
        ...{ 'onKeydown': {} },
        ref: "titleInputRef",
        modelValue: (__VLS_ctx.draftTitle),
        placeholder: "Title",
        ...{ class: "font-medium" },
        disabled: (__VLS_ctx.busy),
    }));
    const __VLS_34 = __VLS_33({
        ...{ 'onKeydown': {} },
        ref: "titleInputRef",
        modelValue: (__VLS_ctx.draftTitle),
        placeholder: "Title",
        ...{ class: "font-medium" },
        disabled: (__VLS_ctx.busy),
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    let __VLS_37;
    const __VLS_38 = ({ keydown: {} },
        { onKeydown: (__VLS_ctx.onTitleKeydown) });
    var __VLS_39 = {};
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    var __VLS_35;
    var __VLS_36;
    const __VLS_41 = UiTextarea;
    // @ts-ignore
    const __VLS_42 = __VLS_asFunctionalComponent1(__VLS_41, new __VLS_41({
        ...{ 'onKeydown': {} },
        modelValue: (__VLS_ctx.draftDescription),
        rows: (2),
        placeholder: "Description (optional)",
        disabled: (__VLS_ctx.busy),
    }));
    const __VLS_43 = __VLS_42({
        ...{ 'onKeydown': {} },
        modelValue: (__VLS_ctx.draftDescription),
        rows: (2),
        placeholder: "Description (optional)",
        disabled: (__VLS_ctx.busy),
    }, ...__VLS_functionalComponentArgsRest(__VLS_42));
    let __VLS_46;
    const __VLS_47 = ({ keydown: {} },
        { onKeydown: (__VLS_ctx.onInlineEscape) });
    var __VLS_44;
    var __VLS_45;
    if (__VLS_ctx.subtasksBlockVisible) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-2" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        const __VLS_48 = TaskSubtasksPanel;
        // @ts-ignore
        const __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({
            ...{ 'onUpdated': {} },
            ref: "subtasksPanelRef",
            task: (__VLS_ctx.task),
        }));
        const __VLS_50 = __VLS_49({
            ...{ 'onUpdated': {} },
            ref: "subtasksPanelRef",
            task: (__VLS_ctx.task),
        }, ...__VLS_functionalComponentArgsRest(__VLS_49));
        let __VLS_53;
        const __VLS_54 = ({ updated: {} },
            { onUpdated: (...[$event]) => {
                    if (!!(!__VLS_ctx.expanded))
                        return;
                    if (!(__VLS_ctx.subtasksBlockVisible))
                        return;
                    __VLS_ctx.emit('updated');
                    // @ts-ignore
                    [task, emit, draftTitle, busy, busy, onTitleKeydown, draftDescription, onInlineEscape, subtasksBlockVisible,];
                } });
        var __VLS_55 = {};
        var __VLS_51;
        var __VLS_52;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex w-full min-w-0 flex-nowrap items-center gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" },
        ...{ class: (__VLS_ctx.subtasksBlockVisible && 'border-t border-border pt-2') },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-nowrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['pb-0.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['[-ms-overflow-style:none]']} */ ;
    /** @type {__VLS_StyleScopedClasses['[scrollbar-width:none]']} */ ;
    /** @type {__VLS_StyleScopedClasses['[&::-webkit-scrollbar]:hidden']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex shrink-0 items-center gap-1.5" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex shrink-0 items-center" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    const __VLS_57 = UiMenuButton || UiMenuButton;
    // @ts-ignore
    const __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57({
        ...{ 'onEscape': {} },
        modelValue: (__VLS_ctx.draftStatus),
        summary: (__VLS_ctx.draftStatusMenuLabel),
        ariaLabel: (`Status: ${__VLS_ctx.draftStatusMenuLabel}`),
        title: (`Status: ${__VLS_ctx.draftStatusMenuLabel}`),
        options: (__VLS_ctx.STATUS_OPTIONS),
        disabled: (__VLS_ctx.busy),
    }));
    const __VLS_59 = __VLS_58({
        ...{ 'onEscape': {} },
        modelValue: (__VLS_ctx.draftStatus),
        summary: (__VLS_ctx.draftStatusMenuLabel),
        ariaLabel: (`Status: ${__VLS_ctx.draftStatusMenuLabel}`),
        title: (`Status: ${__VLS_ctx.draftStatusMenuLabel}`),
        options: (__VLS_ctx.STATUS_OPTIONS),
        disabled: (__VLS_ctx.busy),
    }, ...__VLS_functionalComponentArgsRest(__VLS_58));
    let __VLS_62;
    const __VLS_63 = ({ escape: {} },
        { onEscape: (__VLS_ctx.collapseExpanded) });
    const { default: __VLS_64 } = __VLS_60.slots;
    let __VLS_65;
    /** @ts-ignore @type {typeof __VLS_components.TagIcon} */
    TagIcon;
    // @ts-ignore
    const __VLS_66 = __VLS_asFunctionalComponent1(__VLS_65, new __VLS_65({
        ...{ class: "h-5 w-5" },
        'aria-hidden': "true",
    }));
    const __VLS_67 = __VLS_66({
        ...{ class: "h-5 w-5" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_66));
    /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
    // @ts-ignore
    [busy, subtasksBlockVisible, draftStatus, draftStatusMenuLabel, draftStatusMenuLabel, draftStatusMenuLabel, STATUS_OPTIONS, collapseExpanded,];
    var __VLS_60;
    var __VLS_61;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex shrink-0 items-center" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    const __VLS_70 = UiMenuButton || UiMenuButton;
    // @ts-ignore
    const __VLS_71 = __VLS_asFunctionalComponent1(__VLS_70, new __VLS_70({
        ...{ 'onEscape': {} },
        modelValue: (__VLS_ctx.draftPriority),
        summary: (__VLS_ctx.draftPriorityMenuLabel),
        ariaLabel: (`Priority: ${__VLS_ctx.draftPriorityMenuLabel}`),
        title: (`Priority: ${__VLS_ctx.draftPriorityMenuLabel}`),
        options: (__VLS_ctx.PRIORITY_OPTIONS),
        disabled: (__VLS_ctx.busy),
    }));
    const __VLS_72 = __VLS_71({
        ...{ 'onEscape': {} },
        modelValue: (__VLS_ctx.draftPriority),
        summary: (__VLS_ctx.draftPriorityMenuLabel),
        ariaLabel: (`Priority: ${__VLS_ctx.draftPriorityMenuLabel}`),
        title: (`Priority: ${__VLS_ctx.draftPriorityMenuLabel}`),
        options: (__VLS_ctx.PRIORITY_OPTIONS),
        disabled: (__VLS_ctx.busy),
    }, ...__VLS_functionalComponentArgsRest(__VLS_71));
    let __VLS_75;
    const __VLS_76 = ({ escape: {} },
        { onEscape: (__VLS_ctx.collapseExpanded) });
    const { default: __VLS_77 } = __VLS_73.slots;
    let __VLS_78;
    /** @ts-ignore @type {typeof __VLS_components.BoltIcon} */
    BoltIcon;
    // @ts-ignore
    const __VLS_79 = __VLS_asFunctionalComponent1(__VLS_78, new __VLS_78({
        ...{ class: "h-5 w-5" },
        'aria-hidden': "true",
    }));
    const __VLS_80 = __VLS_79({
        ...{ class: "h-5 w-5" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_79));
    /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
    // @ts-ignore
    [busy, collapseExpanded, draftPriority, draftPriorityMenuLabel, draftPriorityMenuLabel, draftPriorityMenuLabel, PRIORITY_OPTIONS,];
    var __VLS_73;
    var __VLS_74;
    if (__VLS_ctx.showProjectPicker()) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex shrink-0 items-center" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        const __VLS_83 = UiMenuButton || UiMenuButton;
        // @ts-ignore
        const __VLS_84 = __VLS_asFunctionalComponent1(__VLS_83, new __VLS_83({
            ...{ 'onEscape': {} },
            modelValue: (__VLS_ctx.draftProjectId),
            summary: (__VLS_ctx.draftProjectMenuLabel),
            ariaLabel: (`Project: ${__VLS_ctx.draftProjectMenuLabel}`),
            title: (`Project: ${__VLS_ctx.draftProjectMenuLabel}`),
            options: (__VLS_ctx.projectSelectOptions),
            disabled: (__VLS_ctx.busy),
        }));
        const __VLS_85 = __VLS_84({
            ...{ 'onEscape': {} },
            modelValue: (__VLS_ctx.draftProjectId),
            summary: (__VLS_ctx.draftProjectMenuLabel),
            ariaLabel: (`Project: ${__VLS_ctx.draftProjectMenuLabel}`),
            title: (`Project: ${__VLS_ctx.draftProjectMenuLabel}`),
            options: (__VLS_ctx.projectSelectOptions),
            disabled: (__VLS_ctx.busy),
        }, ...__VLS_functionalComponentArgsRest(__VLS_84));
        let __VLS_88;
        const __VLS_89 = ({ escape: {} },
            { onEscape: (__VLS_ctx.collapseExpanded) });
        const { default: __VLS_90 } = __VLS_86.slots;
        let __VLS_91;
        /** @ts-ignore @type {typeof __VLS_components.FolderIcon} */
        FolderIcon;
        // @ts-ignore
        const __VLS_92 = __VLS_asFunctionalComponent1(__VLS_91, new __VLS_91({
            ...{ class: "h-5 w-5" },
            'aria-hidden': "true",
        }));
        const __VLS_93 = __VLS_92({
            ...{ class: "h-5 w-5" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_92));
        /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
        // @ts-ignore
        [busy, collapseExpanded, showProjectPicker, draftProjectId, draftProjectMenuLabel, draftProjectMenuLabel, draftProjectMenuLabel, projectSelectOptions,];
        var __VLS_86;
        var __VLS_87;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ml-auto flex shrink-0 items-center gap-1.5" },
    });
    /** @type {__VLS_StyleScopedClasses['ml-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
    if (__VLS_ctx.showAssigneePicker()) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex shrink-0 items-center" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        const __VLS_96 = UiMenuButton || UiMenuButton;
        // @ts-ignore
        const __VLS_97 = __VLS_asFunctionalComponent1(__VLS_96, new __VLS_96({
            ...{ 'onUpdate:modelValue': {} },
            ...{ 'onClear': {} },
            ...{ 'onEscape': {} },
            modelValue: (__VLS_ctx.draftAssigneeId === '' ? '' : __VLS_ctx.draftAssigneeId),
            summary: (__VLS_ctx.draftAssigneeId === '' ? '' : __VLS_ctx.draftAssigneeMenuLabel),
            showClear: (__VLS_ctx.draftAssigneeId !== ''),
            clearAriaLabel: "Remove assignee",
            ariaLabel: (`Assignee: ${__VLS_ctx.draftAssigneeMenuLabel}`),
            title: (`Assignee: ${__VLS_ctx.draftAssigneeMenuLabel}`),
            options: (__VLS_ctx.assigneeSelectOptions),
            disabled: (__VLS_ctx.busy),
        }));
        const __VLS_98 = __VLS_97({
            ...{ 'onUpdate:modelValue': {} },
            ...{ 'onClear': {} },
            ...{ 'onEscape': {} },
            modelValue: (__VLS_ctx.draftAssigneeId === '' ? '' : __VLS_ctx.draftAssigneeId),
            summary: (__VLS_ctx.draftAssigneeId === '' ? '' : __VLS_ctx.draftAssigneeMenuLabel),
            showClear: (__VLS_ctx.draftAssigneeId !== ''),
            clearAriaLabel: "Remove assignee",
            ariaLabel: (`Assignee: ${__VLS_ctx.draftAssigneeMenuLabel}`),
            title: (`Assignee: ${__VLS_ctx.draftAssigneeMenuLabel}`),
            options: (__VLS_ctx.assigneeSelectOptions),
            disabled: (__VLS_ctx.busy),
        }, ...__VLS_functionalComponentArgsRest(__VLS_97));
        let __VLS_101;
        const __VLS_102 = ({ 'update:modelValue': {} },
            { 'onUpdate:modelValue': (__VLS_ctx.setDraftAssigneeFromMenu) });
        const __VLS_103 = ({ clear: {} },
            { onClear: (...[$event]) => {
                    if (!!(!__VLS_ctx.expanded))
                        return;
                    if (!(__VLS_ctx.showAssigneePicker()))
                        return;
                    __VLS_ctx.draftAssigneeId = '';
                    // @ts-ignore
                    [busy, showAssigneePicker, draftAssigneeId, draftAssigneeId, draftAssigneeId, draftAssigneeId, draftAssigneeId, draftAssigneeMenuLabel, draftAssigneeMenuLabel, draftAssigneeMenuLabel, assigneeSelectOptions, setDraftAssigneeFromMenu,];
                } });
        const __VLS_104 = ({ escape: {} },
            { onEscape: (__VLS_ctx.collapseExpanded) });
        const { default: __VLS_105 } = __VLS_99.slots;
        let __VLS_106;
        /** @ts-ignore @type {typeof __VLS_components.UserPlusIcon} */
        UserPlusIcon;
        // @ts-ignore
        const __VLS_107 = __VLS_asFunctionalComponent1(__VLS_106, new __VLS_106({
            ...{ class: "h-5 w-5" },
            'aria-hidden': "true",
        }));
        const __VLS_108 = __VLS_107({
            ...{ class: "h-5 w-5" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_107));
        /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
        // @ts-ignore
        [collapseExpanded,];
        var __VLS_99;
        var __VLS_100;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "inline-flex min-h-8 min-w-[6rem] max-w-[10rem] shrink-0 items-center truncate rounded-md border border-dashed border-border/70 bg-surface/50 px-2 text-xs text-muted" },
            title: (__VLS_ctx.task.assignee
                ? __VLS_ctx.task.assignee.name || __VLS_ctx.task.assignee.email
                : 'Unassigned'),
        });
        /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-h-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-w-[6rem]']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-[10rem]']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-dashed']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-border/70']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-surface/50']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        (__VLS_ctx.task.assignee
            ? __VLS_ctx.task.assignee.name || __VLS_ctx.task.assignee.email
            : 'No assignee');
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex shrink-0 items-center" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    const __VLS_111 = UiDateMenuButton;
    // @ts-ignore
    const __VLS_112 = __VLS_asFunctionalComponent1(__VLS_111, new __VLS_111({
        ...{ 'onEscape': {} },
        modelValue: (__VLS_ctx.draftDue),
        ariaLabel: (__VLS_ctx.draftDue.trim()
            ? `Due date ${__VLS_ctx.draftDue.slice(0, 10)}`
            : 'Due date'),
        disabled: (__VLS_ctx.busy),
    }));
    const __VLS_113 = __VLS_112({
        ...{ 'onEscape': {} },
        modelValue: (__VLS_ctx.draftDue),
        ariaLabel: (__VLS_ctx.draftDue.trim()
            ? `Due date ${__VLS_ctx.draftDue.slice(0, 10)}`
            : 'Due date'),
        disabled: (__VLS_ctx.busy),
    }, ...__VLS_functionalComponentArgsRest(__VLS_112));
    let __VLS_116;
    const __VLS_117 = ({ escape: {} },
        { onEscape: (__VLS_ctx.collapseExpanded) });
    var __VLS_114;
    var __VLS_115;
    if (!__VLS_ctx.hasSubtasks && !__VLS_ctx.subtasksBlockVisible) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex shrink-0 items-center" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.revealSubtasksAndFocus) },
            type: "button",
            ...{ class: "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" },
            'aria-label': "Add subtask",
            title: "Add subtask",
            disabled: (__VLS_ctx.busy),
        });
        /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-surface-muted']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-foreground']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-none']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:ring-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:ring-ring']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:pointer-events-none']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
        let __VLS_118;
        /** @ts-ignore @type {typeof __VLS_components.RectangleStackIcon} */
        RectangleStackIcon;
        // @ts-ignore
        const __VLS_119 = __VLS_asFunctionalComponent1(__VLS_118, new __VLS_118({
            ...{ class: "h-5 w-5" },
            'aria-hidden': "true",
        }));
        const __VLS_120 = __VLS_119({
            ...{ class: "h-5 w-5" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_119));
        /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-wrap items-center gap-2 border-t border-border pt-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
    const __VLS_123 = Button || Button;
    // @ts-ignore
    const __VLS_124 = __VLS_asFunctionalComponent1(__VLS_123, new __VLS_123({
        ...{ 'onClick': {} },
        variant: "ghost-danger",
        type: "button",
        disabled: (__VLS_ctx.busy || __VLS_ctx.deleting),
    }));
    const __VLS_125 = __VLS_124({
        ...{ 'onClick': {} },
        variant: "ghost-danger",
        type: "button",
        disabled: (__VLS_ctx.busy || __VLS_ctx.deleting),
    }, ...__VLS_functionalComponentArgsRest(__VLS_124));
    let __VLS_128;
    const __VLS_129 = ({ click: {} },
        { onClick: (__VLS_ctx.requestDelete) });
    const { default: __VLS_130 } = __VLS_126.slots;
    // @ts-ignore
    [task, task, task, task, task, task, hasSubtasks, busy, busy, busy, subtasksBlockVisible, collapseExpanded, draftDue, draftDue, draftDue, revealSubtasksAndFocus, deleting, requestDelete,];
    var __VLS_126;
    var __VLS_127;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ml-auto flex flex-wrap gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['ml-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    const __VLS_131 = Button || Button;
    // @ts-ignore
    const __VLS_132 = __VLS_asFunctionalComponent1(__VLS_131, new __VLS_131({
        ...{ 'onClick': {} },
        type: "button",
        variant: "secondary",
        disabled: (__VLS_ctx.busy),
    }));
    const __VLS_133 = __VLS_132({
        ...{ 'onClick': {} },
        type: "button",
        variant: "secondary",
        disabled: (__VLS_ctx.busy),
    }, ...__VLS_functionalComponentArgsRest(__VLS_132));
    let __VLS_136;
    const __VLS_137 = ({ click: {} },
        { onClick: (__VLS_ctx.collapseExpanded) });
    const { default: __VLS_138 } = __VLS_134.slots;
    // @ts-ignore
    [busy, collapseExpanded,];
    var __VLS_134;
    var __VLS_135;
    const __VLS_139 = Button || Button;
    // @ts-ignore
    const __VLS_140 = __VLS_asFunctionalComponent1(__VLS_139, new __VLS_139({
        ...{ 'onClick': {} },
        type: "button",
        disabled: (__VLS_ctx.busy),
    }));
    const __VLS_141 = __VLS_140({
        ...{ 'onClick': {} },
        type: "button",
        disabled: (__VLS_ctx.busy),
    }, ...__VLS_functionalComponentArgsRest(__VLS_140));
    let __VLS_144;
    const __VLS_145 = ({ click: {} },
        { onClick: (__VLS_ctx.saveAndCollapse) });
    const { default: __VLS_146 } = __VLS_142.slots;
    // @ts-ignore
    [busy, saveAndCollapse,];
    var __VLS_142;
    var __VLS_143;
}
if (!__VLS_ctx.expanded) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex shrink-0 flex-row items-stretch self-stretch" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-stretch']} */ ;
    /** @type {__VLS_StyleScopedClasses['self-stretch']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "flex w-44 min-w-0 shrink-0 flex-col justify-center overflow-visible border-l border-border/50 px-2" },
        title: (__VLS_ctx.assigneeTitle),
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-44']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-visible']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-l']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-border/50']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex min-w-0 items-center gap-1" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "min-w-0 flex-1 truncate text-xs leading-tight" },
        ...{ class: (__VLS_ctx.isAssigneePlaceholder ? 'text-muted' : 'text-foreground') },
    });
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['leading-tight']} */ ;
    (__VLS_ctx.assigneeLabel);
    if (__VLS_ctx.canEdit && __VLS_ctx.showAssigneePicker()) {
        const __VLS_147 = UiMenuButton || UiMenuButton;
        // @ts-ignore
        const __VLS_148 = __VLS_asFunctionalComponent1(__VLS_147, new __VLS_147({
            ...{ 'onSelect': {} },
            ...{ class: "shrink-0" },
            modelValue: (__VLS_ctx.task.assignee_id ?? ''),
            ariaLabel: "Change assignee",
            title: "Change assignee",
            placement: "bottom-end",
            options: (__VLS_ctx.assigneeSelectOptions),
            disabled: (__VLS_ctx.assigningQuick),
            minPanelWidth: (200),
        }));
        const __VLS_149 = __VLS_148({
            ...{ 'onSelect': {} },
            ...{ class: "shrink-0" },
            modelValue: (__VLS_ctx.task.assignee_id ?? ''),
            ariaLabel: "Change assignee",
            title: "Change assignee",
            placement: "bottom-end",
            options: (__VLS_ctx.assigneeSelectOptions),
            disabled: (__VLS_ctx.assigningQuick),
            minPanelWidth: (200),
        }, ...__VLS_functionalComponentArgsRest(__VLS_148));
        let __VLS_152;
        const __VLS_153 = ({ select: {} },
            { onSelect: (__VLS_ctx.onAssigneeMenuSelect) });
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        const { default: __VLS_154 } = __VLS_150.slots;
        let __VLS_155;
        /** @ts-ignore @type {typeof __VLS_components.UserPlusIcon} */
        UserPlusIcon;
        // @ts-ignore
        const __VLS_156 = __VLS_asFunctionalComponent1(__VLS_155, new __VLS_155({
            ...{ class: "h-4 w-4" },
            'aria-hidden': "true",
        }));
        const __VLS_157 = __VLS_156({
            ...{ class: "h-4 w-4" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_156));
        /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
        // @ts-ignore
        [task, canEdit, expanded, showAssigneePicker, assigneeSelectOptions, assigneeTitle, isAssigneePlaceholder, assigneeLabel, assigningQuick, onAssigneeMenuSelect,];
        var __VLS_150;
        var __VLS_151;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "flex shrink-0 flex-row items-center justify-center gap-0.5 self-stretch border-l border-border/50 pl-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-0.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['self-stretch']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-l']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-border/50']} */ ;
    /** @type {__VLS_StyleScopedClasses['pl-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(!__VLS_ctx.expanded))
                    return;
                __VLS_ctx.emit('info', __VLS_ctx.task.id);
                // @ts-ignore
                [task, emit,];
            } },
        type: "button",
        ...{ class: "inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" },
        'aria-label': "Task details",
    });
    /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-surface-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-foreground']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:ring-ring']} */ ;
    let __VLS_160;
    /** @ts-ignore @type {typeof __VLS_components.InformationCircleIcon} */
    InformationCircleIcon;
    // @ts-ignore
    const __VLS_161 = __VLS_asFunctionalComponent1(__VLS_160, new __VLS_160({
        ...{ class: "h-5 w-5" },
        'aria-hidden': "true",
    }));
    const __VLS_162 = __VLS_161({
        ...{ class: "h-5 w-5" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_161));
    /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
    if (__VLS_ctx.canEdit) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.requestDelete) },
            type: "button",
            ...{ class: "inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" },
            'aria-label': "Delete task",
            disabled: (__VLS_ctx.deleting),
        });
        /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-1.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-destructive']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-destructive/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-none']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:ring-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:ring-ring']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
        let __VLS_165;
        /** @ts-ignore @type {typeof __VLS_components.TrashIcon} */
        TrashIcon;
        // @ts-ignore
        const __VLS_166 = __VLS_asFunctionalComponent1(__VLS_165, new __VLS_165({
            ...{ class: "h-5 w-5" },
            'aria-hidden': "true",
        }));
        const __VLS_167 = __VLS_166({
            ...{ class: "h-5 w-5" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_166));
        /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
    }
}
// @ts-ignore
var __VLS_40 = __VLS_39, __VLS_56 = __VLS_55;
// @ts-ignore
[canEdit, deleting, requestDelete,];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
export default {};
