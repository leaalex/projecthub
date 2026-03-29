/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ArrowRightStartOnRectangleIcon, ChartBarIcon, ChevronLeftIcon, ChevronRightIcon, ClipboardDocumentCheckIcon, FolderIcon, HomeIcon, MagnifyingGlassIcon, SwatchIcon, UsersIcon, } from '@heroicons/vue/24/outline';
import { computed, nextTick } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';
import { useUiStore } from '../../stores/ui.store';
import Avatar from '../ui/UiAvatar.vue';
const __VLS_props = defineProps();
const emit = defineEmits();
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const ui = useUiStore();
const iconMap = {
    home: HomeIcon,
    folder: FolderIcon,
    check: ClipboardDocumentCheckIcon,
    chart: ChartBarIcon,
    swatch: SwatchIcon,
    users: UsersIcon,
};
const links = computed(() => {
    const base = [
        { to: '/dashboard', label: 'Dashboard', icon: 'home' },
        { to: '/projects', label: 'Projects', icon: 'folder' },
        { to: '/tasks', label: 'Tasks', icon: 'check' },
        { to: '/reports', label: 'Reports', icon: 'chart' },
        { to: '/ui-kit', label: 'UI kit', icon: 'swatch' },
    ];
    if (auth.user?.role === 'admin' || auth.user?.role === 'staff') {
        base.push({ to: '/admin/users', label: 'Users', icon: 'users' });
    }
    const out = base.filter((link) => {
        if (auth.user?.role !== 'user')
            return true;
        return link.to !== '/projects' && link.to !== '/tasks';
    });
    return out;
});
function isActive(path) {
    if (path === '/dashboard')
        return route.path === '/dashboard';
    return route.path === path || route.path.startsWith(path + '/');
}
function onNavigate() {
    emit('navigate');
}
async function logout() {
    auth.logout();
    await router.push('/login');
    emit('navigate');
}
function openCommandPaletteFromSidebar() {
    onNavigate();
    void nextTick(() => {
        ui.openCommandPalette();
    });
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex h-full min-h-0 flex-1 flex-col" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['min-h-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex border-b border-border px-2 py-3 md:px-3" },
    ...{ class: (__VLS_ctx.collapsed
            ? 'items-stretch'
            : 'items-center gap-1 md:gap-2') },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['md:px-3']} */ ;
