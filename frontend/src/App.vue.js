/// <reference types="../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { Bars3Icon } from '@heroicons/vue/24/outline';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppSidebar from './components/layout/AppSidebar.vue';
import CommandPalette from './components/ui/UiCommandPalette.vue';
import ConfirmDialog from './components/ui/UiConfirmDialog.vue';
import Toast from './components/ui/UiToast.vue';
import { useUiStore } from './stores/ui.store';
const route = useRoute();
const ui = useUiStore();
const useAuthLayout = computed(() => route.meta.layout === 'auth');
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "min-h-screen bg-background text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-background']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
const __VLS_0 = Toast;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const __VLS_5 = ConfirmDialog;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({}));
const __VLS_7 = __VLS_6({}, ...__VLS_functionalComponentArgsRest(__VLS_6));
const __VLS_10 = CommandPalette;
// @ts-ignore
const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({}));
const __VLS_12 = __VLS_11({}, ...__VLS_functionalComponentArgsRest(__VLS_11));
if (__VLS_ctx.useAuthLayout) {
    let __VLS_15;
    /** @ts-ignore @type {typeof __VLS_components.routerView | typeof __VLS_components.RouterView | typeof __VLS_components.routerView | typeof __VLS_components.RouterView} */
    routerView;
    // @ts-ignore
    const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({}));
    const __VLS_17 = __VLS_16({}, ...__VLS_functionalComponentArgsRest(__VLS_16));
    {
        const { default: __VLS_20 } = __VLS_18.slots;
        const [{ Component }] = __VLS_vSlot(__VLS_20);
        let __VLS_21;
        /** @ts-ignore @type {typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
        Transition;
        // @ts-ignore
        const __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21({
            name: "page",
            mode: "out-in",
        }));
        const __VLS_23 = __VLS_22({
            name: "page",
            mode: "out-in",
        }, ...__VLS_functionalComponentArgsRest(__VLS_22));
        const { default: __VLS_26 } = __VLS_24.slots;
        const __VLS_27 = (Component);
        // @ts-ignore
        const __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({
            key: (__VLS_ctx.route.fullPath),
        }));
        const __VLS_29 = __VLS_28({
            key: (__VLS_ctx.route.fullPath),
        }, ...__VLS_functionalComponentArgsRest(__VLS_28));
        // @ts-ignore
        [useAuthLayout, route,];
        var __VLS_24;
        // @ts-ignore
        [];
        __VLS_18.slots['' /* empty slot name completion */];
    }
    var __VLS_18;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "relative flex h-dvh max-h-dvh min-h-0 overflow-hidden md:gap-3 md:p-3 lg:gap-4 lg:p-4" },
    });
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-dvh']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-h-dvh']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-h-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:p-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:gap-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:p-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.useAuthLayout))
                    return;
                __VLS_ctx.ui.toggleMobileMenu();
                // @ts-ignore
                [ui,];
            } },
        type: "button",
        ...{ class: "fixed left-4 top-4 z-30 rounded-md border border-border bg-surface p-2 text-muted shadow-sm transition-colors hover:bg-surface-muted hover:text-foreground md:hidden" },
        'aria-label': "Open menu",
    });
    /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
    /** @type {__VLS_StyleScopedClasses['left-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['top-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-30']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-surface-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-foreground']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:hidden']} */ ;
    let __VLS_32;
    /** @ts-ignore @type {typeof __VLS_components.Bars3Icon} */
    Bars3Icon;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
        ...{ class: "h-6 w-6" },
        'aria-hidden': "true",
    }));
    const __VLS_34 = __VLS_33({
        ...{ class: "h-6 w-6" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    /** @type {__VLS_StyleScopedClasses['h-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-6']} */ ;
    const __VLS_37 = AppSidebar;
    // @ts-ignore
    const __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37({}));
    const __VLS_39 = __VLS_38({}, ...__VLS_functionalComponentArgsRest(__VLS_38));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-h-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
        ...{ class: "min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-background p-6 pt-16 md:pt-6" },
    });
    /** @type {__VLS_StyleScopedClasses['min-h-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-x-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-16']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:pt-6']} */ ;
    let __VLS_42;
    /** @ts-ignore @type {typeof __VLS_components.routerView | typeof __VLS_components.RouterView | typeof __VLS_components.routerView | typeof __VLS_components.RouterView} */
    routerView;
    // @ts-ignore
    const __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({}));
    const __VLS_44 = __VLS_43({}, ...__VLS_functionalComponentArgsRest(__VLS_43));
    {
        const { default: __VLS_47 } = __VLS_45.slots;
        const [{ Component }] = __VLS_vSlot(__VLS_47);
        let __VLS_48;
        /** @ts-ignore @type {typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
        Transition;
        // @ts-ignore
        const __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({
            name: "page",
            mode: "out-in",
        }));
        const __VLS_50 = __VLS_49({
            name: "page",
            mode: "out-in",
        }, ...__VLS_functionalComponentArgsRest(__VLS_49));
        const { default: __VLS_53 } = __VLS_51.slots;
        const __VLS_54 = (Component);
        // @ts-ignore
        const __VLS_55 = __VLS_asFunctionalComponent1(__VLS_54, new __VLS_54({
            key: (__VLS_ctx.route.fullPath),
        }));
        const __VLS_56 = __VLS_55({
            key: (__VLS_ctx.route.fullPath),
        }, ...__VLS_functionalComponentArgsRest(__VLS_55));
        // @ts-ignore
        [route,];
        var __VLS_51;
        // @ts-ignore
        [];
        __VLS_45.slots['' /* empty slot name completion */];
    }
    var __VLS_45;
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
