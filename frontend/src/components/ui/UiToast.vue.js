/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { useToastStore } from '../../stores/toast.store';
const toast = useToastStore();
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "pointer-events-none fixed right-4 top-4 z-[100] flex max-w-sm flex-col gap-2" },
    'aria-live': "polite",
});
/** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['right-4']} */ ;
/** @type {__VLS_StyleScopedClasses['top-4']} */ ;
/** @type {__VLS_StyleScopedClasses['z-[100]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
let __VLS_6;
/** @ts-ignore @type {typeof __VLS_components.TransitionGroup | typeof __VLS_components.TransitionGroup} */
TransitionGroup;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
    name: "toast",
}));
const __VLS_8 = __VLS_7({
    name: "toast",
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
const { default: __VLS_11 } = __VLS_9.slots;
for (const [t] of __VLS_vFor((__VLS_ctx.toast.items))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (t.id),
        ...{ class: "pointer-events-auto flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3 shadow-lg" },
        ...{ class: ({
                'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40': t.type === 'success',
                'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40': t.type === 'error',
                'border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/40': t.type === 'info',
            }) },
    });
    /** @type {__VLS_StyleScopedClasses['pointer-events-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-emerald-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-emerald-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:border-emerald-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-emerald-950/40']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-red-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-red-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:border-red-900']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-red-950/40']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-sky-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-sky-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:border-sky-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-sky-950/40']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "flex-1 text-sm text-foreground" },
    });
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
    (t.message);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.toast.dismiss(t.id);
                // @ts-ignore
                [toast, toast,];
            } },
        type: "button",
        ...{ class: "shrink-0 rounded p-0.5 text-muted hover:bg-surface-muted hover:text-foreground" },
        'aria-label': "Dismiss",
    });
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-0.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-surface-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-foreground']} */ ;
    let __VLS_12;
    /** @ts-ignore @type {typeof __VLS_components.XMarkIcon} */
    XMarkIcon;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
        ...{ class: "h-4 w-4" },
        'aria-hidden': "true",
    }));
    const __VLS_14 = __VLS_13({
        ...{ class: "h-4 w-4" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
    // @ts-ignore
    [];
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