if (!__VLS_ctx.collapsed) {
    let __VLS_0;
    /** @ts-ignore @type {typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
    RouterLink;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        ...{ 'onClick': {} },
        to: "/dashboard",
        ...{ class: "flex min-w-0 flex-1 items-center font-semibold text-primary md:justify-start" },
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onClick': {} },
        to: "/dashboard",
        ...{ class: "flex min-w-0 flex-1 items-center font-semibold text-primary md:justify-start" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_5;
    const __VLS_6 = ({ click: {} },
        { onClick: (__VLS_ctx.onNavigate) });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:justify-start']} */ ;
    const { default: __VLS_7 } = __VLS_3.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "truncate text-lg" },
    });
    /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    // @ts-ignore
    [collapsed, collapsed, onNavigate,];
    var __VLS_3;
    var __VLS_4;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.ui.toggleSidebarCollapsed();
            // @ts-ignore
            [ui,];
        } },
    type: "button",
    ...{ class: "hidden rounded-md text-muted transition-colors hover:bg-surface-muted hover:text-foreground md:inline-flex md:items-center md:justify-center" },
    ...{ class: (__VLS_ctx.collapsed
            ? 'w-full py-2'
            : 'shrink-0 p-1.5') },
    title: (__VLS_ctx.collapsed ? 'Expand sidebar' : 'Collapse sidebar'),
    'aria-expanded': (!__VLS_ctx.collapsed),
    'aria-label': "Toggle sidebar width",
});
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-surface-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['md:inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['md:items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['md:justify-center']} */ ;
if (!__VLS_ctx.collapsed) {
    let __VLS_8;
    /** @ts-ignore @type {typeof __VLS_components.ChevronLeftIcon} */
    ChevronLeftIcon;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({
        ...{ class: "h-5 w-5" },
        'aria-hidden': "true",
    }));
    const __VLS_10 = __VLS_9({
        ...{ class: "h-5 w-5" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
}
else {
    let __VLS_13;
    /** @ts-ignore @type {typeof __VLS_components.ChevronRightIcon} */
    ChevronRightIcon;
    // @ts-ignore
    const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
        ...{ class: "h-5 w-5" },
        'aria-hidden': "true",
    }));
    const __VLS_15 = __VLS_14({
        ...{ class: "h-5 w-5" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_14));
    /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "border-b border-border px-2 pb-2 pt-2" },
});
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.openCommandPaletteFromSidebar) },
    type: "button",
    ...{ class: "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground" },
    ...{ class: (__VLS_ctx.collapsed ? 'justify-center px-2' : '') },
    title: "Command palette — ⌘K or Ctrl+K",
    'aria-label': "Open command palette",
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-surface-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-foreground']} */ ;
let __VLS_18;
/** @ts-ignore @type {typeof __VLS_components.MagnifyingGlassIcon} */
MagnifyingGlassIcon;
// @ts-ignore
const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
    ...{ class: "h-5 w-5 shrink-0" },
    'aria-hidden': "true",
}));
const __VLS_20 = __VLS_19({
    ...{ class: "h-5 w-5 shrink-0" },
    'aria-hidden': "true",
}, ...__VLS_functionalComponentArgsRest(__VLS_19));
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "truncate" },
});
__VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (!__VLS_ctx.collapsed) }, null, null);
/** @type {__VLS_StyleScopedClasses['truncate']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
    ...{ class: "flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2" },
    'aria-label': "Main",
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['min-h-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
for (const [l] of __VLS_vFor((__VLS_ctx.links))) {
    let __VLS_23;
    /** @ts-ignore @type {typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
    RouterLink;
    // @ts-ignore
    const __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
        ...{ 'onClick': {} },
        key: (l.to),
        to: (l.to),
        ...{ class: "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors" },
        ...{ class: ([
                __VLS_ctx.isActive(l.to)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted hover:bg-surface-muted hover:text-foreground',
                __VLS_ctx.collapsed ? 'justify-center px-2' : '',
            ]) },
        title: (__VLS_ctx.collapsed ? l.label : undefined),
    }));
    const __VLS_25 = __VLS_24({
        ...{ 'onClick': {} },
        key: (l.to),
        to: (l.to),
        ...{ class: "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors" },
        ...{ class: ([
                __VLS_ctx.isActive(l.to)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted hover:bg-surface-muted hover:text-foreground',
                __VLS_ctx.collapsed ? 'justify-center px-2' : '',
            ]) },
        title: (__VLS_ctx.collapsed ? l.label : undefined),
    }, ...__VLS_functionalComponentArgsRest(__VLS_24));
    let __VLS_28;
    const __VLS_29 = ({ click: {} },
        { onClick: (__VLS_ctx.onNavigate) });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    const { default: __VLS_30 } = __VLS_26.slots;
    const __VLS_31 = (__VLS_ctx.iconMap[l.icon]);
    // @ts-ignore
    const __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({
        ...{ class: "h-5 w-5 shrink-0" },
        'aria-hidden': "true",
    }));
    const __VLS_33 = __VLS_32({
        ...{ class: "h-5 w-5 shrink-0" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_32));
    /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "truncate" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (!__VLS_ctx.collapsed) }, null, null);
    /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
    (l.label);
    // @ts-ignore
    [collapsed, collapsed, collapsed, collapsed, collapsed, collapsed, collapsed, collapsed, collapsed, onNavigate, openCommandPaletteFromSidebar, links, isActive, iconMap,];
    var __VLS_26;
    var __VLS_27;
    // @ts-ignore
    [];
}
if (__VLS_ctx.auth.user) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-auto border-t border-border p-2" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center gap-2 px-1" },
        ...{ class: (__VLS_ctx.collapsed
                ? 'flex-col gap-2'
                : 'justify-between gap-3') },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-1']} */ ;
    let __VLS_36;
    /** @ts-ignore @type {typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
    RouterLink;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
        ...{ 'onClick': {} },
        to: "/profile",
        ...{ class: "flex min-w-0 items-center gap-2 rounded-md px-1 py-0.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring" },
        ...{ class: ([
                __VLS_ctx.collapsed ? 'flex-col' : 'flex-1',
                __VLS_ctx.isActive('/profile')
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-surface-muted',
            ]) },
        title: (__VLS_ctx.collapsed ? 'Profile' : undefined),
        'aria-current': (__VLS_ctx.isActive('/profile') ? 'page' : undefined),
    }));
    const __VLS_38 = __VLS_37({
        ...{ 'onClick': {} },
        to: "/profile",
        ...{ class: "flex min-w-0 items-center gap-2 rounded-md px-1 py-0.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring" },
        ...{ class: ([
                __VLS_ctx.collapsed ? 'flex-col' : 'flex-1',
                __VLS_ctx.isActive('/profile')
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-surface-muted',
            ]) },
        title: (__VLS_ctx.collapsed ? 'Profile' : undefined),
        'aria-current': (__VLS_ctx.isActive('/profile') ? 'page' : undefined),
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    let __VLS_41;
    const __VLS_42 = ({ click: {} },
        { onClick: (__VLS_ctx.onNavigate) });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    /** @type {__VLS_StyleScopedClasses['outline-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:ring-ring']} */ ;
    const { default: __VLS_43 } = __VLS_39.slots;
    const __VLS_44 = Avatar;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
        email: (__VLS_ctx.auth.user.email),
        name: (__VLS_ctx.auth.user.name),
    }));
    const __VLS_46 = __VLS_45({
        email: (__VLS_ctx.auth.user.email),
        name: (__VLS_ctx.auth.user.name),
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "min-w-0 flex-1" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (!__VLS_ctx.collapsed) }, null, null);
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "truncate text-xs font-medium" },
    });
    /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    (__VLS_ctx.auth.user.name || __VLS_ctx.auth.user.email);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "truncate text-xs" },
        ...{ class: (__VLS_ctx.isActive('/profile') ? 'text-primary/80' : 'text-muted') },
    });
    /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    (__VLS_ctx.auth.user.name ? __VLS_ctx.auth.user.email : __VLS_ctx.auth.user.role);
    // @ts-ignore
    [collapsed, collapsed, collapsed, collapsed, onNavigate, isActive, isActive, isActive, auth, auth, auth, auth, auth, auth, auth, auth,];
    var __VLS_39;
    var __VLS_40;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.logout) },
        type: "button",
        ...{ class: "inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-muted transition-colors hover:bg-surface-muted hover:text-foreground" },
        ...{ class: (__VLS_ctx.collapsed ? 'w-full' : '') },
        title: "Sign out",
        'aria-label': "Sign out",
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
    let __VLS_49;
    /** @ts-ignore @type {typeof __VLS_components.ArrowRightStartOnRectangleIcon} */
    ArrowRightStartOnRectangleIcon;
    // @ts-ignore
    const __VLS_50 = __VLS_asFunctionalComponent1(__VLS_49, new __VLS_49({
        ...{ class: "h-5 w-5" },
        'aria-hidden': "true",
    }));
    const __VLS_51 = __VLS_50({
        ...{ class: "h-5 w-5" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_50));
    /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
}
// @ts-ignore
[collapsed, logout,];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
