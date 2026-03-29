/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, onMounted, ref } from 'vue';
import Avatar from '../../components/ui/UiAvatar.vue';
import Breadcrumb from '../../components/ui/UiBreadcrumb.vue';
import Button from '../../components/ui/UiButton.vue';
import EmptyState from '../../components/ui/UiEmptyState.vue';
import Skeleton from '../../components/ui/UiSkeleton.vue';
import Table from '../../components/ui/UiTable.vue';
import { useConfirm } from '../../composables/useConfirm';
import { useToast } from '../../composables/useToast';
import { useAuthStore } from '../../stores/auth.store';
import { api } from '../../utils/api';
const { confirm } = useConfirm();
const toast = useToast();
const auth = useAuthStore();
const users = ref([]);
const loading = ref(true);
const error = ref(null);
const roleSavingId = ref(null);
const isAdmin = computed(() => auth.user?.role === 'admin');
const assignableRoles = ['user', 'creator', 'staff'];
function roleBadgeClass(r) {
    switch (r) {
        case 'admin':
            return 'bg-red-500/15 text-red-800 dark:text-red-200';
        case 'staff':
            return 'bg-violet-500/15 text-violet-800 dark:text-violet-200';
        case 'creator':
            return 'bg-sky-500/15 text-sky-800 dark:text-sky-200';
        default:
            return 'bg-surface-muted text-muted';
    }
}
async function load() {
    loading.value = true;
    error.value = null;
    try {
        const { data } = await api.get('/users');
        users.value = data.users;
    }
    catch {
        error.value = 'Failed to load users (staff or admin only).';
    }
    finally {
        loading.value = false;
    }
}
onMounted(() => load());
async function remove(u) {
    const ok = await confirm({
        title: 'Delete user',
        message: `Delete user ${u.email}?`,
        confirmLabel: 'Delete',
        danger: true,
    });
    if (!ok)
        return;
    try {
        await api.delete(`/users/${u.id}`);
        await load();
        toast.success('User deleted');
    }
    catch {
        const msg = 'Could not delete user.';
        error.value = msg;
        toast.error(msg);
    }
}
async function onRoleSelect(u, ev) {
    const el = ev.target;
    const newRole = el.value;
    if (newRole === u.role)
        return;
    roleSavingId.value = u.id;
    try {
        await api.patch(`/users/${u.id}/role`, { role: newRole });
        await load();
        toast.success('Role updated');
    }
    catch {
        el.value = u.role;
        toast.error('Could not update role');
    }
    finally {
        roleSavingId.value = null;
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
        { label: 'Users' },
    ]),
}));
const __VLS_2 = __VLS_1({
    ...{ class: "mb-4" },
    items: ([
        { label: 'Home', to: '/dashboard' },
        { label: 'Users' },
    ]),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
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
(__VLS_ctx.isAdmin ? 'Manage accounts and global roles' : 'Directory (read-only)');
if (__VLS_ctx.error) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-4 text-sm text-destructive" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-destructive']} */ ;
    (__VLS_ctx.error);
}
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-8 space-y-3" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
    for (const [i] of __VLS_vFor((5))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (i),
            ...{ class: "flex items-center gap-4 rounded-lg border border-border bg-surface p-4" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
        const __VLS_5 = Skeleton;
        // @ts-ignore
        const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
            variant: "avatar",
        }));
        const __VLS_7 = __VLS_6({
            variant: "avatar",
        }, ...__VLS_functionalComponentArgsRest(__VLS_6));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "min-w-0 flex-1 space-y-2" },
        });
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
        const __VLS_10 = Skeleton;
        // @ts-ignore
        const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
            variant: "line",
        }));
        const __VLS_12 = __VLS_11({
            variant: "line",
        }, ...__VLS_functionalComponentArgsRest(__VLS_11));
        const __VLS_15 = Skeleton;
        // @ts-ignore
        const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
            variant: "line",
            lines: (2),
        }));
        const __VLS_17 = __VLS_16({
            variant: "line",
            lines: (2),
        }, ...__VLS_functionalComponentArgsRest(__VLS_16));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "hidden w-24 shrink-0 sm:block" },
        });
        /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-24']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:block']} */ ;
        const __VLS_20 = Skeleton;
        // @ts-ignore
        const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
            variant: "line",
        }));
        const __VLS_22 = __VLS_21({
            variant: "line",
        }, ...__VLS_functionalComponentArgsRest(__VLS_21));
        // @ts-ignore
        [isAdmin, error, error, loading,];
    }
}
else if (!__VLS_ctx.users.length) {
    const __VLS_25 = EmptyState;
    // @ts-ignore
    const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
        ...{ class: "mt-8" },
        title: "No users",
        description: "No user accounts are visible in this environment.",
    }));
    const __VLS_27 = __VLS_26({
        ...{ class: "mt-8" },
        title: "No users",
        description: "No user accounts are visible in this environment.",
    }, ...__VLS_functionalComponentArgsRest(__VLS_26));
    /** @type {__VLS_StyleScopedClasses['mt-8']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-8 space-y-3 md:hidden" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:hidden']} */ ;
    for (const [u] of __VLS_vFor((__VLS_ctx.users))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (u.id),
            ...{ class: "flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex items-center gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        const __VLS_30 = Avatar;
        // @ts-ignore
        const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
            email: (u.email),
            name: (u.name),
        }));
        const __VLS_32 = __VLS_31({
            email: (u.email),
            name: (u.name),
        }, ...__VLS_functionalComponentArgsRest(__VLS_31));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "min-w-0 flex-1" },
        });
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "truncate font-medium text-foreground" },
        });
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
        (u.email);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        (u.name || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-wrap items-center justify-between gap-2 text-xs text-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "font-mono" },
        });
        /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
        (u.id);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "rounded px-2 py-0.5 font-medium" },
            ...{ class: (__VLS_ctx.roleBadgeClass(u.role)) },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        (u.role);
        if (__VLS_ctx.isAdmin && u.role !== 'admin') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex flex-col gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "text-xs text-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                ...{ onChange: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(!__VLS_ctx.users.length))
                            return;
                        if (!(__VLS_ctx.isAdmin && u.role !== 'admin'))
                            return;
                        __VLS_ctx.onRoleSelect(u, $event);
                        // @ts-ignore
                        [isAdmin, users, users, roleBadgeClass, onRoleSelect,];
                    } },
                ...{ class: "rounded-md border border-border bg-surface px-2 py-2 text-sm text-foreground" },
                value: (u.role),
                disabled: (__VLS_ctx.roleSavingId === u.id),
            });
            /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
            for (const [r] of __VLS_vFor((__VLS_ctx.assignableRoles))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                    key: (r),
                    value: (r),
                });
                (r);
                // @ts-ignore
                [roleSavingId, assignableRoles,];
            }
        }
        if (__VLS_ctx.isAdmin) {
            const __VLS_35 = Button || Button;
            // @ts-ignore
            const __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({
                ...{ 'onClick': {} },
                variant: "ghost-danger",
                ...{ class: "w-full" },
            }));
            const __VLS_37 = __VLS_36({
                ...{ 'onClick': {} },
                variant: "ghost-danger",
                ...{ class: "w-full" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_36));
            let __VLS_40;
            const __VLS_41 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(!__VLS_ctx.users.length))
                            return;
                        if (!(__VLS_ctx.isAdmin))
                            return;
                        __VLS_ctx.remove(u);
                        // @ts-ignore
                        [isAdmin, remove,];
                    } });
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            const { default: __VLS_42 } = __VLS_38.slots;
            // @ts-ignore
            [];
            var __VLS_38;
            var __VLS_39;
        }
        // @ts-ignore
        [];
    }
}
if (!__VLS_ctx.loading && __VLS_ctx.users.length) {
    const __VLS_43 = Table || Table;
    // @ts-ignore
    const __VLS_44 = __VLS_asFunctionalComponent1(__VLS_43, new __VLS_43({
        ...{ class: "mt-8 hidden md:block" },
        headers: (['', 'ID', 'Email', 'Name', 'Role', 'Actions']),
    }));
    const __VLS_45 = __VLS_44({
        ...{ class: "mt-8 hidden md:block" },
        headers: (['', 'ID', 'Email', 'Name', 'Role', 'Actions']),
    }, ...__VLS_functionalComponentArgsRest(__VLS_44));
    /** @type {__VLS_StyleScopedClasses['mt-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:block']} */ ;
    const { default: __VLS_48 } = __VLS_46.slots;
    for (const [u] of __VLS_vFor((__VLS_ctx.users))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (u.id),
            ...{ class: "hover:bg-surface-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['hover:bg-surface-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        const __VLS_49 = Avatar;
        // @ts-ignore
        const __VLS_50 = __VLS_asFunctionalComponent1(__VLS_49, new __VLS_49({
            email: (u.email),
            name: (u.name),
        }));
        const __VLS_51 = __VLS_50({
            email: (u.email),
            name: (u.name),
        }, ...__VLS_functionalComponentArgsRest(__VLS_50));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 font-mono text-xs" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        (u.id);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        (u.email);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        (u.name || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "inline-flex rounded px-2 py-0.5 text-xs font-medium" },
            ...{ class: (__VLS_ctx.roleBadgeClass(u.role)) },
        });
        /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        (u.role);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-wrap items-center gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        if (__VLS_ctx.isAdmin && u.role !== 'admin') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                ...{ onChange: (...[$event]) => {
                        if (!(!__VLS_ctx.loading && __VLS_ctx.users.length))
                            return;
                        if (!(__VLS_ctx.isAdmin && u.role !== 'admin'))
                            return;
                        __VLS_ctx.onRoleSelect(u, $event);
                        // @ts-ignore
                        [isAdmin, loading, users, users, roleBadgeClass, onRoleSelect,];
                    } },
                ...{ class: "rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-foreground" },
                value: (u.role),
                disabled: (__VLS_ctx.roleSavingId === u.id),
            });
            /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
            for (const [r] of __VLS_vFor((__VLS_ctx.assignableRoles))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                    key: (r),
                    value: (r),
                });
                (r);
                // @ts-ignore
                [roleSavingId, assignableRoles,];
            }
        }
        if (__VLS_ctx.isAdmin) {
            const __VLS_54 = Button || Button;
            // @ts-ignore
            const __VLS_55 = __VLS_asFunctionalComponent1(__VLS_54, new __VLS_54({
                ...{ 'onClick': {} },
                variant: "ghost-danger",
            }));
            const __VLS_56 = __VLS_55({
                ...{ 'onClick': {} },
                variant: "ghost-danger",
            }, ...__VLS_functionalComponentArgsRest(__VLS_55));
            let __VLS_59;
            const __VLS_60 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!(!__VLS_ctx.loading && __VLS_ctx.users.length))
                            return;
                        if (!(__VLS_ctx.isAdmin))
                            return;
                        __VLS_ctx.remove(u);
                        // @ts-ignore
                        [isAdmin, remove,];
                    } });
            const { default: __VLS_61 } = __VLS_57.slots;
            // @ts-ignore
            [];
            var __VLS_57;
            var __VLS_58;
        }
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_46;
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
