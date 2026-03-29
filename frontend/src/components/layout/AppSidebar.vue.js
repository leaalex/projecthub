/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { watch } from 'vue';
import { useRoute } from 'vue-router';
import { useUiStore } from '../../stores/ui.store';
import SidebarNav from './SidebarNav.vue';
const ui = useUiStore();
const route = useRoute();
watch(() => route.fullPath, () => ui.closeMobileMenu());
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
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
    name: "fade",
}));
const __VLS_8 = __VLS_7({
    name: "fade",
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
const { default: __VLS_11 } = __VLS_9.slots;
if (__VLS_ctx.ui.mobileMenuOpen) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.ui.mobileMenuOpen))
                    return;
                __VLS_ctx.ui.closeMobileMenu();
                // @ts-ignore
                [ui, ui,];
            } },
        ...{ class: "fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm md:hidden" },
        'aria-hidden': "true",
    });
    /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-40']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-foreground/40']} */ ;
    /** @type {__VLS_StyleScopedClasses['backdrop-blur-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:hidden']} */ ;
}
// @ts-ignore
[];
var __VLS_9;
let __VLS_12;
/** @ts-ignore @type {typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
Transition;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
    name: "slide",
}));
const __VLS_14 = __VLS_13({
    name: "slide",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
const { default: __VLS_17 } = __VLS_15.slots;
if (__VLS_ctx.ui.mobileMenuOpen) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.aside, __VLS_intrinsics.aside)({
        ...{ class: "fixed bottom-3 left-3 top-3 z-50 flex w-[min(16rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl md:hidden" },
    });
    /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
    /** @type {__VLS_StyleScopedClasses['bottom-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['left-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['top-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-[min(16rem,calc(100vw-1.5rem))]']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:hidden']} */ ;
    const __VLS_18 = SidebarNav;
    // @ts-ignore
    const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
        ...{ 'onNavigate': {} },
        collapsed: (false),
    }));
    const __VLS_20 = __VLS_19({
        ...{ 'onNavigate': {} },
        collapsed: (false),
    }, ...__VLS_functionalComponentArgsRest(__VLS_19));
    let __VLS_23;
    const __VLS_24 = ({ navigate: {} },
        { onNavigate: (...[$event]) => {
                if (!(__VLS_ctx.ui.mobileMenuOpen))
                    return;
                __VLS_ctx.ui.closeMobileMenu();
                // @ts-ignore
                [ui, ui,];
            } });
    var __VLS_21;
    var __VLS_22;
}
// @ts-ignore
[];
var __VLS_15;
// @ts-ignore
[];
var __VLS_3;
__VLS_asFunctionalElement1(__VLS_intrinsics.aside, __VLS_intrinsics.aside)({
    ...{ class: "relative hidden h-full max-h-full min-h-0 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-lg ring-1 ring-foreground/5 transition-[width] duration-200 ease-out dark:shadow-xl dark:ring-white/10 md:flex" },
    ...{ class: (__VLS_ctx.ui.sidebarCollapsed ? 'w-16' : 'w-56') },
});
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['max-h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['min-h-0']} */ ;
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-1']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-foreground/5']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-[width]']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-200']} */ ;
/** @type {__VLS_StyleScopedClasses['ease-out']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:shadow-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:ring-white/10']} */ ;
/** @type {__VLS_StyleScopedClasses['md:flex']} */ ;
const __VLS_25 = SidebarNav;
// @ts-ignore
const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
    collapsed: (__VLS_ctx.ui.sidebarCollapsed),
}));
const __VLS_27 = __VLS_26({
    collapsed: (__VLS_ctx.ui.sidebarCollapsed),
}, ...__VLS_functionalComponentArgsRest(__VLS_26));
// @ts-ignore
[ui, ui,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
