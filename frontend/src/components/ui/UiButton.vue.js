/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ArrowPathIcon } from '@heroicons/vue/24/outline';
const __VLS_props = withDefaults(defineProps(), {
    type: 'button',
    variant: 'primary',
    disabled: false,
    block: false,
    loading: false,
});
const __VLS_defaults = {
    type: 'button',
    variant: 'primary',
    disabled: false,
    block: false,
    loading: false,
};
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    type: (__VLS_ctx.type),
    disabled: (__VLS_ctx.disabled || __VLS_ctx.loading),
    ...{ class: ([
            'box-border inline-flex h-8 min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-transparent px-3 text-xs font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
            __VLS_ctx.block ? 'w-full' : '',
            __VLS_ctx.variant === 'primary' &&
                'border-border/65 bg-primary text-primary-foreground hover:bg-primary-hover',
            __VLS_ctx.variant === 'secondary' &&
                'border-border/65 bg-surface text-foreground hover:bg-surface-muted',
            __VLS_ctx.variant === 'ghost' &&
                'text-foreground hover:border-border/55 hover:bg-surface-muted',
            __VLS_ctx.variant === 'danger' &&
                'border-border/65 bg-destructive text-white hover:bg-destructive-hover',
            __VLS_ctx.variant === 'ghost-danger' &&
                'text-destructive hover:border-destructive/30 hover:bg-destructive/10',
        ]) },
});
/** @type {__VLS_StyleScopedClasses['box-border']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['min-h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['leading-none']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['focus-visible:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus-visible:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus-visible:ring-ring']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:pointer-events-none']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
if (__VLS_ctx.loading) {
    let __VLS_0;
    /** @ts-ignore @type {typeof __VLS_components.ArrowPathIcon} */
    ArrowPathIcon;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        ...{ class: "h-3.5 w-3.5 shrink-0 animate-spin" },
        'aria-hidden': "true",
    }));
    const __VLS_2 = __VLS_1({
        ...{ class: "h-3.5 w-3.5 shrink-0 animate-spin" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
}
var __VLS_5 = {};
// @ts-ignore
var __VLS_6 = __VLS_5;
// @ts-ignore
[type, disabled, loading, loading, block, variant, variant, variant, variant, variant,];
const __VLS_base = (await import('vue')).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
const __VLS_export = {};
export default {};
