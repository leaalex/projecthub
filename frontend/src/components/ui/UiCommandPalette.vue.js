/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { storeToRefs } from 'pinia';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';
import { useProjectStore } from '../../stores/project.store';
import { useTaskStore } from '../../stores/task.store';
import { useUiStore } from '../../stores/ui.store';
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const projectStore = useProjectStore();
const taskStore = useTaskStore();
const ui = useUiStore();
const { commandPaletteOpen } = storeToRefs(ui);
const query = ref('');
const inputRef = ref(null);
const selected = ref(0);
const navItems = computed(() => {
    const base = [
        {
            id: 'nav-dashboard',
            kind: 'nav',
            label: 'Dashboard',
            subtitle: 'Go to dashboard',
            run: () => void router.push('/dashboard'),
        },
        {
            id: 'nav-projects',
            kind: 'nav',
            label: 'Projects',
            subtitle: 'All projects',
            run: () => void router.push('/projects'),
        },
        {
            id: 'nav-tasks',
            kind: 'nav',
            label: 'Tasks',
            subtitle: 'Task list',
            run: () => void router.push('/tasks'),
        },
        {
            id: 'nav-reports',
            kind: 'nav',
            label: 'Reports',
            subtitle: 'Weekly reports',
            run: () => void router.push('/reports'),
        },
        {
            id: 'nav-profile',
            kind: 'nav',
            label: 'Profile',
            subtitle: 'Your profile',
            run: () => void router.push('/profile'),
        },
        {
            id: 'nav-ui-kit',
            kind: 'nav',
            label: 'UI kit',
            subtitle: 'Component gallery',
            run: () => void router.push('/ui-kit'),
        },
    ];
    if (auth.user?.role === 'admin' || auth.user?.role === 'staff') {
        base.push({
            id: 'nav-users',
            kind: 'nav',
            label: 'Users',
            subtitle: 'Admin',
            run: () => void router.push('/admin/users'),
        });
    }
    if (auth.user?.role === 'user') {
        return base.filter((x) => x.id !== 'nav-projects' && x.id !== 'nav-tasks');
    }
    return base;
});
const actionItems = computed(() => {
    const items = [];
    if (auth.user?.role !== 'user') {
        items.push({
            id: 'act-new-project',
            kind: 'action',
            label: 'New project',
            subtitle: 'Open projects',
            run: () => void router.push('/projects'),
        }, {
            id: 'act-new-task',
            kind: 'action',
            label: 'New task',
            subtitle: 'Open tasks',
            run: () => void router.push('/tasks'),
        });
    }
    items.push({
        id: 'act-signout',
        kind: 'action',
        label: 'Sign out',
        subtitle: 'End session',
        run: () => {
            auth.logout();
            void router.push('/login');
        },
    });
    return items;
});
const projectItems = computed(() => projectStore.projects.map((p) => ({
    id: `proj-${p.id}`,
    kind: 'project',
    label: p.name,
    subtitle: 'Project',
    run: () => void router.push(`/projects/${p.id}`),
})));
const taskItems = computed(() => taskStore.tasks.map((t) => ({
    id: `task-${t.id}`,
    kind: 'task',
    label: t.title,
    subtitle: t.status.replace('_', ' '),
    run: () => {
        const q = {};
        if (t.project_id)
            q.project_id = String(t.project_id);
        const st = t.status;
        if (st)
            q.status = st;
        void router.push({ path: '/tasks', query: q });
    },
})));
const allItems = computed(() => [
    ...navItems.value,
    ...actionItems.value,
    ...projectItems.value,
    ...taskItems.value,
]);
const filtered = computed(() => {
    const q = query.value.trim().toLowerCase();
    if (!q)
        return allItems.value;
    return allItems.value.filter((i) => i.label.toLowerCase().includes(q) ||
        (i.subtitle && i.subtitle.toLowerCase().includes(q)));
});
watch(filtered, () => {
    selected.value = 0;
});
watch(commandPaletteOpen, async (v) => {
    if (v) {
        query.value = '';
        selected.value = 0;
        projectStore.fetchList().catch(() => { });
        taskStore.fetchList().catch(() => { });
        await nextTick();
        inputRef.value?.focus();
    }
});
function close() {
    ui.closeCommandPalette();
}
function activate(i) {
    const list = filtered.value;
    const item = list[i];
    if (!item)
        return;
    void Promise.resolve(item.run()).finally(() => close());
}
function onKeydown(e) {
    if (route.meta.layout === 'auth')
        return;
    const meta = e.metaKey || e.ctrlKey;
    if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        ui.toggleCommandPalette();
        return;
    }
    if (!commandPaletteOpen.value)
        return;
    if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
    }
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        const n = filtered.value.length;
        if (n)
            selected.value = (selected.value + 1) % n;
        return;
    }
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        const n = filtered.value.length;
        if (n)
            selected.value = (selected.value - 1 + n) % n;
        return;
    }
    if (e.key === 'Enter') {
        e.preventDefault();
        activate(selected.value);
    }
}
onMounted(() => document.addEventListener('keydown', onKeydown));
onUnmounted(() => document.removeEventListener('keydown', onKeydown));
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['palette-enter-active']} */ ;
/** @type {__VLS_StyleScopedClasses['palette-leave-active']} */ ;
/** @type {__VLS_StyleScopedClasses['palette-enter-from']} */ ;
/** @type {__VLS_StyleScopedClasses['palette-leave-to']} */ ;
let __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.Teleport | typeof __VLS_components.Teleport} */
Teleport;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    to: "body",
}));
const __VLS_2 = __VLS_1({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_5 } = __VLS_3.slots;
let __VLS_6;
/** @ts-ignore @type {typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
Transition;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
    name: "palette",
}));
const __VLS_8 = __VLS_7({
    name: "palette",
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
const { default: __VLS_11 } = __VLS_9.slots;
if (__VLS_ctx.commandPaletteOpen) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.close) },
        ...{ class: "fixed inset-0 z-[95] flex items-start justify-center overflow-y-auto bg-foreground/30 p-4 pt-[12vh] backdrop-blur-sm" },
        role: "dialog",
        'aria-modal': "true",
        'aria-label': "Command palette",
    });
    /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-[95]']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-foreground/30']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-[12vh]']} */ ;
    /** @type {__VLS_StyleScopedClasses['backdrop-blur-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onKeydown: () => { } },
        ...{ class: "w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-2xl" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "border-b border-border p-3" },
    });
    /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ref: "inputRef",
        type: "search",
        ...{ class: "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" },
        placeholder: "Search navigation, projects, tasks…",
        autocomplete: "off",
        spellcheck: "false",
        'aria-autocomplete': "list",
        'aria-activedescendant': (__VLS_ctx.filtered[__VLS_ctx.selected] ? `cmd-${__VLS_ctx.filtered[__VLS_ctx.selected].id}` : undefined),
    });
    (__VLS_ctx.query);
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
    /** @type {__VLS_StyleScopedClasses['placeholder:text-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:ring-ring']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-2 text-xs text-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.kbd, __VLS_intrinsics.kbd)({
        ...{ class: "rounded border border-border bg-surface-muted px-1" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-surface-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.kbd, __VLS_intrinsics.kbd)({
        ...{ class: "rounded border border-border bg-surface-muted px-1" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-surface-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.kbd, __VLS_intrinsics.kbd)({
        ...{ class: "rounded border border-border bg-surface-muted px-1" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-surface-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.kbd, __VLS_intrinsics.kbd)({
        ...{ class: "rounded border border-border bg-surface-muted px-1" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-surface-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
        ...{ class: "max-h-[min(50vh,24rem)] overflow-y-auto py-2" },
        role: "listbox",
    });
    /** @type {__VLS_StyleScopedClasses['max-h-[min(50vh,24rem)]']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    if (!__VLS_ctx.filtered.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            ...{ class: "px-4 py-6 text-center text-sm text-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
    }
    for (const [item, index] of __VLS_vFor((__VLS_ctx.filtered))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.commandPaletteOpen))
                        return;
                    __VLS_ctx.activate(index);
                    // @ts-ignore
                    [commandPaletteOpen, close, filtered, filtered, filtered, filtered, selected, selected, query, activate,];
                } },
            ...{ onMouseenter: (...[$event]) => {
                    if (!(__VLS_ctx.commandPaletteOpen))
                        return;
                    __VLS_ctx.selected = index;
                    // @ts-ignore
                    [selected,];
                } },
            id: (`cmd-${item.id}`),
            key: (item.id),
            role: "option",
            'aria-selected': (index === __VLS_ctx.selected),
            ...{ class: "mx-2 flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors" },
            ...{ class: (index === __VLS_ctx.selected
                    ? 'bg-primary/15 text-foreground'
                    : 'text-foreground hover:bg-surface-muted') },
        });
        /** @type {__VLS_StyleScopedClasses['mx-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "min-w-0 flex-1 truncate font-medium" },
        });
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        (item.label);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "shrink-0 text-xs capitalize text-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['capitalize']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        (item.kind);
        // @ts-ignore
        [selected, selected,];
    }
}
// @ts-ignore
[];
var __VLS_9;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
